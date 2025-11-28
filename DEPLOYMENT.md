# GCP Deployment Guide for livebaz.com

## Prerequisites
- Fresh GCP Compute Engine instance (Ubuntu 20.04 or 22.04 recommended)
- Domain: livebaz.com pointed to your GCP instance IP
- SSH access to your instance

## Step 1: Initial Server Setup

### Connect to your GCP instance
```bash
# From your local machine
gcloud compute ssh --zone "us-central1-c" "instance-20251127-174006" --project "livebaz"


```

### Update system packages
```bash
sudo apt update
sudo apt upgrade -y
```
gcloud compute scp code.zip instance-20251127-174006:~/ \
    --zone us-central1-c \
    --project livebaz

### Install Node.js (v18 LTS)
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
node --version  # Should show v18.x.x
npm --version
```

### Install PM2 (Process Manager)
```bash
sudo npm install -g pm2 && sudo apt install -y nginx
```

### Install Nginx    zip -r code.zip cpcl
```bash
sudo apt install -y nginx
```

## Step 2: Setup Firewall Rules

### In GCP Console
1. Go to VPC Network → Firewall
2. Create firewall rules:
   - Allow HTTP (port 80)
   - Allow HTTPS (port 443)
   - Allow custom port for backend (port 5000) - optional, only if accessing directly

### Or use gcloud CLI
```bash
gcloud compute firewall-rules create allow-http --allow tcp:80
gcloud compute firewall-rules create allow-https --allow tcp:443
```

## Step 3: Clone Your Project

```bash
# Create directory for your app
cd /home/$USER
mkdir -p apps
cd apps

# Clone your repository (or upload via SCP)
# If using git:
git clone YOUR_REPO_URL cpcl
cd cpcl

# Or upload files using SCP from local machine:
# scp -r /home/pc/Code/cpcl user@YOUR_GCP_IP:/home/user/apps/
```

## Step 4: Setup Backend

```bash
cd /home/$USER/apps/cpcl/server

# Install dependencies
npm install

# Create .env file
nano .env
```

Add to `.env`:
```env
PORT=5000
APIFOOTBALL_KEY=8b638d34018a20c11ed623f266d7a7a6a5db7a451fb17038f8f47962c66db43b
NODE_ENV=production
```

### Start backend with PM2
```bash
pm2 start npm --name "cpcl-backend" -- start
pm2 save
pm2 startup  # Follow the instructions to enable PM2 on system boot
```

## Step 5: Setup Frontend

```bash
cd /home/$USER/apps/cpcl/Frontend

# Create .env file
nano .env
```

Add to `.env`:
```env
VITE_APIFOOTBALL_KEY=8b638d34018a20c11ed623f266d7a7a6a5db7a451fb17038f8f47962c66db43b
```

### Install dependencies and build
```bash
npm install
npm run build
```

This creates a `dist` folder with production-ready files.

## Step 6: Configure Nginx

### Create Nginx configuration
```bash
sudo nano /etc/nginx/sites-available/livebaz.com
```

Add this configuration:
```nginx
# Backend API server
upstream backend {
    server localhost:5000;
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name livebaz.com www.livebaz.com;
    
    # Allow Let's Encrypt verification
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
    
    # Redirect all other traffic to HTTPS
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name livebaz.com www.livebaz.com;

    # SSL certificates (will be added by Certbot)
    # ssl_certificate /etc/letsencrypt/live/livebaz.com/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/livebaz.com/privkey.pem;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Frontend - serve static files
    root /home/$USER/apps/cpcl/Frontend/dist;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript application/json;

    # Frontend routes
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API proxy
    location /api/ {
        proxy_pass http://backend/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket proxy (for live scores)
    location /ws/ {
        proxy_pass http://backend/ws/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

**IMPORTANT**: Replace `$USER` with your actual username in the `root` directive.

### Enable the site
```bash
sudo ln -s /etc/nginx/sites-available/livebaz.com /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default  # Remove default site
sudo nginx -t  # Test configuration
sudo systemctl restart nginx
```

## Step 7: Setup SSL with Let's Encrypt

### Install Certbot
```bash
sudo apt install -y certbot python3-certbot-nginx
```

### Get SSL certificate
```bash
sudo certbot --nginx -d livebaz.com -d www.livebaz.com
```

Follow the prompts:
- Enter your email
- Agree to terms
- Choose whether to redirect HTTP to HTTPS (recommended: Yes)

Certbot will automatically update your Nginx config with SSL certificates.

### Auto-renewal
```bash
# Test renewal
sudo certbot renew --dry-run

# Certbot automatically sets up a cron job for renewal
```

## Step 8: Update Frontend API URL

Since you're using Nginx as a reverse proxy, update your frontend to use relative URLs:

```bash
nano /home/$USER/apps/cpcl/Frontend/src/pages/MathPredictions.jsx
```

Change:
```javascript
const API_BASE_URL = 'http://localhost:5000/api/v1';
```

To:
```javascript
const API_BASE_URL = '/api/v1';
```

Then rebuild:
```bash
cd /home/$USER/apps/cpcl/Frontend
npm run build
sudo systemctl restart nginx
```

## Step 9: DNS Configuration

In your domain registrar (where you bought livebaz.com):

1. Add an **A Record**:
   - Name: `@` (or leave blank)
   - Type: `A`
   - Value: `YOUR_GCP_INSTANCE_IP`
   - TTL: `3600`

2. Add a **CNAME Record** for www:
   - Name: `www`
   - Type: `CNAME`
   - Value: `livebaz.com`
   - TTL: `3600`

Wait 5-30 minutes for DNS propagation.

## Step 10: Verify Deployment

```bash
# Check backend is running
pm2 status

# Check Nginx is running
sudo systemctl status nginx

# Check logs
pm2 logs cpcl-backend
sudo tail -f /var/log/nginx/error.log
```

Visit: https://livebaz.com

## Useful Commands

### PM2 Management
```bash
pm2 list                    # List all processes
pm2 logs cpcl-backend       # View logs
pm2 restart cpcl-backend    # Restart backend
pm2 stop cpcl-backend       # Stop backend
pm2 delete cpcl-backend     # Remove process
```

### Nginx Management
```bash
sudo systemctl status nginx     # Check status
sudo systemctl restart nginx    # Restart
sudo nginx -t                   # Test config
sudo tail -f /var/log/nginx/access.log  # View access logs
sudo tail -f /var/log/nginx/error.log   # View error logs
```

### Update Deployment
```bash
# Pull latest changes
cd /home/$USER/apps/cpcl
git pull

# Update backend
cd server
npm install
pm2 restart cpcl-backend

# Update frontend
cd ../Frontend
npm install
npm run build
sudo systemctl restart nginx
```

## Troubleshooting

### Backend not accessible
```bash
pm2 logs cpcl-backend
# Check if port 5000 is in use
sudo netstat -tulpn | grep 5000
```

### Frontend not loading
```bash
# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Verify build files exist
ls -la /home/$USER/apps/cpcl/Frontend/dist
```

### SSL certificate issues
```bash
sudo certbot certificates
sudo certbot renew --force-renewal
```

### DNS not resolving
```bash
# Check DNS propagation
nslookup livebaz.com
dig livebaz.com
```

## Security Best Practices

1. **Setup UFW Firewall**:
```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

2. **Disable root SSH**:
```bash
sudo nano /etc/ssh/sshd_config
# Set: PermitRootLogin no
sudo systemctl restart sshd
```

3. **Keep system updated**:
```bash
sudo apt update && sudo apt upgrade -y
```

4. **Monitor logs regularly**:
```bash
pm2 logs
sudo tail -f /var/log/nginx/access.log
```

## Done! 🎉

Your site should now be live at https://livebaz.com with:
- ✅ SSL/HTTPS enabled
- ✅ Backend API running on PM2
- ✅ Frontend served by Nginx
- ✅ Auto-restart on server reboot
- ✅ Auto-renewal of SSL certificates

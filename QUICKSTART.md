# LiveBaz Project - Quick Start Guide

## ✅ Setup Complete!

All dependencies have been installed and the database has been configured with an admin user.

## 🚀 Running the Project

### Option 1: Use the Start Script (Recommended)
Simply run:
```bash
.\start.ps1
```

This will start both the backend and frontend servers automatically.

### Option 2: Manual Start

**Terminal 1 - Backend Server:**
```bash
cd server
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd Frontend
npm run dev
```

## 🔐 Admin Panel Access

- **URL:** http://localhost:5173/admin/login
- **Email:** admin@livebaz.com
- **Password:** Admin@123456

## 📝 Important Notes

1. **MySQL Configuration:** The default MySQL password is empty. If your MySQL has a password, update it in `server\.env`

2. **Ports:**
   - Backend: http://localhost:3000
   - Frontend: http://localhost:5173

3. **Environment Variables:** All configurations are in `server\.env`

## 🛠️ Troubleshooting

### MySQL Connection Error
If you see MySQL connection errors:
1. Ensure MySQL is running
2. Update `MYSQL_PASSWORD` in `server\.env` if needed
3. Verify database exists: `mysql -u root -e "SHOW DATABASES;"`

### Port Already in Use
If port 3000 or 5173 is already in use:
- Change `PORT` in `server\.env` for backend
- Frontend port can be changed in `vite.config.js`

## 📦 What Was Installed

### Backend (server/)
- Express.js server
- MySQL with Sequelize ORM
- JWT authentication
- API Football integration
- Admin features

### Frontend (Frontend/)
- React with Vite
- React Router
- Axios for API calls
- TinyMCE editor
- i18next for internationalization

## 🎯 Next Steps

1. Start the servers using `.\start.ps1`
2. Visit http://localhost:5173
3. Login to admin panel at http://localhost:5173/admin/login
4. Explore the application!

---

**Need Help?** Check the logs in the terminal for any errors.

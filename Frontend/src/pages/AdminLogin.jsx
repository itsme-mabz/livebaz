import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function AdminLogin() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(
        `/api/v1/user/login`,
        {
          Email: formData.email,
          Password: formData.password
        },
        { withCredentials: true }
      );

      if (response.data.success) {
        if (response.data.user && response.data.user.is_admin) {
          localStorage.setItem('token', response.data.token);
          localStorage.setItem('adminUser', JSON.stringify(response.data.user));
          navigate('/admin/dashboard');
        } else {
          setError('Access denied. Admin privileges required.');
        }
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(
        err.response?.data?.message ||
        'Invalid credentials. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f5f5f5',
      padding: '20px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        background: '#fff',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        overflow: 'hidden'
      }}>
        <div style={{
          padding: '32px 32px 24px',
          borderBottom: '1px solid #e5e5e5'
        }}>
          <h1 style={{
            margin: '0 0 6px',
            fontSize: '24px',
            fontWeight: '600',
            color: '#1a1a1a'
          }}>
            Admin Login
          </h1>
          <p style={{
            margin: 0,
            fontSize: '14px',
            color: '#666'
          }}>
            Manage content and settings
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '28px 32px 32px' }}>
          {error && (
            <div style={{
              padding: '10px 14px',
              background: '#fff3f3',
              border: '1px solid #ffcdd2',
              borderRadius: '6px',
              color: '#d32f2f',
              fontSize: '14px',
              marginBottom: '20px'
            }}>
              {error}
            </div>
          )}

          <div style={{ marginBottom: '18px' }}>
            <label htmlFor="email" style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: '500',
              color: '#333',
              marginBottom: '6px'
            }}>
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="admin@example.com"
              style={{
                width: '100%',
                padding: '10px 12px',
                fontSize: '14px',
                border: '1px solid #d0d0d0',
                borderRadius: '6px',
                outline: 'none',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = '#ffc107'}
              onBlur={(e) => e.target.style.borderColor = '#d0d0d0'}
            />
          </div>

          <div style={{ marginBottom: '22px' }}>
            <label htmlFor="password" style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: '500',
              color: '#333',
              marginBottom: '6px'
            }}>
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Enter password"
              style={{
                width: '100%',
                padding: '10px 12px',
                fontSize: '14px',
                border: '1px solid #d0d0d0',
                borderRadius: '6px',
                outline: 'none',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = '#ffc107'}
              onBlur={(e) => e.target.style.borderColor = '#d0d0d0'}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '11px',
              fontSize: '14px',
              fontWeight: '500',
              color: '#000',
              background: loading ? '#e0e0e0' : '#ffc107',
              border: 'none',
              borderRadius: '6px',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => !loading && (e.target.style.background = '#ffca2c')}
            onMouseLeave={(e) => !loading && (e.target.style.background = '#ffc107')}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div style={{
          padding: '16px 32px',
          borderTop: '1px solid #e5e5e5',
          textAlign: 'center'
        }}>
          <a href="/" style={{
            color: '#666',
            textDecoration: 'none',
            fontSize: '13px'
          }}>
            Back to Home
          </a>
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;

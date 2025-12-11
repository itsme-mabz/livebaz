import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './AdminLogin.css';

const API_URL = '';

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
        // Check if user is admin
        if (response.data.user && response.data.user.is_admin) {
          // Store token and user info
          localStorage.setItem('adminToken', response.data.token);
          localStorage.setItem('adminUser', JSON.stringify(response.data.user));

          // Redirect to admin dashboard
          navigate('/admin/dashboard');
        } else {
          setError('Access denied. Admin privileges required.');
        }
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(
        err.response?.data?.message ||
        'Login failed. Please check your credentials.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-container">
        <div className="admin-login-box">
          <div className="admin-login-header">
            <h1>Admin Panel</h1>
            <p>Login to manage popular matches and leagues</p>
          </div>

          <form onSubmit={handleSubmit} className="admin-login-form">
            {error && (
              <div className="admin-error-message">
                {error}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="admin@example.com"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Enter your password"
              />
            </div>

            <button
              type="submit"
              className="admin-login-btn"
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <div className="admin-login-footer">
            <a href="/">Back to Home</a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;

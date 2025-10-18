import React, { useState } from 'react';
import './Login.css';

const Login = ({ onLogin, onResetPassword, onSignUp }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin(formData);
  };

  return (
    <div className="login-container">
      <h1 className="login-title">Login</h1>

      <form className="login-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email" className="form-label">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="eg. peerprepforlife@gmail.com"
            className="form-input"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="password" className="form-label">
            Password
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            className="form-input"
            required
          />
        </div>

        <div className="form-actions">
          <button type="submit" className="login-button">
            Login
          </button>
          <button type="button" className="reset-password-link" onClick={onResetPassword}>
            Reset your password
          </button>
        </div>
      </form>

      <div className="signup-section">
        <span className="signup-text">
          Don't have an account?
          <button type="button" className="signup-link" onClick={onSignUp}>
            Sign up here now!
          </button>
        </span>
      </div>
    </div>
  );
};

export default Login;

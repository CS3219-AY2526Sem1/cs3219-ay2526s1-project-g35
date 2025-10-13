import React, { useState } from 'react';
import Login from '../components/Login';
import './LoginPage.css';

const LoginPage = () => {
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });

  const handleLogin = (formData) => {
    console.log('Login attempt:', formData);
    // TODO: Implement actual login logic
  };

  const handleResetPassword = () => {
    console.log('Reset password clicked');
    // TODO: Implement reset password logic
  };

  const handleSignUp = () => {
    console.log('Sign up clicked');
    // TODO: Navigate to sign up page
  };

  return (
    <div className="login-page">
      <header className="login-header">
        <div className="logo-container">
          <div className="logo-icon"></div>
          <span className="logo-text">PeerPrep</span>
        </div>
      </header>
      
      <main className="login-main">
        <Login 
          onLogin={handleLogin}
          onResetPassword={handleResetPassword}
          onSignUp={handleSignUp}
        />
      </main>
    </div>
  );
};

export default LoginPage;

import React, { useState } from 'react';
import './Login.css';
import logo from '../../assets/images/logo.jpeg';
import userIcon from '../../assets/icons/user.webp';
import lockIcon from '../../assets/icons/gembok.webp';
import masukIcon from '../../assets/icons/masuk.webp';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Handle login logic here
    console.log('Login attempt with:', { username, password });
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <img src={logo} alt="Rumah Sakit Citra Husada Logo" className="login-logo" />
          <h1 className="login-title">Smart Presence</h1>
          <p className="login-subtitle">Sistem Presensi Rapat</p>
          <p className="login-subtitle">Rumah Sakit Citra Husada</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <div className="input-wrapper">
              <img src={userIcon} alt="user icon" className="input-icon" />
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan username"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="input-wrapper">
              <img src={lockIcon} alt="lock icon" className="input-icon" />
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password"
                required
              />
            </div>
          </div>

          <button type="submit" className="login-btn">
            <img src={masukIcon} alt="login icon" className="btn-icon" />
            Masuk
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;

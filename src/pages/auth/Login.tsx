import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import { useAuthStore } from '../../store/authStore';
import './Login.css';
import logo from '../../assets/images/logo.jpeg';
import userIcon from '../../assets/icons/user.webp';
import lockIcon from '../../assets/icons/gembok.webp';
import masukIcon from '../../assets/icons/masuk.webp';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();
  const auth = useAuthStore();

  // Redirect if already authenticated
  if (auth.isAuthenticated) {
    navigate('/dashboard', { replace: true });
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await authService.login({ username, password });
      auth.login(response.token, response.user);
      navigate('/dashboard', { replace: true });
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { data?: { message?: string } } };
        setError(axiosError.response?.data?.message || 'Login gagal. Silakan coba lagi.');
      } else {
        setError('Terjadi kesalahan jaringan. Silakan coba lagi.');
      }
    } finally {
      setIsLoading(false);
    }
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

        {error && (
          <div className="login-error">
            {error}
          </div>
        )}

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
                disabled={isLoading}
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
                disabled={isLoading}
              />
            </div>
          </div>

          <button type="submit" className="login-btn" disabled={isLoading}>
            {isLoading ? (
              <>
                <span className="login-spinner"></span>
                Memproses...
              </>
            ) : (
              <>
                <img src={masukIcon} alt="login icon" className="btn-icon" />
                Masuk
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;

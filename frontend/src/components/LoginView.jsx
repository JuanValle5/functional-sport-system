import React, { useState } from 'react';
import { peticionApi } from '../services/api';

export default function LoginView({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);
    try {
      const usuario = await peticionApi('/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password })
      });
      onLoginSuccess(usuario);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <form className="card login-card" onSubmit={handleSubmit}>
        <div className="login-hero-logos">
          <img
            src="/logos/web-oso-blanco-neon.png"
            alt="Oso Funcional Sport"
            className="login-bear-logo"
          />
          <img
            src="/logos/web-logo-horizontal-neon.png"
            alt="Funcional Sport"
            className="login-wordmark-logo"
          />
          <small
            style={{
              color: 'var(--text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              fontWeight: 700
            }}
          >
            Plataforma Local de Control Biométrico y Membresías
          </small>
        </div>

        {errorMsg && <div className="alert-banner error">{errorMsg}</div>}

        <div className="form-group">
          <label>Usuario Operador</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Ingrese su usuario"
            autoComplete="username"
            required
          />
        </div>

        <div className="form-group">
          <label>Contraseña</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Ingrese su contraseña"
            autoComplete="current-password"
            required
          />
        </div>

        <button
          type="submit"
          className="btn"
          style={{ width: '100%', marginTop: '0.4rem' }}
          disabled={loading}
        >
          {loading ? 'Verificando...' : 'Ingresar a la Plataforma'}
        </button>
      </form>
    </div>
  );
}

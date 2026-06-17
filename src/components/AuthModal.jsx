'use client';

import React, { useState } from 'react';
import { X, Mail, Lock, User, KeyRound, Eye, EyeOff } from 'lucide-react';

export default function AuthModal({ onClose, onSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  
  // Form values
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Error / Loading states
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password || (!isLogin && !username)) {
      setError('Por favor, completa todos los campos.');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setLoading(true);

    if (isLogin) {
      setTimeout(() => {
        setLoading(false);
        const storedUsers = JSON.parse(localStorage.getItem('mlb_users') || '[]');
        const user = storedUsers.find(u => u.email === email && u.password === password);
        if (user) {
          onSuccess(user);
        } else {
          setError('Correo o contraseña incorrectos.');
        }
      }, 1000);
    } else {
      setTimeout(() => {
        setLoading(false);
        const storedUsers = JSON.parse(localStorage.getItem('mlb_users') || '[]');
        const userExists = storedUsers.some(u => u.email === email);
        if (userExists) {
          setError('Este correo electrónico ya está registrado.');
          return;
        }
        
        const newUser = {
          id: Date.now(),
          username,
          email,
          password
        };
        storedUsers.push(newUser);
        localStorage.setItem('mlb_users', JSON.stringify(storedUsers));
        onSuccess(newUser);
      }, 1000);
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1100 }}>
      <div className="modal-content glass-panel" style={{ maxWidth: '420px', background: 'hsl(222, 47%, 6%)', border: '1px solid rgba(255, 255, 255, 0.12)' }}>
        
        {/* Cabecera */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid var(--border-glass)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <KeyRound style={{ color: 'var(--color-primary)', width: '20px', height: '20px' }} />
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>
              {isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
            </h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
            <X style={{ width: '20px', height: '20px' }} />
          </button>
        </div>

        {/* Cuerpo */}
        <div style={{ padding: '24px' }}>
          
          <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* Tabs de Selección */}
            <div style={{ display: 'flex', background: 'rgba(255, 255, 255, 0.02)', padding: '3px', borderRadius: '10px', border: '1px solid var(--border-glass)', marginBottom: '8px' }}>
              <button
                type="button"
                onClick={() => { setIsLogin(true); setError(''); }}
                style={{
                  flex: 1, padding: '10px 0', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem',
                  background: isLogin ? 'rgba(255, 255, 255, 0.08)' : 'none',
                  color: isLogin ? 'var(--text-primary)' : 'var(--text-secondary)',
                  transition: 'var(--transition-smooth)'
                }}
              >
                Iniciar Sesión
              </button>
              <button
                type="button"
                onClick={() => { setIsLogin(false); setError(''); }}
                style={{
                  flex: 1, padding: '10px 0', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem',
                  background: !isLogin ? 'rgba(255, 255, 255, 0.08)' : 'none',
                  color: !isLogin ? 'var(--text-primary)' : 'var(--text-secondary)',
                  transition: 'var(--transition-smooth)'
                }}
              >
                Registrarse
              </button>
            </div>

            {/* Input: Nombre de Usuario (Solo en Registro) */}
            {!isLogin && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Nombre de Usuario</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    placeholder="Ej. JuanPerez99"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    style={{
                      width: '100%', padding: '12px 14px 12px 40px', background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid var(--border-glass)', borderRadius: '10px', color: 'var(--text-primary)', fontSize: '0.9rem', outline: 'none'
                    }}
                    required
                  />
                  <User style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '18px', height: '18px', color: 'var(--text-secondary)' }} />
                </div>
              </div>
            )}

            {/* Input: Correo Electrónico */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Correo Electrónico</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  placeholder="ejemplo@correo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: '100%', padding: '12px 14px 12px 40px', background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-glass)', borderRadius: '10px', color: 'var(--text-primary)', fontSize: '0.9rem', outline: 'none'
                  }}
                  required
                />
                <Mail style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '18px', height: '18px', color: 'var(--text-secondary)' }} />
              </div>
            </div>

            {/* Input: Contraseña */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Contraseña</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: '100%', padding: '12px 40px 12px 40px', background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-glass)', borderRadius: '10px', color: 'var(--text-primary)', fontSize: '0.9rem', outline: 'none'
                  }}
                  required
                />
                <Lock style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '18px', height: '18px', color: 'var(--text-secondary)' }} />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
                >
                  {showPassword ? <EyeOff style={{ width: '18px', height: '18px' }} /> : <Eye style={{ width: '18px', height: '18px' }} />}
                </button>
              </div>
            </div>

            {/* Mensaje de Error */}
            {error && (
              <div style={{ color: 'var(--color-high-risk)', fontSize: '0.8rem', fontWeight: 600, background: 'var(--color-high-risk-bg)', padding: '10px 12px', borderRadius: '8px', border: '1px solid hsla(0, 84%, 60%, 0.2)' }}>
                {error}
              </div>
            )}

            {/* Botón de Envío */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '12px', borderRadius: '10px', fontSize: '0.9rem', marginTop: '10px' }}
            >
              {loading ? (
                <div style={{ width: '20px', height: '20px', border: '2px solid rgba(255,255,255,0.2)', borderTopColor: 'var(--text-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
              ) : (
                isLogin ? 'Acceder al Sistema' : 'Crear Cuenta'
              )}
            </button>

          </form>

        </div>

      </div>

      {/* Estilos CSS Locales y Keyframes para el Loader */}
      <style jsx global>{`
        @keyframes fadeInDown {
          from { opacity: 0; transform: translate(-50%, -30px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
      `}</style>
    </div>
  );
}

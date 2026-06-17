'use client';

import React, { useState, useEffect } from 'react';
import { Mail, Lock, User, Activity, Eye, EyeOff, LogIn, Sun, Moon } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function AuthScreen({ onSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLightTheme, setIsLightTheme] = useState(false);
  
  // Form values
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Error / Loading states
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const isLight = document.documentElement.classList.contains('light-theme');
    setIsLightTheme(isLight);
  }, []);

  const toggleTheme = () => {
    const nextTheme = !isLightTheme;
    setIsLightTheme(nextTheme);
    if (nextTheme) {
      document.documentElement.classList.add('light-theme');
      localStorage.setItem('mlb_theme', 'light');
    } else {
      document.documentElement.classList.remove('light-theme');
      localStorage.setItem('mlb_theme', 'dark');
    }
  };

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

    try {
      if (isLogin) {
        // Consultar el usuario en Supabase
        const { data: user, error: loginError } = await supabase
          .from('users')
          .select('*')
          .eq('email', email)
          .eq('password', password)
          .maybeSingle();

        setLoading(false);

        if (loginError) {
          console.error(loginError);
          setError('Error de conexión con la base de datos.');
          return;
        }

        if (user) {
          onSuccess(user);
        } else {
          setError('Correo o contraseña incorrectos.');
        }
      } else {
        // Registrar en Supabase
        // 1. Verificar si el correo ya existe
        const { data: existingUser, error: findError } = await supabase
          .from('users')
          .select('id')
          .eq('email', email)
          .maybeSingle();

        if (findError) {
          console.error(findError);
          setLoading(false);
          setError('Error al verificar la disponibilidad del correo.');
          return;
        }

        if (existingUser) {
          setLoading(false);
          setError('Este correo electrónico ya está registrado.');
          return;
        }

        // 2. Insertar nuevo usuario
        // Nota: para pruebas, puedes establecer que "admin@analistamlb.com" tenga el rol admin por defecto
        const isAdminEmail = email.toLowerCase() === 'admin@analistamlb.com';
        const { data: newUser, error: insertError } = await supabase
          .from('users')
          .insert([
            { username, email, password, credits: 0.00, role: isAdminEmail ? 'admin' : 'user' }
          ])
          .select()
          .single();

        setLoading(false);

        if (insertError) {
          console.error(insertError);
          setError('Error al crear la cuenta en la base de datos.');
          return;
        }

        if (newUser) {
          onSuccess(newUser);
        }
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
      setError('Error al conectar con el servidor.');
    }
  };

  return (
    <div className="auth-screen-container" style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-auth-screen)',
      padding: '20px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Botón de cambio de tema floating */}
      <button 
        type="button"
        onClick={toggleTheme}
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-glass)',
          borderRadius: '50%',
          width: '44px',
          height: '44px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: 'var(--text-primary)',
          boxShadow: 'var(--shadow-premium)',
          zIndex: 100,
          transition: 'var(--transition-smooth)'
        }}
        title="Cambiar tema"
      >
        {isLightTheme ? <Moon style={{ width: '20px', height: '20px' }} /> : <Sun style={{ width: '20px', height: '20px' }} />}
      </button>
      {/* Luces y efectos decorativos de estadio de béisbol de fondo */}
      <div style={{
        position: 'absolute',
        top: '-10%',
        left: '-10%',
        width: '50%',
        height: '50%',
        background: 'radial-gradient(circle, rgba(59, 130, 246, 0.08) 0%, transparent 70%)',
        zIndex: 1,
        pointerEvents: 'none'
      }}></div>
      <div style={{
        position: 'absolute',
        bottom: '-10%',
        right: '-10%',
        width: '50%',
        height: '50%',
        background: 'radial-gradient(circle, rgba(147, 51, 234, 0.05) 0%, transparent 70%)',
        zIndex: 1,
        pointerEvents: 'none'
      }}></div>

      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '440px',
        padding: '40px 32px',
        borderRadius: '24px',
        background: 'rgba(3, 7, 18, 0.45)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        zIndex: 10,
        position: 'relative'
      }}>
        
        {/* Logo / Marca */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            display: 'inline-flex',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            padding: '12px',
            borderRadius: '16px',
            border: '1px solid rgba(59, 130, 246, 0.25)',
            marginBottom: '16px',
            animation: 'pulseGlow 2.5s infinite alternate'
          }}>
            <Activity style={{ width: '32px', height: '32px', color: 'var(--color-primary)' }} />
          </div>
          
          <h1 className="text-gradient" style={{
            fontSize: '1.8rem',
            fontWeight: 900,
            letterSpacing: '0.02em',
            margin: '0 0 8px 0',
            lineHeight: '1.2'
          }}>
            ANALISTA DE JUGADAS MLB
          </h1>
          
          <p style={{
            fontSize: '0.85rem',
            color: 'var(--text-secondary)',
            margin: 0
          }}>
            Análisis lógico y predicciones estadísticas en tiempo real
          </p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Selector de pestañas */}
          <div style={{
            display: 'flex',
            background: 'rgba(255, 255, 255, 0.02)',
            padding: '4px',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            marginBottom: '8px'
          }}>
            <button
              type="button"
              onClick={() => { setIsLogin(true); setError(''); }}
              style={{
                flex: 1,
                padding: '12px 0',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.85rem',
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
                flex: 1,
                padding: '12px 0',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.85rem',
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
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Nombre de Usuario</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="Ej. JuanPerez99"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '14px 14px 14px 44px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '12px',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem',
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  required
                />
                <User style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '18px',
                  height: '18px',
                  color: 'var(--text-secondary)'
                }} />
              </div>
            </div>
          )}

          {/* Input: Correo Electrónico */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Correo Electrónico</label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                placeholder="ejemplo@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '14px 14px 14px 44px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px',
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                required
              />
              <Mail style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '18px',
                height: '18px',
                color: 'var(--text-secondary)'
              }} />
            </div>
          </div>

          {/* Input: Contraseña */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Contraseña</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '14px 44px 14px 44px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px',
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                required
              />
              <Lock style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '18px',
                height: '18px',
                color: 'var(--text-secondary)'
              }} />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-secondary)',
                  padding: 0
                }}
              >
                {showPassword ? <EyeOff style={{ width: '18px', height: '18px' }} /> : <Eye style={{ width: '18px', height: '18px' }} />}
              </button>
            </div>
          </div>

          {/* Mensaje de Error */}
          {error && (
            <div style={{
              color: 'var(--color-high-risk)',
              fontSize: '0.8rem',
              fontWeight: 600,
              background: 'var(--color-high-risk-bg)',
              padding: '12px 14px',
              borderRadius: '10px',
              border: '1px solid hsla(0, 84%, 60%, 0.15)'
            }}>
              {error}
            </div>
          )}

          {/* Botón de Envío */}
          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{
              width: '100%',
              justifyContent: 'center',
              padding: '14px',
              borderRadius: '12px',
              fontSize: '0.95rem',
              fontWeight: 700,
              marginTop: '10px'
            }}
          >
            {loading ? (
              <div style={{
                width: '20px',
                height: '20px',
                border: '2px solid rgba(255,255,255,0.2)',
                borderTopColor: 'var(--text-primary)',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}></div>
            ) : (
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <LogIn style={{ width: '18px', height: '18px' }} />
                {isLogin ? 'Acceder al Sistema' : 'Crear Cuenta'}
              </span>
            )}
          </button>

        </form>

      </div>

      <style jsx global>{`
        @keyframes pulseGlow {
          0% { border-color: rgba(59, 130, 246, 0.15); box-shadow: 0 0 10px rgba(59, 130, 246, 0.05); }
          100% { border-color: rgba(59, 130, 246, 0.45); box-shadow: 0 0 20px rgba(59, 130, 246, 0.2); }
        }
      `}</style>
    </div>
  );
}

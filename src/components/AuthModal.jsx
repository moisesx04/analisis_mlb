'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X, Mail, Lock, User, KeyRound, Eye, EyeOff, Sparkles, ShieldCheck } from 'lucide-react';

export default function AuthModal({ onClose, onSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [step, setStep] = useState('form'); // form, verification
  const [showPassword, setShowPassword] = useState(false);
  
  // Form values
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Verification code values
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [generatedCode, setGeneratedCode] = useState('');
  const [codeToast, setCodeToast] = useState('');
  
  // Error / Loading states
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const inputRefs = [
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null)
  ];

  // Genera un código de verificación aleatorio de 6 dígitos
  const generateVerificationCode = () => {
    const num = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedCode(num);
    setCodeToast(num);
    
    // Auto ocultar el toast del código después de 15 segundos
    setTimeout(() => {
      setCodeToast(prev => prev === num ? '' : prev);
    }, 15000);
  };

  const handleFormSubmit = (e) => {
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

    // Simular retraso de red
    setTimeout(() => {
      setLoading(false);
      
      const storedUsers = JSON.parse(localStorage.getItem('mlb_users') || '[]');
      
      if (isLogin) {
        // Lógica de Inicio de Sesión
        const user = storedUsers.find(u => u.email === email && u.password === password);
        if (user) {
          onSuccess(user);
        } else {
          setError('Correo o contraseña incorrectos.');
        }
      } else {
        // Lógica de Registro (validar duplicado)
        const userExists = storedUsers.some(u => u.email === email);
        if (userExists) {
          setError('Este correo electrónico ya está registrado.');
        } else {
          // Generar código y avanzar al paso de verificación
          generateVerificationCode();
          setStep('verification');
        }
      }
    }, 1000);
  };

  // Manejar entrada en los cuadros del código
  const handleCodeChange = (index, value) => {
    // Aceptar solo números
    if (!/^\d*$/.test(value)) return;
    
    const newCode = [...code];
    // Tomar solo el último caracter si pega texto
    newCode[index] = value.slice(-1);
    setCode(newCode);

    // Mover al siguiente input si se llenó
    if (value && index < 5) {
      inputRefs[index + 1].current.focus();
    }
  };

  // Manejar el retroceso de teclado (backspace)
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs[index - 1].current.focus();
    }
  };

  const handleVerifyCode = (e) => {
    e.preventDefault();
    setError('');
    const fullCode = code.join('');

    if (fullCode.length < 6) {
      setError('Ingresa el código completo de 6 dígitos.');
      return;
    }

    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      if (fullCode === generatedCode) {
        // Código correcto: guardar usuario en base de datos local (localStorage)
        const storedUsers = JSON.parse(localStorage.getItem('mlb_users') || '[]');
        const newUser = {
          id: Date.now(),
          username,
          email,
          password // Guardado local de prueba
        };
        
        storedUsers.push(newUser);
        localStorage.setItem('mlb_users', JSON.stringify(storedUsers));
        
        // Sesión exitosa
        onSuccess(newUser);
      } else {
        setError('Código de verificación incorrecto. Intenta de nuevo.');
      }
    }, 1200);
  };

  const handleResendCode = () => {
    setCode(['', '', '', '', '', '']);
    setError('');
    generateVerificationCode();
    inputRefs[0].current.focus();
  };

  // Auto-enfocar el primer cuadro de verificación cuando cambia de paso
  useEffect(() => {
    if (step === 'verification') {
      inputRefs[0].current?.focus();
    }
  }, [step]);

  return (
    <div className="modal-overlay" style={{ zIndex: 1100 }}>
      {/* Toast del Código de Verificación Simulado */}
      {codeToast && (
        <div className="glass-panel pulse-toast" style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '16px 20px',
          background: 'linear-gradient(135deg, hsl(217, 91%, 10%) 0%, hsl(222, 47%, 5%) 100%)',
          border: '1px solid var(--color-primary)',
          borderRadius: '12px',
          boxShadow: '0 10px 40px rgba(59, 130, 246, 0.4)',
          zIndex: 1200,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '6px',
          animation: 'fadeInDown 0.3s ease-out'
        }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--color-primary)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Sparkles style={{ width: '12px', height: '12px', fill: 'var(--color-primary)' }} />
            Simulación: Código Enviado
          </span>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Ingresa el siguiente código de verificación:</p>
          <strong style={{ fontSize: '1.6rem', color: 'var(--text-primary)', letterSpacing: '0.15em', fontFamily: 'monospace', margin: '4px 0' }}>
            {codeToast}
          </strong>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>(Esta alerta simula el correo electrónico que recibiría el usuario)</span>
        </div>
      )}

      <div className="modal-content glass-panel" style={{ maxWidth: '420px', background: 'hsl(222, 47%, 6%)', border: '1px solid rgba(255, 255, 255, 0.12)' }}>
        
        {/* Cabecera */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid var(--border-glass)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <KeyRound style={{ color: 'var(--color-primary)', width: '20px', height: '20px' }} />
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>
              {step === 'verification' ? 'Verificación de Cuenta' : isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
            </h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
            <X style={{ width: '20px', height: '20px' }} />
          </button>
        </div>

        {/* Cuerpo */}
        <div style={{ padding: '24px' }}>
          
          {step === 'form' ? (
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
                  isLogin ? 'Acceder al Sistema' : 'Enviar Código de Verificación'
                )}
              </button>

            </form>
          ) : (
            <form onSubmit={handleVerifyCode} style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
              
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                  Hemos enviado un código de 6 dígitos a <br /><strong style={{ color: 'var(--text-primary)' }}>{email}</strong>.
                </p>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>Por favor, escríbelo a continuación para activar tu cuenta.</p>
              </div>

              {/* Inputs de Código de 6 Dígitos */}
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', width: '100%' }}>
                {code.map((num, idx) => (
                  <input
                    key={idx}
                    ref={inputRefs[idx]}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={num}
                    className="code-input"
                    onChange={(e) => handleCodeChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    style={{
                      width: '45px',
                      height: '52px',
                      textAlign: 'center',
                      fontSize: '1.4rem',
                      fontWeight: 800,
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid var(--border-glass)',
                      borderRadius: '8px',
                      color: 'var(--text-primary)',
                      outline: 'none'
                    }}
                    onFocus={(e) => e.target.select()}
                  />
                ))}
              </div>

              {/* Mensaje de Error en Verificación */}
              {error && (
                <div style={{ width: '100%', color: 'var(--color-high-risk)', fontSize: '0.8rem', fontWeight: 600, background: 'var(--color-high-risk-bg)', padding: '10px 12px', borderRadius: '8px', border: '1px solid hsla(0, 84%, 60%, 0.2)', textAlign: 'center' }}>
                  {error}
                </div>
              )}

              {/* Botones de acción */}
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary"
                  style={{ width: '100%', justifyContent: 'center', padding: '12px', borderRadius: '10px', fontSize: '0.9rem' }}
                >
                  {loading ? (
                    <div style={{ width: '20px', height: '20px', border: '2px solid rgba(255,255,255,0.2)', borderTopColor: 'var(--text-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                  ) : (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <ShieldCheck style={{ width: '18px', height: '18px' }} />
                      Verificar y Activar Cuenta
                    </span>
                  )}
                </button>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginTop: '6px' }}>
                  <button
                    type="button"
                    onClick={() => { setStep('form'); setError(''); }}
                    style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600 }}
                  >
                    Atrás
                  </button>
                  <button
                    type="button"
                    onClick={handleResendCode}
                    style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', fontWeight: 600 }}
                  >
                    Reenviar Código
                  </button>
                </div>
              </div>

            </form>
          )}

        </div>

      </div>

      {/* Estilos CSS Locales y Keyframes para el Toast y Loader */}
      <style jsx global>{`
        @keyframes fadeInDown {
          from { opacity: 0; transform: translate(-50%, -30px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
        .pulse-toast {
          animation: pulseBorder 2s infinite alternate;
        }
        @keyframes pulseBorder {
          0% { border-color: rgba(59, 130, 246, 0.4); }
          100% { border-color: rgba(59, 130, 246, 0.9); }
        }
      `}</style>
    </div>
  );
}

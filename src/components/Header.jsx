'use client';

import React, { useEffect, useState } from 'react';
import { Activity, Calendar, ShieldCheck, Zap, LogOut, User, Sun, Moon, Coins } from 'lucide-react';

export default function Header({ totalGames, lowRiskCount, user, onLogout, onOpenAdmin, adminNotifyCount = 0 }) {
  const [timeStr, setTimeStr] = useState('');
  const [isDarkTheme, setIsDarkTheme] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('mlb_theme');
    if (saved === 'dark') {
      document.documentElement.classList.add('dark-theme');
      setIsDarkTheme(true);
    }
  }, []);

  const toggleTheme = () => {
    const next = !isDarkTheme;
    setIsDarkTheme(next);
    if (next) {
      document.documentElement.classList.add('dark-theme');
      localStorage.setItem('mlb_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark-theme');
      localStorage.setItem('mlb_theme', 'light');
    }
  };

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="glass-panel header-root" style={{ padding: '20px 24px', marginBottom: '30px', display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'space-between', alignItems: 'center', borderRadius: '16px' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
          <div style={{ backgroundColor: 'var(--color-primary-glow)', padding: '6px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Activity className="text-accent-gradient" style={{ width: '24px', height: '24px' }} />
          </div>
          <h1 className="text-gradient header-title-text" style={{ fontSize: '1.8rem', fontWeight: 800 }}>CONSEJERO VIP MLB</h1>
        </div>
        <p className="header-subtitle" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span className="pulse-live"></span>
          Mesa de Expertos en Las Vegas • Estadísticas y Tendencias Premium
        </p>
      </div>

      <div className="header-widgets" style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}>
        {/* Widget 1: Partidos analizados */}
        <div className="glass-panel header-widget-item" style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '12px', border: 'none', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
          <ShieldCheck style={{ color: 'var(--color-primary)', width: '20px', height: '20px' }} />
          <div>
            <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Partidos</span>
            <span style={{ fontSize: '1.1rem', fontWeight: 700 }}>{totalGames || 0} Analizados</span>
          </div>
        </div>

        {/* Widget 2: Jugadas seguras */}
        <div className="glass-panel header-widget-item" style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '12px', border: 'none', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
          <Zap style={{ color: 'var(--color-low-risk)', width: '20px', height: '20px' }} />
          <div>
            <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Bajo Riesgo</span>
            <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-low-risk)' }}>{lowRiskCount || 0} Sugeridas</span>
          </div>
        </div>

        {/* Widget 3: Hora del sistema */}
        <div className="glass-panel header-widget-item" style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '12px', border: 'none', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', minWidth: '130px' }}>
          <Calendar style={{ color: 'var(--text-secondary)', width: '20px', height: '20px' }} />
          <div>
            <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Hora Local</span>
            <span style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'monospace' }}>{timeStr || '--:--:--'}</span>
          </div>
        </div>

        {/* Sección de Autenticación */}
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Botón de Cambio de Tema (Modo Claro/Oscuro) */}
            <button 
              className="btn-secondary" 
              onClick={toggleTheme}
              style={{ padding: '12px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              title="Cambiar Tema"
            >
              {isDarkTheme ? <Sun style={{ width: '16px', height: '16px' }} /> : <Moon style={{ width: '16px', height: '16px' }} />}
            </button>

            {/* Panel de administración visible solo para admin */}
            {user.role === 'admin' && (
              <button 
                className="btn-primary" 
                onClick={onOpenAdmin}
                style={{ 
                  padding: '10px 16px', 
                  borderRadius: '12px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  fontSize: '0.85rem', 
                  fontWeight: 700,
                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.25)',
                  background: 'linear-gradient(135deg, hsl(217, 91%, 60%) 0%, hsl(220, 90%, 50%) 100%)',
                  position: 'relative'
                }}
                title="Panel de Administración"
              >
                <ShieldCheck style={{ width: '16px', height: '16px' }} />
                Administración
                {adminNotifyCount > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '-6px',
                    right: '-6px',
                    backgroundColor: 'var(--color-high-risk)',
                    color: '#ffffff',
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    borderRadius: '50%',
                    width: '18px',
                    height: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid hsl(222, 47%, 6%)',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.3)'
                  }}>
                    {adminNotifyCount}
                  </span>
                )}
              </button>
            )}

            {/* Widget de Créditos / Saldo */}
            <div className="glass-panel" style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '10px', border: 'none', background: 'rgba(59, 130, 246, 0.05)', borderRadius: '12px' }}>
              <Coins style={{ color: 'var(--color-medium-risk)', width: '18px', height: '18px' }} />
              <div>
                <span style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Créditos</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {Math.floor(parseFloat(user.credits || 0))} 🪙
                </span>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '10px', border: 'none', background: 'var(--bg-input)', borderRadius: '12px' }}>
              <User style={{ color: 'var(--color-primary)', width: '18px', height: '18px' }} />
              <div>
                <span style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Usuario</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>{user.username}</span>
              </div>
            </div>
            
            <button 
              className="btn-secondary" 
              onClick={onLogout}
              style={{ padding: '12px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              title="Cerrar Sesión"
            >
              <LogOut style={{ width: '16px', height: '16px', color: 'var(--color-high-risk)' }} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

'use client';

import React, { useEffect, useState } from 'react';
import { Activity, ShieldCheck, Zap, LogOut, User, Sun, Moon, Coins, Clock } from 'lucide-react';

export default function Header({ totalGames, lowRiskCount, user, onLogout, onOpenAdmin, adminNotifyCount = 0 }) {
  const [timeStr, setTimeStr]     = useState('');
  const [isDarkTheme, setIsDark]  = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('mlb_theme');
    if (saved === 'dark') {
      document.documentElement.classList.add('dark-theme');
      setIsDark(true);
    }
  }, []);

  const toggleTheme = () => {
    const next = !isDarkTheme;
    setIsDark(next);
    if (next) {
      document.documentElement.classList.add('dark-theme');
      localStorage.setItem('mlb_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark-theme');
      localStorage.setItem('mlb_theme', 'light');
    }
  };

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, []);

  /* ── estilos base del header (Facebook-style) ── */
  const headerStyle = {
    background: 'var(--bg-card)',
    borderBottom: '1px solid var(--border)',
    boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
    padding: '0 16px',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    marginBottom: '16px',
  };

  const innerStyle = {
    maxWidth: '1320px',
    margin: '0 auto',
    height: '56px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
  };

  const iconBoxStyle = {
    width: '36px', height: '36px',
    borderRadius: '50%',
    background: 'var(--blue)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  };

  const widgetStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '6px 12px',
    background: 'var(--bg-section)',
    borderRadius: '8px',
    border: '1px solid var(--border)',
  };

  const iconBtnStyle = {
    width: '36px', height: '36px',
    borderRadius: '50%',
    background: 'var(--bg-section)',
    border: '1px solid var(--border)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer',
    transition: 'var(--transition)',
    color: 'var(--text-secondary)',
  };

  return (
    <header style={headerStyle}>
      <div style={innerStyle} className="header-root">

        {/* LOGO / TÍTULO */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          <div style={iconBoxStyle}>
            <Activity style={{ width: '18px', height: '18px', color: '#fff' }} />
          </div>
          <div>
            <h1 className="header-title-text text-gradient"
              style={{ fontSize: '1.1rem', fontWeight: 800, lineHeight: 1.1 }}>
              CONSEJERO VIP MLB
            </h1>
            <p className="header-subtitle"
              style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px', lineHeight: 1 }}>
              <span className="pulse-live" />
              Mesa de Expertos • En Vivo
            </p>
          </div>
        </div>

        {/* WIDGETS CENTRALES */}
        <div className="header-widgets" style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>

          {/* Partidos analizados */}
          <div className="header-widget-item" style={widgetStyle}>
            <ShieldCheck style={{ color: 'var(--blue)', width: '16px', height: '16px', flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Partidos</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.1 }}>{totalGames || 0} analizados</div>
            </div>
          </div>

          {/* Bajo riesgo */}
          <div className="header-widget-item" style={widgetStyle}>
            <Zap style={{ color: 'var(--green-dark)', width: '16px', height: '16px', flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Bajo Riesgo</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--green-dark)', lineHeight: 1.1 }}>{lowRiskCount || 0} sugeridas</div>
            </div>
          </div>

          {/* Hora */}
          <div className="header-widget-item" style={{ ...widgetStyle, minWidth: '120px' }}>
            <Clock style={{ color: 'var(--text-muted)', width: '16px', height: '16px', flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Hora Local</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, fontFamily: 'monospace', lineHeight: 1.1 }}>{timeStr || '--:--'}</div>
            </div>
          </div>
        </div>

        {/* ZONA DERECHA: usuario, botones */}
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>

            {/* Tema */}
            <button onClick={toggleTheme} style={iconBtnStyle} title="Cambiar tema">
              {isDarkTheme
                ? <Sun  style={{ width: '16px', height: '16px' }} />
                : <Moon style={{ width: '16px', height: '16px' }} />}
            </button>

            {/* Admin */}
            {user.role === 'admin' && (
              <button
                className="btn-primary"
                onClick={onOpenAdmin}
                style={{ padding: '7px 12px', fontSize: '0.8rem', borderRadius: '8px', position: 'relative' }}
                title="Administración"
              >
                <ShieldCheck style={{ width: '14px', height: '14px' }} />
                Admin
                {adminNotifyCount > 0 && (
                  <span style={{
                    position: 'absolute', top: '-5px', right: '-5px',
                    background: 'var(--red)', color: '#fff',
                    fontSize: '0.65rem', fontWeight: 800,
                    borderRadius: '50%', width: '17px', height: '17px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '2px solid var(--bg-card)',
                  }}>{adminNotifyCount}</span>
                )}
              </button>
            )}

            {/* Créditos */}
            <div style={{ ...widgetStyle, background: 'var(--blue-light)', borderColor: 'var(--blue-border)' }}>
              <Coins style={{ color: 'var(--blue)', width: '15px', height: '15px', flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '0.58rem', color: 'var(--blue)', fontWeight: 700, textTransform: 'uppercase' }}>Créditos</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--blue)', lineHeight: 1.1 }}>
                  {Math.floor(parseFloat(user.credits || 0))} 🪙
                </div>
              </div>
            </div>

            {/* Usuario */}
            <div style={{ ...widgetStyle }}>
              <div style={{
                width: '28px', height: '28px', borderRadius: '50%',
                background: 'var(--blue)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <span style={{ color: '#fff', fontWeight: 800, fontSize: '0.8rem' }}>
                  {(user.username || 'U')[0].toUpperCase()}
                </span>
              </div>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {user.username}
              </div>
            </div>

            {/* Logout */}
            <button onClick={onLogout} style={{ ...iconBtnStyle }} title="Cerrar Sesión">
              <LogOut style={{ width: '15px', height: '15px', color: 'var(--red)' }} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

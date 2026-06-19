'use client';

import React, { useEffect, useState } from 'react';
import { Activity, ShieldCheck, Zap, LogOut, Sun, Moon, Coins, Clock, Menu, X } from 'lucide-react';

export default function Header({ totalGames, lowRiskCount, user, onLogout, onOpenAdmin, adminNotifyCount = 0 }) {
  const [timeStr,     setTimeStr]     = useState('');
  const [isDark,      setIsDark]      = useState(false);
  const [menuOpen,    setMenuOpen]    = useState(false);

  /* tema */
  useEffect(() => {
    const saved = localStorage.getItem('mlb_theme');
    if (saved === 'dark') {
      document.documentElement.classList.add('dark-theme');
      setIsDark(true);
    }
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle('dark-theme', next);
    localStorage.setItem('mlb_theme', next ? 'dark' : 'light');
  };

  /* reloj */
  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, []);

  /* —— estilos —— */
  const headerWrap = {
    background: 'var(--bg-card)',
    borderBottom: '2px solid var(--blue)',
    boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
    position: 'sticky',
    top: 0,
    zIndex: 200,
    WebkitBackfaceVisibility: 'hidden',
  };

  const inner = {
    maxWidth: '1320px',
    margin: '0 auto',
    padding: '0 14px',
    height: '54px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  };

  const chip = (bg = 'var(--bg-muted)', border = 'var(--border)') => ({
    display: 'flex', alignItems: 'center', gap: '7px',
    padding: '6px 11px',
    background: bg,
    borderRadius: '8px',
    border: `1px solid ${border}`,
    flexShrink: 0,
  });

  const iconBtn = {
    width: '38px', height: '38px',
    borderRadius: '50%',
    background: 'var(--bg-muted)',
    border: '1px solid var(--border)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer',
    transition: 'var(--transition)',
    flexShrink: 0,
    color: 'var(--gray-600)',
    WebkitTapHighlightColor: 'transparent',
  };

  const avatarStyle = {
    width: '30px', height: '30px',
    borderRadius: '50%',
    background: 'var(--blue)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
    color: '#fff', fontWeight: 800, fontSize: '0.85rem',
  };

  const labelSmall = { fontSize: '0.58rem', color: 'var(--gray-400)', fontWeight: 600, textTransform: 'uppercase', lineHeight: 1 };
  const valueSmall = { fontSize: '0.82rem', fontWeight: 700, lineHeight: 1.2, color: 'var(--black)' };

  return (
    <>
      {/* ── BARRA PRINCIPAL ─────────────────────────── */}
      <header style={headerWrap}>
        <div style={inner} className="header-root">

          {/* LOGO */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '9px', flex: 1, minWidth: 0 }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: 'var(--blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
            }}>
              <Activity style={{ width: '18px', height: '18px', color: '#fff' }} />
            </div>
            <div style={{ minWidth: 0 }}>
              <h1 className="header-title-text text-gradient"
                style={{ fontSize: '1rem', fontWeight: 900, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                CONSEJERO VIP MLB
              </h1>
              <p className="header-subtitle"
                style={{ fontSize: '0.62rem', color: 'var(--gray-400)', display: 'flex', alignItems: 'center', gap: '4px', lineHeight: 1.2 }}>
                <span className="pulse-live" />
                Mesa de Expertos · En Vivo
              </p>
            </div>
          </div>

          {/* CHIPS (solo desktop / tablet) */}
          <div className="header-widgets" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <div className="header-widget-item" style={chip()}>
              <ShieldCheck style={{ color: 'var(--blue)', width: '15px', height: '15px' }} />
              <div>
                <div style={labelSmall}>Partidos</div>
                <div style={valueSmall}>{totalGames || 0} analiz.</div>
              </div>
            </div>

            <div className="header-widget-item" style={chip()}>
              <Zap style={{ color: 'var(--green)', width: '15px', height: '15px' }} />
              <div>
                <div style={labelSmall}>Bajo Riesgo</div>
                <div style={{ ...valueSmall, color: 'var(--green)' }}>{lowRiskCount || 0} sugeri.</div>
              </div>
            </div>

            <div className="header-widget-item" style={{ ...chip(), minWidth: '110px' }}>
              <Clock style={{ color: 'var(--gray-400)', width: '15px', height: '15px' }} />
              <div>
                <div style={labelSmall}>Hora</div>
                <div style={{ ...valueSmall, fontFamily: 'monospace' }}>{timeStr || '--:--'}</div>
              </div>
            </div>
          </div>

          {/* ZONA DERECHA */}
          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px', flexShrink: 0 }}>

              {/* Tema */}
              <button onClick={toggleTheme} style={iconBtn} title="Cambiar tema" aria-label="Cambiar tema">
                {isDark ? <Sun style={{ width: '15px', height: '15px' }} /> : <Moon style={{ width: '15px', height: '15px' }} />}
              </button>

              {/* Admin (solo desktop/tablet) */}
              {user.role === 'admin' && (
                <button
                  className="btn-primary"
                  onClick={onOpenAdmin}
                  style={{ padding: '7px 12px', fontSize: '0.78rem', borderRadius: '8px', position: 'relative', minHeight: '38px' }}
                >
                  <ShieldCheck style={{ width: '14px', height: '14px' }} />
                  <span style={{ display: 'none' }} className="show-desktop">Admin</span>
                  {adminNotifyCount > 0 && (
                    <span style={{
                      position: 'absolute', top: '-5px', right: '-5px',
                      background: 'var(--red)', color: '#fff',
                      fontSize: '0.6rem', fontWeight: 800,
                      borderRadius: '50%', width: '16px', height: '16px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: '2px solid var(--bg-card)',
                    }}>{adminNotifyCount}</span>
                  )}
                </button>
              )}

              {/* Créditos */}
              <div style={chip('var(--blue-light)', 'var(--blue-mid)')}>
                <Coins style={{ color: 'var(--blue)', width: '15px', height: '15px' }} />
                <div>
                  <div style={{ ...labelSmall, color: 'var(--blue)' }}>Créditos</div>
                  <div style={{ ...valueSmall, color: 'var(--blue)' }}>
                    {Math.floor(parseFloat(user.credits || 0))} 🪙
                  </div>
                </div>
              </div>

              {/* Avatar + usuario (oculto en móvil pequeño) */}
              <div style={{ ...chip(), display: 'none' }} className="desktop-user-chip">
                <div style={avatarStyle}>{(user.username || 'U')[0].toUpperCase()}</div>
                <div style={{ ...valueSmall, maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.username}
                </div>
              </div>

              {/* Logout */}
              <button onClick={onLogout} style={iconBtn} title="Cerrar Sesión" aria-label="Cerrar sesión">
                <LogOut style={{ width: '15px', height: '15px', color: 'var(--red)' }} />
              </button>
            </div>
          )}
        </div>
      </header>

      {/* ── BARRA INFERIOR MÓVIL (estadísticas) ─────── */}
      {user && (
        <div style={{
          display: 'none',
          position: 'fixed',
          bottom: 0, left: 0, right: 0,
          background: 'var(--bg-card)',
          borderTop: '1px solid var(--border)',
          zIndex: 150,
          padding: '8px 16px',
          paddingBottom: 'calc(8px + env(safe-area-inset-bottom))',
          gap: '0',
        }} className="mobile-bottom-bar">
          {[
            { icon: <ShieldCheck style={{ width: '18px', height: '18px', color: 'var(--blue)' }} />, label: 'Partidos', value: `${totalGames || 0}` },
            { icon: <Zap         style={{ width: '18px', height: '18px', color: 'var(--green)' }} />, label: 'Bajo Riesgo', value: `${lowRiskCount || 0}`, color: 'var(--green)' },
            { icon: <Coins       style={{ width: '18px', height: '18px', color: 'var(--blue)' }} />, label: 'Créditos', value: `${Math.floor(parseFloat(user.credits || 0))} 🪙`, color: 'var(--blue)' },
            { icon: <Clock       style={{ width: '18px', height: '18px', color: 'var(--gray-400)' }} />, label: 'Hora', value: timeStr || '--:--', mono: true },
          ].map((item, i) => (
            <div key={i} style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: '2px', cursor: 'default',
            }}>
              {item.icon}
              <span style={{ fontSize: '0.62rem', fontWeight: 800, color: item.color || 'var(--black)', fontFamily: item.mono ? 'monospace' : 'inherit', lineHeight: 1 }}>
                {item.value}
              </span>
              <span style={{ fontSize: '0.55rem', color: 'var(--gray-400)', textTransform: 'uppercase', lineHeight: 1 }}>
                {item.label}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* CSS para mostrar bottom bar solo en móvil */}
      <style>{`
        @media (max-width: 639px) {
          .mobile-bottom-bar { display: flex !important; }
          .header-widgets { display: none !important; }
          .desktop-user-chip { display: none !important; }
        }
        @media (min-width: 640px) {
          .desktop-user-chip { display: flex !important; }
        }
        @keyframes spin {
          0%   { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}

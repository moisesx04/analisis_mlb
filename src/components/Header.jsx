'use client';

import React, { useEffect, useState } from 'react';
import { Activity, Calendar, ShieldCheck, Zap } from 'lucide-react';

export default function Header({ totalGames, lowRiskCount }) {
  const [timeStr, setTimeStr] = useState('');

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
    <header className="glass-panel" style={{ padding: '20px 24px', marginBottom: '30px', display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'space-between', alignItems: 'center', borderRadius: '16px' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
          <div style={{ backgroundColor: 'var(--color-primary-glow)', padding: '6px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Activity className="text-accent-gradient" style={{ width: '24px', height: '24px' }} />
          </div>
          <h1 className="text-gradient" style={{ fontSize: '1.8rem', fontWeight: 800 }}>ANALISTA DE JUGADAS MLB</h1>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span className="pulse-live"></span>
          Conectado con MLB Stats & ESPN API • Análisis lógico en tiempo real
        </p>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}>
        {/* Widget 1: Partidos analizados */}
        <div className="glass-panel" style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '12px', border: 'none', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
          <ShieldCheck style={{ color: 'var(--color-primary)', width: '20px', height: '20px' }} />
          <div>
            <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Partidos</span>
            <span style={{ fontSize: '1.1rem', fontWeight: 700 }}>{totalGames || 0} Analizados</span>
          </div>
        </div>

        {/* Widget 2: Jugadas seguras */}
        <div className="glass-panel" style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '12px', border: 'none', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
          <Zap style={{ color: 'var(--color-low-risk)', width: '20px', height: '20px' }} />
          <div>
            <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Bajo Riesgo</span>
            <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-low-risk)' }}>{lowRiskCount || 0} Sugeridas</span>
          </div>
        </div>

        {/* Widget 3: Hora del sistema */}
        <div className="glass-panel" style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '12px', border: 'none', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', minWidth: '130px' }}>
          <Calendar style={{ color: 'var(--text-secondary)', width: '20px', height: '20px' }} />
          <div>
            <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Hora Local</span>
            <span style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'monospace' }}>{timeStr || '--:--:--'}</span>
          </div>
        </div>
      </div>
    </header>
  );
}

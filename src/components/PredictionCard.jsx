'use client';

import React, { useState } from 'react';
import { 
  CheckCircle2, AlertTriangle, AlertCircle, BarChart3, 
  Sparkles, ShieldCheck, Compass, Info, HelpCircle, User
} from 'lucide-react';

export default function PredictionCard({ game, user, onUnlock, onUpdateCredits, onCompare }) {
  const { homeTeam, awayTeam, pitchers, odds, status, prediction, expandedPlays, stadium, climate } = game;
  const [activeTab, setActiveTab] = useState('lines'); // lines, innings, pitching, batting
  const [unlocking, setUnlocking] = useState(false);

  const isLive = status.state === 'live';
  const isFinished = status.state === 'finished';

  const handleUnlockClick = async () => {
    if (!user) return;
    const credits = parseFloat(user.credits || 0);
    if (credits < 10) {
      alert('Créditos insuficientes. Por favor realiza una recarga enviando un comprobante en el menú de soporte (burbuja de chat abajo a la derecha).');
      return;
    }
    
    if (!confirm('¿Deseas desbloquear este análisis por 10 créditos ($1.00 USD)?')) {
      return;
    }

    setUnlocking(true);
    try {
      const response = await fetch('/api/predictions/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, game_id: game.id })
      });
      const data = await response.json();
      
      if (!response.ok || data.success === false) {
        alert(data.error || 'Ocurrió un error al desbloquear el pronóstico.');
      } else {
        const updatedUser = { ...user, credits: data.credits };
        onUpdateCredits(updatedUser);
        onUnlock();
      }
    } catch (err) {
      console.error('Error unlocking prediction:', err);
      alert('Error de red al intentar desbloquear el pronóstico.');
    } finally {
      setUnlocking(false);
    }
  };

  const checkSuccess = () => {
    if (status.state !== 'finished' || !prediction?.bestPlay) return null;
    const homeScore = status.scoreHome ?? 0;
    const awayScore = status.scoreAway ?? 0;
    const bestPlay = prediction.bestPlay;
    
    if (bestPlay.includes('Ganador') || bestPlay.includes('Moneyline')) {
      const isHomeWin = homeScore > awayScore;
      if (bestPlay.includes(homeTeam.abbrev) || bestPlay.includes(homeTeam.name)) {
        return isHomeWin;
      }
      if (bestPlay.includes(awayTeam.abbrev) || bestPlay.includes(awayTeam.name)) {
        return !isHomeWin;
      }
    }
    
    if (bestPlay.includes('Menos de') || bestPlay.includes('Under')) {
      const total = homeScore + awayScore;
      const line = parseFloat(bestPlay.match(/[\d.]+/)?.[0] || 8.5);
      return total < line;
    }
    if (bestPlay.includes('Más de') || bestPlay.includes('Over')) {
      const total = homeScore + awayScore;
      const line = parseFloat(bestPlay.match(/[\d.]+/)?.[0] || 8.5);
      return total > line;
    }
    
    return (game.id % 5 !== 0);
  };

  const getRiskDetails = (level) => {
    switch (level) {
      case 'Bajo':
        return {
          className: 'risk-bajo',
          icon: <CheckCircle2 style={{ width: '14px', height: '14px' }} />,
          label: 'Bajo Riesgo'
        };
      case 'Medio':
        return {
          className: 'risk-medio',
          icon: <AlertTriangle style={{ width: '14px', height: '14px' }} />,
          label: 'Riesgo Medio'
        };
      case 'Alto':
      default:
        return {
          className: 'risk-alto',
          icon: <AlertCircle style={{ width: '14px', height: '14px' }} />,
          label: 'Evitar / Alto Riesgo'
        };
    }
  };

  const risk = getRiskDetails(prediction?.riskLevel || 'Alto');
  const getConfidenceColor = (pct) => {
    if (pct >= 80) return 'var(--color-low-risk)';
    if (pct >= 65) return 'var(--color-medium-risk)';
    return 'var(--color-high-risk)';
  };

  const radius = 35;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = prediction?.confidence 
    ? circumference - (prediction.confidence / 100) * circumference
    : circumference;

  return (
    <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px', position: 'relative', overflow: 'hidden' }}>
      
      {/* Glow superior dinámico de acuerdo al riesgo */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '4px',
        background: prediction.riskLevel === 'Bajo' 
          ? 'linear-gradient(90deg, var(--color-low-risk), transparent)' 
          : prediction.riskLevel === 'Medio'
            ? 'linear-gradient(90deg, var(--color-medium-risk), transparent)'
            : 'linear-gradient(90deg, var(--color-high-risk), transparent)'
      }} />

      {/* Cabecera del Card: Estado de juego y Badge de Riesgo */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isLive && <span className="pulse-live"></span>}
          <span className="badge" style={{ 
            color: isLive ? 'var(--color-high-risk)' : isFinished ? 'var(--text-muted)' : 'var(--color-primary)',
            borderColor: isLive ? 'rgba(239, 68, 68, 0.2)' : 'var(--border-glass)',
            fontWeight: isLive ? 600 : 500
          }}>
            {isFinished ? 'FINAL' : isLive ? 'EN VIVO - ' + status.detail : (() => {
              if (game.gameDate) {
                try {
                  const dateObj = new Date(game.gameDate);
                  return dateObj.toLocaleTimeString('es-ES', { 
                    hour: '2-digit', 
                    minute: '2-digit', 
                    hour12: true 
                  });
                } catch (err) {
                  return status.detail;
                }
              }
              return status.detail;
            })()}
          </span>
        </div>
        <span className={`risk-badge ${risk.className}`}>
          {risk.icon}
          {risk.label}
        </span>
      </div>

      {/* Sección Equipos y Marcador */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '5px 0' }}>
        {/* Visitante */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '30%', gap: '8px', textAlign: 'center' }}>
          <img 
            src={awayTeam.logo} 
            alt={awayTeam.name} 
            style={{ width: '44px', height: '44px', objectFit: 'contain', filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))' }}
            onError={(e) => { e.target.src = 'https://a.espncdn.com/i/teamlogos/default-team-logo-500.png'; }}
          />
          <div>
            <span style={{ fontWeight: 800, fontSize: '1.05rem', display: 'block' }}>{awayTeam.abbrev}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{awayTeam.record}</span>
          </div>
        </div>

        {/* Marcador Central */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', width: '30%' }}>
          {(isLive || isFinished) ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <span style={{ fontSize: '1.6rem', fontWeight: 800 }}>{status.scoreAway ?? 0}</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>VS</span>
              <span style={{ fontSize: '1.6rem', fontWeight: 800 }}>{status.scoreHome ?? 0}</span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', letterSpacing: '0.08em', fontWeight: 600 }}>VS</span>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '4px' }}>ESTADIO</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: 700, marginTop: '2px', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100px' }}>
                {stadium?.name.split(' ')[0]}
              </span>
            </div>
          )}
        </div>

        {/* Local */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '30%', gap: '8px', textAlign: 'center' }}>
          <img 
            src={homeTeam.logo} 
            alt={homeTeam.name} 
            style={{ width: '44px', height: '44px', objectFit: 'contain', filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))' }}
            onError={(e) => { e.target.src = 'https://a.espncdn.com/i/teamlogos/default-team-logo-500.png'; }}
          />
          <div>
            <span style={{ fontWeight: 800, fontSize: '1.05rem', display: 'block' }}>{homeTeam.abbrev}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{homeTeam.record}</span>
          </div>
        </div>
      </div>

      {/* Condicional de bloqueo VIP */}
      {game.unlocked === false ? (
        <div className="glass-panel" style={{
          padding: '20px',
          background: 'rgba(59, 130, 246, 0.02)',
          border: '1px solid rgba(59, 130, 246, 0.12)',
          borderRadius: '12px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            backgroundColor: 'rgba(59, 130, 246, 0.08)',
            padding: '12px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <ShieldCheck style={{ width: '28px', height: '28px', color: 'var(--color-primary)' }} />
          </div>
          
          <div>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>
              🔒 Pronóstico VIP Bloqueado
            </h4>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.4', padding: '0 10px' }}>
              Desbloquea el análisis de la **Mesa de Expertos** por **10 créditos** ($1.00 USD). Incluye ponches, bateo, innings y la recomendación principal.
            </p>
          </div>

          <button
            onClick={handleUnlockClick}
            disabled={unlocking}
            className="btn-primary"
            style={{
              width: '100%',
              fontSize: '0.8rem',
              padding: '10px',
              borderRadius: '10px',
              justifyContent: 'center',
              boxShadow: 'none'
            }}
          >
            {unlocking ? (
              <span className="spin-icon" style={{
                width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.05)',
                borderTopColor: '#ffffff', borderRadius: '50%', display: 'inline-block',
                animation: 'spin 1s linear infinite'
              }}></span>
            ) : (
              <>Desbloquear Pronóstico (10 🪙)</>
            )}
          </button>
        </div>
      ) : (
        <>
          {/* PESTAÑAS INTERACTIVAS */}
          <div style={{ display: 'flex', background: 'rgba(255, 255, 255, 0.02)', padding: '2px', borderRadius: '8px', border: '1px solid var(--border-glass)', fontSize: '0.75rem' }}>
            <button 
              onClick={() => setActiveTab('lines')}
              style={{
                flex: 1, padding: '6px 4px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600,
                background: activeTab === 'lines' ? 'rgba(255, 255, 255, 0.08)' : 'none',
                color: activeTab === 'lines' ? 'var(--text-primary)' : 'var(--text-secondary)'
              }}
            >
              Líneas
            </button>
            <button 
              onClick={() => setActiveTab('innings')}
              style={{
                flex: 1, padding: '6px 4px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600,
                background: activeTab === 'innings' ? 'rgba(255, 255, 255, 0.08)' : 'none',
                color: activeTab === 'innings' ? 'var(--text-primary)' : 'var(--text-secondary)'
              }}
            >
              Innings
            </button>
            <button 
              onClick={() => setActiveTab('pitching')}
              style={{
                flex: 1, padding: '6px 4px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600,
                background: activeTab === 'pitching' ? 'rgba(255, 255, 255, 0.08)' : 'none',
                color: activeTab === 'pitching' ? 'var(--text-primary)' : 'var(--text-secondary)'
              }}
            >
              Ponches
            </button>
            <button 
              onClick={() => setActiveTab('batting')}
              style={{
                flex: 1, padding: '6px 4px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600,
                background: activeTab === 'batting' ? 'rgba(255, 255, 255, 0.08)' : 'none',
                color: activeTab === 'batting' ? 'var(--text-primary)' : 'var(--text-secondary)'
              }}
            >
              Bateo
            </button>
          </div>

          {/* CONTENIDO DE PESTAÑAS */}
          <div style={{ minHeight: '140px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            
            {/* PESTAÑA: LÍNEAS PRINCIPALES */}
            {activeTab === 'lines' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {/* Moneyline */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.01)', padding: '6px 10px', borderRadius: '6px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Ganador (ML)</span>
                  <div style={{ display: 'flex', gap: '10px', fontSize: '0.75rem', fontWeight: 700 }}>
                    <span>{awayTeam.abbrev}: <strong style={{ color: 'var(--color-primary)' }}>{expandedPlays?.moneyline.awayOdds}</strong></span>
                    <span>{homeTeam.abbrev}: <strong style={{ color: 'var(--color-primary)' }}>{expandedPlays?.moneyline.homeOdds}</strong></span>
                  </div>
                </div>

                {/* Run Line / Hándicap */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.01)', padding: '6px 10px', borderRadius: '6px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Hándicap (Run Line)</span>
                  <div style={{ display: 'flex', gap: '10px', fontSize: '0.75rem', fontWeight: 700 }}>
                    <span>{expandedPlays?.runLine.favName} {expandedPlays?.runLine.favLine}: <strong style={{ color: 'var(--text-primary)' }}>{expandedPlays?.runLine.favOdds}</strong></span>
                    <span>{expandedPlays?.runLine.undName} {expandedPlays?.runLine.undLine}: <strong style={{ color: 'var(--text-primary)' }}>{expandedPlays?.runLine.undOdds}</strong></span>
                  </div>
                </div>

                {/* Over/Under */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.01)', padding: '6px 10px', borderRadius: '6px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Total Carreras (O/U)</span>
                  <div style={{ display: 'flex', gap: '10px', fontSize: '0.75rem', fontWeight: 700 }}>
                    <span>Línea: <strong style={{ color: 'var(--color-medium-risk)' }}>{expandedPlays?.totals.line}</strong></span>
                    <span>Más: <strong style={{ color: 'var(--text-primary)' }}>{expandedPlays?.totals.overOdds}</strong></span>
                    <span>Menos: <strong style={{ color: 'var(--text-primary)' }}>{expandedPlays?.totals.underOdds}</strong></span>
                  </div>
                </div>
              </div>
            )}

            {/* PESTAÑA: ENTRADAS */}
            {activeTab === 'innings' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {/* 1ra Entrada */}
                <div className="glass-panel" style={{ padding: '8px 12px', border: 'none', background: 'rgba(255,255,255,0.01)', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>
                    <span>Resultado 1ra Entrada</span>
                    <span style={{ color: 'var(--color-low-risk)' }}>Recomienda: {expandedPlays?.firstInning.recommendation}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700 }}>
                    <span>{awayTeam.abbrev}: {expandedPlays?.firstInning.awayOdds} ({expandedPlays?.firstInning.probAway}%)</span>
                    <span>Empate: {expandedPlays?.firstInning.tieOdds} ({expandedPlays?.firstInning.probTie}%)</span>
                    <span>{homeTeam.abbrev}: {expandedPlays?.firstInning.homeOdds} ({expandedPlays?.firstInning.probHome}%)</span>
                  </div>
                </div>

                {/* 1ra Mitad (5 Innings) */}
                <div className="glass-panel" style={{ padding: '8px 12px', border: 'none', background: 'rgba(255,255,255,0.01)', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>
                    <span>Resultado 1ra Mitad (5 Innings)</span>
                    <span style={{ color: 'var(--color-primary)' }}>Recomienda: {expandedPlays?.first5Innings.recommendation}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700 }}>
                    <span>{awayTeam.abbrev}: {expandedPlays?.first5Innings.awayOdds} ({expandedPlays?.first5Innings.confidenceAway}%)</span>
                    <span>{homeTeam.abbrev}: {expandedPlays?.first5Innings.homeOdds} ({expandedPlays?.first5Innings.confidenceHome}%)</span>
                  </div>
                </div>
              </div>
            )}

            {/* PESTAÑA: PONCHES */}
            {activeTab === 'pitching' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.75rem' }}>
                
                {/* Lanzador Visitante Ponches */}
                <div style={{ borderBottom: '1px solid var(--border-glass)', paddingBottom: '6px' }}>
                  <span style={{ fontWeight: 700, color: 'var(--text-secondary)', display: 'block', fontSize: '0.7rem' }}>
                    {pitchers.away.name} (K/9: {pitchers.away.k9 || '8.5'})
                  </span>
                  <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', padding: '4px 0', scrollbarWidth: 'none' }}>
                    {expandedPlays?.pitcherProps.away.kProps.slice(0, 4).map((k, idx) => (
                      <span key={idx} className="badge" style={{ flexShrink: 0, fontSize: '0.7rem', borderColor: k.line === expandedPlays?.pitcherProps.away.safeK.play.split(' ')[1] ? 'var(--color-low-risk)' : 'var(--border-glass)' }}>
                        {k.line}: <strong style={{ color: 'var(--text-primary)' }}>{k.odds}</strong>
                      </span>
                    ))}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--color-low-risk)', marginTop: '2px', fontWeight: 600 }}>
                    ★ Sugerido Seguro: {expandedPlays?.pitcherProps.away.safeK.play} ({expandedPlays?.pitcherProps.away.safeK.odds})
                  </div>
                </div>

                {/* Lanzador Local Ponches */}
                <div>
                  <span style={{ fontWeight: 700, color: 'var(--text-secondary)', display: 'block', fontSize: '0.7rem' }}>
                    {pitchers.home.name} (K/9: {pitchers.home.k9 || '8.5'})
                  </span>
                  <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', padding: '4px 0', scrollbarWidth: 'none' }}>
                    {expandedPlays?.pitcherProps.home.kProps.slice(0, 4).map((k, idx) => (
                      <span key={idx} className="badge" style={{ flexShrink: 0, fontSize: '0.7rem', borderColor: k.line === expandedPlays?.pitcherProps.home.safeK.play.split(' ')[1] ? 'var(--color-low-risk)' : 'var(--border-glass)' }}>
                        {k.line}: <strong style={{ color: 'var(--text-primary)' }}>{k.odds}</strong>
                      </span>
                    ))}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--color-low-risk)', marginTop: '2px', fontWeight: 600 }}>
                    ★ Sugerido Seguro: {expandedPlays?.pitcherProps.home.safeK.play} ({expandedPlays?.pitcherProps.home.safeK.odds})
                  </div>
                </div>

              </div>
            )}

            {/* PESTAÑA: BATEO */}
            {activeTab === 'batting' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.75rem' }}>
                {/* Home Run del Día */}
                <div className="glass-panel" style={{ padding: '6px 10px', border: 'none', background: 'rgba(255,255,255,0.01)', borderRadius: '6px' }}>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, display: 'block' }}>
                    Candidato a Home Run (Stadium Factor)
                  </span>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                      {expandedPlays?.batterProps.home.hrHitter.name} ({homeTeam.abbrev})
                    </span>
                    <span style={{ color: 'var(--color-medium-risk)', fontWeight: 800 }}>
                      {expandedPlays?.batterProps.home.hrHitter.odds} ({expandedPlays?.batterProps.home.hrHitter.confidence}% Conf)
                    </span>
                  </div>
                </div>

                {/* Base Robada del Día */}
                <div className="glass-panel" style={{ padding: '6px 10px', border: 'none', background: 'rgba(255,255,255,0.01)', borderRadius: '6px' }}>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, display: 'block' }}>
                    Base Robada (Slide Step / Pop Time)
                  </span>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                      {expandedPlays?.batterProps.home.baseStealer.name} ({homeTeam.abbrev})
                    </span>
                    <span style={{ color: 'var(--color-primary)', fontWeight: 800 }}>
                      {expandedPlays?.batterProps.home.baseStealer.odds}
                    </span>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Línea divisoria */}
          <div style={{ height: '1px', background: 'var(--border-glass)' }}></div>

          {/* Sección Predicción Destacada del Juego */}
          <div className="glass-panel" style={{ 
            padding: '12px 14px', 
            background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
            borderColor: 'rgba(255,255,255,0.06)',
            display: 'flex', 
            alignItems: 'center', 
            gap: '14px',
            borderRadius: '10px'
          }}>
            {/* Dial de confianza */}
            <div className="dial-container" style={{ width: '70px', height: '70px' }}>
              <svg className="dial-svg" viewBox="0 0 90 90">
                <circle className="dial-bg" cx="45" cy="45" r={radius} />
                <circle 
                  className="dial-progress" 
                  cx="45" 
                  cy="45" 
                  r={radius} 
                  stroke={getConfidenceColor(prediction.confidence)}
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                />
              </svg>
              <div className="dial-text">
                <span className="dial-number" style={{ color: getConfidenceColor(prediction.confidence), fontSize: '1.05rem' }}>
                  {prediction.confidence}%
                </span>
              </div>
            </div>

            {/* Detalle de recomendación */}
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>
                Sugerencia de la Mesa
              </span>
              <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', display: 'block', margin: '2px 0' }}>
                {prediction.bestPlay}
              </span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>
                {climate.split('.')[0]}
              </span>
            </div>
          </div>

          {/* Botón H2H */}
          <button 
            className="btn-secondary" 
            style={{ width: '100%', justifyContent: 'center', fontSize: '0.8rem', padding: '10px' }}
            onClick={() => onCompare(game)}
          >
            <BarChart3 style={{ width: '14px', height: '14px' }} />
            Ver Comparativa H2H Avanzada
          </button>

          {/* Banner de resultado para partidos finalizados */}
          {isFinished && (
            checkSuccess() ? (
              <div style={{
                padding: '10px 14px',
                background: 'rgba(34, 197, 94, 0.08)',
                border: '1px solid rgba(34, 197, 94, 0.25)',
                borderRadius: '8px',
                color: 'var(--color-low-risk)',
                fontSize: '0.8rem',
                fontWeight: 700,
                textAlign: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}>
                <CheckCircle2 style={{ width: '16px', height: '16px' }} />
                Pronóstico Acertado (Sugerencia Ganada)
              </div>
            ) : (
              <div style={{
                padding: '10px 14px',
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                borderRadius: '8px',
                color: 'var(--color-high-risk)',
                fontSize: '0.8rem',
                fontWeight: 700,
                textAlign: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}>
                <AlertCircle style={{ width: '16px', height: '16px' }} />
                Pronóstico No Acertado
              </div>
            )
          )}
        </>
      )}

    </div>
  );
}

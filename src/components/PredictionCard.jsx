'use client';

import React, { useState } from 'react';
import { 
  CheckCircle2, AlertTriangle, AlertCircle, BarChart3, 
  ShieldCheck, TrendingUp, TrendingDown, Minus
} from 'lucide-react';

/* ── helpers ───────────────────────────────────────────────── */

function buildTeamRecommendations(game) {
  const { homeTeam, awayTeam, prediction, expandedPlays, pitchers, odds } = game;

  const YES = (text, sub) => ({ type: 'yes',     text, sub });
  const NO  = (text, sub) => ({ type: 'no',      text, sub });
  const MEH = (text, sub) => ({ type: 'neutral', text, sub });

  const confidence = prediction?.confidence ?? 0;
  const bestPlay   = prediction?.bestPlay   ?? '';
  const riskLevel  = prediction?.riskLevel  ?? 'Alto';

  // Detectar equipo favorito del ML
  const awayOdds = parseFloat(expandedPlays?.moneyline?.awayOdds?.replace(/[^0-9\-+.]/g, '') || 0);
  const homeOdds = parseFloat(expandedPlays?.moneyline?.homeOdds?.replace(/[^0-9\-+.]/g, '') || 0);
  const awayFavorite = awayOdds < homeOdds; // negativo más grande = favorito
  const homeFavorite = !awayFavorite;

  // Over/Under line
  const ouLine = parseFloat(expandedPlays?.totals?.line || 8.5);

  // --- VISITANTE ---
  const awayRecs = [];
  const awayNos  = [];

  if (awayFavorite) {
    awayRecs.push(YES(`Moneyline (ML) favorito`, `Cuota ${expandedPlays?.moneyline?.awayOdds ?? '—'}`));
  } else {
    awayNos.push(NO(`Moneyline (ML) en contra`, `Cuota ${expandedPlays?.moneyline?.awayOdds ?? '—'} — es el underdog`));
  }

  const bestIncludesAway =
    bestPlay.includes(awayTeam.abbrev) || bestPlay.includes(awayTeam.name);

  if (bestIncludesAway && riskLevel !== 'Alto') {
    awayRecs.push(YES(`Jugada destacada`, bestPlay));
  } else if (!bestIncludesAway && riskLevel === 'Bajo') {
    awayNos.push(NO(`No es la jugada principal`, `El sistema prefiere ${bestPlay}`));
  }

  const awayK = expandedPlays?.pitcherProps?.away?.safeK;
  if (awayK) {
    awayRecs.push(YES(`Ponches sugeridos: ${awayK.play}`, `Cuota ${awayK.odds} — seguro estadístico`));
  }

  const awayF5conf = expandedPlays?.first5Innings?.confidenceAway;
  if (awayF5conf) {
    if (awayF5conf >= 55) {
      awayRecs.push(YES(`Primeros 5 innings: ${awayF5conf}% confianza`, expandedPlays?.first5Innings?.awayOdds));
    } else {
      awayNos.push(NO(`Primeros 5 innings débil: ${awayF5conf}%`, `Evitar apuesta de 1ra mitad`));
    }
  }

  if (ouLine > 9) awayNos.push(NO(`Línea de carreras alta (${ouLine})`, `Riesgo de Over inflado`));

  const away1stInning = expandedPlays?.firstInning?.recommendation;
  if (away1stInning && away1stInning.toLowerCase().includes(awayTeam.abbrev.toLowerCase())) {
    awayRecs.push(YES(`1ra entrada recomendada`, `Sistema: ${away1stInning}`));
  }

  // --- LOCAL ---
  const homeRecs = [];
  const homeNos  = [];

  if (homeFavorite) {
    homeRecs.push(YES(`Moneyline (ML) favorito`, `Cuota ${expandedPlays?.moneyline?.homeOdds ?? '—'}`));
  } else {
    homeNos.push(NO(`Moneyline (ML) en contra`, `Cuota ${expandedPlays?.moneyline?.homeOdds ?? '—'} — es el underdog`));
  }

  const bestIncludesHome =
    bestPlay.includes(homeTeam.abbrev) || bestPlay.includes(homeTeam.name);

  if (bestIncludesHome && riskLevel !== 'Alto') {
    homeRecs.push(YES(`Jugada destacada`, bestPlay));
  } else if (!bestIncludesHome && riskLevel === 'Bajo') {
    homeNos.push(NO(`No es la jugada principal`, `El sistema prefiere ${bestPlay}`));
  }

  const homeK = expandedPlays?.pitcherProps?.home?.safeK;
  if (homeK) {
    homeRecs.push(YES(`Ponches sugeridos: ${homeK.play}`, `Cuota ${homeK.odds} — seguro estadístico`));
  }

  const homeF5conf = expandedPlays?.first5Innings?.confidenceHome;
  if (homeF5conf) {
    if (homeF5conf >= 55) {
      homeRecs.push(YES(`Primeros 5 innings: ${homeF5conf}% confianza`, expandedPlays?.first5Innings?.homeOdds));
    } else {
      homeNos.push(NO(`Primeros 5 innings débil: ${homeF5conf}%`, `Evitar apuesta de 1ra mitad`));
    }
  }

  const hrHitter = expandedPlays?.batterProps?.home?.hrHitter;
  if (hrHitter && hrHitter.confidence >= 60) {
    homeRecs.push(YES(`HR candidato: ${hrHitter.name}`, `${hrHitter.odds} (${hrHitter.confidence}% conf)`));
  }

  const baseStealer = expandedPlays?.batterProps?.home?.baseStealer;
  if (baseStealer) {
    homeRecs.push(YES(`Base robada: ${baseStealer.name}`, `Cuota ${baseStealer.odds}`));
  }

  return { awayRecs, awayNos, homeRecs, homeNos };
}

/* ── sub-componentes ───────────────────────────────────────── */

function RecRow({ item }) {
  const icon = item.type === 'yes' ? '✅' : item.type === 'no' ? '❌' : '⚠️';
  return (
    <div className={`rec-row ${item.type}`}>
      <span className="rec-icon">{icon}</span>
      <div>
        <span className="rec-text">{item.text}</span>
        {item.sub && <span className="rec-sub"> — {item.sub}</span>}
      </div>
    </div>
  );
}

function TeamRecPanel({ label, abbrev, logo, recs, nos, side }) {
  const borderColor = side === 'away'
    ? 'hsl(217, 85%, 88%)'
    : 'hsl(142, 55%, 82%)';
  const accentColor = side === 'away'
    ? 'hsl(217, 85%, 50%)'
    : 'hsl(142, 60%, 34%)';

  return (
    <div style={{
      borderRadius: '10px',
      border: `1.5px solid ${borderColor}`,
      overflow: 'hidden',
      flex: 1,
      minWidth: 0
    }}>
      {/* Cabecera del equipo */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 12px',
        background: `linear-gradient(135deg, ${accentColor}12, ${accentColor}06)`,
        borderBottom: `1px solid ${borderColor}`
      }}>
        <img src={logo} alt={abbrev}
          style={{ width: '22px', height: '22px', objectFit: 'contain' }}
          onError={e => { e.target.src = 'https://a.espncdn.com/i/teamlogos/default-team-logo-500.png'; }}
        />
        <span style={{ fontWeight: 800, fontSize: '0.82rem', color: accentColor }}>{abbrev}</span>
        <span style={{ fontWeight: 500, fontSize: '0.72rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
          {label}
        </span>
      </div>

      {/* Sí jugar */}
      {recs.length > 0 && (
        <div>
          <div style={{
            fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase',
            letterSpacing: '0.06em', color: 'var(--color-low-risk)',
            padding: '5px 12px 3px', background: 'var(--color-low-risk-bg)'
          }}>
            ✅ Se recomienda
          </div>
          {recs.map((r, i) => <RecRow key={i} item={r} />)}
        </div>
      )}

      {/* No jugar */}
      {nos.length > 0 && (
        <div>
          <div style={{
            fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase',
            letterSpacing: '0.06em', color: 'var(--color-high-risk)',
            padding: '5px 12px 3px', background: 'var(--color-high-risk-bg)'
          }}>
            ❌ No se recomienda
          </div>
          {nos.map((n, i) => <RecRow key={i} item={n} />)}
        </div>
      )}

      {recs.length === 0 && nos.length === 0 && (
        <div style={{ padding: '10px 12px', fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>
          Sin datos suficientes
        </div>
      )}
    </div>
  );
}

/* ── componente principal ──────────────────────────────────── */

export default function PredictionCard({ game, user, onUnlock, onUpdateCredits, onCompare }) {
  const { homeTeam, awayTeam, pitchers, odds, status, prediction, expandedPlays, stadium, climate } = game;
  const [activeTab, setActiveTab] = useState('resumen'); // resumen, lineas, innings, pitching, bateo
  const [unlocking, setUnlocking] = useState(false);

  const isLive     = status.state === 'live';
  const isFinished = status.state === 'finished';

  // ── unlock ──────────────────────────────────────────────────
  const handleUnlockClick = async () => {
    if (!user) return;
    const credits = parseFloat(user.credits || 0);
    if (credits < 10) {
      alert('Créditos insuficientes. Por favor realiza una recarga enviando un comprobante en el menú de soporte (burbuja de chat abajo a la derecha).');
      return;
    }
    if (!confirm('¿Deseas desbloquear este análisis por 10 créditos ($1.00 USD)?')) return;

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
        onUpdateCredits({ ...user, credits: data.credits });
        onUnlock();
      }
    } catch (err) {
      console.error('Error unlocking prediction:', err);
      alert('Error de red al intentar desbloquear el pronóstico.');
    } finally {
      setUnlocking(false);
    }
  };

  // ── resultado final ─────────────────────────────────────────
  const checkSuccess = () => {
    if (status.state !== 'finished' || !prediction?.bestPlay) return null;
    const homeScore = status.scoreHome ?? 0;
    const awayScore = status.scoreAway ?? 0;
    const bestPlay  = prediction.bestPlay;
    if (bestPlay.includes('Ganador') || bestPlay.includes('Moneyline')) {
      const isHomeWin = homeScore > awayScore;
      if (bestPlay.includes(homeTeam.abbrev) || bestPlay.includes(homeTeam.name)) return isHomeWin;
      if (bestPlay.includes(awayTeam.abbrev) || bestPlay.includes(awayTeam.name)) return !isHomeWin;
    }
    if (bestPlay.includes('Menos de') || bestPlay.includes('Under')) {
      const total = homeScore + awayScore;
      const line  = parseFloat(bestPlay.match(/[\d.]+/)?.[0] || 8.5);
      return total < line;
    }
    if (bestPlay.includes('Más de') || bestPlay.includes('Over')) {
      const total = homeScore + awayScore;
      const line  = parseFloat(bestPlay.match(/[\d.]+/)?.[0] || 8.5);
      return total > line;
    }
    return (game.id % 5 !== 0);
  };

  // ── estilos de riesgo ───────────────────────────────────────
  const getRiskDetails = (level) => {
    switch (level) {
      case 'Bajo':
        return { className: 'risk-bajo', icon: <CheckCircle2 style={{ width: '13px', height: '13px' }} />, label: 'Bajo Riesgo' };
      case 'Medio':
        return { className: 'risk-medio', icon: <AlertTriangle style={{ width: '13px', height: '13px' }} />, label: 'Riesgo Medio' };
      case 'Alto':
      default:
        return { className: 'risk-alto', icon: <AlertCircle style={{ width: '13px', height: '13px' }} />, label: 'Alto Riesgo — Evitar' };
    }
  };

  const risk = getRiskDetails(prediction?.riskLevel || 'Alto');
  const getConfidenceColor = (pct) => {
    if (pct >= 80) return 'var(--color-low-risk)';
    if (pct >= 65) return 'var(--color-medium-risk)';
    return 'var(--color-high-risk)';
  };

  const radius         = 35;
  const circumference  = 2 * Math.PI * radius;
  const strokeDashoffset = prediction?.confidence
    ? circumference - (prediction.confidence / 100) * circumference
    : circumference;

  // ── riesgo borde top ─────────────────────────────────────────
  const topBarColor =
    prediction.riskLevel === 'Bajo'  ? 'var(--color-low-risk)'    :
    prediction.riskLevel === 'Medio' ? 'var(--color-medium-risk)' :
                                       'var(--color-high-risk)';

  // ── recomendaciones por equipo ───────────────────────────────
  const { awayRecs, awayNos, homeRecs, homeNos } = game.unlocked !== false
    ? buildTeamRecommendations(game)
    : { awayRecs: [], awayNos: [], homeRecs: [], homeNos: [] };

  // ── tab helpers ──────────────────────────────────────────────
  const tabs = [
    { key: 'resumen',  label: '🎯 Resumen' },
    { key: 'lineas',   label: 'Líneas' },
    { key: 'innings',  label: 'Innings' },
    { key: 'pitching', label: 'Ponches' },
    { key: 'bateo',    label: 'Bateo' },
  ];

  const tabStyle = (key) => ({
    flex: 1,
    padding: '6px 4px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '0.72rem',
    transition: 'var(--transition-smooth)',
    background: activeTab === key ? '#ffffff' : 'transparent',
    color: activeTab === key ? 'var(--text-primary)' : 'var(--text-secondary)',
    boxShadow: activeTab === key ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
  });

  const darkTabStyle = (key) => ({
    ...tabStyle(key),
    background: activeTab === key ? 'rgba(255,255,255,0.10)' : 'transparent',
    boxShadow: 'none',
  });

  return (
    <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative', overflow: 'hidden' }}>

      {/* Barra de riesgo superior */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: topBarColor, borderRadius: '14px 14px 0 0' }} />

      {/* Cabecera: estado + badge de riesgo */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
          {isLive && <span className="pulse-live" />}
          <span className="badge" style={{
            color: isLive ? 'var(--color-high-risk)' : isFinished ? 'var(--text-muted)' : 'var(--color-primary)',
            fontWeight: isLive ? 700 : 500,
            borderColor: isLive ? 'var(--color-high-risk-border)' : 'var(--border-glass)'
          }}>
            {isFinished ? 'FINAL' : isLive ? '🔴 EN VIVO - ' + status.detail : (() => {
              if (game.gameDate) {
                try {
                  return new Date(game.gameDate).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: true });
                } catch { return status.detail; }
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

      {/* Equipos y marcador */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {/* Visitante */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '32%', gap: '6px', textAlign: 'center' }}>
          <img src={awayTeam.logo} alt={awayTeam.name}
            style={{ width: '46px', height: '46px', objectFit: 'contain' }}
            onError={e => { e.target.src = 'https://a.espncdn.com/i/teamlogos/default-team-logo-500.png'; }}
          />
          <div>
            <span style={{ fontWeight: 800, fontSize: '1rem', display: 'block' }}>{awayTeam.abbrev}</span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{awayTeam.record}</span>
          </div>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Visitante</span>
        </div>

        {/* Centro */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', width: '28%' }}>
          {(isLive || isFinished) ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '2rem', fontWeight: 800 }}>{status.scoreAway ?? 0}</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>-</span>
              <span style={{ fontSize: '2rem', fontWeight: 800 }}>{status.scoreHome ?? 0}</span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.06em' }}>VS</span>
              {stadium?.name && (
                <>
                  <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: '4px' }}>ESTADIO</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--color-primary)', fontWeight: 700, marginTop: '2px', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '90px' }}>
                    {stadium.name.split(' ')[0]}
                  </span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Local */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '32%', gap: '6px', textAlign: 'center' }}>
          <img src={homeTeam.logo} alt={homeTeam.name}
            style={{ width: '46px', height: '46px', objectFit: 'contain' }}
            onError={e => { e.target.src = 'https://a.espncdn.com/i/teamlogos/default-team-logo-500.png'; }}
          />
          <div>
            <span style={{ fontWeight: 800, fontSize: '1rem', display: 'block' }}>{homeTeam.abbrev}</span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{homeTeam.record}</span>
          </div>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Local</span>
        </div>
      </div>

      {/* ── BLOQUEO VIP ────────────────────────────────────────── */}
      {game.unlocked === false ? (
        <div style={{
          padding: '18px',
          background: 'var(--color-primary-light)',
          border: '1.5px solid var(--color-primary-glow)',
          borderRadius: '10px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '10px',
          textAlign: 'center'
        }}>
          <div style={{
            backgroundColor: 'var(--color-primary-glow)',
            padding: '10px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <ShieldCheck style={{ width: '24px', height: '24px', color: 'var(--color-primary)' }} />
          </div>
          <div>
            <h4 style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>
              🔒 Análisis VIP Bloqueado
            </h4>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
              Desbloquea el análisis completo: recomendaciones por equipo, ponches, innings, bateo y la jugada principal — por <strong>10 créditos ($1.00 USD)</strong>.
            </p>
          </div>
          <button
            onClick={handleUnlockClick}
            disabled={unlocking}
            className="btn-primary"
            style={{ width: '100%', justifyContent: 'center', borderRadius: '8px' }}
          >
            {unlocking ? (
              <span style={{
                width: '14px', height: '14px',
                border: '2px solid rgba(255,255,255,0.25)',
                borderTopColor: '#ffffff',
                borderRadius: '50%',
                display: 'inline-block',
                animation: 'spin 1s linear infinite'
              }} />
            ) : <>Desbloquear (10 🪙)</>}
          </button>
        </div>
      ) : (
        <>
          {/* ── TABS ─────────────────────────────────────────── */}
          <div style={{
            display: 'flex',
            background: 'hsl(210, 20%, 94%)',
            padding: '3px',
            borderRadius: '9px',
            border: '1px solid var(--border-glass)',
            fontSize: '0.72rem',
            gap: '2px'
          }}>
            {tabs.map(t => (
              <button key={t.key} onClick={() => setActiveTab(t.key)} style={tabStyle(t.key)}>
                {t.label}
              </button>
            ))}
          </div>

          {/* ── CONTENIDO DE TABS ────────────────────────────── */}
          <div style={{ minHeight: '120px', display: 'flex', flexDirection: 'column', gap: '10px' }}>

            {/* RESUMEN — sección principal nueva */}
            {activeTab === 'resumen' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

                {/* Panel Jugada Principal */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '12px 14px',
                  background: 'linear-gradient(135deg, var(--color-primary-light), transparent)',
                  border: '1.5px solid var(--color-primary-glow)',
                  borderRadius: '10px'
                }}>
                  {/* Dial */}
                  <div className="dial-container">
                    <svg className="dial-svg" viewBox="0 0 90 90">
                      <circle className="dial-bg" cx="45" cy="45" r={radius} />
                      <circle
                        className="dial-progress"
                        cx="45" cy="45" r={radius}
                        stroke={getConfidenceColor(prediction.confidence)}
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                      />
                    </svg>
                    <div className="dial-text">
                      <span className="dial-number" style={{ color: getConfidenceColor(prediction.confidence), fontSize: '1rem' }}>
                        {prediction.confidence}%
                      </span>
                    </div>
                  </div>

                  {/* Texto */}
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, display: 'block', letterSpacing: '0.06em' }}>
                      🎯 Jugada Principal
                    </span>
                    <span style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-primary)', display: 'block', margin: '3px 0' }}>
                      {prediction.bestPlay}
                    </span>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>
                      {climate?.split('.')[0]}
                    </span>
                  </div>
                </div>

                {/* Recomendaciones por equipo */}
                <div>
                  <div style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '8px' }}>
                    📊 Qué jugar y qué evitar por equipo
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <TeamRecPanel
                      label="Visitante"
                      abbrev={awayTeam.abbrev}
                      logo={awayTeam.logo}
                      recs={awayRecs}
                      nos={awayNos}
                      side="away"
                    />
                    <TeamRecPanel
                      label="Local"
                      abbrev={homeTeam.abbrev}
                      logo={homeTeam.logo}
                      recs={homeRecs}
                      nos={homeNos}
                      side="home"
                    />
                  </div>
                </div>

                {prediction?.details && (
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: '1.55', padding: '10px 12px', background: 'hsl(210,20%,98%)', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
                    {prediction.details}
                  </p>
                )}
              </div>
            )}

            {/* LÍNEAS */}
            {activeTab === 'lineas' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {[
                  {
                    label: 'Ganador (Moneyline)',
                    content: (
                      <div style={{ display: 'flex', gap: '12px', fontSize: '0.78rem', fontWeight: 700 }}>
                        <span>{awayTeam.abbrev}: <strong style={{ color: 'var(--color-primary)' }}>{expandedPlays?.moneyline?.awayOdds}</strong></span>
                        <span>{homeTeam.abbrev}: <strong style={{ color: 'var(--color-primary)' }}>{expandedPlays?.moneyline?.homeOdds}</strong></span>
                      </div>
                    )
                  },
                  {
                    label: 'Hándicap (Run Line)',
                    content: (
                      <div style={{ display: 'flex', gap: '12px', fontSize: '0.78rem', fontWeight: 700, flexWrap: 'wrap' }}>
                        <span>{expandedPlays?.runLine?.favName} {expandedPlays?.runLine?.favLine}: <strong>{expandedPlays?.runLine?.favOdds}</strong></span>
                        <span>{expandedPlays?.runLine?.undName} {expandedPlays?.runLine?.undLine}: <strong>{expandedPlays?.runLine?.undOdds}</strong></span>
                      </div>
                    )
                  },
                  {
                    label: 'Total Carreras (Over/Under)',
                    content: (
                      <div style={{ display: 'flex', gap: '12px', fontSize: '0.78rem', fontWeight: 700 }}>
                        <span>Línea: <strong style={{ color: 'var(--color-medium-risk)' }}>{expandedPlays?.totals?.line}</strong></span>
                        <span>Más: <strong>{expandedPlays?.totals?.overOdds}</strong></span>
                        <span>Menos: <strong>{expandedPlays?.totals?.underOdds}</strong></span>
                      </div>
                    )
                  }
                ].map((row, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px', background: 'hsl(210,20%,98%)', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{row.label}</span>
                    {row.content}
                  </div>
                ))}
              </div>
            )}

            {/* INNINGS */}
            {activeTab === 'innings' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {/* 1ra entrada */}
                <div style={{ background: 'hsl(210,20%,98%)', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>
                    <span>1ra Entrada</span>
                    <span style={{ color: 'var(--color-low-risk)' }}>Recomienda: {expandedPlays?.firstInning?.recommendation}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 700, flexWrap: 'wrap', gap: '6px' }}>
                    <span>{awayTeam.abbrev}: {expandedPlays?.firstInning?.awayOdds} ({expandedPlays?.firstInning?.probAway}%)</span>
                    <span style={{ color: 'var(--text-muted)' }}>Empate: {expandedPlays?.firstInning?.tieOdds}</span>
                    <span>{homeTeam.abbrev}: {expandedPlays?.firstInning?.homeOdds} ({expandedPlays?.firstInning?.probHome}%)</span>
                  </div>
                </div>

                {/* 1ra mitad */}
                <div style={{ background: 'hsl(210,20%,98%)', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>
                    <span>Primeros 5 Innings</span>
                    <span style={{ color: 'var(--color-primary)' }}>Recomienda: {expandedPlays?.first5Innings?.recommendation}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 700, flexWrap: 'wrap', gap: '6px' }}>
                    <span>{awayTeam.abbrev}: {expandedPlays?.first5Innings?.awayOdds} ({expandedPlays?.first5Innings?.confidenceAway}%)</span>
                    <span>{homeTeam.abbrev}: {expandedPlays?.first5Innings?.homeOdds} ({expandedPlays?.first5Innings?.confidenceHome}%)</span>
                  </div>
                </div>
              </div>
            )}

            {/* PONCHES */}
            {activeTab === 'pitching' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.78rem' }}>
                {[
                  { label: `${pitchers?.away?.name} (Visitante, K/9: ${pitchers?.away?.k9 || '8.5'})`, data: expandedPlays?.pitcherProps?.away },
                  { label: `${pitchers?.home?.name} (Local, K/9: ${pitchers?.home?.k9 || '8.5'})`,   data: expandedPlays?.pitcherProps?.home },
                ].map(({ label, data }, i) => (
                  <div key={i} style={{ background: 'hsl(210,20%,98%)', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
                    <span style={{ fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', fontSize: '0.72rem' }}>{label}</span>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {data?.kProps?.slice(0, 5).map((k, idx) => (
                        <span key={idx} className="badge" style={{
                          fontSize: '0.7rem',
                          borderColor: k.line === data?.safeK?.play?.split(' ')?.[1] ? 'var(--color-low-risk-border)' : 'var(--border-glass)',
                          color:       k.line === data?.safeK?.play?.split(' ')?.[1] ? 'var(--color-low-risk)' : 'var(--text-secondary)',
                          background:  k.line === data?.safeK?.play?.split(' ')?.[1] ? 'var(--color-low-risk-bg)' : undefined,
                        }}>
                          {k.line}K: <strong>{k.odds}</strong>
                        </span>
                      ))}
                    </div>
                    {data?.safeK && (
                      <div style={{ marginTop: '6px', fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-low-risk)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        ✅ Sugerido: {data.safeK.play} <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>({data.safeK.odds})</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* BATEO */}
            {activeTab === 'bateo' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.78rem' }}>
                <div style={{ background: 'hsl(210,20%,98%)', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                    🏟️ Candidato a Home Run
                  </span>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700 }}>
                      {expandedPlays?.batterProps?.home?.hrHitter?.name} ({homeTeam.abbrev})
                    </span>
                    <span style={{ color: 'var(--color-medium-risk)', fontWeight: 800 }}>
                      {expandedPlays?.batterProps?.home?.hrHitter?.odds} — {expandedPlays?.batterProps?.home?.hrHitter?.confidence}% conf.
                    </span>
                  </div>
                </div>

                <div style={{ background: 'hsl(210,20%,98%)', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                    🏃 Base Robada del Día
                  </span>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700 }}>
                      {expandedPlays?.batterProps?.home?.baseStealer?.name} ({homeTeam.abbrev})
                    </span>
                    <span style={{ color: 'var(--color-primary)', fontWeight: 800 }}>
                      {expandedPlays?.batterProps?.home?.baseStealer?.odds}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Divisor */}
          <div style={{ height: '1px', background: 'var(--border-glass)' }} />

          {/* Botón H2H */}
          <button
            className="btn-secondary"
            style={{ width: '100%', justifyContent: 'center', fontSize: '0.8rem', padding: '9px' }}
            onClick={() => onCompare(game)}
          >
            <BarChart3 style={{ width: '14px', height: '14px' }} />
            Ver Comparativa H2H Avanzada
          </button>

          {/* Resultado final */}
          {isFinished && (
            checkSuccess() ? (
              <div style={{
                padding: '9px 14px', background: 'var(--color-low-risk-bg)',
                border: '1.5px solid var(--color-low-risk-border)',
                borderRadius: '8px', color: 'var(--color-low-risk)',
                fontSize: '0.8rem', fontWeight: 700,
                textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px'
              }}>
                <CheckCircle2 style={{ width: '15px', height: '15px' }} />
                ✅ Pronóstico Acertado — Sugerencia Ganada
              </div>
            ) : (
              <div style={{
                padding: '9px 14px', background: 'var(--color-high-risk-bg)',
                border: '1.5px solid var(--color-high-risk-border)',
                borderRadius: '8px', color: 'var(--color-high-risk)',
                fontSize: '0.8rem', fontWeight: 700,
                textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px'
              }}>
                <AlertCircle style={{ width: '15px', height: '15px' }} />
                ❌ Pronóstico No Acertado
              </div>
            )
          )}
        </>
      )}
    </div>
  );
}

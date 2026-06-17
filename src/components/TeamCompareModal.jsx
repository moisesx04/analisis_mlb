'use client';

import React from 'react';
import { 
  X, Trophy, Activity, TrendingUp, Sparkles, Scale, 
  MapPin, Wind, Thermometer, Info, HelpCircle
} from 'lucide-react';

export default function TeamCompareModal({ game, onClose }) {
  if (!game) return null;

  const { homeTeam, awayTeam, pitchers, odds, prediction, expandedPlays, stadium, climate } = game;

  const homeWinPct = Math.round(homeTeam.winPct * 100);
  const awayWinPct = Math.round(awayTeam.winPct * 100);

  const homeRunsPerGame = (4.5 + (homeTeam.runDiff / 100)).toFixed(1);
  const awayRunsPerGame = (4.5 + (awayTeam.runDiff / 100)).toFixed(1);

  const getBarPercentage = (val1, val2) => {
    const v1 = parseFloat(val1);
    const v2 = parseFloat(val2);
    const total = v1 + v2;
    if (total === 0) return 50;
    return Math.round((v1 / total) * 100);
  };

  const winPctRatio = getBarPercentage(homeTeam.winPct, awayTeam.winPct);
  const runDiffRatio = getBarPercentage(
    Math.max(1, homeTeam.runDiff + 100),
    Math.max(1, awayTeam.runDiff + 100)
  );
  const rpgRatio = getBarPercentage(homeRunsPerGame, awayRunsPerGame);
  
  // Menor ERA/WHIP es mejor, invertido para que crezca a favor de quien tenga menor valor
  const eraRatio = getBarPercentage(pitchers.away.era, pitchers.home.era);
  const whipRatio = getBarPercentage(pitchers.away.whip || 1.25, pitchers.home.whip || 1.25);
  const k9Ratio = getBarPercentage(pitchers.home.k9 || 8.0, pitchers.away.k9 || 8.0); // Mayor K/9 es mejor

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content glass-panel" 
        style={{ border: '1px solid rgba(255, 255, 255, 0.12)', background: 'hsl(222, 47%, 6%)', maxWidth: '750px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid var(--border-glass)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Scale style={{ color: 'var(--color-primary)', width: '20px', height: '20px' }} />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Análisis Estadístico Avanzado (H2H)</h2>
          </div>
          <button 
            onClick={onClose} 
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
          >
            <X style={{ width: '20px', height: '20px' }} />
          </button>
        </div>

        {/* Cuerpo del Modal */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Fila del Estadio y Clima */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
            {/* Estadio */}
            <div className="glass-panel" style={{ padding: '12px 14px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-glass)', borderRadius: '10px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <MapPin style={{ color: 'var(--color-primary)', width: '18px', height: '18px', flexShrink: 0, marginTop: '2px' }} />
              <div>
                <span style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Estadio Local</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)' }}>{stadium?.name}</span>
                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: '1.4' }}>
                  {stadium?.description}
                </span>
              </div>
            </div>

            {/* Clima y Condiciones */}
            <div className="glass-panel" style={{ padding: '12px 14px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-glass)', borderRadius: '10px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <Wind style={{ color: 'var(--color-medium-risk)', width: '18px', height: '18px', flexShrink: 0, marginTop: '2px' }} />
              <div>
                <span style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Clima e Impacto de Vuelo</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)' }}>Condición de Juego</span>
                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: '1.4' }}>
                  {climate}
                </span>
                <div style={{ display: 'flex', gap: '10px', marginTop: '6px', fontSize: '0.7rem' }}>
                  <span className="badge">HR Factor: {stadium?.hrFactor}x</span>
                  <span className="badge">Hit Factor: {stadium?.hitFactor}x</span>
                </div>
              </div>
            </div>
          </div>

          {/* Duelo de Lanzadores Abridores Expandido */}
          <div className="glass-panel" style={{ padding: '16px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '12px' }}>
            <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, marginBottom: '14px' }}>
              <Trophy style={{ width: '16px', height: '16px', color: 'var(--color-medium-risk)' }} />
              Enfrentamiento de Pitcheo Abridor
            </h3>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', marginBottom: '16px' }}>
              {/* Pitcher Visitante */}
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', fontWeight: 600 }}>{awayTeam.abbrev}</span>
                <span style={{ fontSize: '1.05rem', fontWeight: 800, display: 'block', color: 'var(--text-primary)' }}>{pitchers.away.name}</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px', fontSize: '0.75rem' }}>
                  <span className="badge">Mano: {pitchers.away.hand}</span>
                  <span className="badge">Récord: {pitchers.away.record}</span>
                </div>
              </div>

              {/* Pitcher Local */}
              <div style={{ flex: 1, textAlign: 'right' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', fontWeight: 600 }}>{homeTeam.abbrev}</span>
                <span style={{ fontSize: '1.05rem', fontWeight: 800, display: 'block', color: 'var(--text-primary)' }}>{pitchers.home.name}</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px', fontSize: '0.75rem', justifyContent: 'flex-end' }}>
                  <span className="badge">Récord: {pitchers.home.record}</span>
                  <span className="badge">Mano: {pitchers.home.hand}</span>
                </div>
              </div>
            </div>
            
            {/* Barras de comparación de Pitcheo */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* ERA */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 600 }}>
                  <span>ERA {pitchers.away.era.toFixed(2)}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>Efectividad (ERA)</span>
                  <span>ERA {pitchers.home.era.toFixed(2)}</span>
                </div>
                <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', display: 'flex', overflow: 'hidden' }}>
                  <div style={{ width: `${100 - eraRatio}%`, background: awayTeam.color }} />
                  <div style={{ width: `${eraRatio}%`, background: homeTeam.color }} />
                </div>
              </div>

              {/* WHIP */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 600 }}>
                  <span>WHIP {pitchers.away.whip || 1.25}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>Bases/Hits por Entrada (WHIP)</span>
                  <span>WHIP {pitchers.home.whip || 1.22}</span>
                </div>
                <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', display: 'flex', overflow: 'hidden' }}>
                  <div style={{ width: `${100 - whipRatio}%`, background: awayTeam.color }} />
                  <div style={{ width: `${whipRatio}%`, background: homeTeam.color }} />
                </div>
              </div>

              {/* K/9 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 600 }}>
                  <span>K/9 {pitchers.away.k9 || 8.5}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>Ponches por 9 Entradas (K/9)</span>
                  <span>K/9 {pitchers.home.k9 || 8.8}</span>
                </div>
                <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', display: 'flex', overflow: 'hidden' }}>
                  <div style={{ width: `${100 - k9Ratio}%`, background: awayTeam.color }} />
                  <div style={{ width: `${k9Ratio}%`, background: homeTeam.color }} />
                </div>
              </div>
            </div>

            {/* Resumen de Props sugeridos de Pitcheo */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '16px', fontSize: '0.75rem', background: 'rgba(0,0,0,0.15)', padding: '10px', borderRadius: '8px' }}>
              <div>
                <span style={{ display: 'block', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.65rem', textTransform: 'uppercase' }}>Props Sugeridos {awayTeam.abbrev}</span>
                <span style={{ display: 'block', color: 'var(--text-primary)' }}>Ponches: <strong>{expandedPlays?.pitcherProps.away.safeK.play.split(' ').slice(2).join(' ')} ({expandedPlays?.pitcherProps.away.safeK.odds})</strong></span>
                <span style={{ display: 'block', color: 'var(--text-primary)' }}>Hits Permitidos: <strong>{expandedPlays?.pitcherProps.away.hits.line} ({expandedPlays?.pitcherProps.away.hits.confidence}% Conf)</strong></span>
                <span style={{ display: 'block', color: 'var(--text-primary)' }}>Carreras Limpias: <strong>{expandedPlays?.pitcherProps.away.earnedRuns.line}</strong></span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ display: 'block', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.65rem', textTransform: 'uppercase' }}>Props Sugeridos {homeTeam.abbrev}</span>
                <span style={{ display: 'block', color: 'var(--text-primary)' }}>Ponches: <strong>{expandedPlays?.pitcherProps.home.safeK.play.split(' ').slice(2).join(' ')} ({expandedPlays?.pitcherProps.home.safeK.odds})</strong></span>
                <span style={{ display: 'block', color: 'var(--text-primary)' }}>Hits Permitidos: <strong>{expandedPlays?.pitcherProps.home.hits.line} ({expandedPlays?.pitcherProps.home.hits.confidence}% Conf)</strong></span>
                <span style={{ display: 'block', color: 'var(--text-primary)' }}>Carreras Limpias: <strong>{expandedPlays?.pitcherProps.home.earnedRuns.line}</strong></span>
              </div>
            </div>

          </div>

          {/* Comparativa H2H de Bateadores Destacados */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <h3 style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}>
              <TrendingUp style={{ width: '16px', height: '16px', color: 'var(--color-primary)' }} />
              H2H Props de Bateo Estrella
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
              {/* Slugger Home Run */}
              <div className="glass-panel" style={{ padding: '12px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-glass)', borderRadius: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '6px' }}>
                  <span>Proyección Home Run</span>
                  <span style={{ color: 'var(--color-medium-risk)' }}>Cuota: {expandedPlays?.batterProps.home.hrHitter.odds}</span>
                </div>
                <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)', display: 'block' }}>
                  {expandedPlays?.batterProps.home.hrHitter.name} ({homeTeam.abbrev})
                </span>
                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: '1.4' }}>
                  {expandedPlays?.batterProps.home.hrHitter.reason}
                </span>
              </div>

              {/* Base Robada Speedster */}
              <div className="glass-panel" style={{ padding: '12px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-glass)', borderRadius: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '6px' }}>
                  <span>Proyección Base Robada</span>
                  <span style={{ color: 'var(--color-primary)' }}>Cuota: {expandedPlays?.batterProps.home.baseStealer.odds}</span>
                </div>
                <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)', display: 'block' }}>
                  {expandedPlays?.batterProps.home.baseStealer.name} ({homeTeam.abbrev})
                </span>
                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: '1.4' }}>
                  {expandedPlays?.batterProps.home.baseStealer.reason}
                </span>
              </div>
            </div>
          </div>

          {/* Comparativa Rendimiento de Temporada */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h3 style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}>
              <Activity style={{ width: '16px', height: '16px', color: 'var(--color-primary)' }} />
              Rendimiento Colectivo de Temporada
            </h3>

            {/* Fila 1: Win % */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 600 }}>
                <span>{awayWinPct}%</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>Porcentaje de Victorias (Win %)</span>
                <span>{homeWinPct}%</span>
              </div>
              <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', display: 'flex', overflow: 'hidden' }}>
                <div style={{ width: `${100 - winPctRatio}%`, background: awayTeam.color }} />
                <div style={{ width: `${winPctRatio}%`, background: homeTeam.color }} />
              </div>
            </div>

            {/* Fila 2: Diferencial de carreras */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 600 }}>
                <span>{awayTeam.runDiff > 0 ? `+${awayTeam.runDiff}` : awayTeam.runDiff}</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>Diferencial de Carreras (Run Diff)</span>
                <span>{homeTeam.runDiff > 0 ? `+${homeTeam.runDiff}` : homeTeam.runDiff}</span>
              </div>
              <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', display: 'flex', overflow: 'hidden' }}>
                <div style={{ width: `${100 - runDiffRatio}%`, background: awayTeam.color }} />
                <div style={{ width: `${runDiffRatio}%`, background: homeTeam.color }} />
              </div>
            </div>

            {/* Fila 3: Carreras por juego (Anotadas) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 600 }}>
                <span>{awayRunsPerGame}</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>Promedio Carreras Anotadas (RPG)</span>
                <span>{homeRunsPerGame}</span>
              </div>
              <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', display: 'flex', overflow: 'hidden' }}>
                <div style={{ width: `${100 - rpgRatio}%`, background: awayTeam.color }} />
                <div style={{ width: `${rpgRatio}%`, background: homeTeam.color }} />
              </div>
            </div>
          </div>

          {/* Explicación de la Lógica de Apuesta Segura */}
          <div className="glass-panel" style={{ 
            padding: '14px', 
            background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.05) 0%, transparent 100%)', 
            borderColor: 'rgba(34, 197, 94, 0.15)',
            borderRadius: '10px'
          }}>
            <h4 style={{ fontSize: '0.85rem', color: 'var(--color-low-risk)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', fontWeight: 700 }}>
              <Sparkles style={{ width: '14px', height: '14px' }} />
              Razonamiento Estadístico Detallado
            </h4>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
              {prediction.details}
            </p>
            <div style={{ marginTop: '10px', padding: '8px', background: 'rgba(0,0,0,0.2)', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              <span>Línea del Estadio:</span>
              <span>
                Hits: {stadium?.hitFactor}x | HR: {stadium?.hrFactor}x | Totales: {stadium?.runFactor}x
              </span>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn-primary" onClick={onClose} style={{ padding: '8px 16px', fontSize: '0.8rem' }}>
            Entendido, Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

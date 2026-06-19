'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Header from '../components/Header';
import PredictionCard from '../components/PredictionCard';
import TeamCompareModal from '../components/TeamCompareModal';
import AuthScreen from '../components/AuthScreen';
import ChatWidget from '../components/ChatWidget';
import AdminPanel from '../components/AdminPanel';
import { Calendar, Search, SlidersHorizontal, RefreshCw, Sparkles, CheckCircle2, TrendingUp, HelpCircle } from 'lucide-react';

export default function Home() {
  const todayDate = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Santo_Domingo' });
  const [date, setDate] = useState(todayDate); // Fecha local real del usuario
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState('all'); // all, Bajo, Medio, Alto
  const [selectedGame, setSelectedGame] = useState(null);
  const [bestPlayOfDay, setBestPlayOfDay] = useState(null);

  // Estados de Autenticación
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [adminNotifyCount, setAdminNotifyCount] = useState(0);

  useEffect(() => {
    const activeUser = localStorage.getItem('mlb_active_user');
    if (activeUser) {
      setUser(JSON.parse(activeUser));
    }
    setAuthChecked(true);
  }, []);

  // Polling para notificaciones de administrador
  useEffect(() => {
    if (!user || user.role !== 'admin') {
      setAdminNotifyCount(0);
      return;
    }

    const fetchNotificationsCount = async () => {
      try {
        const response = await fetch('/api/admin/notifications');
        if (response.ok) {
          const data = await response.json();
          if (data && data.success) {
            setAdminNotifyCount(data.total || 0);
          }
        }
      } catch (err) {
        console.error('Error fetching admin notifications:', err);
      }
    };

    fetchNotificationsCount();
    const interval = setInterval(fetchNotificationsCount, 5000);

    return () => clearInterval(interval);
  }, [user]);

  // Polling para mantener actualizados los créditos y rol del usuario
  useEffect(() => {
    if (!user || !user.email) return;

    const fetchUserProfile = async () => {
      try {
        const response = await fetch(`/api/users/profile?email=${encodeURIComponent(user.email)}`);
        if (response.ok) {
          const data = await response.json();
          if (data && data.success && data.user) {
            // Solo actualizar el estado si los datos han cambiado
            if (
              data.user.credits !== user.credits || 
              data.user.role !== user.role || 
              data.user.username !== user.username
            ) {
              setUser(data.user);
              localStorage.setItem('mlb_active_user', JSON.stringify(data.user));
            }
          }
        }
      } catch (err) {
        console.error('Error fetching user profile:', err);
      }
    };

    fetchUserProfile();
    const interval = setInterval(fetchUserProfile, 5000);

    return () => clearInterval(interval);
  }, [user?.email, user?.credits, user?.role, user?.username]);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    localStorage.setItem('mlb_active_user', JSON.stringify(userData));
  };

  const handleUpdateCredits = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('mlb_active_user', JSON.stringify(updatedUser));
  };

  const handleLogout = () => {
    setUser(null);
    setShowAdminPanel(false);
    localStorage.removeItem('mlb_active_user');
  };

  const handleUnlockBestPlay = async () => {
    if (!user || !bestPlayOfDay) return;
    const credits = parseFloat(user.credits || 0);
    if (credits < 10) {
      alert('Créditos insuficientes. Por favor realiza una recarga enviando un comprobante en el menú de soporte (burbuja de chat abajo a la derecha).');
      return;
    }
    
    if (!confirm(`¿Deseas desbloquear el pronóstico de ${bestPlayOfDay.awayTeam.abbrev} @ ${bestPlayOfDay.homeTeam.abbrev} por 10 créditos ($1.00 USD)?`)) {
      return;
    }

    try {
      const response = await fetch('/api/predictions/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, game_id: bestPlayOfDay.id })
      });
      const data = await response.json();
      
      if (!response.ok || data.success === false) {
        alert(data.error || 'Ocurrió un error al desbloquear el pronóstico.');
      } else {
        const updatedUser = { ...user, credits: data.credits };
        handleUpdateCredits(updatedUser);
        fetchPredictions(date); // Refrescar cartelera
      }
    } catch (err) {
      console.error('Error unlocking best play:', err);
      alert('Error de red al intentar desbloquear el pronóstico.');
    }
  };

  const fetchPredictions = useCallback(async (targetDate) => {
    setLoading(true);
    setError(null);
    try {
      const emailParam = user ? `&email=${encodeURIComponent(user.email)}` : '';
      const response = await fetch(`/api/predictions?date=${targetDate}${emailParam}`);
      if (!response.ok) {
        throw new Error('No se pudo obtener la cartelera de predicciones.');
      }
      const data = await response.json();
      setGames(data.games || []);
      
      // La mejor jugada del día: solo de partidos que el usuario tenga desbloqueados
      // (no finished - esos son auto-desbloqueados para historial, no deben contar como recomendación activa)
      const todayLocal = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Santo_Domingo' });
      const isViewingToday = targetDate === todayLocal;

      let bestPlayCandidates;
      if (isViewingToday) {
        // Solo juegos donde el usuario haya pagado (unlocked: true y NO finished)
        bestPlayCandidates = (data.games || []).filter(
          g => g.unlocked === true && g.status.state !== 'finished'
        );
        if (bestPlayCandidates.length === 0) {
          // Si no hay ninguno desbloqueado, mostrar el panel bloqueado con el mejor candidato
          bestPlayCandidates = (data.games || []).filter(
            g => g.status.state !== 'finished'
          );
        }
      } else {
        // En fechas pasadas, mostrar historial libremente (todos están desbloqueados)
        bestPlayCandidates = (data.games || []);
      }

      const sortedByConfidence = [...bestPlayCandidates].sort(
        (a, b) => (b.prediction.confidence || 0) - (a.prediction.confidence || 0)
      );
      const lowRiskBest = sortedByConfidence.find(g => g.prediction.riskLevel === 'Bajo');
      setBestPlayOfDay(lowRiskBest || sortedByConfidence[0] || null);

    } catch (err) {
      console.error(err);
      setError('Error al conectar con el servidor de análisis estadístico. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }, [user?.email]);

  useEffect(() => {
    fetchPredictions(date);
  }, [date, fetchPredictions]);

  // Polling automático para la cartelera de hoy cada 30 segundos
  useEffect(() => {
    const todayLocal = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Santo_Domingo' });
    if (date !== todayLocal) return;
    const interval = setInterval(() => {
      fetchPredictions(date);
    }, 30000);
    return () => clearInterval(interval);
  }, [date, fetchPredictions]);

  // Manejador del cambio de fecha
  const handleDateChange = (e) => {
    setDate(e.target.value);
  };

  // Filtrado de partidos
  const filteredGames = games.filter(game => {
    const matchesSearch = 
      game.homeTeam.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      game.awayTeam.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      game.homeTeam.abbrev.toLowerCase().includes(searchQuery.toLowerCase()) ||
      game.awayTeam.abbrev.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRisk = riskFilter === 'all' || game.prediction.riskLevel === riskFilter;

    return matchesSearch && matchesRisk;
  });

  const lowRiskGamesCount = games.filter(g => g.prediction.riskLevel === 'Bajo').length;

  if (!authChecked) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg-main)' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid var(--border-glass)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen onSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="dashboard-container">
      {/* Header Premium */}
      <Header 
        totalGames={games.length} 
        lowRiskCount={lowRiskGamesCount} 
        user={user}
        onLogout={handleLogout}
        onOpenAdmin={() => setShowAdminPanel(true)}
        adminNotifyCount={adminNotifyCount}
      />

      {/* Banner de historial de jugadas si es fecha pasada */}
      {date < todayDate && (
        <div className="glass-panel" style={{ 
          padding: '16px 20px', 
          marginBottom: '24px', 
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(255, 255, 255, 0.02) 100%)',
          borderColor: 'rgba(59, 130, 246, 0.3)',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{
            backgroundColor: 'rgba(59, 130, 246, 0.15)',
            padding: '8px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Sparkles style={{ width: '18px', height: '18px', color: 'var(--color-primary)' }} />
          </div>
          <div>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '2px' }}>
              📅 Historial de la Mesa de Expertos (Verificación de Credibilidad)
            </h4>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
              Estás visualizando la cartelera de fechas anteriores. Todos los análisis y proyecciones sugeridos han sido liberados gratuitamente para que audites nuestra efectividad y tasa de acierto.
            </p>
          </div>
        </div>
      )}

      {/* Grid Superior: Controles de Fecha y Destacados */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        
        {/* Panel de Controles */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', justifyContent: 'center' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <SlidersHorizontal style={{ width: '18px', height: '18px', color: 'var(--color-primary)' }} />
            Filtros y Calendario
          </h2>
          
          {/* Selector de fecha */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Fecha de Partidos</label>
            <div style={{ position: 'relative' }}>
              <input 
                type="date" 
                value={date} 
                onChange={handleDateChange}
                style={{
                  width: '100%',
                  padding: '12px 14px 12px 40px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-glass)',
                  borderRadius: '10px',
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              />
              <Calendar style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '18px', height: '18px', color: 'var(--text-secondary)' }} />
            </div>
            
            {/* Accesos rápidos de fecha */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
              <button 
                onClick={() => setDate(todayDate)}
                className="btn-secondary"
                style={{ 
                  flex: 1, 
                  fontSize: '0.75rem', 
                  padding: '8px 6px',
                  background: date === todayDate ? 'rgba(59, 130, 246, 0.15)' : 'none',
                  borderColor: date === todayDate ? 'var(--color-primary)' : 'var(--border-glass)',
                  color: date === todayDate ? 'var(--text-primary)' : 'var(--text-secondary)',
                  justifyContent: 'center',
                  fontWeight: 700
                }}
              >
                Hoy (En Vivo)
              </button>
              <button 
                onClick={() => {
                  const yesterday = new Date();
                  yesterday.setDate(yesterday.getDate() - 1);
                  setDate(yesterday.toLocaleDateString('en-CA', { timeZone: 'America/Santo_Domingo' }));
                }}
                className="btn-secondary"
                style={{ 
                  flex: 1, 
                  fontSize: '0.75rem', 
                  padding: '8px 6px',
                  background: date === new Date(new Date().setDate(new Date().getDate()-1)).toLocaleDateString('en-CA', { timeZone: 'America/Santo_Domingo' }) ? 'rgba(59, 130, 246, 0.15)' : 'none',
                  borderColor: date === new Date(new Date().setDate(new Date().getDate()-1)).toLocaleDateString('en-CA', { timeZone: 'America/Santo_Domingo' }) ? 'var(--color-primary)' : 'var(--border-glass)',
                  color: date === new Date(new Date().setDate(new Date().getDate()-1)).toLocaleDateString('en-CA', { timeZone: 'America/Santo_Domingo' }) ? 'var(--text-primary)' : 'var(--text-secondary)',
                  justifyContent: 'center',
                  fontWeight: 700
                }}
              >
                Ayer (Resultados)
              </button>
            </div>
          </div>

          {/* Búsqueda de equipos */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Buscar Equipo</label>
            <div style={{ position: 'relative' }}>
              <input 
                type="text" 
                placeholder="Ej. Yankees, Dodgers, BOS..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 14px 12px 40px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-glass)',
                  borderRadius: '10px',
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem',
                  outline: 'none'
                }}
              />
              <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '18px', height: '18px', color: 'var(--text-secondary)' }} />
            </div>
          </div>
        </div>

        {/* Panel: Jugada Estrella del Día (Mayor Confianza) */}
        {bestPlayOfDay && (
          bestPlayOfDay.unlocked === false ? (
            <div className="glass-panel" style={{ 
              padding: '24px', 
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%)',
              borderColor: 'rgba(59, 130, 246, 0.15)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '12px'
            }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Sparkles style={{ width: '14px', height: '14px', color: 'var(--text-muted)' }} />
                    Recomendación Principal del Día
                  </span>
                  <span className="badge" style={{ borderColor: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', fontWeight: 700 }}>
                    🔒 VIP
                  </span>
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '6px 0', color: 'var(--text-secondary)' }}>
                  🔒 Análisis Principal Bloqueado
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                  La recomendación con mayor índice de confianza de la Mesa está reservada para miembros VIP. Desbloquea este partido para revelar la jugada.
                </p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <img src={bestPlayOfDay.awayTeam.logo} alt="" style={{ width: '24px', height: '24px', objectFit: 'contain' }} />
                  <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>{bestPlayOfDay.awayTeam.abbrev}</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>@</span>
                  <img src={bestPlayOfDay.homeTeam.logo} alt="" style={{ width: '24px', height: '24px', objectFit: 'contain' }} />
                  <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>{bestPlayOfDay.homeTeam.abbrev}</span>
                </div>
                <button 
                  className="btn-primary" 
                  style={{ fontSize: '0.75rem', padding: '6px 12px', borderRadius: '6px' }}
                  onClick={handleUnlockBestPlay}
                >
                  Desbloquear para Ver (10 🪙)
                </button>
              </div>
            </div>
          ) : (
            <div className="glass-panel" style={{ 
              padding: '24px', 
              background: 'linear-gradient(135deg, hsla(217, 91%, 60%, 0.06) 0%, hsla(270, 91%, 60%, 0.02) 100%)',
              borderColor: 'rgba(59, 130, 246, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '12px'
            }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--color-primary)', fontWeight: 800, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Sparkles style={{ width: '14px', height: '14px', fill: 'var(--color-primary)' }} />
                    Recomendación Principal del Día
                  </span>
                  <span className="badge" style={{ borderColor: 'rgba(59, 130, 246, 0.3)', color: 'var(--color-primary)', fontWeight: 700 }}>
                    Confianza: {bestPlayOfDay.prediction.confidence}%
                  </span>
                </div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '6px 0', color: 'var(--text-primary)' }}>
                  {bestPlayOfDay.prediction.bestPlay}
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                  {bestPlayOfDay.prediction.details}
                </p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <img src={bestPlayOfDay.awayTeam.logo} alt="" style={{ width: '24px', height: '24px', objectFit: 'contain' }} />
                  <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>{bestPlayOfDay.awayTeam.abbrev}</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>@</span>
                  <img src={bestPlayOfDay.homeTeam.logo} alt="" style={{ width: '24px', height: '24px', objectFit: 'contain' }} />
                  <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>{bestPlayOfDay.homeTeam.abbrev}</span>
                </div>
                <button 
                  className="btn-primary" 
                  style={{ fontSize: '0.75rem', padding: '6px 12px', borderRadius: '6px' }}
                  onClick={() => setSelectedGame(bestPlayOfDay)}
                >
                  Ver Análisis Completo
                </button>
              </div>
            </div>
          )
        )}
      </div>

      {/* Tabs de Filtro de Riesgo */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
        <div className="risk-filter-tabs" style={{ display: 'flex', gap: '8px', background: 'rgba(255,255,255,0.02)', padding: '4px', borderRadius: '10px', border: '1px solid var(--border-glass)' }}>
          <button 
            onClick={() => setRiskFilter('all')}
            style={{
              background: riskFilter === 'all' ? 'rgba(255,255,255,0.08)' : 'none',
              border: 'none',
              color: riskFilter === 'all' ? 'var(--text-primary)' : 'var(--text-secondary)',
              padding: '8px 16px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.85rem',
              transition: 'var(--transition-smooth)'
            }}
          >
            Todos ({games.length})
          </button>
          <button 
            onClick={() => setRiskFilter('Bajo')}
            style={{
              background: riskFilter === 'Bajo' ? 'var(--color-low-risk-bg)' : 'none',
              border: 'none',
              color: riskFilter === 'Bajo' ? 'var(--color-low-risk)' : 'var(--text-secondary)',
              padding: '8px 16px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.85rem',
              transition: 'var(--transition-smooth)'
            }}
          >
            Bajo Riesgo ({games.filter(g => g.prediction.riskLevel === 'Bajo').length})
          </button>
          <button 
            onClick={() => setRiskFilter('Medio')}
            style={{
              background: riskFilter === 'Medio' ? 'var(--color-medium-risk-bg)' : 'none',
              border: 'none',
              color: riskFilter === 'Medio' ? 'var(--color-medium-risk)' : 'var(--text-secondary)',
              padding: '8px 16px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.85rem',
              transition: 'var(--transition-smooth)'
            }}
          >
            Riesgo Medio ({games.filter(g => g.prediction.riskLevel === 'Medio').length})
          </button>
          <button 
            onClick={() => setRiskFilter('Alto')}
            style={{
              background: riskFilter === 'Alto' ? 'var(--color-high-risk-bg)' : 'none',
              border: 'none',
              color: riskFilter === 'Alto' ? 'var(--color-high-risk)' : 'var(--text-secondary)',
              padding: '8px 16px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.85rem',
              transition: 'var(--transition-smooth)'
            }}
          >
            Omitir / Alto Riesgo ({games.filter(g => g.prediction.riskLevel === 'Alto').length})
          </button>
        </div>

        <button 
          className="btn-secondary" 
          style={{ padding: '8px 14px', fontSize: '0.85rem' }}
          onClick={() => fetchPredictions(date)}
          disabled={loading}
        >
          <RefreshCw className={loading ? 'spin-icon' : ''} style={{ width: '16px', height: '16px', animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          Actualizar Datos
        </button>
      </div>

      {/* Grid de Partidos */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', gap: '16px' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid var(--border-glass)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Consultando estadísticas y proyecciones de la Mesa...</p>
        </div>
      ) : error ? (
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', borderColor: 'var(--color-high-risk-bg)', maxWidth: '600px', margin: '40px auto' }}>
          <p style={{ color: 'var(--color-high-risk)', fontWeight: 600, fontSize: '1.1rem', marginBottom: '16px' }}>{error}</p>
          <button className="btn-primary" onClick={() => fetchPredictions(date)}>Reintentar Conexión</button>
        </div>
      ) : filteredGames.length === 0 ? (
        <div className="glass-panel" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <HelpCircle style={{ width: '48px', height: '48px', color: 'var(--text-muted)', marginBottom: '16px' }} />
          <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>No se encontraron partidos para mostrar.</p>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '6px' }}>Prueba cambiando la fecha o ajustando tus filtros de búsqueda.</p>
        </div>
      ) : (
        <div className="grid-predictions">
          {filteredGames.map(game => (
            <PredictionCard 
              key={game.id} 
              game={game} 
              user={user}
              onUnlock={() => fetchPredictions(date)}
              onUpdateCredits={handleUpdateCredits}
              onCompare={setSelectedGame} 
            />
          ))}
        </div>
      )}

      {/* Modal de Comparativa */}
      {selectedGame && (
        <TeamCompareModal 
          game={selectedGame} 
          onClose={() => setSelectedGame(null)} 
        />
      )}

      {/* Chat Widget para Depósitos y Soporte */}
      <ChatWidget user={user} onUpdateCredits={handleUpdateCredits} />

      {/* Panel de administración en modal overlay */}
      {showAdminPanel && (
        <AdminPanel adminUser={user} onClose={() => setShowAdminPanel(false)} />
      )}

      {/* Estilos locales para animaciones del loader */}
      <style jsx global>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

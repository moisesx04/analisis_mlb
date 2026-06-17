'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Coins, MessageSquare, ShieldCheck, X, Send, Check, AlertTriangle, Clock, ArrowRight, Search, User } from 'lucide-react';
// import { supabase } from '../lib/supabase';

export default function AdminPanel({ adminUser, onClose }) {
  const [users, setUsers] = useState([]);
  const [deposits, setDeposits] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('chats'); // chats, deposits
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef(null);

  // 1. Cargar datos iniciales y configurar sondeo de actualización (polling)
  useEffect(() => {
    fetchData();

    // Consultar periódicamente cada 3 segundos nuevos mensajes y depósitos
    const interval = setInterval(() => {
      fetchMessages();
      fetchDeposits();
    }, 3000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, selectedChatId]);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchUsers(), fetchDeposits(), fetchMessages()]);
    setLoading(false);
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      const data = await response.json();
      if (data && data.success) {
        setUsers(data.users || []);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const fetchDeposits = async () => {
    try {
      const response = await fetch('/api/deposits');
      const data = await response.json();
      if (data && data.success) {
        setDeposits(data.deposits || []);
      }
    } catch (err) {
      console.error('Error fetching deposits:', err);
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await fetch('/api/chat/messages');
      const data = await response.json();
      if (data && data.success) {
        setMessages(data.messages || []);
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  };

  // Enviar respuesta al chat seleccionado
  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedChatId) return;

    const messageToSend = replyText;
    setReplyText('');

    try {
      const response = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: selectedChatId,
          sender: 'admin',
          sender_name: 'Administrador',
          text: messageToSend
        })
      });

      if (!response.ok) {
        alert('Error al enviar el mensaje.');
      } else {
        fetchMessages();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Aprobar un depósito
  const handleApproveDeposit = async (deposit) => {
    if (!confirm(`¿Estás seguro de APROBAR el depósito de $${deposit.amount} USD para ${deposit.username}?`)) return;

    try {
      const response = await fetch('/api/deposits', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deposit_id: deposit.id,
          status: 'approved'
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al aprobar depósito.');
      }

      alert('¡Depósito aprobado y créditos acreditados con éxito!');
      fetchData();

    } catch (err) {
      console.error(err);
      alert(err.message || 'Ocurrió un error al procesar la aprobación.');
    }
  };

  // Rechazar un depósito
  const handleRejectDeposit = async (depositId) => {
    if (!confirm('¿Estás seguro de RECHAZAR este depósito?')) return;

    try {
      const response = await fetch('/api/deposits', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deposit_id: depositId,
          status: 'rejected'
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al rechazar depósito.');
      }

      alert('Depósito rechazado.');
      fetchData();
    } catch (err) {
      console.error(err);
      alert(err.message || 'Error al rechazar depósito.');
    }
  };

  // Agrupar mensajes para sacar la lista de chats activos
  const getActiveChats = () => {
    const chatsMap = {};
    messages.forEach(msg => {
      if (!chatsMap[msg.chat_id]) {
        chatsMap[msg.chat_id] = {
          email: msg.chat_id,
          lastMessage: msg.text,
          lastTime: new Date(msg.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
          unread: msg.sender === 'user',
          userName: msg.sender === 'user' ? msg.sender_name : 'Usuario'
        };
      } else {
        chatsMap[msg.chat_id].lastMessage = msg.text;
        chatsMap[msg.chat_id].lastTime = new Date(msg.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
        if (msg.sender === 'user') {
          chatsMap[msg.chat_id].unread = true;
          chatsMap[msg.chat_id].userName = msg.sender_name;
        } else {
          chatsMap[msg.chat_id].unread = false;
        }
      }
    });

    return Object.values(chatsMap).filter(chat => 
      chat.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chat.userName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const activeChats = getActiveChats();
  const selectedChatMessages = messages.filter(m => m.chat_id === selectedChatId);

  return (
    <div className="modal-overlay" style={{ zIndex: 1100 }}>
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '1000px',
        height: '85vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'hsl(222, 47%, 6%)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '24px',
        overflow: 'hidden'
      }}>
        
        {/* Cabecera del Panel */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-glass)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, transparent 100%)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: 'var(--color-primary-glow)', padding: '6px', borderRadius: '8px' }}>
              <Coins style={{ color: 'var(--color-primary)', width: '22px', height: '22px' }} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Consola de Administración</h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>MLB Analista • Dashboard de Control</span>
            </div>
          </div>
          
          {/* Tabs del Panel */}
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.02)', padding: '3px', borderRadius: '10px', border: '1px solid var(--border-glass)' }}>
            <button
              onClick={() => setActiveTab('chats')}
              style={{
                padding: '8px 16px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem',
                background: activeTab === 'chats' ? 'rgba(255, 255, 255, 0.08)' : 'none',
                color: activeTab === 'chats' ? 'var(--text-primary)' : 'var(--text-secondary)'
              }}
            >
              <MessageSquare style={{ width: '14px', height: '14px', marginRight: '6px', display: 'inline' }} />
              Chats en Vivo ({activeChats.length})
            </button>
            <button
              onClick={() => setActiveTab('deposits')}
              style={{
                padding: '8px 16px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem',
                background: activeTab === 'deposits' ? 'rgba(255, 255, 255, 0.08)' : 'none',
                color: activeTab === 'deposits' ? 'var(--text-primary)' : 'var(--text-secondary)'
              }}
            >
              <Coins style={{ width: '14px', height: '14px', marginRight: '6px', display: 'inline' }} />
              Depósitos ({deposits.filter(d => d.status === 'pending').length} pendientes)
            </button>
          </div>

          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
            <X style={{ width: '22px', height: '22px' }} />
          </button>
        </div>

        {/* Contenido según la pestaña activa */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          
          {loading ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.05)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Cargando datos de Supabase...</span>
            </div>
          ) : activeTab === 'chats' ? (
            <>
              {/* LISTA DE CHATS ACTIVAS (IZQUIERDA) */}
              <div style={{ width: '320px', borderRight: '1px solid var(--border-glass)', display: 'flex', flexDirection: 'column', background: 'rgba(0,0,0,0.1)' }}>
                <div style={{ padding: '16px', borderBottom: '1px solid var(--border-glass)' }}>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      placeholder="Buscar usuario o email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      style={{
                        width: '100%', padding: '10px 10px 10px 34px', background: 'var(--bg-input)',
                        border: '1px solid var(--border-glass)', borderRadius: '10px', color: 'var(--text-primary)', fontSize: '0.8rem', outline: 'none'
                      }}
                    />
                    <Search style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', width: '14px', height: '14px', color: 'var(--text-muted)' }} />
                  </div>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                  {activeChats.length === 0 ? (
                    <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      No hay chats activos.
                    </div>
                  ) : (
                    activeChats.map(chat => (
                      <button
                        key={chat.email}
                        onClick={() => setSelectedChatId(chat.email)}
                        style={{
                          width: '100%', padding: '14px 18px', border: 'none', borderBottom: '1px solid var(--border-glass)',
                          background: selectedChatId === chat.email ? 'rgba(59, 130, 246, 0.08)' : 'none',
                          color: 'var(--text-primary)', textAlign: 'left', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '4px',
                          transition: 'background 0.2s'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 800 }}>{chat.userName}</span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{chat.lastTime}</span>
                        </div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>
                          {chat.lastMessage}
                        </span>
                        {chat.unread && (
                          <span style={{
                            alignSelf: 'flex-start', background: 'var(--color-primary)', color: '#ffffff',
                            fontSize: '0.6rem', fontWeight: 800, padding: '2px 6px', borderRadius: '10px', marginTop: '2px'
                          }}>
                            NUEVO
                          </span>
                        )}
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* CONVERSACIÓN (DERECHA) */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'rgba(0,0,0,0.05)' }}>
                {selectedChatId ? (
                  <>
                    {/* Info de contacto */}
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-glass)', background: 'rgba(255,255,255,0.01)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ backgroundColor: 'var(--color-primary-glow)', padding: '8px', borderRadius: '50%' }}>
                        <User style={{ color: 'var(--color-primary)', width: '18px', height: '18px' }} />
                      </div>
                      <div>
                        <span style={{ fontSize: '0.85rem', fontWeight: 800, display: 'block' }}>Chat con {selectedChatId}</span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Historial sincronizado en tiempo real</span>
                      </div>
                    </div>

                    {/* Mensajes */}
                    <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      {selectedChatMessages.map(msg => (
                        <div
                          key={msg.id}
                          style={{
                            alignSelf: msg.sender === 'admin' ? 'flex-end' : 'flex-start',
                            maxWidth: '75%',
                            background: msg.sender === 'admin'
                              ? 'linear-gradient(135deg, hsl(217, 91%, 60%) 0%, hsl(220, 90%, 50%) 100%)'
                              : 'rgba(255,255,255,0.04)',
                            color: msg.sender === 'admin' ? '#ffffff' : 'var(--text-primary)',
                            padding: '12px 16px',
                            borderRadius: msg.sender === 'admin' ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                            fontSize: '0.85rem',
                            border: msg.sender === 'admin' ? 'none' : '1px solid rgba(255, 255, 255, 0.05)',
                            boxShadow: msg.sender === 'admin' ? '0 4px 10px rgba(59, 130, 246, 0.2)' : 'none'
                          }}
                        >
                          <span style={{ display: 'block', fontSize: '0.65rem', color: msg.sender === 'admin' ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)', marginBottom: '4px', fontWeight: 700 }}>
                            {msg.sender === 'admin' ? 'Tú (Administrador)' : msg.sender_name}
                          </span>
                          {msg.text}
                          <span style={{ display: 'block', fontSize: '0.55rem', color: msg.sender === 'admin' ? 'rgba(255,255,255,0.5)' : 'var(--text-muted)', textAlign: 'right', marginTop: '4px' }}>
                            {new Date(msg.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Formulario de envío de respuesta */}
                    <form onSubmit={handleSendReply} style={{ padding: '16px 20px', borderTop: '1px solid var(--border-glass)', background: 'rgba(0,0,0,0.15)', display: 'flex', gap: '10px' }}>
                      <input
                        type="text"
                        placeholder="Escribe un mensaje de respuesta..."
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        style={{
                          flex: 1, padding: '12px 16px', background: 'var(--bg-input)',
                          border: '1px solid var(--border-glass)', borderRadius: '12px', color: 'var(--text-primary)', fontSize: '0.9rem', outline: 'none'
                        }}
                      />
                      <button type="submit" className="btn-primary" style={{ padding: '12px', borderRadius: '12px' }}>
                        <Send style={{ width: '18px', height: '18px' }} />
                      </button>
                    </form>
                  </>
                ) : (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', color: 'var(--text-muted)' }}>
                    <MessageSquare style={{ width: '48px', height: '48px', opacity: 0.3 }} />
                    <span style={{ fontSize: '0.9rem' }}>Selecciona un chat de la izquierda para comenzar a conversar.</span>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* LISTADO DE DEPÓSITOS (DERECHA) */
            <div style={{ flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Historial de Depósitos Recientes</h3>
              
              {deposits.length === 0 ? (
                <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  No se han registrado reportes de depósito.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {deposits.map(dep => (
                    <div
                      key={dep.id}
                      className="glass-panel"
                      style={{
                        padding: '20px',
                        background: 'rgba(255,255,255,0.01)',
                        display: 'grid',
                        gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1.5fr',
                        alignItems: 'center',
                        gap: '16px',
                        borderColor: dep.status === 'approved' ? 'rgba(34, 197, 94, 0.15)' : dep.status === 'rejected' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255,255,255,0.05)'
                      }}
                    >
                      <div>
                        <strong style={{ display: 'block', fontSize: '0.85rem' }}>{dep.username}</strong>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{dep.email}</span>
                      </div>
                      
                      <div>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', fontWeight: 600 }}>Monto</span>
                        <strong style={{ fontSize: '1rem', color: 'var(--color-medium-risk)' }}>${dep.amount} USD</strong>
                      </div>

                      <div>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', fontWeight: 600 }}>Referencia / Método</span>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>{dep.reference}</span>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', display: 'block' }}>{dep.method}</span>
                      </div>

                      <div>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', fontWeight: 600 }}>Estado</span>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', fontWeight: 800,
                          padding: '3px 8px', borderRadius: '12px', textTransform: 'uppercase',
                          background: dep.status === 'approved' ? 'rgba(34, 197, 94, 0.1)' : dep.status === 'rejected' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                          color: dep.status === 'approved' ? 'var(--color-low-risk)' : dep.status === 'rejected' ? 'var(--color-high-risk)' : 'var(--color-medium-risk)'
                        }}>
                          {dep.status === 'approved' && <ShieldCheck style={{ width: '12px', height: '12px' }} />}
                          {dep.status === 'rejected' && <AlertTriangle style={{ width: '12px', height: '12px' }} />}
                          {dep.status === 'pending' && <Clock style={{ width: '12px', height: '12px' }} />}
                          {dep.status === 'pending' ? 'pendiente' : dep.status === 'approved' ? 'aprobado' : 'rechazado'}
                        </span>
                      </div>

                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        {dep.status === 'pending' ? (
                          <>
                            <button
                              onClick={() => handleApproveDeposit(dep)}
                              className="btn-primary"
                              style={{ padding: '6px 12px', fontSize: '0.75rem', background: '#22c55e', color: '#ffffff', borderRadius: '8px', boxShadow: 'none' }}
                            >
                              <Check style={{ width: '14px', height: '14px', marginRight: '4px', display: 'inline' }} />
                              Aprobar
                            </button>
                            <button
                              onClick={() => handleRejectDeposit(dep.id)}
                              className="btn-secondary"
                              style={{ padding: '6px 12px', fontSize: '0.75rem', borderColor: 'var(--color-high-risk)', color: 'var(--color-high-risk)', borderRadius: '8px' }}
                            >
                              Rechazar
                            </button>
                          </>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            Procesado ({new Date(dep.created_at).toLocaleDateString()})
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

      </div>

      <style jsx global>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

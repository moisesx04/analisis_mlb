'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, CreditCard, ArrowLeft, Upload, ShieldCheck, Coins, HelpCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function ChatWidget({ user, onUpdateCredits }) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState('welcome'); // welcome, deposit_info, deposit_form, loading, success
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  
  // Deposit Form State
  const [amount, setAmount] = useState('');
  const [reference, setReference] = useState('');
  const [method, setMethod] = useState('Transferencia Bancaria');
  const [notes, setNotes] = useState('');
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');

  const chatEndRef = useRef(null);

  // 1. Cargar mensajes iniciales y suscribirse a cambios en tiempo real
  useEffect(() => {
    if (!user || !isOpen) return;

    fetchMessages();

    // Suscribirse al canal en tiempo real para este chat_id
    const channel = supabase
      .channel(`chat-${user.email}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `chat_id=eq.${user.email}` },
        (payload) => {
          setMessages(prev => {
            // Evitar agregar duplicados
            if (prev.some(m => m.id === payload.new.id)) return prev;
            return [...prev, payload.new];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, isOpen]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, step]);

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', user.email)
      .order('created_at', { ascending: true });

    if (data) {
      setMessages(data);
      // Si ya hay historial de mensajes de depósito o chat, cambiamos el step a chat libre
      if (data.length > 0) {
        setStep('welcome');
      }
    }
  };

  const handleOptionClick = async (option) => {
    if (!user) return;

    if (option === 'deposit') {
      setStep('deposit_info');
      // Registrar selección en la base de datos
      await supabase.from('messages').insert([
        { chat_id: user.email, sender: 'user', sender_name: user.username, text: '💰 Recargar Créditos / Depositar' },
        {
          chat_id: user.email,
          sender: 'bot',
          sender_name: 'Asistente',
          text: `Excelente decisión. Para comprar créditos de análisis, realiza el pago en cualquiera de las siguientes opciones:\n\n` +
            `• 🏦 **Banco Nacional:** Cta: 1234-5678-9012 (A nombre de Juan Pérez • Ahorros)\n` +
            `• 💳 **Binance Pay ID:** 987654321 (Enviar USDT)\n` +
            `• 📧 **PayPal:** pagos@analistamlb.com (Enviar como familiar/amigo)\n\n` +
            `Una vez realizado, pulsa el botón de abajo para registrar tu comprobante.`
        }
      ]);
    } else if (option === 'how_it_works') {
      await supabase.from('messages').insert([
        { chat_id: user.email, sender: 'user', sender_name: user.username, text: '❓ ¿Cómo funcionan las predicciones?' },
        {
          chat_id: user.email,
          sender: 'bot',
          sender_name: 'Asistente',
          text: 'Nuestro sistema recopila estadísticas en tiempo real de MLB Stats y ESPN API. Evaluamos el estadio, clima, lanzadores abridores y rotaciones de bateo para calcular el porcentaje lógico de probabilidad de victoria y riesgo (Bajo, Medio, Alto). \n\n¡Los partidos de Bajo Riesgo tienen más de un 80% de efectividad histórica!'
        }
      ]);
    } else if (option === 'support') {
      await supabase.from('messages').insert([
        { chat_id: user.email, sender: 'user', sender_name: user.username, text: '👤 Soporte Técnico' },
        {
          chat_id: user.email,
          sender: 'bot',
          sender_name: 'Asistente',
          text: 'Si tienes problemas con la plataforma o alguna duda con tu cuenta, puedes escribir directamente a nuestro administrador de soporte técnico en WhatsApp o enviar un correo electrónico a soporte@analistamlb.com. ¡Estamos activos 24/7!'
        }
      ]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFileName(e.target.files[0].name);
    }
  };

  // Enviar mensaje personalizado de chat libre
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !user) return;

    const textToSend = inputText;
    setInputText('');

    try {
      const { error } = await supabase.from('messages').insert([
        {
          chat_id: user.email,
          sender: 'user',
          sender_name: user.username,
          text: textToSend
        }
      ]);

      if (error) {
        console.error(error);
        alert('Error al enviar el mensaje.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmitDeposit = async (e) => {
    e.preventDefault();
    setError('');

    if (!amount || !reference) {
      setError('Por favor completa los campos obligatorios.');
      return;
    }

    setStep('loading');

    try {
      // 1. Enviar comprobante real al endpoint backend para alertas Discord/Telegram
      await fetch('/api/support/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: user.username,
          email: user.email,
          amount,
          reference,
          method,
          message: notes
        })
      });

      // 2. Registrar el depósito en la tabla de Supabase
      const { error: insertError } = await supabase
        .from('deposits')
        .insert([
          {
            username: user.username,
            email: user.email,
            amount: parseFloat(amount),
            reference,
            method,
            notes,
            status: 'pending'
          }
        ]);

      if (insertError) throw insertError;

      // 3. Registrar mensaje automático en el chat para avisar del depósito en el historial
      await supabase.from('messages').insert([
        {
          chat_id: user.email,
          sender: 'user',
          sender_name: user.username,
          text: `💸 *COMPROBANTE REGISTRADO*\n` +
            `• Método: ${method}\n` +
            `• Monto: $${amount} USD\n` +
            `• Ref: ${reference}\n` +
            `• Comentarios: ${notes || 'Sin comentarios.'}`
        }
      ]);

      setStep('success');

    } catch (err) {
      console.error(err);
      setError('Ocurrió un error al enviar el comprobante. Intenta de nuevo.');
      setStep('deposit_form');
    }
  };

  // Genera el enlace de WhatsApp con el mensaje pre-redactado
  const getWhatsAppLink = () => {
    const adminPhoneNumber = '18491234567'; // Reemplazar con el número real del administrador
    const text = encodeURIComponent(
      `Hola Administrador, acabo de registrar un depósito en la plataforma Analista MLB.\n\n` +
      `• *Usuario:* ${user?.username}\n` +
      `• *Correo:* ${user?.email}\n` +
      `• *Monto:* $${amount} USD\n` +
      `• *Método:* ${method}\n` +
      `• *Referencia:* ${reference}\n` +
      `• *Mensaje:* ${notes || 'Sin comentarios.'}\n\n` +
      `Adjunto imagen del comprobante de pago.`
    );
    return `https://wa.me/${adminPhoneNumber}?text=${text}`;
  };

  return (
    <>
      {/* Botón Flotante */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, hsl(217, 91%, 60%) 0%, hsl(220, 90%, 50%) 100%)',
          color: '#ffffff',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 8px 24px rgba(59, 130, 246, 0.4), 0 0 10px rgba(59, 130, 246, 0.2)',
          zIndex: 1000,
          transition: 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
        }}
        className="hover-pop"
        title="Soporte y Depósitos"
      >
        {isOpen ? <X style={{ width: '24px', height: '24px' }} /> : <MessageSquare style={{ width: '24px', height: '24px' }} />}
      </button>

      {/* Ventana de Chat */}
      {isOpen && (
        <div className="glass-panel" style={{
          position: 'fixed',
          bottom: '96px',
          right: '24px',
          width: '380px',
          height: '550px',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          borderRadius: '20px',
          background: 'rgba(3, 7, 18, 0.85)',
          borderColor: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
          animation: 'slideUp 0.3s ease-out'
        }}>
          
          {/* Cabecera del Chat */}
          <div style={{
            padding: '16px 20px',
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(255, 255, 255, 0.02) 100%)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: 'var(--color-low-risk)',
                boxShadow: '0 0 8px var(--color-low-risk)'
              }}></div>
              <div>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0 }}>Soporte MLB</h3>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Asistente en línea</span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
            >
              <X style={{ width: '18px', height: '18px' }} />
            </button>
          </div>

          {/* Cuerpo del Chat / Mensajes */}
          <div style={{
            flex: 1,
            padding: '20px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px'
          }}>
            {messages.length === 0 ? (
              <div style={{
                alignSelf: 'flex-start',
                maxWidth: '85%',
                background: 'rgba(255, 255, 255, 0.04)',
                color: 'var(--text-primary)',
                padding: '12px 16px',
                borderRadius: '16px 16px 16px 2px',
                fontSize: '0.85rem',
                lineHeight: '1.4',
                border: '1px solid rgba(255, 255, 255, 0.05)'
              }}>
                ¡Hola, **{user?.username}**! 👋 Soy el asistente virtual de Analista MLB. ¿En qué puedo ayudarte hoy?
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div
                  key={msg.id || idx}
                  style={{
                    alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                    maxWidth: '85%',
                    background: msg.sender === 'user'
                      ? 'linear-gradient(135deg, hsl(217, 91%, 60%) 0%, hsl(220, 90%, 50%) 100%)'
                      : (msg.sender === 'admin'
                        ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(255,255,255,0.03) 100%)'
                        : 'rgba(255, 255, 255, 0.04)'),
                    color: msg.sender === 'user' ? '#ffffff' : 'var(--text-primary)',
                    padding: '12px 16px',
                    borderRadius: msg.sender === 'user' ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                    fontSize: '0.85rem',
                    lineHeight: '1.4',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    boxShadow: msg.sender === 'user' ? '0 4px 10px rgba(59, 130, 246, 0.2)' : 'none',
                    whiteSpace: 'pre-line'
                  }}
                >
                  <span style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 700 }}>
                    {msg.sender === 'user' ? 'Tú' : msg.sender_name}
                  </span>
                  {msg.text}
                </div>
              ))
            )}

            {/* Opciones rápidas de bienvenida */}
            {step === 'welcome' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
                <button
                  onClick={() => handleOptionClick('deposit')}
                  className="btn-secondary"
                  style={{ width: '100%', fontSize: '0.8rem', padding: '10px', borderRadius: '10px', justifyContent: 'flex-start', gap: '10px' }}
                >
                  <Coins style={{ width: '16px', height: '16px', color: 'var(--color-primary)' }} />
                  💰 Recargar Créditos / Depositar
                </button>
                <button
                  onClick={() => handleOptionClick('how_it_works')}
                  className="btn-secondary"
                  style={{ width: '100%', fontSize: '0.8rem', padding: '10px', borderRadius: '10px', justifyContent: 'flex-start', gap: '10px' }}
                >
                  <HelpCircle style={{ width: '16px', height: '16px', color: 'var(--color-medium-risk)' }} />
                  ❓ ¿Cómo funcionan las predicciones?
                </button>
                <button
                  onClick={() => handleOptionClick('support')}
                  className="btn-secondary"
                  style={{ width: '100%', fontSize: '0.8rem', padding: '10px', borderRadius: '10px', justifyContent: 'flex-start', gap: '10px' }}
                >
                  <MessageSquare style={{ width: '16px', height: '16px', color: 'var(--color-low-risk)' }} />
                  👤 Soporte Técnico
                </button>
              </div>
            )}

            {/* Botón de transición en información de depósito */}
            {step === 'deposit_info' && (
              <button
                onClick={() => setStep('deposit_form')}
                className="btn-primary"
                style={{ width: '100%', fontSize: '0.85rem', padding: '12px', borderRadius: '12px', justifyContent: 'center', marginTop: '10px' }}
              >
                <CreditCard style={{ width: '16px', height: '16px' }} />
                Registrar Comprobante de Pago
              </button>
            )}

            {/* Formulario de carga de datos */}
            {step === 'deposit_form' && (
              <form onSubmit={handleSubmitDeposit} style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                background: 'rgba(255,255,255,0.02)',
                padding: '16px',
                borderRadius: '16px',
                border: '1px solid rgba(255,255,255,0.05)',
                marginTop: '10px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px' }}>
                  <button type="button" onClick={() => setStep('deposit_info')} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 0 }}>
                    <ArrowLeft style={{ width: '16px', height: '16px' }} />
                  </button>
                  <span style={{ fontSize: '0.8rem', fontWeight: 800 }}>Datos del Depósito</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600 }}>MÉTODO DE PAGO</label>
                  <select
                    value={method}
                    onChange={(e) => setMethod(e.target.value)}
                    style={{
                      padding: '10px',
                      borderRadius: '8px',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-glass)',
                      color: 'var(--text-primary)',
                      fontSize: '0.8rem',
                      outline: 'none'
                    }}
                  >
                    <option value="Transferencia Bancaria">🏦 Transferencia Bancaria</option>
                    <option value="Binance Pay">💳 Binance Pay</option>
                    <option value="PayPal">📧 PayPal</option>
                  </select>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600 }}>MONTO ($ USD) *</label>
                    <input
                      type="number"
                      placeholder="Monto"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      style={{
                        padding: '10px',
                        borderRadius: '8px',
                        background: 'var(--bg-input)',
                        border: '1px solid var(--border-glass)',
                        color: 'var(--text-primary)',
                        fontSize: '0.8rem',
                        outline: 'none'
                      }}
                      required
                    />
                  </div>
                  <div style={{ flex: 1.5, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600 }}>REFERENCIA / ID *</label>
                    <input
                      type="text"
                      placeholder="Nº de Ref."
                      value={reference}
                      onChange={(e) => setReference(e.target.value)}
                      style={{
                        padding: '10px',
                        borderRadius: '8px',
                        background: 'var(--bg-input)',
                        border: '1px solid var(--border-glass)',
                        color: 'var(--text-primary)',
                        fontSize: '0.8rem',
                        outline: 'none'
                      }}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600 }}>COMPROBANTE (FOTO/PDF)</label>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '10px',
                    borderRadius: '8px',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-glass)',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    color: 'var(--text-secondary)',
                    textAlign: 'center'
                  }}>
                    <Upload style={{ width: '14px', height: '14px' }} />
                    {fileName ? fileName : 'Seleccionar archivo'}
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={handleFileChange}
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600 }}>MENSAJE OPCIONAL</label>
                  <input
                    type="text"
                    placeholder="Escribe comentarios aquí..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    style={{
                      padding: '10px',
                      borderRadius: '8px',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-glass)',
                      color: 'var(--text-primary)',
                      fontSize: '0.8rem',
                      outline: 'none'
                    }}
                  />
                </div>

                {error && (
                  <span style={{ color: 'var(--color-high-risk)', fontSize: '0.7rem', fontWeight: 600 }}>{error}</span>
                )}

                <button
                  type="submit"
                  className="btn-primary"
                  style={{ width: '100%', fontSize: '0.85rem', padding: '10px', borderRadius: '10px', justifyContent: 'center', marginTop: '4px' }}
                >
                  Enviar Comprobante
                </button>
              </form>
            )}

            {/* Estado cargando */}
            {step === 'loading' && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '40px 0' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  border: '2px solid rgba(255,255,255,0.05)',
                  borderTopColor: 'var(--color-primary)',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}></div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Enviando reporte al administrador...</span>
              </div>
            )}

            {/* Pantalla de éxito final */}
            {step === 'success' && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '14px',
                textAlign: 'center',
                background: 'rgba(34, 197, 94, 0.04)',
                border: '1px solid rgba(34, 197, 94, 0.15)',
                padding: '20px',
                borderRadius: '16px',
                marginTop: '10px'
              }}>
                <div style={{
                  backgroundColor: 'rgba(34, 197, 94, 0.1)',
                  padding: '12px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <ShieldCheck style={{ width: '32px', height: '32px', color: 'var(--color-low-risk)' }} />
                </div>
                
                <div>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--color-low-risk)', marginBottom: '4px' }}>
                    ¡Comprobante Enviado!
                  </h4>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                    Los datos han sido enviados al servidor. El administrador verificará tu referencia en unos minutos para acreditar tu saldo.
                  </p>
                </div>

                {/* Botón enviar por WhatsApp */}
                <a
                  href={getWhatsAppLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary"
                  style={{
                    width: '100%',
                    fontSize: '0.85rem',
                    padding: '12px',
                    borderRadius: '12px',
                    justifyContent: 'center',
                    background: '#22c55e',
                    boxShadow: '0 4px 14px rgba(34, 197, 94, 0.3)',
                    textDecoration: 'none',
                    color: '#ffffff'
                  }}
                >
                  <MessageSquare style={{ width: '16px', height: '16px' }} />
                  Enviar por WhatsApp
                </a>

                <button
                  type="button"
                  onClick={() => {
                    setStep('welcome');
                    setAmount('');
                    setReference('');
                    setNotes('');
                    setFileName('');
                  }}
                  className="btn-secondary"
                  style={{ width: '100%', fontSize: '0.8rem', padding: '8px', borderRadius: '10px', justifyContent: 'center' }}
                >
                  Volver al Chat
                </button>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Caja de texto para chat libre (si no está cargando o en formulario) */}
          {step !== 'deposit_form' && step !== 'loading' && (
            <form onSubmit={handleSendMessage} style={{
              display: 'flex',
              gap: '8px',
              borderTop: '1px solid rgba(255,255,255,0.08)',
              padding: '12px 16px',
              background: 'rgba(3, 7, 18, 0.5)'
            }}>
              <input
                type="text"
                placeholder="Escribe un mensaje al soporte..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  borderRadius: '10px',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-glass)',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem',
                  outline: 'none'
                }}
              />
              <button
                type="submit"
                className="btn-primary"
                style={{ padding: '10px', borderRadius: '10px', justifyContent: 'center', boxShadow: 'none' }}
              >
                <Send style={{ width: '16px', height: '16px' }} />
              </button>
            </form>
          )}

        </div>
      )}

      {/* Estilos adicionales */}
      <style jsx global>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .hover-pop:hover {
          transform: scale(1.08);
        }
      `}</style>
    </>
  );
}

import React, { useState } from 'react';
import { Sparkles, MessageSquare, X, Send, RefreshCw, ChevronUp, Bot } from 'lucide-react';
import { askMestizoAI } from '../utils/aiEngine';

export default function AICopilotWidget({ onOpenFullAIView }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'init-msg',
      sender: 'ai',
      text: '🤖 ¡Hola! Soy tu Copiloto IA de Mestizo. Puedes preguntarme sobre ventas, existencias o anomalías en cualquier momento.'
    }
  ]);

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if (!query.trim() || isAiLoading) return;

    const userText = query.trim();
    setMessages(prev => [...prev, { id: `u-${Date.now()}`, sender: 'user', text: userText }]);
    setQuery('');
    setIsAiLoading(true);

    try {
      const res = await askMestizoAI(userText);
      setMessages(prev => [...prev, { id: `ai-${Date.now()}`, sender: 'ai', text: res.reply }]);
    } catch (err) {
      setMessages(prev => [...prev, { id: `err-${Date.now()}`, sender: 'ai', text: `Error: ${err.message}` }]);
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 999 }}>
      {/* VENTANA EMERGENTE DEL COPILOTO */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          bottom: '65px',
          right: '0',
          width: '360px',
          height: '460px',
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          boxShadow: 'var(--shadow-lg)',
          border: '1px solid var(--sand-border)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'fadeIn 0.25s ease'
        }}>
          {/* Header Widget */}
          <div style={{
            backgroundColor: 'var(--terracotta)',
            color: '#FFFFFF',
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={18} />
              <strong style={{ fontSize: '0.9rem' }}>Mestizo Copilot IA</strong>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {onOpenFullAIView && (
                <button
                  onClick={() => { setIsOpen(false); onOpenFullAIView(); }}
                  title="Abrir Centro Completo de IA"
                  style={{
                    background: 'rgba(255,255,255,0.2)',
                    border: 'none',
                    color: '#FFF',
                    padding: '3px 7px',
                    borderRadius: '6px',
                    fontSize: '0.72rem',
                    cursor: 'pointer',
                    fontWeight: 700
                  }}
                >
                  Ver Todo
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#FFF',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Chat Messages */}
          <div style={{
            flex: 1,
            padding: '12px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            backgroundColor: 'var(--sand-bg)',
            fontSize: '0.84rem'
          }}>
            {messages.map(m => (
              <div
                key={m.id}
                style={{
                  alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                  backgroundColor: m.sender === 'user' ? 'var(--terracotta)' : '#FFFFFF',
                  color: m.sender === 'user' ? '#FFFFFF' : 'var(--dark-text)',
                  padding: '8px 12px',
                  borderRadius: m.sender === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                  boxShadow: 'var(--shadow-sm)',
                  border: m.sender === 'user' ? 'none' : '1px solid var(--sand-border)',
                  whiteSpace: 'pre-wrap',
                  lineHeight: 1.4
                }}
              >
                {m.text}
              </div>
            ))}
            {isAiLoading && (
              <div style={{ alignSelf: 'flex-start', color: 'var(--terracotta)', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 700 }}>
                <RefreshCw size={14} className="animate-spin" />
                <span>Analizando datos...</span>
              </div>
            )}
          </div>

          {/* Form input */}
          <form
            onSubmit={handleSend}
            style={{
              padding: '8px 10px',
              borderTop: '1px solid var(--sand-border)',
              backgroundColor: '#FFFFFF',
              display: 'flex',
              gap: '6px'
            }}
          >
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Pregunta rápida..."
              style={{
                flex: 1,
                padding: '8px 10px',
                borderRadius: '8px',
                border: '1px solid var(--sand-border)',
                fontSize: '0.84rem',
                outline: 'none'
              }}
            />
            <button
              type="submit"
              disabled={isAiLoading || !query.trim()}
              style={{
                backgroundColor: 'var(--terracotta)',
                color: '#FFF',
                border: 'none',
                padding: '8px 12px',
                borderRadius: '8px',
                cursor: query.trim() && !isAiLoading ? 'pointer' : 'not-allowed',
                opacity: query.trim() && !isAiLoading ? 1 : 0.6
              }}
            >
              <Send size={14} />
            </button>
          </form>
        </div>
      )}

      {/* BOTÓN FLOTANTE */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '52px',
          height: '52px',
          borderRadius: '50%',
          backgroundColor: 'var(--terracotta)',
          color: '#FFFFFF',
          border: '2px solid #FFFFFF',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
        title="Copiloto IA de Mestizo"
      >
        <Sparkles size={24} />
      </button>
    </div>
  );
}

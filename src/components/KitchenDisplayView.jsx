import React, { useState, useEffect } from 'react';
import { Utensils, Clock, CheckCircle, AlertTriangle, Flame, BellRing, BellOff, RefreshCw } from 'lucide-react';
import { getKitchenTickets, saveKitchenTickets } from '../utils/storage';
import { playNotificationBell } from '../utils/audioHelper';

export default function KitchenDisplayView() {
  const [tickets, setTickets] = useState([]);
  const [now, setNow] = useState(Date.now());
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [prevCount, setPrevCount] = useState(0);

  const loadTickets = () => {
    const allTickets = getKitchenTickets();
    const kitchenOnly = allTickets.filter(t => t.type === 'kitchen' && t.status !== 'completed');
    
    // Play bell chime if new ticket arrived
    if (kitchenOnly.length > prevCount && prevCount > 0 && soundEnabled) {
      playNotificationBell();
    }
    setPrevCount(kitchenOnly.length);
    setTickets(kitchenOnly);
  };

  useEffect(() => {
    loadTickets();
    const timer = setInterval(() => {
      setNow(Date.now());
      loadTickets();
    }, 4000);

    return () => clearInterval(timer);
  }, [prevCount, soundEnabled]);

  const handleMarkItemDone = (ticketId, itemIdx) => {
    const allTickets = getKitchenTickets();
    const updated = allTickets.map(ticket => {
      if (ticket.id === ticketId) {
        const updatedItems = [...ticket.items];
        if (updatedItems[itemIdx]) {
          updatedItems[itemIdx].isDone = !updatedItems[itemIdx].isDone;
        }

        // If all items are done, mark ticket as completed
        const allDone = updatedItems.every(i => i.isDone);
        return {
          ...ticket,
          items: updatedItems,
          status: allDone ? 'completed' : 'preparing'
        };
      }
      return ticket;
    });

    saveKitchenTickets(updated);
    loadTickets();
  };

  const handleCompleteTicket = (ticketId) => {
    const allTickets = getKitchenTickets();
    const updated = allTickets.map(ticket => {
      if (ticket.id === ticketId) {
        return {
          ...ticket,
          status: 'completed',
          items: ticket.items.map(i => ({ ...i, isDone: true }))
        };
      }
      return ticket;
    });

    saveKitchenTickets(updated);
    loadTickets();
  };

  const getElapsedTimeMinutes = (createdAt) => {
    const created = new Date(createdAt).getTime();
    const diffMs = now - created;
    return Math.floor(diffMs / 60000);
  };

  return (
    <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', flex: 1, width: '100%', minWidth: 0 }}>
      
      {/* Header Banner */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Flame size={28} color="var(--terracotta)" />
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--terracotta)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              MONITOR DE PREPARACIÓN DE ALIMENTOS (KDS)
            </span>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--dark-text)' }}>
              Comandas de Cocina ({tickets.length})
            </h1>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.85rem', fontWeight: 700 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--success)' }} />
            <span>🟢 &lt; 5 min</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#FBC02D' }} />
            <span>🟡 5-10 min</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--danger)' }} />
            <span>🔴 &gt; 10 min (URGENTE)</span>
          </div>

          <button
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              if (!soundEnabled) playNotificationBell();
            }}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              border: soundEnabled ? '1px solid var(--terracotta)' : '1px solid var(--sand-border)',
              backgroundColor: soundEnabled ? 'var(--sand-muted)' : '#FFF',
              color: soundEnabled ? 'var(--terracotta)' : 'var(--dark-subdued)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              fontWeight: 700
            }}
          >
            {soundEnabled ? <BellRing size={16} /> : <BellOff size={16} />}
            <span>{soundEnabled ? 'Timbre Activado' : 'Sin Sonido'}</span>
          </button>

          <button
            onClick={loadTickets}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              border: '1px solid var(--sand-border)',
              backgroundColor: '#FFF',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={14} />
            <span>Actualizar</span>
          </button>
        </div>
      </div>

      {tickets.length === 0 ? (
        <div style={{
          backgroundColor: '#FFF',
          border: '1px dashed var(--sand-border)',
          borderRadius: 'var(--radius-lg)',
          padding: '3rem',
          textAlign: 'center',
          color: 'var(--dark-subdued)'
        }}>
          <Utensils size={40} style={{ margin: '0 auto 1rem auto', opacity: 0.5 }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>No hay comanda de cocina pendiente</h3>
          <p style={{ fontSize: '0.9rem', marginTop: '4px' }}>Las nuevas órdenes de los meseros aparecerán automáticamente aquí con alerta de tiempo.</p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '1.25rem'
        }}>
          {tickets.map(ticket => {
            const isCancellation = Boolean(ticket.isCancellationAlert);
            const elapsed = getElapsedTimeMinutes(ticket.createdAt);
            const isYellow = elapsed >= 5 && elapsed < 10;
            const isRed = elapsed >= 10 || isCancellation;

            const badgeBg = isCancellation ? '#FFEBEE' : (isRed ? '#FFEBEE' : (isYellow ? '#FFFDE7' : '#E8F5E9'));
            const badgeColor = isCancellation ? '#D32F2F' : (isRed ? 'var(--danger)' : (isYellow ? '#F57F17' : 'var(--success)'));
            const borderColor = isCancellation ? '#D32F2F' : (isRed ? 'var(--danger)' : (isYellow ? '#FBC02D' : 'var(--sand-border)'));

            return (
              <div
                key={ticket.id}
                className="animate-fade-in"
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: 'var(--radius-lg)',
                  border: `3px solid ${borderColor}`,
                  boxShadow: isCancellation ? '0 4px 15px rgba(211,47,47,0.3)' : 'var(--shadow-md)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  overflow: 'hidden'
                }}
              >
                {/* Header card */}
                <div style={{
                  padding: '10px 14px',
                  backgroundColor: badgeBg,
                  borderBottom: `1px solid ${borderColor}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: isCancellation ? '#D32F2F' : 'var(--dark-text)' }}>
                      {isCancellation ? `🚨 CANCELACIÓN - Mesa ${ticket.tableNumber}` : `Mesa ${ticket.tableNumber}`}
                    </h3>
                    <span style={{ fontSize: '0.78rem', color: 'var(--dark-subdued)' }}>
                      Mesero: <strong>{ticket.waiterName || 'Mesero'}</strong>
                    </span>
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    backgroundColor: '#FFF',
                    padding: '4px 10px',
                    borderRadius: '12px',
                    border: `1px solid ${borderColor}`,
                    color: badgeColor,
                    fontWeight: 800,
                    fontSize: '0.85rem'
                  }}>
                    <Clock size={14} />
                    <span>{elapsed} min</span>
                  </div>
                </div>

                {/* Items */}
                <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                  {ticket.items.map((item, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleMarkItemDone(ticket.id, idx)}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: item.isDone ? '1px solid #C8E6C9' : '1px solid var(--sand-border)',
                        backgroundColor: item.isDone ? '#F1F8E9' : 'var(--sand-bg)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        textDecoration: item.isDone ? 'line-through' : 'none',
                        opacity: item.isDone ? 0.6 : 1
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>
                          {item.quantity}x {item.name}
                        </div>
                        {item.note && (
                          <div style={{ fontSize: '0.78rem', color: 'var(--terracotta)', fontWeight: 600, marginTop: '2px' }}>
                            📝 {item.note}
                          </div>
                        )}
                      </div>

                      <div style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        backgroundColor: item.isDone ? 'var(--success)' : '#FFF',
                        border: '1px solid var(--sand-border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: item.isDone ? '#FFF' : 'transparent'
                      }}>
                        <CheckCircle size={16} />
                      </div>
                    </div>
                  ))}

                  {ticket.notes && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--terracotta)', fontStyle: 'italic', marginTop: '4px' }}>
                      Nota mesa: {ticket.notes}
                    </div>
                  )}
                </div>

                {/* Action button */}
                <div style={{ padding: '10px 14px', backgroundColor: 'var(--sand-muted)', borderTop: '1px solid var(--sand-border)' }}>
                  <button
                    onClick={() => handleCompleteTicket(ticket.id)}
                    style={{
                      width: '100%',
                      backgroundColor: 'var(--terracotta)',
                      color: '#FFF',
                      border: 'none',
                      padding: '10px',
                      borderRadius: '8px',
                      fontWeight: 800,
                      fontSize: '0.88rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <CheckCircle size={18} />
                    <span>¡PLATILLOS LISTOS!</span>
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}

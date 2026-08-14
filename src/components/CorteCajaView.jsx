import React, { useState } from 'react';
import { Landmark, DollarSign, CreditCard, ArrowRight, CheckCircle, AlertTriangle, Printer, Clock, FileText } from 'lucide-react';

export default function CorteCajaView({
  currentShift,
  shiftHistory,
  onOpenShift,
  onCloseShift,
  onNavigateToPOS,
  onNavigateToTables
}) {
  const [initialCashInput, setInitialCashInput] = useState(1000);
  const [cashierNameInput, setCashierNameInput] = useState('Cajero Principal');

  const [actualCashInput, setActualCashInput] = useState('');
  const [shiftNotes, setShiftNotes] = useState('');
  const [selectedPastShift, setSelectedPastShift] = useState(null);
  const [actionSuccessMessage, setActionSuccessMessage] = useState('');

  const handleOpenShiftSubmit = (e) => {
    e.preventDefault();
    const cashVal = parseFloat(initialCashInput);
    if (isNaN(cashVal) || cashVal < 0) {
      alert('Por favor ingresa un fondo inicial válido (monto mayor o igual a 0).');
      return;
    }
    onOpenShift(cashVal, cashierNameInput);
    if (onNavigateToPOS) {
      onNavigateToPOS();
    }
  };

  const handleCloseShiftSubmit = (e) => {
    e.preventDefault();
    if (actualCashInput === '' || isNaN(parseFloat(actualCashInput))) {
      alert('Ingresa la cantidad física de efectivo contada en la caja.');
      return;
    }
    if (!confirm('¿Estás seguro de realizar el arqueo y cerrar el turno de caja actual?')) {
      return;
    }
    const closed = onCloseShift(parseFloat(actualCashInput), shiftNotes);
    if (closed) {
      setSelectedPastShift(closed);
      setActualCashInput('');
      setShiftNotes('');
      setActionSuccessMessage('✓ Turno cerrado y guardado en el historial con éxito.');
      setTimeout(() => setActionSuccessMessage(''), 5000);
    }
  };

  const expectedCashInDrawer = currentShift ? ((Number(currentShift.initialCash) || 0) + (Number(currentShift.totalCash) || 0)) : 0;
  const actualCashNum = Number(actualCashInput) || 0;
  const discrepancy = actualCashInput !== '' ? actualCashNum - expectedCashInDrawer : 0;

  return (
    <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', flex: 1, width: '100%', minWidth: 0, overflowX: 'hidden' }}>
      
      {actionSuccessMessage && (
        <div style={{
          backgroundColor: 'var(--success-bg)',
          color: 'var(--success)',
          border: '1px solid #C8E6C9',
          padding: '12px 18px',
          borderRadius: '12px',
          fontWeight: 800,
          fontSize: '0.95rem',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <CheckCircle size={20} />
          <span>{actionSuccessMessage}</span>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--terracotta)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            CONTROL FINANCIERO Y AUDITORÍA DE TURNO
          </span>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--dark-text)' }}>
            Corte de Caja & Arqueo de Efectivo
          </h1>
        </div>

        {currentShift && currentShift.isOpen && (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {onNavigateToPOS && (
              <button
                onClick={onNavigateToPOS}
                style={{
                  backgroundColor: 'var(--terracotta)',
                  color: '#FFF',
                  border: 'none',
                  padding: '10px 16px',
                  borderRadius: '10px',
                  fontSize: '0.9rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                <DollarSign size={18} />
                <span>Ir al Punto de Venta</span>
              </button>
            )}
            {onNavigateToTables && (
              <button
                onClick={onNavigateToTables}
                style={{
                  backgroundColor: 'var(--dark-green)',
                  color: '#FFF',
                  border: 'none',
                  padding: '10px 16px',
                  borderRadius: '10px',
                  fontSize: '0.9rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                <Landmark size={18} />
                <span>Ver Mesas</span>
              </button>
            )}
          </div>
        )}
      </div>

      {!currentShift || !currentShift.isOpen ? (
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-md)',
          border: '1px solid var(--sand-border)',
          padding: '2rem',
          maxWidth: '560px',
          alignSelf: 'center',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ backgroundColor: 'var(--sand-muted)', padding: '12px', borderRadius: '12px', color: 'var(--terracotta)' }}>
              <Landmark size={28} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Apertura de Caja (Nuevo Turno)</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--dark-subdued)' }}>
                Ingresa el fondo inicial asignado al cajero para comenzar a cobrar ventas.
              </p>
            </div>
          </div>

          <form onSubmit={handleOpenShiftSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                Nombre del Cajero / Responsable
              </label>
              <input
                type="text"
                value={cashierNameInput}
                onChange={(e) => setCashierNameInput(e.target.value)}
                required
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--sand-border)', fontSize: '0.95rem' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                Fondo Inicial en Efectivo ($ MXN)
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontWeight: 800, color: 'var(--terracotta)' }}>$</span>
                <input
                  type="number"
                  step="any"
                  value={initialCashInput}
                  onChange={(e) => setInitialCashInput(e.target.value)}
                  required
                  style={{ width: '100%', padding: '10px 10px 10px 30px', borderRadius: '8px', border: '1px solid var(--sand-border)', fontSize: '1.2rem', fontWeight: 800 }}
                />
              </div>
            </div>

            <button
              type="submit"
              style={{
                width: '100%',
                backgroundColor: 'var(--terracotta)',
                color: '#FFF',
                border: 'none',
                padding: '12px',
                borderRadius: '10px',
                fontSize: '1rem',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: 'var(--shadow-sm)',
                marginTop: '6px'
              }}
            >
              ABRIR CAJA E INICIAR TURNO
            </button>
          </form>
        </div>
      ) : (

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div style={{
            backgroundColor: 'var(--success-bg)',
            border: '1px solid #C8E6C9',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'var(--success)' }} className="animate-pulse-glow" />
              <div>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--success)', textTransform: 'uppercase' }}>
                  TURNO DE CAJA ACTIVO: #{currentShift.id}
                </span>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--dark-text)' }}>
                  Responsable: {currentShift.cashierName}
                </h3>
              </div>
            </div>

            <div style={{ fontSize: '0.85rem', color: 'var(--dark-subdued)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={16} />
              <span>Abierto el: {new Date(currentShift.openedAt).toLocaleString('es-MX')}</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            
            <div style={{ backgroundColor: '#FFF', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--sand-border)', boxShadow: 'var(--shadow-sm)' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--dark-subdued)' }}>Fondo Inicial</span>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--dark-text)', marginTop: '4px' }}>
                ${currentShift.initialCash.toFixed(2)}
              </h2>
            </div>

            <div style={{ backgroundColor: '#FFF', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--sand-border)', boxShadow: 'var(--shadow-sm)' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--dark-subdued)' }}>Ventas Efectivo</span>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--success)', marginTop: '4px' }}>
                +${(currentShift.totalCash || 0).toFixed(2)}
              </h2>
            </div>

            <div style={{ backgroundColor: '#FFF', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--sand-border)', boxShadow: 'var(--shadow-sm)' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--dark-subdued)' }}>Ventas Tarjeta</span>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--dark-text)', marginTop: '4px' }}>
                ${(currentShift.totalCard || 0).toFixed(2)}
              </h2>
            </div>

            <div style={{ backgroundColor: '#FFF', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--sand-border)', boxShadow: 'var(--shadow-sm)' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--dark-subdued)' }}>Ventas Transferencia</span>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--dark-text)', marginTop: '4px' }}>
                ${(currentShift.totalTransfer || 0).toFixed(2)}
              </h2>
            </div>

            <div style={{ backgroundColor: 'var(--sand-muted)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--terracotta)', boxShadow: 'var(--shadow-sm)' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--terracotta)' }}>Efectivo Esperado en Caja</span>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--terracotta)', marginTop: '4px' }}>
                ${expectedCashInDrawer.toFixed(2)}
              </h2>
            </div>

          </div>

          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-sm)',
            border: '1px solid var(--sand-border)',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem'
          }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Realizar Arqueo y Cierre de Turno</h2>

            <form onSubmit={handleCloseShiftSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                  Conteo de Efectivo Físico en Caja ($ MXN)
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontWeight: 800, fontSize: '1.2rem', color: 'var(--terracotta)' }}>$</span>
                  <input
                    type="number"
                    step="any"
                    placeholder="Ingresa el efectivo contado..."
                    value={actualCashInput}
                    onChange={(e) => setActualCashInput(e.target.value)}
                    required
                    style={{ width: '100%', padding: '10px 10px 10px 30px', borderRadius: '8px', border: '1px solid var(--sand-border)', fontSize: '1.2rem', fontWeight: 800 }}
                  />
                </div>

                {actualCashInput !== '' && (
                  <div style={{
                    marginTop: '10px',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    backgroundColor: discrepancy === 0 ? 'var(--success-bg)' : discrepancy > 0 ? 'var(--warning-bg)' : 'var(--danger-bg)',
                    color: discrepancy === 0 ? 'var(--success)' : discrepancy > 0 ? 'var(--warning)' : 'var(--danger)',
                    fontWeight: 700,
                    fontSize: '0.9rem'
                  }}>
                    {discrepancy === 0 ? (
                      <span>✓ Conteo exacto: Caja balanceada sin faltantes ni sobrantes.</span>
                    ) : discrepancy > 0 ? (
                      <span>🟢 Sobrante de efectivo: +${discrepancy.toFixed(2)}</span>
                    ) : (
                      <span>🔴 FALTANTE DE EFECTIVO: -${Math.abs(discrepancy).toFixed(2)}</span>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                  Notas u Observaciones del Cierre
                </label>
                <textarea
                  placeholder="Ej: Cambio entregado en billetes de $50, se retiraron $2,000 para depósito..."
                  value={shiftNotes}
                  onChange={(e) => setShiftNotes(e.target.value)}
                  rows={3}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--sand-border)', fontSize: '0.9rem' }}
                />

                <button
                  type="submit"
                  style={{
                    width: '100%',
                    backgroundColor: 'var(--dark-green)',
                    color: '#FFF',
                    border: 'none',
                    padding: '12px',
                    borderRadius: '8px',
                    fontSize: '0.95rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    marginTop: '10px'
                  }}
                >
                  FINALIZAR Y CERRAR CORTE DE CAJA
                </button>
              </div>
            </form>
          </div>

        </div>
      )}

      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-sm)',
        border: '1px solid var(--sand-border)',
        padding: '1.5rem',
        marginTop: '1rem'
      }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1rem' }}>Historial de Cortes de Caja</h2>

        {shiftHistory.length === 0 ? (
          <p style={{ color: 'var(--dark-subdued)', fontSize: '0.9rem', fontStyle: 'italic' }}>
            No hay cortes de caja anteriores registrados.
          </p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--sand-muted)', borderBottom: '1px solid var(--sand-border)' }}>
                <th style={{ padding: '10px 12px' }}>ID Turno</th>
                <th style={{ padding: '10px 12px' }}>Cajeros</th>
                <th style={{ padding: '10px 12px' }}>Apertura / Cierre</th>
                <th style={{ padding: '10px 12px' }}>Ventas Totales</th>
                <th style={{ padding: '10px 12px' }}>Efectivo Esperado</th>
                <th style={{ padding: '10px 12px' }}>Efectivo Físico</th>
                <th style={{ padding: '10px 12px' }}>Diferencia</th>
                <th style={{ padding: '10px 12px', textAlign: 'right' }}>Reporte</th>
              </tr>
            </thead>
            <tbody>
              {shiftHistory.map(shift => (
                <tr key={shift.id} style={{ borderBottom: '1px solid var(--sand-border)' }}>
                  <td style={{ padding: '10px 12px', fontWeight: 700 }}>#{shift.id}</td>
                  <td style={{ padding: '10px 12px' }}>{shift.cashierName}</td>
                  <td style={{ padding: '10px 12px', fontSize: '0.8rem', color: 'var(--dark-subdued)' }}>
                    {new Date(shift.openedAt).toLocaleDateString('es-MX')}
                  </td>
                  <td style={{ padding: '10px 12px', fontWeight: 700 }}>${(shift.totalRevenue || 0).toFixed(2)}</td>
                  <td style={{ padding: '10px 12px' }}>${shift.expectedCash.toFixed(2)}</td>
                  <td style={{ padding: '10px 12px' }}>${shift.actualPhysicalCash.toFixed(2)}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{
                      fontWeight: 800,
                      color: shift.discrepancy === 0 ? 'var(--success)' : shift.discrepancy > 0 ? 'var(--warning)' : 'var(--danger)'
                    }}>
                      {shift.discrepancy === 0 ? '$0.00' : (shift.discrepancy > 0 ? `+$${shift.discrepancy.toFixed(2)}` : `-$${Math.abs(shift.discrepancy).toFixed(2)}`)}
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                    <button
                      onClick={() => setSelectedPastShift(shift)}
                      style={{
                        backgroundColor: 'var(--sand-muted)',
                        border: '1px solid var(--sand-border)',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '0.78rem'
                      }}
                    >
                      <FileText size={14} /> Reporte
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selectedPastShift && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.5)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{ backgroundColor: '#FFF', padding: '1.5rem', borderRadius: 'var(--radius-md)', width: '420px', boxShadow: 'var(--shadow-lg)' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '4px' }}>Reporte de Corte de Caja #{selectedPastShift.id}</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--dark-subdued)', marginBottom: '1rem' }}>
              Responsable: {selectedPastShift.cashierName} | Cierre: {new Date(selectedPastShift.closedAt).toLocaleString('es-MX')}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.9rem', borderTop: '1px solid var(--sand-border)', borderBottom: '1px solid var(--sand-border)', padding: '10px 0', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Fondo Inicial:</span>
                <span>${selectedPastShift.initialCash.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Ventas Efectivo:</span>
                <span>+${(selectedPastShift.totalCash || 0).toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Ventas Tarjeta:</span>
                <span>${(selectedPastShift.totalCard || 0).toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Ventas Transferencia:</span>
                <span>${(selectedPastShift.totalTransfer || 0).toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, borderTop: '1px dashed var(--sand-border)', paddingTop: '4px' }}>
                <span>Efectivo Esperado:</span>
                <span>${selectedPastShift.expectedCash.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800 }}>
                <span>Efectivo Físico Contado:</span>
                <span>${selectedPastShift.actualPhysicalCash.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, color: selectedPastShift.discrepancy === 0 ? 'var(--success)' : 'var(--danger)' }}>
                <span>Diferencia (Sobrante/Faltante):</span>
                <span>${selectedPastShift.discrepancy.toFixed(2)}</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button onClick={() => setSelectedPastShift(null)} style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid var(--sand-border)' }}>Cerrar</button>
              <button onClick={() => window.print()} style={{ padding: '8px 14px', borderRadius: '8px', border: 'none', background: 'var(--terracotta)', color: '#FFF', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Printer size={16} /> Imprimir
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

import React, { useState } from 'react';
import { Printer, X, Check, RefreshCw } from 'lucide-react';

export default function PrinterSettingsModal({
  settings,
  onSave,
  onClose
}) {
  const [formState, setFormState] = useState({ ...settings });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formState);
    onClose();
  };

  const handleTestPrint = () => {
    alert('Realizando prueba de impresión. Si la impresora térmica está conectada, se abrirá la ventana de impresión.');
    window.print();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(0,0,0,0.5)',
      zIndex: 110,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem'
    }}>
      <form onSubmit={handleSubmit} className="animate-fade-in" style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 'var(--radius-lg)',
        width: '480px',
        maxWidth: '100%',
        boxShadow: 'var(--shadow-lg)',
        border: '1px solid var(--sand-border)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--sand-border)',
          backgroundColor: 'var(--sand-muted)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTopLeftRadius: 'var(--radius-lg)',
          borderTopRightRadius: 'var(--radius-lg)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Printer size={22} color="var(--terracotta)" />
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Configurar Impresora Térmica</h2>
          </div>
          <button type="button" onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
              Ancho de Papel Térmico
            </label>
            <div style={{ display: 'flex', gap: '10px' }}>
              {['58mm', '80mm'].map(width => (
                <button
                  key={width}
                  type="button"
                  onClick={() => setFormState({ ...formState, paperWidth: width })}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '8px',
                    border: formState.paperWidth === width ? '2px solid var(--terracotta)' : '1px solid var(--sand-border)',
                    backgroundColor: formState.paperWidth === width ? 'var(--sand-muted)' : '#FFF',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    cursor: 'pointer'
                  }}
                >
                  {width} ({width === '80mm' ? 'Estándar Restaurante' : 'Mini Impresora'})
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
              Nombre del Negocio en Ticket
            </label>
            <input
              type="text"
              value={formState.businessName}
              onChange={(e) => setFormState({ ...formState, businessName: e.target.value })}
              style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--sand-border)' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Teléfono</label>
              <input
                type="text"
                value={formState.phone}
                onChange={(e) => setFormState({ ...formState, phone: e.target.value })}
                style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--sand-border)' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>RFC</label>
              <input
                type="text"
                value={formState.rfc}
                onChange={(e) => setFormState({ ...formState, rfc: e.target.value })}
                style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--sand-border)' }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Dirección</label>
            <input
              type="text"
              value={formState.address}
              onChange={(e) => setFormState({ ...formState, address: e.target.value })}
              style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--sand-border)' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
              Mensaje al Pie del Ticket
            </label>
            <textarea
              value={formState.footerMessage}
              onChange={(e) => setFormState({ ...formState, footerMessage: e.target.value })}
              rows={2}
              style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--sand-border)', fontSize: '0.85rem' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'var(--sand-bg)', padding: '10px 14px', borderRadius: '8px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Impresión de prueba</span>
            <button
              type="button"
              onClick={handleTestPrint}
              style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--sand-border)', backgroundColor: '#FFF', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem' }}
            >
              Probar Impresión
            </button>
          </div>
        </div>

        <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--sand-border)', backgroundColor: 'var(--sand-muted)', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button type="button" onClick={onClose} style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid var(--sand-border)', background: '#FFF' }}>Cancelar</button>
          <button type="submit" style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: 'var(--terracotta)', color: '#FFF', fontWeight: 700 }}>Guardar Configuración</button>
        </div>
      </form>
    </div>
  );
}

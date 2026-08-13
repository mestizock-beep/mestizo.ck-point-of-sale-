import React from 'react';
import { AlertTriangle, X, ArrowRight } from 'lucide-react';

export default function LowStockModal({
  products,
  onClose,
  onGoToInventory
}) {
  const lowStockInsumos = products.filter(p => p.stock <= p.minStock);

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
      <div className="animate-fade-in" style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 'var(--radius-lg)',
        width: '520px',
        maxWidth: '100%',
        boxShadow: 'var(--shadow-lg)',
        border: '1px solid var(--sand-border)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--sand-border)',
          backgroundColor: 'var(--warning-bg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTopLeftRadius: 'var(--radius-lg)',
          borderTopRightRadius: 'var(--radius-lg)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--warning)' }}>
            <AlertTriangle size={24} />
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Aviso de Insumos por Agotarse</h2>
          </div>
          <button type="button" onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.85rem', maxHeight: '60vh', overflowY: 'auto' }}>
          {lowStockInsumos.map(ins => {
            const isOut = ins.stock <= 0;
            return (
              <div
                key={ins.id}
                style={{
                  backgroundColor: 'var(--sand-bg)',
                  borderRadius: '10px',
                  padding: '12px 14px',
                  border: '1px solid var(--sand-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--dark-text)' }}>{ins.name}</h4>
                  <span style={{ fontSize: '0.78rem', color: 'var(--dark-subdued)' }}>
                    Unidad de medida: {ins.unit}
                  </span>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span style={{
                    fontSize: '0.85rem',
                    fontWeight: 800,
                    color: isOut ? 'var(--danger)' : 'var(--warning)',
                    display: 'block'
                  }}>
                    {isOut ? `🔴 AGOTADO (0 ${ins.unit}s)` : `⚠️ Stock: ${ins.stock} ${ins.unit}s`}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--dark-subdued)' }}>Stock mín: {ins.minStock} {ins.unit}s</span>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{
          padding: '1rem 1.5rem',
          borderTop: '1px solid var(--sand-border)',
          backgroundColor: 'var(--sand-muted)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottomLeftRadius: 'var(--radius-lg)',
          borderBottomRightRadius: 'var(--radius-lg)'
        }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--dark-subdued)' }}>
            El inventario se descuenta por receta al cobrar.
          </span>
          <button
            onClick={() => {
              onClose();
              onGoToInventory();
            }}
            style={{
              padding: '10px 16px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: 'var(--terracotta)',
              color: '#FFF',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            Ir a Surtir Insumos <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { ShoppingBag, Package, Landmark, Printer, AlertTriangle, UserCheck } from 'lucide-react';
import Logo from './Logo';

export default function Header({
  activeTab,
  setActiveTab,
  currentShift,
  lowStockCount,
  onOpenPrinterSettings,
  onOpenLowStockModal
}) {
  return (
    <header
      style={{
        backgroundColor: '#FFFFFF',
        borderBottom: '1px solid var(--sand-border)',
        padding: '0.75rem 1.5rem',
        boxShadow: 'var(--shadow-sm)',
        position: 'sticky',
        top: 0,
        zIndex: 40,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}
    >
      {/* Brand & Emblem */}
      <div style={{ cursor: 'pointer' }} onClick={() => setActiveTab('pos')}>
        <Logo size="sm" variant="terracotta" />
      </div>

      {/* Main Navigation Tabs */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--sand-muted)', padding: '4px', borderRadius: '12px' }}>
        <button
          onClick={() => setActiveTab('pos')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            borderRadius: '9px',
            border: 'none',
            fontSize: '0.9rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            backgroundColor: activeTab === 'pos' ? 'var(--terracotta)' : 'transparent',
            color: activeTab === 'pos' ? '#FFFFFF' : 'var(--dark-subdued)',
            boxShadow: activeTab === 'pos' ? 'var(--shadow-sm)' : 'none'
          }}
        >
          <ShoppingBag size={18} />
          Punto de Venta
        </button>

        <button
          onClick={() => setActiveTab('inventory')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            borderRadius: '9px',
            border: 'none',
            fontSize: '0.9rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            backgroundColor: activeTab === 'inventory' ? 'var(--terracotta)' : 'transparent',
            color: activeTab === 'inventory' ? '#FFFFFF' : 'var(--dark-subdued)',
            boxShadow: activeTab === 'inventory' ? 'var(--shadow-sm)' : 'none'
          }}
        >
          <Package size={18} />
          Inventario
          {lowStockCount > 0 && (
            <span
              style={{
                backgroundColor: 'var(--danger)',
                color: '#FFF',
                fontSize: '0.75rem',
                padding: '2px 7px',
                borderRadius: '10px',
                fontWeight: 700
              }}
            >
              {lowStockCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('corte')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            borderRadius: '9px',
            border: 'none',
            fontSize: '0.9rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            backgroundColor: activeTab === 'corte' ? 'var(--terracotta)' : 'transparent',
            color: activeTab === 'corte' ? '#FFFFFF' : 'var(--dark-subdued)',
            boxShadow: activeTab === 'corte' ? 'var(--shadow-sm)' : 'none'
          }}
        >
          <Landmark size={18} />
          Corte de Caja
        </button>
      </nav>

      {/* Right Controls & Status Indicators */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {lowStockCount > 0 && (
          <button
            onClick={onOpenLowStockModal}
            className="animate-pulse-glow"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'var(--warning-bg)',
              color: 'var(--warning)',
              border: '1px solid #FFD8A8',
              padding: '6px 12px',
              borderRadius: '20px',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            <AlertTriangle size={16} />
            <span>{lowStockCount} por agotarse</span>
          </button>
        )}

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: currentShift && currentShift.isOpen ? 'var(--success-bg)' : 'var(--danger-bg)',
            color: currentShift && currentShift.isOpen ? 'var(--success)' : 'var(--danger)',
            padding: '6px 14px',
            borderRadius: '20px',
            fontSize: '0.82rem',
            fontWeight: 700,
            border: `1px solid ${currentShift && currentShift.isOpen ? '#C8E6C9' : '#FFCDD2'}`
          }}
        >
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: currentShift && currentShift.isOpen ? 'var(--success)' : 'var(--danger)'
            }}
          />
          {currentShift && currentShift.isOpen ? (
            <span>Caja Abierta (${currentShift.initialCash.toFixed(0)})</span>
          ) : (
            <span>Caja Cerrada</span>
          )}
        </div>

        <button
          onClick={onOpenPrinterSettings}
          title="Configuración de Impresora Térmica"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            border: '1px solid var(--sand-border)',
            backgroundColor: 'var(--sand-muted)',
            color: 'var(--dark-subdued)',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          <Printer size={20} />
        </button>
      </div>
    </header>
  );
}

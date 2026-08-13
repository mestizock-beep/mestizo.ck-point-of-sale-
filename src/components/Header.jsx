import React from 'react';
import { ShoppingBag, Package, Landmark, Printer, AlertTriangle, UserCheck, LogOut, Settings, Utensils, Flame, Wine, BarChart3 } from 'lucide-react';
import Logo from './Logo';

export default function Header({
  activeTab,
  setActiveTab,
  currentShift,
  lowStockCount,
  onOpenPrinterSettings,
  onOpenLowStockModal,
  currentUser,
  onLogout,
  onOpenSettings
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
      <nav style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.35rem',
        backgroundColor: 'var(--sand-muted)',
        padding: '4px',
        borderRadius: '12px',
        overflowX: 'auto',
        maxWidth: '100%'
      }} className="no-scrollbar">
        <button
          onClick={() => setActiveTab('pos')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 14px',
            borderRadius: '9px',
            border: 'none',
            fontSize: '0.88rem',
            fontWeight: 600,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            transition: 'all 0.2s ease',
            backgroundColor: activeTab === 'pos' ? 'var(--terracotta)' : 'transparent',
            color: activeTab === 'pos' ? '#FFFFFF' : 'var(--dark-subdued)',
            boxShadow: activeTab === 'pos' ? 'var(--shadow-sm)' : 'none'
          }}
        >
          <ShoppingBag size={18} />
          <span>Venta Rápida</span>
        </button>

        <button
          onClick={() => setActiveTab('tables')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 14px',
            borderRadius: '9px',
            border: 'none',
            fontSize: '0.88rem',
            fontWeight: 600,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            transition: 'all 0.2s ease',
            backgroundColor: activeTab === 'tables' ? 'var(--terracotta)' : 'transparent',
            color: activeTab === 'tables' ? '#FFFFFF' : 'var(--dark-subdued)',
            boxShadow: activeTab === 'tables' ? 'var(--shadow-sm)' : 'none'
          }}
        >
          <Utensils size={18} />
          <span>Mesas (20)</span>
        </button>

        <button
          onClick={() => setActiveTab('kitchen')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 14px',
            borderRadius: '9px',
            border: 'none',
            fontSize: '0.88rem',
            fontWeight: 600,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            transition: 'all 0.2s ease',
            backgroundColor: activeTab === 'kitchen' ? 'var(--terracotta)' : 'transparent',
            color: activeTab === 'kitchen' ? '#FFFFFF' : 'var(--dark-subdued)',
            boxShadow: activeTab === 'kitchen' ? 'var(--shadow-sm)' : 'none'
          }}
        >
          <Flame size={18} />
          <span>Cocina KDS</span>
        </button>

        <button
          onClick={() => setActiveTab('bar')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 14px',
            borderRadius: '9px',
            border: 'none',
            fontSize: '0.88rem',
            fontWeight: 600,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            transition: 'all 0.2s ease',
            backgroundColor: activeTab === 'bar' ? 'var(--terracotta)' : 'transparent',
            color: activeTab === 'bar' ? '#FFFFFF' : 'var(--dark-subdued)',
            boxShadow: activeTab === 'bar' ? 'var(--shadow-sm)' : 'none'
          }}
        >
          <Wine size={18} />
          <span>Barra BDS</span>
        </button>

        <button
          onClick={() => setActiveTab('inventory')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 14px',
            borderRadius: '9px',
            border: 'none',
            fontSize: '0.88rem',
            fontWeight: 600,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            transition: 'all 0.2s ease',
            backgroundColor: activeTab === 'inventory' ? 'var(--terracotta)' : 'transparent',
            color: activeTab === 'inventory' ? '#FFFFFF' : 'var(--dark-subdued)',
            boxShadow: activeTab === 'inventory' ? 'var(--shadow-sm)' : 'none'
          }}
        >
          <Package size={18} />
          <span>Inventario</span>
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
            gap: '6px',
            padding: '8px 14px',
            borderRadius: '9px',
            border: 'none',
            fontSize: '0.88rem',
            fontWeight: 600,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            transition: 'all 0.2s ease',
            backgroundColor: activeTab === 'corte' ? 'var(--terracotta)' : 'transparent',
            color: activeTab === 'corte' ? '#FFFFFF' : 'var(--dark-subdued)',
            boxShadow: activeTab === 'corte' ? 'var(--shadow-sm)' : 'none'
          }}
        >
          <Landmark size={18} />
          <span>Corte de Caja</span>
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 14px',
            borderRadius: '9px',
            border: 'none',
            fontSize: '0.88rem',
            fontWeight: 600,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            transition: 'all 0.2s ease',
            backgroundColor: activeTab === 'reports' ? 'var(--terracotta)' : 'transparent',
            color: activeTab === 'reports' ? '#FFFFFF' : 'var(--dark-subdued)',
            boxShadow: activeTab === 'reports' ? 'var(--shadow-sm)' : 'none'
          }}
        >
          <BarChart3 size={18} />
          <span>Reportes & Analytics</span>
        </button>
      </nav>

      {/* Right Controls & Status Indicators */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
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
            <span>Caja Abierta por {currentShift.cashierName || 'Usiel'} (${currentShift.initialCash.toFixed(0)})</span>
          ) : (
            <span>Caja Cerrada</span>
          )}
        </div>

        {currentUser && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: 'var(--sand-muted)',
            padding: '6px 12px',
            borderRadius: '20px',
            fontSize: '0.82rem',
            fontWeight: 700,
            color: 'var(--terracotta)',
            border: '1px solid var(--sand-border)'
          }}>
            <UserCheck size={16} />
            <span>{currentUser.fullName || currentUser.email}</span>
            <span style={{
              backgroundColor: currentUser.role === 'admin' ? 'var(--terracotta)' : 'var(--dark-subdued)',
              color: '#FFF',
              fontSize: '0.68rem',
              padding: '1px 6px',
              borderRadius: '8px',
              marginLeft: '4px',
              textTransform: 'uppercase'
            }}>
              {currentUser.role || 'Cajero'}
            </span>
          </div>
        )}

        {onOpenSettings && (
          <button
            onClick={onOpenSettings}
            title="Ajustes y Cambiar Contraseña"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 12px',
              borderRadius: '10px',
              border: '1px solid var(--sand-border)',
              backgroundColor: 'var(--sand-muted)',
              color: 'var(--dark-text)',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <Settings size={18} color="var(--terracotta)" />
            <span>Ajustes</span>
          </button>
        )}

        {onLogout && (
          <button
            onClick={onLogout}
            title="Cerrar Sesión Segura"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '10px',
              border: '1px solid #FFCDD2',
              backgroundColor: 'var(--danger-bg)',
              color: 'var(--danger)',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <LogOut size={18} />
            <span>Cerrar Sesión</span>
          </button>
        )}
      </div>
    </header>
  );
}

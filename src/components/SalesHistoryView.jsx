import React, { useState, useMemo } from 'react';
import { 
  Receipt, 
  Search, 
  Calendar, 
  DollarSign, 
  CreditCard, 
  ArrowRight, 
  Utensils, 
  User, 
  Printer, 
  Download, 
  Filter, 
  Clock, 
  ShoppingBag, 
  CheckCircle2, 
  ChevronRight,
  TrendingUp,
  FileText,
  X
} from 'lucide-react';

export default function SalesHistoryView({
  sales = [],
  onSelectSaleForTicket,
  onNavigateToPOS,
  onNavigateToTables
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [period, setPeriod] = useState('today'); // 'today' | 'yesterday' | 'week' | 'month' | 'all'
  const [paymentFilter, setPaymentFilter] = useState('all'); // 'all' | 'Efectivo' | 'Tarjeta' | 'Transferencia'
  const [typeFilter, setTypeFilter] = useState('all'); // 'all' | 'table' | 'takeout'

  // Filter sales based on period, search query, payment method and type
  const filteredSales = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfYesterday = startOfToday - (24 * 60 * 60 * 1000);
    const startOfWeek = startOfToday - (7 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    return sales.filter(sale => {
      const saleTime = new Date(sale.timestamp || sale.createdAt || Date.now()).getTime();

      // Period filter
      if (period === 'today' && saleTime < startOfToday) return false;
      if (period === 'yesterday' && (saleTime < startOfYesterday || saleTime >= startOfToday)) return false;
      if (period === 'week' && saleTime < startOfWeek) return false;
      if (period === 'month' && saleTime < startOfMonth) return false;

      // Payment method filter
      if (paymentFilter !== 'all' && sale.paymentMethod !== paymentFilter) return false;

      // Type filter (Table vs Takeout/General)
      if (typeFilter === 'table' && !sale.tableNumber) return false;
      if (typeFilter === 'takeout' && sale.tableNumber) return false;

      // Search query filter (matches ID, customerName, waiterName, or items)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const idMatch = (sale.id || '').toLowerCase().includes(q);
        const customerMatch = (sale.customerName || '').toLowerCase().includes(q);
        const waiterMatch = (sale.waiterName || '').toLowerCase().includes(q);
        const tableMatch = sale.tableNumber ? `mesa ${sale.tableNumber}`.includes(q) : false;
        const itemMatch = Array.isArray(sale.items) && sale.items.some(i => (i.name || '').toLowerCase().includes(q));

        if (!idMatch && !customerMatch && !waiterMatch && !tableMatch && !itemMatch) {
          return false;
        }
      }

      return true;
    });
  }, [sales, period, paymentFilter, typeFilter, searchQuery]);

  // Financial calculations
  const totalRevenue = filteredSales.reduce((sum, s) => sum + (Number(s.total) || 0), 0);
  const totalTickets = filteredSales.length;
  const averageTicket = totalTickets > 0 ? totalRevenue / totalTickets : 0;

  const cashTotal = filteredSales.filter(s => s.paymentMethod === 'Efectivo').reduce((sum, s) => sum + (Number(s.total) || 0), 0);
  const cardTotal = filteredSales.filter(s => s.paymentMethod === 'Tarjeta').reduce((sum, s) => sum + (Number(s.total) || 0), 0);
  const transferTotal = filteredSales.filter(s => s.paymentMethod === 'Transferencia').reduce((sum, s) => sum + (Number(s.total) || 0), 0);

  const totalItemsSold = filteredSales.reduce((sum, sale) => {
    if (Array.isArray(sale.items)) {
      return sum + sale.items.reduce((iSum, i) => iSum + (Number(i.quantity) || 1), 0);
    }
    return sum + 1;
  }, 0);

  // Export to CSV
  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Folio,Fecha,Hora,Tipo/Mesa,Mesero/Cajero,Metodo de Pago,Subtotal,Descuento,Propina,Total,Detalle Platillos\n";

    filteredSales.forEach(s => {
      const d = new Date(s.timestamp || Date.now());
      const fecha = d.toLocaleDateString('es-MX');
      const hora = d.toLocaleTimeString('es-MX');
      const tipo = s.tableNumber ? `Mesa #${s.tableNumber}` : 'Venta Mostrador';
      const responsable = s.waiterName || s.customerName || 'Personal General';
      const itemsStr = Array.isArray(s.items) ? s.items.map(i => `${i.quantity}x ${i.name}`).join(' | ') : '';

      csvContent += `"${s.id}","${fecha}","${hora}","${tipo}","${responsable}","${s.paymentMethod || 'Efectivo'}",${s.subtotal || 0},${s.discountAmount || 0},${s.tipAmount || 0},${s.total || 0},"${itemsStr}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Historial_Ventas_Mestizo_${period}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{
      padding: '1.25rem',
      maxWidth: '1400px',
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'column',
      gap: '1.25rem',
      width: '100%',
      boxSizing: 'border-box'
    }}>
      
      {/* Header Banner */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '16px',
        padding: '1.25rem 1.5rem',
        boxShadow: 'var(--shadow-sm)',
        border: '1px solid var(--sand-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--terracotta)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              REGISTRO Y CONSULTA DE TICKETS
            </span>
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--dark-text)', margin: '2px 0 0 0' }}>
            Historial de Ventas Realizadas
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--dark-subdued)', margin: '4px 0 0 0' }}>
            Todas las ventas registradas en caja, comandas de mesas y pagos cobrados en el sistema.
          </p>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={handleExportCSV}
            style={{
              padding: '9px 16px',
              borderRadius: '10px',
              border: '1px solid var(--sand-border)',
              backgroundColor: '#FFFFFF',
              color: 'var(--dark-text)',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <Download size={16} />
            <span>Descargar Excel / CSV</span>
          </button>

          {onNavigateToPOS && (
            <button
              onClick={onNavigateToPOS}
              style={{
                padding: '9px 16px',
                borderRadius: '10px',
                border: 'none',
                backgroundColor: 'var(--terracotta)',
                color: '#FFFFFF',
                fontWeight: 800,
                fontSize: '0.88rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 8px rgba(199, 91, 57, 0.25)'
              }}
            >
              <ShoppingBag size={16} />
              <span>+ Nueva Venta</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards Bar */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1rem'
      }}>
        
        {/* Card 1: Total Revenue */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          padding: '1.25rem',
          border: '1px solid var(--sand-border)',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--dark-subdued)', textTransform: 'uppercase' }}>
              Ventas Totales
            </span>
            <div style={{ backgroundColor: '#FFF0EA', color: 'var(--terracotta)', padding: '6px', borderRadius: '8px' }}>
              <TrendingUp size={18} />
            </div>
          </div>
          <div style={{ marginTop: '8px' }}>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--terracotta)' }}>
              ${totalRevenue.toFixed(2)}
            </div>
            <span style={{ fontSize: '0.78rem', color: 'var(--dark-subdued)', fontWeight: 600 }}>
              {totalTickets} tickets emitidos • {totalItemsSold} platillos
            </span>
          </div>
        </div>

        {/* Card 2: Cash Breakdown */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          padding: '1.25rem',
          border: '1px solid var(--sand-border)',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#2E7D32', textTransform: 'uppercase' }}>
              💵 En Efectivo
            </span>
            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#2E7D32', backgroundColor: '#E8F5E9', padding: '2px 8px', borderRadius: '6px' }}>
              {totalRevenue > 0 ? ((cashTotal / totalRevenue) * 100).toFixed(0) : 0}%
            </span>
          </div>
          <div style={{ marginTop: '8px' }}>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#2E7D32' }}>
              ${cashTotal.toFixed(2)}
            </div>
            <span style={{ fontSize: '0.78rem', color: 'var(--dark-subdued)', fontWeight: 600 }}>
              {filteredSales.filter(s => s.paymentMethod === 'Efectivo').length} transacciones
            </span>
          </div>
        </div>

        {/* Card 3: Card Breakdown */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          padding: '1.25rem',
          border: '1px solid var(--sand-border)',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#1565C0', textTransform: 'uppercase' }}>
              💳 Tarjetas Débito/Crédito
            </span>
            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#1565C0', backgroundColor: '#E3F2FD', padding: '2px 8px', borderRadius: '6px' }}>
              {totalRevenue > 0 ? ((cardTotal / totalRevenue) * 100).toFixed(0) : 0}%
            </span>
          </div>
          <div style={{ marginTop: '8px' }}>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#1565C0' }}>
              ${cardTotal.toFixed(2)}
            </div>
            <span style={{ fontSize: '0.78rem', color: 'var(--dark-subdued)', fontWeight: 600 }}>
              {filteredSales.filter(s => s.paymentMethod === 'Tarjeta').length} transacciones
            </span>
          </div>
        </div>

        {/* Card 4: Transfer / Average Ticket */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          padding: '1.25rem',
          border: '1px solid var(--sand-border)',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#6A1B9A', textTransform: 'uppercase' }}>
              📲 Transferencias / SPEI
            </span>
            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#6A1B9A', backgroundColor: '#F3E5F5', padding: '2px 8px', borderRadius: '6px' }}>
              {totalRevenue > 0 ? ((transferTotal / totalRevenue) * 100).toFixed(0) : 0}%
            </span>
          </div>
          <div style={{ marginTop: '8px' }}>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#6A1B9A' }}>
              ${transferTotal.toFixed(2)}
            </div>
            <span style={{ fontSize: '0.78rem', color: 'var(--dark-subdued)', fontWeight: 600 }}>
              Ticket Promedio: <strong>${averageTicket.toFixed(2)}</strong>
            </span>
          </div>
        </div>

      </div>

      {/* Filter and Search Bar */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '16px',
        padding: '1rem',
        border: '1px solid var(--sand-border)',
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.85rem'
      }}>
        
        {/* Top search and period row */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', justifyContent: 'space-between' }}>
          
          {/* Live search input */}
          <div style={{ position: 'relative', flex: '1 1 300px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--dark-subdued)' }} />
            <input
              type="text"
              placeholder="Buscar por folio (#MST-...), cliente, mesero o platillo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px 9px 36px',
                borderRadius: '10px',
                border: '1.5px solid var(--sand-border)',
                backgroundColor: 'var(--sand-bg)',
                fontSize: '0.88rem',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  border: 'none',
                  backgroundColor: 'transparent',
                  cursor: 'pointer',
                  color: 'var(--dark-subdued)'
                }}
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Period selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto' }} className="no-scrollbar">
            {[
              { key: 'today', label: 'Hoy' },
              { key: 'yesterday', label: 'Ayer' },
              { key: 'week', label: 'Últimos 7 Días' },
              { key: 'month', label: 'Este Mes' },
              { key: 'all', label: 'Todo el Historial' }
            ].map(p => {
              const isSelected = period === p.key;
              return (
                <button
                  key={p.key}
                  onClick={() => setPeriod(p.key)}
                  style={{
                    padding: '7px 12px',
                    borderRadius: '8px',
                    border: isSelected ? '2px solid var(--terracotta)' : '1px solid var(--sand-border)',
                    backgroundColor: isSelected ? 'var(--terracotta)' : '#FFFFFF',
                    color: isSelected ? '#FFFFFF' : 'var(--dark-text)',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {p.label}
                </button>
              );
            })}
          </div>

        </div>

        {/* Secondary filters: Payment method & Order type */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', borderTop: '1px solid var(--sand-border)', paddingTop: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 800, color: 'var(--dark-subdued)' }}>
            <Filter size={14} />
            <span>Método:</span>
          </div>

          {['all', 'Efectivo', 'Tarjeta', 'Transferencia'].map(m => (
            <button
              key={m}
              onClick={() => setPaymentFilter(m)}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                border: paymentFilter === m ? '1.5px solid var(--terracotta)' : '1px solid var(--sand-border)',
                backgroundColor: paymentFilter === m ? '#FFF0EA' : '#FFFFFF',
                color: paymentFilter === m ? 'var(--terracotta)' : 'var(--dark-text)',
                fontWeight: 700,
                fontSize: '0.78rem',
                cursor: 'pointer'
              }}
            >
              {m === 'all' ? 'Todos los métodos' : m}
            </button>
          ))}

          <div style={{ width: '1px', height: '20px', backgroundColor: 'var(--sand-border)', margin: '0 4px' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 800, color: 'var(--dark-subdued)' }}>
            <span>Tipo:</span>
          </div>

          {[
            { key: 'all', label: 'Todas las órdenes' },
            { key: 'table', label: 'Mesas (Salón)' },
            { key: 'takeout', label: 'Mostrador / Para Llevar' }
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTypeFilter(t.key)}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                border: typeFilter === t.key ? '1.5px solid var(--terracotta)' : '1px solid var(--sand-border)',
                backgroundColor: typeFilter === t.key ? '#FFF0EA' : '#FFFFFF',
                color: typeFilter === t.key ? 'var(--terracotta)' : 'var(--dark-text)',
                fontWeight: 700,
                fontSize: '0.78rem',
                cursor: 'pointer'
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

      </div>

      {/* Sales Tickets Table / Cards List */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '16px',
        border: '1px solid var(--sand-border)',
        boxShadow: 'var(--shadow-sm)',
        overflow: 'hidden'
      }}>
        {filteredSales.length === 0 ? (
          <div style={{
            padding: '3.5rem 1.5rem',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '10px',
            color: 'var(--dark-subdued)'
          }}>
            <Receipt size={48} color="var(--sand-border)" />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--dark-text)', margin: 0 }}>
              No se encontraron ventas para este filtro
            </h3>
            <p style={{ fontSize: '0.88rem', margin: 0, maxWidth: '400px' }}>
              Prueba cambiando el periodo de fecha o registrando una nueva venta desde el Punto de Venta o Mesas.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--sand-muted)', borderBottom: '1px solid var(--sand-border)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--dark-subdued)' }}>
                  <th style={{ padding: '12px 16px' }}>Folio Ticket</th>
                  <th style={{ padding: '12px 16px' }}>Fecha & Hora</th>
                  <th style={{ padding: '12px 16px' }}>Origen / Mesa</th>
                  <th style={{ padding: '12px 16px' }}>Mesero / Cliente</th>
                  <th style={{ padding: '12px 16px' }}>Platillos Vendidos</th>
                  <th style={{ padding: '12px 16px' }}>Método de Pago</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Total</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center' }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {filteredSales.map((sale, idx) => {
                  const saleDate = new Date(sale.timestamp || Date.now());
                  const formattedDate = saleDate.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' });
                  const formattedTime = saleDate.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });

                  const paymentBadgeColor = 
                    sale.paymentMethod === 'Efectivo' ? { bg: '#E8F5E9', text: '#2E7D32', border: '#C8E6C9' } :
                    sale.paymentMethod === 'Tarjeta' ? { bg: '#E3F2FD', text: '#1565C0', border: '#BBDEFB' } :
                    { bg: '#F3E5F5', text: '#6A1B9A', border: '#E1BEE7' };

                  return (
                    <tr
                      key={sale.id || idx}
                      style={{
                        borderBottom: '1px solid var(--sand-border)',
                        transition: 'background-color 0.15s ease',
                        cursor: 'pointer'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--sand-bg)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FFFFFF'}
                      onClick={() => onSelectSaleForTicket && onSelectSaleForTicket(sale)}
                    >
                      {/* Folio */}
                      <td style={{ padding: '12px 16px', fontWeight: 800, color: 'var(--terracotta)', fontSize: '0.9rem' }}>
                        <span style={{ backgroundColor: '#FFF0EA', padding: '3px 8px', borderRadius: '6px' }}>
                          #{sale.id}
                        </span>
                      </td>

                      {/* Date & Time */}
                      <td style={{ padding: '12px 16px', fontSize: '0.85rem' }}>
                        <div style={{ fontWeight: 700, color: 'var(--dark-text)' }}>{formattedDate}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--dark-subdued)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <Clock size={11} />
                          <span>{formattedTime}</span>
                        </div>
                      </td>

                      {/* Origen / Mesa */}
                      <td style={{ padding: '12px 16px' }}>
                        {sale.tableNumber ? (
                          <span style={{
                            backgroundColor: 'var(--terracotta)',
                            color: '#FFF',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '0.78rem',
                            fontWeight: 800
                          }}>
                            🍽️ MESA #{sale.tableNumber}
                          </span>
                        ) : (
                          <span style={{
                            backgroundColor: 'var(--sand-muted)',
                            color: 'var(--dark-text)',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '0.78rem',
                            fontWeight: 700
                          }}>
                            🛒 Mostrador
                          </span>
                        )}
                      </td>

                      {/* Mesero / Cliente */}
                      <td style={{ padding: '12px 16px', fontSize: '0.85rem' }}>
                        <div style={{ fontWeight: 700, color: 'var(--dark-text)' }}>
                          {sale.waiterName || sale.customerName || 'General'}
                        </div>
                        {sale.customerPhone && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--dark-subdued)' }}>
                            📱 {sale.customerPhone}
                          </div>
                        )}
                      </td>

                      {/* Platillos resumen */}
                      <td style={{ padding: '12px 16px', fontSize: '0.82rem', color: 'var(--dark-text)', maxWidth: '280px' }}>
                        {Array.isArray(sale.items) && sale.items.length > 0 ? (
                          <div>
                            <span style={{ fontWeight: 700 }}>
                              {sale.items.slice(0, 2).map(i => `${i.quantity}x ${i.name}`).join(', ')}
                            </span>
                            {sale.items.length > 2 && (
                              <span style={{ color: 'var(--dark-subdued)', fontSize: '0.75rem', marginLeft: '4px' }}>
                                +{sale.items.length - 2} más
                              </span>
                            )}
                          </div>
                        ) : (
                          <span style={{ fontStyle: 'italic', color: 'var(--dark-subdued)' }}>Consumo general</span>
                        )}
                      </td>

                      {/* Metodo de Pago */}
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          backgroundColor: paymentBadgeColor.bg,
                          color: paymentBadgeColor.text,
                          border: `1px solid ${paymentBadgeColor.border}`,
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '0.78rem',
                          fontWeight: 800,
                          display: 'inline-block'
                        }}>
                          {sale.paymentMethod || 'Efectivo'}
                        </span>
                      </td>

                      {/* Total */}
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 900, fontSize: '1.05rem', color: 'var(--dark-text)' }}>
                        ${(Number(sale.total) || 0).toFixed(2)}
                      </td>

                      {/* Accion */}
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onSelectSaleForTicket) onSelectSaleForTicket(sale);
                          }}
                          style={{
                            padding: '6px 10px',
                            borderRadius: '8px',
                            border: '1px solid var(--sand-border)',
                            backgroundColor: '#FFFFFF',
                            color: 'var(--dark-text)',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            boxShadow: 'var(--shadow-sm)'
                          }}
                        >
                          <Receipt size={14} color="var(--terracotta)" />
                          <span>Ver Ticket</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}

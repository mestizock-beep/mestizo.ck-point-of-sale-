import React, { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  ShoppingBag, 
  Award, 
  AlertTriangle, 
  Calendar, 
  Download, 
  Printer, 
  Users, 
  PieChart, 
  Clock, 
  ArrowUpRight, 
  ArrowDownRight,
  Filter,
  CheckCircle,
  PackageCheck
} from 'lucide-react';

export default function ReportsView({ salesHistory = [], shiftHistory = [], products = [], currentUser }) {
  const [period, setPeriod] = useState('this_month'); // 'this_month' | 'last_month' | 'last_30' | 'all'

  // Filter sales according to selected period
  const filterSalesByPeriod = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    return salesHistory.filter(sale => {
      const saleDate = new Date(sale.timestamp || sale.createdAt || sale.date || Date.now());
      const saleYear = saleDate.getFullYear();
      const saleMonth = saleDate.getMonth();

      if (period === 'this_month') {
        return saleYear === currentYear && saleMonth === currentMonth;
      } else if (period === 'last_month') {
        const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
        return saleYear === lastMonthYear && saleMonth === lastMonth;
      } else if (period === 'last_30') {
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return saleDate >= thirtyDaysAgo;
      }
      return true; // 'all'
    });
  };

  const filteredSales = filterSalesByPeriod();

  // 1. Executive Metrics
  const totalRevenue = filteredSales.reduce((sum, s) => sum + (Number(s.total) || 0), 0);
  const totalOrdersCount = filteredSales.length;
  const averageTicket = totalOrdersCount > 0 ? totalRevenue / totalOrdersCount : 0;

  // Total items sold count
  const totalItemsCount = filteredSales.reduce((sum, sale) => {
    if (sale.items && Array.isArray(sale.items)) {
      return sum + sale.items.reduce((iSum, item) => iSum + (Number(item.quantity) || 1), 0);
    }
    return sum + 1;
  }, 0);

  // Payment methods breakdown
  const cashSales = filteredSales.filter(s => s.paymentMethod === 'Efectivo').reduce((sum, s) => sum + Number(s.total || 0), 0);
  const cardSales = filteredSales.filter(s => s.paymentMethod === 'Tarjeta').reduce((sum, s) => sum + Number(s.total || 0), 0);
  const transferSales = filteredSales.filter(s => s.paymentMethod === 'Transferencia').reduce((sum, s) => sum + Number(s.total || 0), 0);

  // 2. Product Performance Analysis (Estudio de Campo - Mas y Menos Vendidos)
  const productStatsMap = {};

  // Initialize with all products so slow sellers with 0 sales show up correctly
  products.forEach(p => {
    productStatsMap[p.id] = {
      id: p.id,
      name: p.name,
      category: p.category || 'General',
      price: p.price,
      quantitySold: 0,
      revenue: 0,
      image: p.image
    };
  });

  filteredSales.forEach(sale => {
    if (sale.items && Array.isArray(sale.items)) {
      sale.items.forEach(item => {
        const pid = item.id;
        const qty = Number(item.quantity) || 1;
        const rev = (Number(item.price) || 0) * qty;

        if (productStatsMap[pid]) {
          productStatsMap[pid].quantitySold += qty;
          productStatsMap[pid].revenue += rev;
        } else {
          productStatsMap[pid] = {
            id: pid,
            name: item.name || 'Producto',
            category: item.category || 'General',
            price: Number(item.price) || 0,
            quantitySold: qty,
            revenue: rev,
            image: item.image
          };
        }
      });
    }
  });

  const allProductStats = Object.values(productStatsMap);

  // Top 5 Best Sellers (Platillos Estrella)
  const topSellers = [...allProductStats]
    .sort((a, b) => b.quantitySold - a.quantitySold)
    .filter(p => p.quantitySold > 0)
    .slice(0, 5);

  // Bottom 5 Slow Sellers (Platillos de Menor Salida / Evaluar Menú)
  const bottomSellers = [...allProductStats]
    .sort((a, b) => a.quantitySold - b.quantitySold)
    .slice(0, 5);

  // 3. Category Breakdown
  const categoryStatsMap = {};
  allProductStats.forEach(p => {
    const cat = p.category || 'General';
    if (!categoryStatsMap[cat]) {
      categoryStatsMap[cat] = { category: cat, revenue: 0, quantitySold: 0 };
    }
    categoryStatsMap[cat].revenue += p.revenue;
    categoryStatsMap[cat].quantitySold += p.quantitySold;
  });

  const categoryStats = Object.values(categoryStatsMap).sort((a, b) => b.revenue - a.revenue);

  // 4. Daily Revenue Trend (Pure SVG Dynamic Chart)
  const getDailySalesData = () => {
    const dailyMap = {};
    filteredSales.forEach(s => {
      const d = new Date(s.timestamp || s.createdAt || s.date || Date.now());
      const dateKey = `${d.getDate()}/${d.getMonth() + 1}`;
      if (!dailyMap[dateKey]) {
        dailyMap[dateKey] = 0;
      }
      dailyMap[dateKey] += Number(s.total) || 0;
    });

    const entries = Object.entries(dailyMap);
    if (entries.length === 0) return [];
    return entries.map(([date, revenue]) => ({ date, revenue }));
  };

  const dailySalesData = getDailySalesData();
  const maxDailyRevenue = Math.max(...dailySalesData.map(d => d.revenue), 100);

  // 5. Staff Cashier Sales Performance
  const staffSalesMap = {};
  filteredSales.forEach(s => {
    const cashier = s.cashierName || s.waiterName || 'Personal General';
    if (!staffSalesMap[cashier]) {
      staffSalesMap[cashier] = { cashier, count: 0, total: 0 };
    }
    staffSalesMap[cashier].count += 1;
    staffSalesMap[cashier].total += Number(s.total) || 0;
  });

  const staffStats = Object.values(staffSalesMap).sort((a, b) => b.total - a.total);

  // Print Executive Summary
  const handlePrintExecutiveReport = () => {
    window.print();
  };

  // Export CSV
  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Producto,Categoria,Precio,Unidades Vendidas,Ingreso Total\n";

    allProductStats.forEach(p => {
      csvContent += `"${p.name}","${p.category}",${p.price},${p.quantitySold},${p.revenue.toFixed(2)}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Reporte_Estudio_Campo_Mestizo_${period}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{
      padding: '1.25rem',
      maxWidth: '1350px',
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'column',
      gap: '1.25rem'
    }}>
      
      {/* Header & Period Selector */}
      <div style={{
        backgroundColor: '#FFF',
        borderRadius: 'var(--radius-lg)',
        padding: '1.25rem',
        boxShadow: 'var(--shadow-sm)',
        border: '1px solid var(--sand-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ backgroundColor: 'var(--terracotta)', color: '#FFF', padding: '8px', borderRadius: '10px' }}>
              <BarChart3 size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--dark-text)' }}>
                Estudio de Campo & Reporte de Ventas
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--dark-subdued)' }}>
                Análisis estratégico de productos más vendidos, platillos lentos e ingresos totales.
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          
          {/* Period selector dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'var(--sand-bg)', padding: '6px 12px', borderRadius: '10px', border: '1px solid var(--sand-border)' }}>
            <Calendar size={16} color="var(--terracotta)" />
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              style={{ border: 'none', background: 'none', fontWeight: 700, fontSize: '0.88rem', color: 'var(--dark-text)', cursor: 'pointer', outline: 'none' }}
            >
              <option value="this_month">Este Mes (Mes Actual)</option>
              <option value="last_month">Mes Anterior</option>
              <option value="last_30">Últimos 30 Días</option>
              <option value="all">Todo el Historial Registrado</option>
            </select>
          </div>

          <button
            onClick={handleExportCSV}
            style={{
              padding: '8px 14px',
              borderRadius: '9px',
              border: '1px solid var(--sand-border)',
              backgroundColor: '#FFF',
              color: 'var(--dark-text)',
              fontSize: '0.85rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}
          >
            <Download size={16} />
            <span>Exportar Excel/CSV</span>
          </button>

          <button
            onClick={handlePrintExecutiveReport}
            style={{
              padding: '8px 14px',
              borderRadius: '9px',
              border: 'none',
              backgroundColor: 'var(--terracotta)',
              color: '#FFF',
              fontSize: '0.85rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <Printer size={16} />
            <span>Imprimir Reporte</span>
          </button>
        </div>
      </div>

      {/* KPI Key Performance Indicator Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1rem'
      }}>
        
        {/* Card 1: Total Revenue */}
        <div style={{
          backgroundColor: '#FFF',
          padding: '1.25rem',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--sand-border)',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--dark-subdued)', textTransform: 'uppercase' }}>
              Ventas Totales
            </span>
            <div style={{ backgroundColor: '#E8F5E9', padding: '6px', borderRadius: '8px', color: 'var(--forest)' }}>
              <DollarSign size={18} />
            </div>
          </div>
          <div style={{ marginTop: '0.75rem' }}>
            <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--dark-text)' }}>
              ${totalRevenue.toFixed(2)}
            </h3>
            <span style={{ fontSize: '0.78rem', color: 'var(--success)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
              <ArrowUpRight size={14} /> Ingreso total del periodo
            </span>
          </div>
        </div>

        {/* Card 2: Total Orders & Ticket Promedio */}
        <div style={{
          backgroundColor: '#FFF',
          padding: '1.25rem',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--sand-border)',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--dark-subdued)', textTransform: 'uppercase' }}>
              Órdenes & Ticket Promedio
            </span>
            <div style={{ backgroundColor: '#FFF3E0', padding: '6px', borderRadius: '8px', color: 'var(--terracotta)' }}>
              <ShoppingBag size={18} />
            </div>
          </div>
          <div style={{ marginTop: '0.75rem' }}>
            <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--dark-text)' }}>
              {totalOrdersCount} <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--dark-subdued)' }}>órdenes</span>
            </h3>
            <span style={{ fontSize: '0.82rem', color: 'var(--terracotta)', fontWeight: 700, marginTop: '4px', display: 'block' }}>
              Ticket Promedio: ${averageTicket.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Card 3: Items Sold Count */}
        <div style={{
          backgroundColor: '#FFF',
          padding: '1.25rem',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--sand-border)',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--dark-subdued)', textTransform: 'uppercase' }}>
              Platillos / Bebidas Despachados
            </span>
            <div style={{ backgroundColor: '#E0F2F1', padding: '6px', borderRadius: '8px', color: '#00796B' }}>
              <PackageCheck size={18} />
            </div>
          </div>
          <div style={{ marginTop: '0.75rem' }}>
            <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--dark-text)' }}>
              {totalItemsCount} <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--dark-subdued)' }}>unidades</span>
            </h3>
            <span style={{ fontSize: '0.78rem', color: 'var(--dark-subdued)', fontWeight: 600, marginTop: '4px', display: 'block' }}>
              Volumen total de cocina y barra
            </span>
          </div>
        </div>

        {/* Card 4: Payment Methods Distribution */}
        <div style={{
          backgroundColor: '#FFF',
          padding: '1.25rem',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--sand-border)',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--dark-subdued)', textTransform: 'uppercase' }}>
              Métodos de Pago
            </span>
            <div style={{ backgroundColor: '#EDE7F6', padding: '6px', borderRadius: '8px', color: '#512DA8' }}>
              <PieChart size={18} />
            </div>
          </div>
          <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.8rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>💵 Efectivo:</span>
              <strong style={{ color: 'var(--forest)' }}>${cashSales.toFixed(2)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>💳 Tarjeta:</span>
              <strong style={{ color: 'var(--terracotta)' }}>${cardSales.toFixed(2)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>📲 Transferencia:</span>
              <strong style={{ color: '#1976D2' }}>${transferSales.toFixed(2)}</strong>
            </div>
          </div>
        </div>

      </div>

      {/* Main Section: Estudio de Campo (Platillos Estrella vs Platillos Lentos) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
        gap: '1.25rem'
      }}>
        
        {/* TOP 5 Platillos Estrella (Los más vendidos) */}
        <div style={{
          backgroundColor: '#FFF',
          borderRadius: 'var(--radius-lg)',
          padding: '1.25rem',
          border: '1px solid var(--sand-border)',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ backgroundColor: '#FFF3E0', padding: '8px', borderRadius: '10px', color: '#F57C00' }}>
              <Award size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--dark-text)' }}>
                ⭐ Top 5 Platillos Estrella (Más Vendidos)
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--dark-subdued)' }}>
                Los productos con mayor rotación e ingresos generados.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {topSellers.length === 0 ? (
              <p style={{ fontSize: '0.85rem', color: 'var(--dark-subdued)', fontStyle: 'italic', textAlign: 'center', padding: '1.5rem 0' }}>
                No hay suficientes ventas registradas en este periodo.
              </p>
            ) : (
              topSellers.map((prod, idx) => (
                <div
                  key={prod.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: '10px',
                    backgroundColor: 'var(--sand-bg)',
                    border: '1px solid var(--sand-border)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      backgroundColor: idx === 0 ? '#FFD700' : (idx === 1 ? '#C0C0C0' : (idx === 2 ? '#CD7F32' : 'var(--terracotta)')),
                      color: '#FFF',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      #{idx + 1}
                    </span>
                    <div>
                      <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--dark-text)' }}>{prod.name}</h4>
                      <span style={{ fontSize: '0.75rem', color: 'var(--dark-subdued)' }}>{prod.category}</span>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--terracotta)' }}>
                      ${prod.revenue.toFixed(2)}
                    </div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--forest)' }}>
                      {prod.quantitySold} pzas vendidas
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* TOP 5 Platillos Lentos (Los de menor salida / Evaluar menú) */}
        <div style={{
          backgroundColor: '#FFF',
          borderRadius: 'var(--radius-lg)',
          padding: '1.25rem',
          border: '1px solid var(--sand-border)',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ backgroundColor: '#FFEBEE', padding: '8px', borderRadius: '10px', color: 'var(--danger)' }}>
              <AlertTriangle size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--dark-text)' }}>
                🐢 Top 5 Menor Salida (Estudio de Campo)
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--dark-subdued)' }}>
                Productos con poca demanda para analizar promociones o retirar.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {bottomSellers.length === 0 ? (
              <p style={{ fontSize: '0.85rem', color: 'var(--dark-subdued)', fontStyle: 'italic', textAlign: 'center', padding: '1.5rem 0' }}>
                No hay productos en catálogo.
              </p>
            ) : (
              bottomSellers.map((prod, idx) => (
                <div
                  key={prod.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: '10px',
                    backgroundColor: '#FFF8F8',
                    border: '1px solid #FFCDD2'
                  }}
                >
                  <div>
                    <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--dark-text)' }}>{prod.name}</h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--dark-subdued)' }}>{prod.category} • ${prod.price.toFixed(2)} c/u</span>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 800, color: prod.quantitySold === 0 ? 'var(--danger)' : 'var(--dark-text)' }}>
                      {prod.quantitySold === 0 ? '⚠️ 0 ventas' : `${prod.quantitySold} pzas`}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--dark-subdued)' }}>
                      ${prod.revenue.toFixed(2)} ingresos
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Daily Revenue Trend Chart & Category Breakdown */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
        gap: '1.25rem'
      }}>
        
        {/* Daily Sales Bar Chart */}
        <div style={{
          backgroundColor: '#FFF',
          borderRadius: 'var(--radius-lg)',
          padding: '1.25rem',
          border: '1px solid var(--sand-border)',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={18} color="var(--terracotta)" />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--dark-text)' }}>
                Tendencia Diaria de Ingresos ($)
              </h3>
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--dark-subdued)' }}>
              Ventas diarias acumuladas
            </span>
          </div>

          {dailySalesData.length === 0 ? (
            <div style={{ padding: '2rem 0', textAlign: 'center', color: 'var(--dark-subdued)', fontStyle: 'italic', fontSize: '0.88rem' }}>
              No hay registro diario de ventas para este periodo.
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px', height: '180px', paddingTop: '20px', borderBottom: '1px solid var(--sand-border)', overflowX: 'auto' }}>
              {dailySalesData.map((d, i) => {
                const heightPercent = Math.max(12, (d.revenue / maxDailyRevenue) * 100);
                return (
                  <div key={i} style={{ flex: 1, minWidth: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--terracotta)', marginBottom: '4px' }}>
                      ${d.revenue.toFixed(0)}
                    </span>
                    <div
                      style={{
                        width: '100%',
                        maxHeight: `${heightPercent}%`,
                        height: `${heightPercent}%`,
                        backgroundColor: 'var(--terracotta)',
                        borderRadius: '6px 6px 0 0',
                        transition: 'height 0.3s ease'
                      }}
                      title={`Fecha: ${d.date} - Ingreso: $${d.revenue.toFixed(2)}`}
                    />
                    <span style={{ fontSize: '0.72rem', color: 'var(--dark-subdued)', marginTop: '6px', whiteSpace: 'nowrap', fontWeight: 600 }}>
                      {d.date}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Category Breakdown */}
        <div style={{
          backgroundColor: '#FFF',
          borderRadius: 'var(--radius-lg)',
          padding: '1.25rem',
          border: '1px solid var(--sand-border)',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PieChart size={18} color="var(--terracotta)" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--dark-text)' }}>
              Ventas por Categoría de Menú
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {categoryStats.map((cat, i) => {
              const catPercent = totalRevenue > 0 ? (cat.revenue / totalRevenue) * 100 : 0;
              return (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span style={{ fontWeight: 700, color: 'var(--dark-text)' }}>{cat.category}</span>
                    <span style={{ fontWeight: 800, color: 'var(--terracotta)' }}>
                      ${cat.revenue.toFixed(2)} ({catPercent.toFixed(1)}%)
                    </span>
                  </div>
                  <div style={{ height: '8px', backgroundColor: 'var(--sand-bg)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${catPercent}%`,
                        height: '100%',
                        backgroundColor: 'var(--terracotta)',
                        borderRadius: '4px',
                        transition: 'width 0.3s ease'
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Staff Cashier / Waiter Performance Breakdown */}
      <div style={{
        backgroundColor: '#FFF',
        borderRadius: 'var(--radius-lg)',
        padding: '1.25rem',
        border: '1px solid var(--sand-border)',
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ backgroundColor: '#E3F2FD', padding: '8px', borderRadius: '10px', color: '#1976D2' }}>
            <Users size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--dark-text)' }}>
              Rendimiento de Ventas por Personal
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--dark-subdued)' }}>
              Total cobrado y volumen de comandan por colaborador (Usiel Chi, Fer Segura, Kaleb, etc.)
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          {staffStats.length === 0 ? (
            <p style={{ fontSize: '0.85rem', color: 'var(--dark-subdued)', fontStyle: 'italic' }}>
              No hay datos registrados de personal.
            </p>
          ) : (
            staffStats.map((st, i) => (
              <div
                key={i}
                style={{
                  padding: '12px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--sand-bg)',
                  border: '1px solid var(--sand-border)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}
              >
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--dark-subdued)' }}>
                  👤 {st.cashier}
                </span>
                <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--terracotta)' }}>
                  ${st.total.toFixed(2)}
                </span>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--forest)' }}>
                  {st.count} ventas realizadas
                </span>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}

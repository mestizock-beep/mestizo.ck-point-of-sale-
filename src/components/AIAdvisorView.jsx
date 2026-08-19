import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  ShieldAlert, 
  ShoppingCart, 
  MessageSquare, 
  Send, 
  RefreshCw, 
  FileText, 
  DollarSign, 
  Package, 
  Award, 
  Clock, 
  Plus, 
  Check, 
  X, 
  Zap,
  Layers,
  ChevronRight,
  Printer,
  Sliders,
  Settings
} from 'lucide-react';
import { 
  analyzeBusinessHealth, 
  generateSuggestedPurchaseOrder, 
  getPurchaseOrders, 
  savePurchaseOrder, 
  deletePurchaseOrder, 
  applyPurchaseOrderStock,
  askMestizoAI,
  getGeminiApiKey
} from '../utils/aiEngine';

export default function AIAdvisorView({
  products = [],
  insumos = [],
  sales = [],
  shiftHistory = [],
  onNavigateToTab,
  onOpenSettings,
  onRefreshData
}) {
  const [activeSubtab, setActiveSubtab] = useState('dashboard'); // 'dashboard' | 'chat' | 'anomalies' | 'purchase_orders'
  const [healthData, setHealthData] = useState(() => analyzeBusinessHealth({ sales, insumos, products, shiftHistory }));
  const [purchaseOrders, setPurchaseOrders] = useState(() => getPurchaseOrders());
  
  // Chat state
  const [messages, setMessages] = useState([
    {
      id: 'msg-welcome',
      sender: 'ai',
      text: '👋 ¡Hola! Soy **Mestizo AI**, tu copiloto de inteligencia de negocio y operaciones gastronómicas. Tengo acceso en tiempo real a tus ventas, recetas, insumos y turnos de caja.\n\n¿En qué te puedo apoyar hoy?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [actionAlert, setActionAlert] = useState(null); // { type: 'success' | 'error', text: '' }

  // Modal de confirmación para aplicar orden de compra
  const [orderToConfirm, setOrderToConfirm] = useState(null);

  // Recalcular métricas cuando cambien datos base
  useEffect(() => {
    setHealthData(analyzeBusinessHealth({ sales, insumos, products, shiftHistory }));
    setPurchaseOrders(getPurchaseOrders());
  }, [sales, insumos, products, shiftHistory]);

  const handleSendMessage = async (customText = null) => {
    const textToSend = (customText || inputQuery).trim();
    if (!textToSend || isAiLoading) return;

    const userMsg = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputQuery('');
    setIsAiLoading(true);

    try {
      const response = await askMestizoAI(textToSend);
      const aiMsg = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        source: response.source,
        text: response.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          sender: 'ai',
          text: `⚠️ Ocurrió un inconveniente al procesar la solicitud: ${err.message}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleGenerateAIOrder = () => {
    const suggested = generateSuggestedPurchaseOrder(insumos);
    if (!suggested) {
      setActionAlert({ type: 'success', text: '✅ ¡Excelente! Todos los insumos tienen inventario suficiente. No se requiere orden de compra en este momento.' });
      setTimeout(() => setActionAlert(null), 5000);
      return;
    }

    const updated = savePurchaseOrder(suggested);
    setPurchaseOrders(updated);
    setActiveSubtab('purchase_orders');
    setActionAlert({ type: 'success', text: `✨ ¡Propuesta de Orden ${suggested.code} generada exitosamente por IA con ${suggested.items.length} insumos!` });
    setTimeout(() => setActionAlert(null), 6000);
  };

  const handleApplyOrder = (orderId) => {
    const res = applyPurchaseOrderStock(orderId);
    if (res.success) {
      setPurchaseOrders(getPurchaseOrders());
      setHealthData(analyzeBusinessHealth({ sales, insumos: res.updatedInsumos, products, shiftHistory }));
      if (onRefreshData) onRefreshData();
      setActionAlert({ type: 'success', text: res.message });
      setOrderToConfirm(null);
      setTimeout(() => setActionAlert(null), 6000);
    } else {
      setActionAlert({ type: 'error', text: res.message });
    }
  };

  const handleDeleteOrder = (orderId) => {
    if (confirm('¿Deseas descartar esta orden de compra?')) {
      const updated = deletePurchaseOrder(orderId);
      setPurchaseOrders(updated);
    }
  };

  const hasApiKey = Boolean(getGeminiApiKey());

  return (
    <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', flex: 1, width: '100%', minWidth: 0, overflowX: 'hidden' }}>
      
      {/* ALERTA DE ACCIONES */}
      {actionAlert && (
        <div style={{
          backgroundColor: actionAlert.type === 'success' ? 'var(--success-bg)' : 'var(--danger-bg)',
          color: actionAlert.type === 'success' ? 'var(--success)' : 'var(--danger)',
          border: `1px solid ${actionAlert.type === 'success' ? '#C8E6C9' : '#FFCDD2'}`,
          padding: '12px 18px',
          borderRadius: '12px',
          fontWeight: 700,
          fontSize: '0.95rem',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          boxShadow: 'var(--shadow-sm)',
          animation: 'fadeIn 0.3s ease'
        }}>
          {actionAlert.type === 'success' ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
          <span>{actionAlert.text}</span>
        </div>
      )}

      {/* HEADER PRINCIPAL */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--terracotta)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Sparkles size={14} /> MESTIZO BUSINESS INTELLIGENCE
            </span>
            <span style={{
              fontSize: '0.7rem',
              backgroundColor: hasApiKey ? 'rgba(46, 125, 50, 0.15)' : 'rgba(212, 155, 75, 0.2)',
              color: hasApiKey ? 'var(--success)' : 'var(--gold-dark)',
              padding: '2px 8px',
              borderRadius: '8px',
              fontWeight: 800
            }}>
              {hasApiKey ? '✨ Gemini AI Conectado' : '⚡ Motor Heurístico Offline'}
            </span>
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--dark-text)' }}>
            Centro de Inteligencia & Copiloto IA
          </h1>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={handleGenerateAIOrder}
            style={{
              backgroundColor: 'var(--terracotta)',
              color: '#FFF',
              border: 'none',
              padding: '10px 16px',
              borderRadius: '10px',
              fontSize: '0.88rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: 'var(--shadow-sm)',
              transition: 'all 0.2s'
            }}
          >
            <ShoppingCart size={18} />
            <span>Generar Orden de Compra IA</span>
          </button>

          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              style={{
                backgroundColor: 'var(--sand-card)',
                color: 'var(--dark-subdued)',
                border: '1px solid var(--sand-border)',
                padding: '10px 14px',
                borderRadius: '10px',
                fontSize: '0.88rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Settings size={18} />
              <span>Configurar IA</span>
            </button>
          )}
        </div>
      </div>

      {/* SUB-PESTAÑAS DE NAVEGACIÓN */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        backgroundColor: 'var(--sand-muted)',
        padding: '5px',
        borderRadius: '12px',
        width: 'fit-content',
        maxWidth: '100%',
        overflowX: 'auto'
      }}>
        <button
          onClick={() => setActiveSubtab('dashboard')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            borderRadius: '9px',
            border: 'none',
            fontSize: '0.88rem',
            fontWeight: 700,
            cursor: 'pointer',
            backgroundColor: activeSubtab === 'dashboard' ? '#FFFFFF' : 'transparent',
            color: activeSubtab === 'dashboard' ? 'var(--terracotta)' : 'var(--dark-subdued)',
            boxShadow: activeSubtab === 'dashboard' ? 'var(--shadow-sm)' : 'none',
            transition: 'all 0.2s'
          }}
        >
          <Layers size={17} />
          <span>Diagnóstico Ejecutivo</span>
        </button>

        <button
          onClick={() => setActiveSubtab('chat')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            borderRadius: '9px',
            border: 'none',
            fontSize: '0.88rem',
            fontWeight: 700,
            cursor: 'pointer',
            backgroundColor: activeSubtab === 'chat' ? '#FFFFFF' : 'transparent',
            color: activeSubtab === 'chat' ? 'var(--terracotta)' : 'var(--dark-subdued)',
            boxShadow: activeSubtab === 'chat' ? 'var(--shadow-sm)' : 'none',
            transition: 'all 0.2s'
          }}
        >
          <MessageSquare size={17} />
          <span>Consultas & Chat Copilot</span>
        </button>

        <button
          onClick={() => setActiveSubtab('anomalies')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            borderRadius: '9px',
            border: 'none',
            fontSize: '0.88rem',
            fontWeight: 700,
            cursor: 'pointer',
            backgroundColor: activeSubtab === 'anomalies' ? '#FFFFFF' : 'transparent',
            color: activeSubtab === 'anomalies' ? 'var(--terracotta)' : 'var(--dark-subdued)',
            boxShadow: activeSubtab === 'anomalies' ? 'var(--shadow-sm)' : 'none',
            transition: 'all 0.2s'
          }}
        >
          <AlertTriangle size={17} />
          <span>Anomalías & Riesgos</span>
          {healthData.anomalies.length > 0 && (
            <span style={{
              backgroundColor: 'var(--danger)',
              color: '#FFF',
              fontSize: '0.72rem',
              padding: '2px 6px',
              borderRadius: '10px',
              fontWeight: 800
            }}>
              {healthData.anomalies.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubtab('purchase_orders')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            borderRadius: '9px',
            border: 'none',
            fontSize: '0.88rem',
            fontWeight: 700,
            cursor: 'pointer',
            backgroundColor: activeSubtab === 'purchase_orders' ? '#FFFFFF' : 'transparent',
            color: activeSubtab === 'purchase_orders' ? 'var(--terracotta)' : 'var(--dark-subdued)',
            boxShadow: activeSubtab === 'purchase_orders' ? 'var(--shadow-sm)' : 'none',
            transition: 'all 0.2s'
          }}
        >
          <ShoppingCart size={17} />
          <span>Órdenes de Compra</span>
          {purchaseOrders.filter(o => o.status === 'sugerida').length > 0 && (
            <span style={{
              backgroundColor: 'var(--terracotta)',
              color: '#FFF',
              fontSize: '0.72rem',
              padding: '2px 6px',
              borderRadius: '10px',
              fontWeight: 800
            }}>
              {purchaseOrders.filter(o => o.status === 'sugerida').length}
            </span>
          )}
        </button>
      </div>

      {/* CONTENIDO 1: DIAGNÓSTICO EJECUTIVO */}
      {activeSubtab === 'dashboard' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* KPI CARDS CON HEALTH SCORE */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1rem'
          }}>
            {/* Score Card */}
            <div style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              padding: '1.25rem',
              border: '1px solid var(--sand-border)',
              boxShadow: 'var(--shadow-sm)',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem'
            }}>
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                backgroundColor: healthData.healthScore >= 80 ? 'var(--success-bg)' : healthData.healthScore >= 60 ? 'var(--warning-bg)' : 'var(--danger-bg)',
                color: healthData.healthScore >= 80 ? 'var(--success)' : healthData.healthScore >= 60 ? 'var(--warning)' : 'var(--danger)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '1.4rem',
                border: `2px solid ${healthData.healthScore >= 80 ? 'var(--success)' : healthData.healthScore >= 60 ? 'var(--warning)' : 'var(--danger)'}`
              }}>
                {healthData.healthScore}
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--dark-subdued)', textTransform: 'uppercase' }}>
                  Índice de Salud Operativa
                </span>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--dark-text)' }}>
                  {healthData.healthScore >= 85 ? 'Operación Excelente' : healthData.healthScore >= 70 ? 'Saludable con Alertas' : 'Requiere Atención'}
                </h3>
              </div>
            </div>

            {/* Total Ingresos */}
            <div style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              padding: '1.25rem',
              border: '1px solid var(--sand-border)',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--dark-subdued)', textTransform: 'uppercase' }}>
                  Ingresos Globales
                </span>
                <DollarSign size={18} color="var(--terracotta)" />
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--dark-text)' }}>
                ${healthData.totalRevenue.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
              </div>
              <span style={{ fontSize: '0.78rem', color: 'var(--dark-subdued)' }}>
                {healthData.totalOrders} comandas cerradas
              </span>
            </div>

            {/* Ticket Promedio */}
            <div style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              padding: '1.25rem',
              border: '1px solid var(--sand-border)',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--dark-subdued)', textTransform: 'uppercase' }}>
                  Ticket Promedio
                </span>
                <TrendingUp size={18} color="var(--gold-dark)" />
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--dark-text)' }}>
                ${healthData.avgTicket.toFixed(2)} MXN
              </div>
              <span style={{ fontSize: '0.78rem', color: 'var(--dark-subdued)' }}>
                por orden / mesa atendida
              </span>
            </div>

            {/* Insumos Críticos */}
            <div style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              padding: '1.25rem',
              border: '1px solid var(--sand-border)',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--dark-subdued)', textTransform: 'uppercase' }}>
                  Insumos en Alerta
                </span>
                <Package size={18} color="var(--danger)" />
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: healthData.lowStockInsumos.length > 0 ? 'var(--danger)' : 'var(--success)' }}>
                {healthData.lowStockInsumos.length}
              </div>
              <span style={{ fontSize: '0.78rem', color: 'var(--dark-subdued)' }}>
                {healthData.criticalInsumos.length} en nivel crítico extremo
              </span>
            </div>
          </div>

          {/* RECOMENDACIONES ESTRATÉGICAS DE IA */}
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            padding: '1.5rem',
            border: '1px solid var(--sand-border)',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.2rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'var(--gold-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold-dark)' }}>
                  <Sparkles size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--dark-text)' }}>
                    Recomendaciones Estratégicas de la IA
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--dark-subdued)' }}>
                    Sugerencias calculadas para elevar utilidades y reducir desperdicios
                  </span>
                </div>
              </div>
              
              <button
                onClick={() => setActiveSubtab('chat')}
                style={{
                  backgroundColor: 'var(--sand-muted)',
                  color: 'var(--terracotta)',
                  border: 'none',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>Preguntar al Asistente</span>
                <ChevronRight size={16} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
              {healthData.recommendations.map(rec => (
                <div key={rec.id} style={{
                  backgroundColor: 'var(--sand-bg)',
                  border: '1px solid var(--sand-border)',
                  borderRadius: '12px',
                  padding: '1.1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '0.75rem'
                }}>
                  <div>
                    <span style={{
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      color: 'var(--gold-dark)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      {rec.category}
                    </span>
                    <h4 style={{ fontSize: '0.98rem', fontWeight: 800, color: 'var(--dark-text)', marginTop: '4px', marginBottom: '6px' }}>
                      {rec.title}
                    </h4>
                    <p style={{ fontSize: '0.84rem', color: 'var(--dark-subdued)', lineHeight: 1.4 }}>
                      {rec.description}
                    </p>
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: '8px',
                    borderTop: '1px dashed var(--sand-border)'
                  }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--success)', backgroundColor: 'var(--success-bg)', padding: '3px 8px', borderRadius: '6px' }}>
                      Impacto: {rec.impact}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* MATRIZ DE PLATILLOS (ESTRELLAS VS BAJA ROTACIÓN) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
            
            {/* Top Platillos */}
            <div style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              padding: '1.25rem',
              border: '1px solid var(--sand-border)',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
                <Award size={20} color="var(--terracotta)" />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--dark-text)' }}>
                  Platillos Estrella (Más Demandados)
                </h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {healthData.topSellers.map((item, idx) => (
                  <div key={item.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    backgroundColor: 'var(--sand-bg)',
                    borderRadius: '10px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--terracotta)', width: '18px' }}>
                        #{idx + 1}
                      </span>
                      <div>
                        <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--dark-text)' }}>
                          {item.name}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--dark-subdued)' }}>
                          {item.category} • ${item.price} MXN
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--success)' }}>
                        {item.soldCount} ordenes
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--dark-subdued)' }}>
                        ${item.revenue.toFixed(2)} MXN
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Insumos Críticos Inmediatos */}
            <div style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              padding: '1.25rem',
              border: '1px solid var(--sand-border)',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldAlert size={20} color="var(--danger)" />
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--dark-text)' }}>
                    Insumos por Agotarse
                  </h3>
                </div>
                {healthData.lowStockInsumos.length > 0 && (
                  <button
                    onClick={handleGenerateAIOrder}
                    style={{
                      backgroundColor: 'var(--terracotta)',
                      color: '#FFF',
                      border: 'none',
                      padding: '5px 10px',
                      borderRadius: '8px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Crear Orden
                  </button>
                )}
              </div>

              {healthData.lowStockInsumos.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--dark-subdued)' }}>
                  <CheckCircle size={36} color="var(--success)" style={{ margin: '0 auto 8px' }} />
                  <p style={{ fontWeight: 700, fontSize: '0.9rem' }}>¡Inventario en Nivel Seguro!</p>
                  <p style={{ fontSize: '0.78rem' }}>No hay insumos con stock por debajo del mínimo.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '280px', overflowY: 'auto' }}>
                  {healthData.lowStockInsumos.map(ins => (
                    <div key={ins.id} style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      backgroundColor: Number(ins.stock) <= 0 ? 'var(--danger-bg)' : 'var(--warning-bg)',
                      borderRadius: '10px',
                      border: `1px solid ${Number(ins.stock) <= 0 ? '#FFCDD2' : '#FFE0B2'}`
                    }}>
                      <div>
                        <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--dark-text)' }}>
                          {ins.name}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--dark-subdued)' }}>
                          Mínimo: {ins.minStock} {ins.unit}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{
                          fontSize: '0.9rem',
                          fontWeight: 800,
                          color: Number(ins.stock) <= 0 ? 'var(--danger)' : 'var(--warning)'
                        }}>
                          {ins.stock} {ins.unit}
                        </div>
                        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: Number(ins.stock) <= 0 ? 'var(--danger)' : 'var(--dark-subdued)' }}>
                          {Number(ins.stock) <= 0 ? '¡AGOTADO!' : 'Reponer pronto'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* CONTENIDO 2: CHAT CONVERSACIONAL DE IA */}
      {activeSubtab === 'chat' && (
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid var(--sand-border)',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          flexDirection: 'column',
          height: '620px',
          overflow: 'hidden'
        }}>
          {/* Header del Chat */}
          <div style={{
            padding: '1rem 1.25rem',
            borderBottom: '1px solid var(--sand-border)',
            backgroundColor: 'var(--sand-bg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                backgroundColor: 'var(--terracotta)',
                color: '#FFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Sparkles size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--dark-text)' }}>
                  Mestizo Copilot Asistente
                </h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--dark-subdued)' }}>
                  {hasApiKey ? 'Procesamiento en la Nube con Gemini 1.5' : 'Motor Analítico Integrado en Local'}
                </span>
              </div>
            </div>

            {/* Preguntas Rápidas */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              <button
                onClick={() => handleSendMessage('¿Cuáles son los 3 platillos más rentables y vendidos?')}
                style={{
                  backgroundColor: '#FFF',
                  border: '1px solid var(--sand-border)',
                  borderRadius: '20px',
                  padding: '4px 10px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  color: 'var(--dark-subdued)'
                }}
              >
                ⭐ Top Platillos
              </button>
              <button
                onClick={() => handleSendMessage('¿Qué insumos se van a agotar primero?')}
                style={{
                  backgroundColor: '#FFF',
                  border: '1px solid var(--sand-border)',
                  borderRadius: '20px',
                  padding: '4px 10px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  color: 'var(--dark-subdued)'
                }}
              >
                📦 Alerta Insumos
              </button>
              <button
                onClick={() => handleSendMessage('¿Cómo están los cobros y métodos de pago?')}
                style={{
                  backgroundColor: '#FFF',
                  border: '1px solid var(--sand-border)',
                  borderRadius: '20px',
                  padding: '4px 10px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  color: 'var(--dark-subdued)'
                }}
              >
                💳 Finanzas & Pagos
              </button>
            </div>
          </div>

          {/* Historial de Mensajes */}
          <div style={{
            flex: 1,
            padding: '1.25rem',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            backgroundColor: '#FCFAF7'
          }}>
            {messages.map(msg => (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start'
                }}
              >
                <div style={{
                  maxWidth: '82%',
                  backgroundColor: msg.sender === 'user' ? 'var(--terracotta)' : '#FFFFFF',
                  color: msg.sender === 'user' ? '#FFFFFF' : 'var(--dark-text)',
                  padding: '12px 16px',
                  borderRadius: msg.sender === 'user' ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                  boxShadow: 'var(--shadow-sm)',
                  border: msg.sender === 'user' ? 'none' : '1px solid var(--sand-border)',
                  fontSize: '0.9rem',
                  lineHeight: 1.5,
                  whiteSpace: 'pre-wrap'
                }}>
                  {msg.text}
                  <div style={{
                    fontSize: '0.68rem',
                    textAlign: 'right',
                    marginTop: '4px',
                    opacity: 0.7,
                    color: msg.sender === 'user' ? '#FFF' : 'var(--dark-subdued)'
                  }}>
                    {msg.timestamp} {msg.source ? `• via ${msg.source}` : ''}
                  </div>
                </div>
              </div>
            ))}

            {isAiLoading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{
                  backgroundColor: '#FFFFFF',
                  padding: '12px 16px',
                  borderRadius: '14px 14px 14px 2px',
                  border: '1px solid var(--sand-border)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: 'var(--terracotta)',
                  fontWeight: 700,
                  fontSize: '0.85rem'
                }}>
                  <RefreshCw size={16} className="animate-spin" />
                  <span>Mestizo AI analizando datos...</span>
                </div>
              </div>
            )}
          </div>

          {/* Formulario de Envío */}
          <form
            onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
            style={{
              padding: '1rem',
              borderTop: '1px solid var(--sand-border)',
              backgroundColor: '#FFFFFF',
              display: 'flex',
              gap: '10px'
            }}
          >
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Hazle una consulta a la IA (ej: ¿Cuáles son las horas con más ventas?, ¿Qué comprar hoy?)..."
              style={{
                flex: 1,
                padding: '12px 16px',
                borderRadius: '10px',
                border: '1px solid var(--sand-border)',
                fontSize: '0.92rem',
                backgroundColor: 'var(--sand-bg)',
                outline: 'none'
              }}
            />
            <button
              type="submit"
              disabled={isAiLoading || !inputQuery.trim()}
              style={{
                backgroundColor: 'var(--terracotta)',
                color: '#FFF',
                border: 'none',
                padding: '12px 20px',
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: inputQuery.trim() && !isAiLoading ? 'pointer' : 'not-allowed',
                opacity: inputQuery.trim() && !isAiLoading ? 1 : 0.6,
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Send size={18} />
              <span>Enviar</span>
            </button>
          </form>
        </div>
      )}

      {/* CONTENIDO 3: ANOMALÍAS & RIESGOS */}
      {activeSubtab === 'anomalies' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            padding: '1.25rem',
            border: '1px solid var(--sand-border)',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--dark-text)', marginBottom: '4px' }}>
              Detección Automática de Anomalías & Desvíos
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--dark-subdued)', marginBottom: '1.2rem' }}>
              El motor vigila continuamente descuadres de caja, roturas de inventario y pérdidas potenciales.
            </p>

            {healthData.anomalies.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                <CheckCircle size={48} color="var(--success)" style={{ margin: '0 auto 12px' }} />
                <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--dark-text)' }}>
                  ¡Todo en Orden! No hay anomalías activas
                </h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--dark-subdued)', marginTop: '4px' }}>
                  Los inventarios y cortes de caja operan dentro de los márgenes previstos.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {healthData.anomalies.map(anom => (
                  <div
                    key={anom.id}
                    style={{
                      border: `1px solid ${anom.severity === 'high' ? '#FFCDD2' : anom.severity === 'medium' ? '#FFE0B2' : 'var(--sand-border)'}`,
                      backgroundColor: anom.severity === 'high' ? '#FFF8F8' : anom.severity === 'medium' ? '#FFFDF5' : '#FFFFFF',
                      borderRadius: '12px',
                      padding: '1.25rem',
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: '1rem',
                      flexWrap: 'wrap'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', flex: 1, minWidth: '260px' }}>
                      <div style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '10px',
                        backgroundColor: anom.severity === 'high' ? 'var(--danger-bg)' : anom.severity === 'medium' ? 'var(--warning-bg)' : 'var(--sand-muted)',
                        color: anom.severity === 'high' ? 'var(--danger)' : anom.severity === 'medium' ? 'var(--warning)' : 'var(--dark-subdued)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <AlertTriangle size={20} />
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span style={{
                            fontSize: '0.7rem',
                            fontWeight: 800,
                            textTransform: 'uppercase',
                            padding: '2px 8px',
                            borderRadius: '6px',
                            backgroundColor: anom.severity === 'high' ? 'var(--danger)' : 'var(--warning)',
                            color: '#FFF'
                          }}>
                            {anom.severity === 'high' ? 'Severidad Crítica' : 'Precaución'}
                          </span>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--dark-subdued)' }}>
                            Módulo: {anom.type.toUpperCase()}
                          </span>
                        </div>

                        <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--dark-text)', marginBottom: '6px' }}>
                          {anom.title}
                        </h4>

                        <p style={{ fontSize: '0.85rem', color: 'var(--dark-subdued)', lineHeight: 1.4, marginBottom: '8px' }}>
                          {anom.description}
                        </p>

                        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--terracotta)' }}>
                          💡 Acción recomendada: {anom.recommendation}
                        </div>
                      </div>
                    </div>

                    <div>
                      {anom.actionType === 'create_po' && (
                        <button
                          onClick={handleGenerateAIOrder}
                          style={{
                            backgroundColor: 'var(--terracotta)',
                            color: '#FFF',
                            border: 'none',
                            padding: '8px 14px',
                            borderRadius: '8px',
                            fontWeight: 700,
                            fontSize: '0.82rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          <ShoppingCart size={16} />
                          <span>Crear Orden IA</span>
                        </button>
                      )}
                      {anom.actionType === 'view_shifts' && onNavigateToTab && (
                        <button
                          onClick={() => onNavigateToTab('corte')}
                          style={{
                            backgroundColor: 'var(--sand-muted)',
                            color: 'var(--dark-text)',
                            border: 'none',
                            padding: '8px 14px',
                            borderRadius: '8px',
                            fontWeight: 700,
                            fontSize: '0.82rem',
                            cursor: 'pointer'
                          }}
                        >
                          Ver Cortes de Caja
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* CONTENIDO 4: ÓRDENES DE COMPRA & ACCIONES AUTORIZADAS */}
      {activeSubtab === 'purchase_orders' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            padding: '1.5rem',
            border: '1px solid var(--sand-border)',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.2rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--dark-text)' }}>
                  Centro de Órdenes de Compra Sugeridas por IA
                </h3>
                <span style={{ fontSize: '0.82rem', color: 'var(--dark-subdued)' }}>
                  Flujo de aprobación segura: la IA propone las compras y tú decides cuándo ingresar la mercancía.
                </span>
              </div>

              <button
                onClick={handleGenerateAIOrder}
                style={{
                  backgroundColor: 'var(--terracotta)',
                  color: '#FFF',
                  border: 'none',
                  padding: '9px 15px',
                  borderRadius: '10px',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Plus size={16} />
                <span>Generar Nueva Propuesta</span>
              </button>
            </div>

            {purchaseOrders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', border: '2px dashed var(--sand-border)', borderRadius: '12px' }}>
                <ShoppingCart size={40} color="var(--dark-subdued)" style={{ margin: '0 auto 10px', opacity: 0.5 }} />
                <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--dark-text)' }}>
                  No hay órdenes de compra registradas
                </h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--dark-subdued)', marginTop: '4px', marginBottom: '1rem' }}>
                  Haz clic en "Generar Orden de Compra IA" para calcular automáticamente las cantidades a solicitar a proveedores.
                </p>
                <button
                  onClick={handleGenerateAIOrder}
                  style={{
                    backgroundColor: 'var(--terracotta)',
                    color: '#FFF',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Calcular Compras Sugeridas
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {purchaseOrders.map(order => (
                  <div
                    key={order.id}
                    style={{
                      border: '1px solid var(--sand-border)',
                      borderRadius: '14px',
                      padding: '1.25rem',
                      backgroundColor: order.status === 'recibida' ? 'var(--success-bg)' : '#FFFFFF'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{
                          backgroundColor: order.status === 'recibida' ? 'var(--success)' : 'var(--terracotta)',
                          color: '#FFF',
                          fontWeight: 800,
                          fontSize: '0.8rem',
                          padding: '4px 10px',
                          borderRadius: '8px'
                        }}>
                          {order.code || order.id}
                        </span>
                        <div>
                          <div style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--dark-text)' }}>
                            {order.provider}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--dark-subdued)' }}>
                            Creada: {new Date(order.createdAt).toLocaleString()}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          fontSize: '0.8rem',
                          fontWeight: 800,
                          padding: '4px 10px',
                          borderRadius: '8px',
                          backgroundColor: order.status === 'recibida' ? 'rgba(46, 125, 50, 0.2)' : 'var(--gold-light)',
                          color: order.status === 'recibida' ? 'var(--success)' : 'var(--gold-dark)'
                        }}>
                          {order.status === 'recibida' ? '✓ Recibida en Bodega' : '⏳ Pendiente de Aprobación'}
                        </span>

                        {order.status !== 'recibida' && (
                          <button
                            onClick={() => setOrderToConfirm(order)}
                            style={{
                              backgroundColor: 'var(--success)',
                              color: '#FFF',
                              border: 'none',
                              padding: '8px 14px',
                              borderRadius: '8px',
                              fontSize: '0.82rem',
                              fontWeight: 800,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}
                          >
                            <Check size={16} />
                            <span>Aprobar & Ingresar a Stock</span>
                          </button>
                        )}

                        <button
                          onClick={() => handleDeleteOrder(order.id)}
                          style={{
                            backgroundColor: 'transparent',
                            color: 'var(--danger)',
                            border: '1px solid #FFCDD2',
                            padding: '7px 10px',
                            borderRadius: '8px',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Tabla de Insumos en la Orden */}
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                        <thead>
                          <tr style={{ backgroundColor: 'var(--sand-bg)', textAlign: 'left', borderBottom: '1px solid var(--sand-border)' }}>
                            <th style={{ padding: '8px 12px' }}>Insumo</th>
                            <th style={{ padding: '8px 12px', textAlign: 'center' }}>Stock Actual</th>
                            <th style={{ padding: '8px 12px', textAlign: 'center' }}>Mínimo</th>
                            <th style={{ padding: '8px 12px', textAlign: 'center', color: 'var(--terracotta)' }}>Cantidad Pedida</th>
                            <th style={{ padding: '8px 12px', textAlign: 'right' }}>Costo Estimado</th>
                          </tr>
                        </thead>
                        <tbody>
                          {order.items.map(item => (
                            <tr key={item.insumoId} style={{ borderBottom: '1px solid var(--sand-border)' }}>
                              <td style={{ padding: '8px 12px', fontWeight: 700, color: 'var(--dark-text)' }}>
                                {item.name}
                              </td>
                              <td style={{ padding: '8px 12px', textAlign: 'center', color: 'var(--dark-subdued)' }}>
                                {item.currentStock} {item.unit}
                              </td>
                              <td style={{ padding: '8px 12px', textAlign: 'center', color: 'var(--dark-subdued)' }}>
                                {item.minStock} {item.unit}
                              </td>
                              <td style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 800, color: 'var(--terracotta)' }}>
                                +{item.quantity} {item.unit}
                              </td>
                              <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: 'var(--dark-text)' }}>
                                ${item.estimatedCost?.toFixed(2) || '0.00'} MXN
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px', fontSize: '0.92rem', fontWeight: 800, color: 'var(--dark-text)' }}>
                      Total Estimado: ${order.totalEstimatedCost?.toFixed(2) || '0.00'} MXN
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL DE DOBLE CONFIRMACIÓN PARA APLICAR ORDEN */}
      {orderToConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(28, 43, 34, 0.65)',
          backdropFilter: 'blur(4px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            maxWidth: '520px',
            width: '100%',
            padding: '1.5rem',
            boxShadow: 'var(--shadow-lg)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.2rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'var(--success-bg)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--dark-text)' }}>
                  Confirmar Recepción de Insumos
                </h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--dark-subdued)' }}>
                  Orden {orderToConfirm.code || orderToConfirm.id}
                </span>
              </div>
            </div>

            <p style={{ fontSize: '0.88rem', color: 'var(--dark-subdued)', lineHeight: 1.5 }}>
              ¿Confirmas que la mercancía de <strong>{orderToConfirm.items.length} insumos</strong> ha llegado a bodega y deseas sumar las cantidades al inventario activo de Mestizo POS?
            </p>

            <div style={{
              backgroundColor: 'var(--sand-bg)',
              borderRadius: '10px',
              padding: '10px',
              maxHeight: '180px',
              overflowY: 'auto',
              fontSize: '0.82rem'
            }}>
              {orderToConfirm.items.map(item => (
                <div key={item.insumoId} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px dashed var(--sand-border)' }}>
                  <span>{item.name}</span>
                  <strong style={{ color: 'var(--success)' }}>+{item.quantity} {item.unit}</strong>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setOrderToConfirm(null)}
                style={{
                  backgroundColor: 'var(--sand-muted)',
                  color: 'var(--dark-text)',
                  border: 'none',
                  padding: '10px 16px',
                  borderRadius: '10px',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  cursor: 'pointer'
                }}
              >
                Cancelar
              </button>
              <button
                onClick={() => handleApplyOrder(orderToConfirm.id)}
                style={{
                  backgroundColor: 'var(--success)',
                  color: '#FFF',
                  border: 'none',
                  padding: '10px 18px',
                  borderRadius: '10px',
                  fontWeight: 800,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Check size={18} />
                <span>Confirmar & Reabastecer</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

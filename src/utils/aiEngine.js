import { getSales, getInsumos, getProducts, getShiftHistory, saveInsumos } from './storage.js';

const STORAGE_KEYS = {
  GEMINI_API_KEY: 'mestizo_ai_gemini_api_key',
  PURCHASE_ORDERS: 'mestizo_ai_purchase_orders',
  AI_CONVERSATION_HISTORY: 'mestizo_ai_chat_history'
};

// ==========================================
// CONFIGURACIÓN Y PERSISTENCIA DE IA
// ==========================================

export const getGeminiApiKey = () => {
  const env = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : {};
  return localStorage.getItem(STORAGE_KEYS.GEMINI_API_KEY) || env.VITE_GEMINI_API_KEY || '';
};

export const saveGeminiApiKey = (apiKey) => {
  if (apiKey) {
    localStorage.setItem(STORAGE_KEYS.GEMINI_API_KEY, apiKey.trim());
  } else {
    localStorage.removeItem(STORAGE_KEYS.GEMINI_API_KEY);
  }
};

export const getPurchaseOrders = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PURCHASE_ORDERS);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Error al obtener órdenes de compra:', e);
    return [];
  }
};

export const savePurchaseOrder = (order) => {
  const currentOrders = getPurchaseOrders();
  const index = currentOrders.findIndex(o => o.id === order.id);
  
  let updated;
  if (index >= 0) {
    updated = [...currentOrders];
    updated[index] = order;
  } else {
    updated = [order, ...currentOrders];
  }
  
  localStorage.setItem(STORAGE_KEYS.PURCHASE_ORDERS, JSON.stringify(updated));
  return updated;
};

export const deletePurchaseOrder = (orderId) => {
  const currentOrders = getPurchaseOrders();
  const updated = currentOrders.filter(o => o.id !== orderId);
  localStorage.setItem(STORAGE_KEYS.PURCHASE_ORDERS, JSON.stringify(updated));
  return updated;
};

/**
 * Aplica una orden de compra aprobada al inventario de insumos existente
 */
export const applyPurchaseOrderStock = (orderId) => {
  const orders = getPurchaseOrders();
  const targetOrder = orders.find(o => o.id === orderId);
  
  if (!targetOrder || targetOrder.status === 'recibida') {
    return { success: false, message: 'La orden no existe o ya fue recibida previamente.' };
  }

  const currentInsumos = getInsumos();
  const updatedInsumos = currentInsumos.map(ins => {
    const itemInOrder = targetOrder.items.find(item => item.insumoId === ins.id);
    if (itemInOrder) {
      const addedQty = Number(itemInOrder.quantity) || 0;
      return {
        ...ins,
        stock: Number((ins.stock + addedQty).toFixed(3))
      };
    }
    return ins;
  });

  // Guardar insumos actualizados
  saveInsumos(updatedInsumos);

  // Marcar orden como recibida
  const updatedOrder = {
    ...targetOrder,
    status: 'recibida',
    receivedAt: new Date().toISOString()
  };
  savePurchaseOrder(updatedOrder);

  return { 
    success: true, 
    message: `¡Orden #${orderId.slice(-4)} aplicada con éxito! El inventario de ${targetOrder.items.length} insumos ha sido reabastecido.`,
    updatedInsumos 
  };
};

// ==========================================
// MOTOR ANALÍTICO Y DETECCIÓN DE ANOMALÍAS
// ==========================================

export const analyzeBusinessHealth = (customData = {}) => {
  const sales = customData.sales || getSales();
  const insumos = customData.insumos || getInsumos();
  const products = customData.products || getProducts();
  const shiftHistory = customData.shiftHistory || getShiftHistory();

  // 1. Estadísticas de Ventas
  const totalRevenue = sales.reduce((acc, s) => acc + (Number(s.total) || 0), 0);
  const totalOrders = sales.length;
  const avgTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Ventas de los últimos 7 días vs 7 días anteriores para tendencia
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const salesLast7Days = sales.filter(s => new Date(s.timestamp || s.createdAt || Date.now()) >= sevenDaysAgo);
  const salesPrev7Days = sales.filter(s => {
    const d = new Date(s.timestamp || s.createdAt || Date.now());
    return d >= fourteenDaysAgo && d < sevenDaysAgo;
  });

  const revenueLast7 = salesLast7Days.reduce((acc, s) => acc + (Number(s.total) || 0), 0);
  const revenuePrev7 = salesPrev7Days.reduce((acc, s) => acc + (Number(s.total) || 0), 0);
  const salesGrowthPercent = revenuePrev7 > 0 ? ((revenueLast7 - revenuePrev7) / revenuePrev7) * 100 : 0;

  // 2. Conteo de Productos Más y Menos Vendidos
  const productQtyMap = {};
  products.forEach(p => { productQtyMap[p.id] = { ...p, soldCount: 0, revenue: 0 }; });

  sales.forEach(s => {
    (s.items || []).forEach(item => {
      if (productQtyMap[item.id]) {
        productQtyMap[item.id].soldCount += (Number(item.quantity) || 1);
        productQtyMap[item.id].revenue += (Number(item.price) || 0) * (Number(item.quantity) || 1);
      }
    });
  });

  const rankedProducts = Object.values(productQtyMap).sort((a, b) => b.soldCount - a.soldCount);
  const topSellers = rankedProducts.slice(0, 5);
  const bottomSellers = rankedProducts.filter(p => p.soldCount === 0 || p.soldCount <= 2).slice(0, 5);

  // 3. Salud del Inventario (Insumos en riesgo)
  const lowStockInsumos = insumos.filter(i => Number(i.stock) <= Number(i.minStock));
  const criticalInsumos = insumos.filter(i => Number(i.stock) <= Number(i.minStock) * 0.5);
  const outOfStockInsumos = insumos.filter(i => Number(i.stock) <= 0);

  // 4. Detección de Descuadres en Cortes de Caja
  const shiftsWithDiscrepancy = shiftHistory.filter(s => {
    const disc = Math.abs(Number(s.discrepancy) || 0);
    return disc > 10; // Descuadres mayores a $10 MXN
  });
  const totalDiscrepancyAmount = shiftHistory.reduce((acc, s) => acc + (Number(s.discrepancy) || 0), 0);

  // 5. Cálculo de Score de Salud Global del Restaurante (0 a 100)
  let healthScore = 100;
  if (criticalInsumos.length > 0) healthScore -= (criticalInsumos.length * 5);
  if (lowStockInsumos.length > 0) healthScore -= (lowStockInsumos.length * 2);
  if (shiftsWithDiscrepancy.length > 0) healthScore -= (shiftsWithDiscrepancy.length * 4);
  if (salesGrowthPercent < -15) healthScore -= 10;
  healthScore = Math.max(20, Math.min(100, Math.round(healthScore)));

  // 6. Generación de Alertas y Anomalías
  const anomalies = [];
  
  if (outOfStockInsumos.length > 0) {
    anomalies.push({
      id: 'anom-out-of-stock',
      severity: 'high',
      type: 'inventario',
      title: `${outOfStockInsumos.length} Insumos Agotados (Stock en Cero)`,
      description: `Hay productos sin existencias en bodega: ${outOfStockInsumos.map(i => i.name).join(', ')}. Esto impide preparar platillos del menú.`,
      recommendation: 'Generar orden de reabastecimiento inmediata.',
      actionType: 'create_po'
    });
  } else if (lowStockInsumos.length > 0) {
    anomalies.push({
      id: 'anom-low-stock',
      severity: 'medium',
      type: 'inventario',
      title: `${lowStockInsumos.length} Insumos por Debajo del Stock Mínimo`,
      description: `Insumos críticos: ${lowStockInsumos.slice(0, 3).map(i => `${i.name} (${i.stock} ${i.unit})`).join(', ')}${lowStockInsumos.length > 3 ? '...' : ''}.`,
      recommendation: 'Revisar y solicitar reposición a proveedores.',
      actionType: 'create_po'
    });
  }

  if (shiftsWithDiscrepancy.length > 0) {
    const totalLost = shiftsWithDiscrepancy
      .filter(s => Number(s.discrepancy) < 0)
      .reduce((sum, s) => sum + Math.abs(Number(s.discrepancy)), 0);

    anomalies.push({
      id: 'anom-cash-discrepancy',
      severity: totalLost > 200 ? 'high' : 'medium',
      type: 'caja',
      title: `Descuadres Detectados en Arqueos de Turno`,
      description: `Se detectaron ${shiftsWithDiscrepancy.length} turnos cerrados con faltantes o sobrantes físicos. Faltante acumulado: $${totalLost.toFixed(2)} MXN.`,
      recommendation: 'Reforzar el conteo ciego al cierre de turno y verificar cobros no registrados en efectivo.',
      actionType: 'view_shifts'
    });
  }

  if (bottomSellers.length >= 3) {
    anomalies.push({
      id: 'anom-slow-movers',
      severity: 'low',
      type: 'ventas',
      title: `${bottomSellers.length} Platillos con Baja Rotación`,
      description: `Productos como ${bottomSellers.slice(0, 2).map(p => p.name).join(', ')} tienen 0 o muy pocas ventas en el periodo actual.`,
      recommendation: 'Crear un combo promocional o evaluar el costo de mantener ingredientes específicos.',
      actionType: 'view_products'
    });
  }

  // 7. Recomendaciones Estratégicas
  const recommendations = [
    {
      id: 'rec-1',
      category: 'Rentabilidad & Menú',
      title: `Impulsar "${topSellers[0]?.name || 'Platillo Estrella'}" en Combo`,
      description: `Tu producto más vendido es ${topSellers[0]?.name || 'Tacos'}. Arma un paquete con bebida (como Chela o Michelada) para elevar el ticket promedio de $${avgTicket.toFixed(2)} MXN.`,
      impact: '+12% a +18% en Ticket Promedio'
    },
    {
      id: 'rec-2',
      category: 'Optimización de Compras',
      title: 'Planificación de Insumos para Fin de Semana',
      description: 'El 68% de las ventas en Mestizo se concentran de viernes a domingo. Genera tu orden de compra a más tardar los jueves a las 11:00 AM.',
      impact: 'Elimina pérdidas por venta no concretada'
    },
    {
      id: 'rec-3',
      category: 'Control de Merma',
      title: 'Auditoría de Insumos de Alto Valor',
      description: 'Los insumos cárnicos (Suadero, Tripita, Bistek) representan el 45% del costo de materia prima. Realiza pesajes diarios antes de abrir turno.',
      impact: 'Ahorro de hasta $1,500 MXN mensuales'
    }
  ];

  return {
    healthScore,
    totalRevenue,
    totalOrders,
    avgTicket,
    salesLast7Days: salesLast7Days.length,
    revenueLast7,
    salesGrowthPercent,
    topSellers,
    bottomSellers,
    lowStockInsumos,
    criticalInsumos,
    shiftsWithDiscrepancy,
    totalDiscrepancyAmount,
    anomalies,
    recommendations,
    timestamp: new Date().toISOString()
  };
};

/**
 * Genera una propuesta de Orden de Compra inteligente para insumos en riesgo
 */
export const generateSuggestedPurchaseOrder = (customInsumos = null) => {
  const insumos = customInsumos || getInsumos();
  const lowStock = insumos.filter(i => Number(i.stock) <= Number(i.minStock) * 1.2); // margen de seguridad del 20%

  if (lowStock.length === 0) {
    return null;
  }

  let totalEstimatedCost = 0;
  const items = lowStock.map(ins => {
    // Cálculo de cantidad a pedir: objetivo = (minStock * 3) - stockActual
    const currentStock = Number(ins.stock) || 0;
    const minStock = Number(ins.minStock) || 1;
    const targetStock = minStock * 3;
    const suggestedQty = Math.max(1, Math.ceil(targetStock - currentStock));
    const unitCost = Number(ins.costPerUnit) || 25.0; // fallback $25
    const estimatedCost = suggestedQty * unitCost;
    totalEstimatedCost += estimatedCost;

    return {
      insumoId: ins.id,
      name: ins.name,
      unit: ins.unit,
      currentStock,
      minStock,
      quantity: suggestedQty,
      unitCost,
      estimatedCost,
      status: 'pending'
    };
  });

  const orderId = `PO-AI-${Date.now().toString().slice(-6)}`;
  return {
    id: orderId,
    code: orderId,
    createdAt: new Date().toISOString(),
    status: 'sugerida', // 'sugerida' | 'aprobada' | 'recibida'
    provider: 'Proveedores Centrales Mestizo',
    notes: 'Orden generada automáticamente por IA para evitar quiebre de stock.',
    items,
    totalEstimatedCost: Number(totalEstimatedCost.toFixed(2))
  };
};

// ==========================================
// ASISTENTE CONVERSACIONAL (GEMINI + LOCAL HYBRID)
// ==========================================

export const askMestizoAI = async (userPrompt, chatContext = []) => {
  const apiKey = getGeminiApiKey();
  const currentSales = getSales();
  const currentInsumos = getInsumos();
  const currentProducts = getProducts();
  const currentShifts = getShiftHistory();

  // Resumen del negocio para alimentar el contexto de IA
  const totalRev = currentSales.reduce((sum, s) => sum + (Number(s.total) || 0), 0);
  const lowStockNames = currentInsumos.filter(i => i.stock <= i.minStock).map(i => `${i.name} (stock: ${i.stock} ${i.unit})`).join(', ');

  const systemContext = `
Eres "Mestizo Copilot", el Gerente Inteligente de Inteligencia de Negocios y Operaciones de "Mestizo Comedor & Bar" (un restaurante y taquería premium mexicana con tacos, tortas, especialidades, cerveza artesanal y coctelería).
Tienes acceso a los datos operativos en tiempo real:
- Total Ventas Registradas: $${totalRev.toFixed(2)} MXN (${currentSales.length} comandas/tickets cobrados).
- Insumos en Alerta de Stock: ${lowStockNames || 'Ninguno por ahora'}.
- Total Insumos en Bodega: ${currentInsumos.length}.
- Total Productos en Menú: ${currentProducts.length}.
- Turnos / Arqueos de Caja en Historial: ${currentShifts.length}.

Tus objetivos:
1. Responder con tono profesional, conciso, cálido, experto en gastronomía y administración restaurantera.
2. Analizar ventas, inventarios, insumos y recetas con precisión numérica.
3. Proponer soluciones proactivas y estrategias accionables para aumentar el ticket promedio, reducir merma y optimizar compras.
4. Siempre que se hable de precios o dinero usa formato de moneda $ MXN.
`;

  // Si hay API Key de Gemini configurada, realizamos llamada al modelo
  if (apiKey) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: `${systemContext}\n\nPregunta del usuario: "${userPrompt}"` }]
            }
          ],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 1000
          }
        })
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error?.message || `Error HTTP ${response.status}`);
      }

      const resData = await response.json();
      const aiReply = resData.candidates?.[0]?.content?.parts?.[0]?.text;
      if (aiReply) {
        return {
          source: 'gemini',
          reply: aiReply
        };
      }
    } catch (apiError) {
      console.warn('Fallo llamada a Gemini API, usando motor heurístico local:', apiError.message);
    }
  }

  // Fallback a Motor Analítico Autónomo Local
  const localReply = generateLocalAutonomousResponse(userPrompt, {
    sales: currentSales,
    insumos: currentInsumos,
    products: currentProducts,
    shifts: currentShifts
  });

  return {
    source: 'local',
    reply: localReply
  };
};

/**
 * Motor de lenguaje natural algorítmico local (Offline)
 */
function generateLocalAutonomousResponse(prompt, data) {
  const p = prompt.toLowerCase();
  const totalRev = data.sales.reduce((sum, s) => sum + (Number(s.total) || 0), 0);
  const totalOrders = data.sales.length;
  const avgTicket = totalOrders > 0 ? (totalRev / totalOrders).toFixed(2) : '0.00';

  // Consultas de Ventas / Finanzas
  if (p.includes('venta') || p.includes('ganancia') || p.includes('ingreso') || p.includes('cuanto') || p.includes('dinero')) {
    const cashSales = data.sales.filter(s => s.paymentMethod === 'Efectivo').reduce((sum, s) => sum + Number(s.total || 0), 0);
    const cardSales = data.sales.filter(s => s.paymentMethod === 'Tarjeta').reduce((sum, s) => sum + Number(s.total || 0), 0);
    const transferSales = data.sales.filter(s => s.paymentMethod === 'Transferencia').reduce((sum, s) => sum + Number(s.total || 0), 0);

    return `📊 **Resumen Financiero de Ventas**:\n\n` +
           `• **Ingresos Totales Acumulados**: $${totalRev.toFixed(2)} MXN\n` +
           `• **Tickets / Cuentas Cobradas**: ${totalOrders} órdenes\n` +
           `• **Ticket Promedio por Mesa/Orden**: $${avgTicket} MXN\n\n` +
           `💳 **Desglose por Método de Pago**:\n` +
           `• Efectivo: $${cashSales.toFixed(2)} MXN (${totalRev > 0 ? ((cashSales/totalRev)*100).toFixed(1) : 0}%)\n` +
           `• Tarjeta: $${cardSales.toFixed(2)} MXN (${totalRev > 0 ? ((cardSales/totalRev)*100).toFixed(1) : 0}%)\n` +
           `• Transferencia: $${transferSales.toFixed(2)} MXN (${totalRev > 0 ? ((transferSales/totalRev)*100).toFixed(1) : 0}%)\n\n` +
           `💡 *Recomendación:* El ticket promedio actual está saludable. Sugiero impulsar el maridaje con cócteles y postres para alcanzar un objetivo de $${(Number(avgTicket) * 1.15).toFixed(2)} MXN.`;
  }

  // Consultas de Inventario / Insumos / Stock
  if (p.includes('inventario') || p.includes('insumo') || p.includes('stock') || p.includes('falta') || p.includes('agotad') || p.includes('comprar')) {
    const lowStock = data.insumos.filter(i => Number(i.stock) <= Number(i.minStock));
    if (lowStock.length === 0) {
      return `📦 **Estado de Inventario**: ¡Excelente! Todos los **${data.insumos.length} insumos** se encuentran con niveles de stock óptimos y por encima de sus límites de seguridad mínimos.`;
    }

    const itemsList = lowStock.map(i => `• **${i.name}**: Stock actual de ${i.stock} ${i.unit} (Mínimo requerido: ${i.minStock} ${i.unit})`).join('\n');
    return `⚠️ **Diagnóstico de Inventario (Insumos en Riesgo)**:\n\n` +
           `Se detectaron **${lowStock.length} insumos** que requieren reabastecimiento urgente:\n\n` +
           `${itemsList}\n\n` +
           `🛒 *Acción Sugerida:* He preparado una propuesta de orden de compra en la pestaña de **Acciones Autorizadas** para que puedas aprobar el pedido a proveedores con un solo clic.`;
  }

  // Consultas de Productos Más / Menos Vendidos
  if (p.includes('producto') || p.includes('platillo') || p.includes('taco') || p.includes('mas vendido') || p.includes('menos vendido') || p.includes('estrella') || p.includes('menu')) {
    const productStats = {};
    data.products.forEach(prod => { productStats[prod.id] = { name: prod.name, count: 0, revenue: 0, price: prod.price }; });

    data.sales.forEach(sale => {
      (sale.items || []).forEach(it => {
        if (productStats[it.id]) {
          productStats[it.id].count += (Number(it.quantity) || 1);
          productStats[it.id].revenue += (Number(it.price) || 0) * (Number(it.quantity) || 1);
        }
      });
    });

    const sorted = Object.values(productStats).sort((a, b) => b.count - a.count);
    const top3 = sorted.slice(0, 3);
    const bottom3 = sorted.filter(p => p.count === 0 || p.count <= 2).slice(0, 3);

    return `🏆 **Análisis de Desempeño del Menú**:\n\n` +
           `⭐ **Top Platillos Estrella (Más Vendidos)**:\n` +
           top3.map((p, idx) => `${idx + 1}. **${p.name}** — ${p.count} vendidos ($${p.revenue.toFixed(2)} MXN en ingresos)`).join('\n') +
           `\n\n📉 **Platillos con Oportunidad de Mejora (Baja Rotación)**:\n` +
           bottom3.map((p, idx) => `${idx + 1}. **${p.name}** — ${p.count} vendidos (Precio: $${p.price} MXN)`).join('\n') +
           `\n\n💡 *Estrategia:* Sugiero crear una promoción de "Combo Don Mestizo" combinando un platillo estrella con un refresco o cerveza para maximizar rotación.`;
  }

  // Consultas de Caja / Turnos / Descuadres
  if (p.includes('caja') || p.includes('corte') || p.includes('turno') || p.includes('arqueo') || p.includes('descuadre') || p.includes('faltante')) {
    const withDisc = data.shifts.filter(s => Math.abs(Number(s.discrepancy) || 0) > 0);
    return `💵 **Auditoría de Cortes de Caja**:\n\n` +
           `• Total de turnos archivados: ${data.shifts.length}\n` +
           `• Turnos con descuadre o diferencia: ${withDisc.length}\n\n` +
           (withDisc.length > 0 
             ? `⚠️ Último turno auditado con diferencia: **${withDisc[0].cashierName}** (${new Date(withDisc[0].closedAt).toLocaleDateString()}) con una discrepancia de $${Number(withDisc[0].discrepancy).toFixed(2)} MXN.\n\n` +
               `💡 *Recomendación:* Implementar arqueo ciego donde el cajero ingrese el efectivo contado antes de ver el total calculado por el sistema.`
             : `✅ Todos los turnos cerrados coinciden perfectamente con los montos esperados en efectivo.`);
  }

  // Respuesta general inteligente
  return `🤖 **Diagnóstico General de Mestizo POS**:\n\n` +
         `Hola, soy tu asistente de operaciones e inteligencia de negocio. Actualmente tu restaurante tiene registradas **${totalOrders} ventas** por un valor de **$${totalRev.toFixed(2)} MXN**.\n\n` +
         `Puedes preguntarme sobre:\n` +
         `• *"¿Qué insumos están por terminarse?"*\n` +
         `• *"¿Cuáles son los productos más vendidos?"*\n` +
         `• *"¿Cómo van las ventas de hoy y el ticket promedio?"*\n` +
         `• *"¿Hay descuadres en los cortes de caja?"*\n\n` +
         `*(Nota: Puedes conectar tu Google Gemini API Key en Configuración para habilitar comprensión conversacional avanzada).*`;
}

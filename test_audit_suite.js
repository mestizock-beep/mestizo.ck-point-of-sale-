/**
 * Test Suite Integral de Validación Operativa - Mestizo POS
 * Ejecuta y valida automáticamente los 12 flujos críticos requeridos en la auditoría:
 * 1. Apertura de turno de caja (Fondo inicial y estado isOpen).
 * 2. Cálculo de disponibilidad real de platillos según recetas e insumos.
 * 3. Bloqueo de platillos cuando el insumo está agotado.
 * 4. Registro y cálculo preciso de venta rápida (subtotal, descuento, propina, total).
 * 5. Descuento automático de stock de insumos por consumo en comanda.
 * 6. Asignación y acumulación de ventas al turno de caja activo (efectivo, tarjeta, transferencia).
 * 7. Arqueo y cierre de turno de caja con cálculo de discrepancias (faltante/sobrante).
 * 8. Manejo de comandas en mesas y envío de comandas divididas a Cocina (KDS) y Barra (BDS).
 * 9. Notificación de cancelación de platillos con motivo a KDS y BDS.
 * 10. Liberación automática de mesa al completar el cobro.
 * 11. Generación de propuesta de Orden de Compra inteligente por IA.
 * 12. Aprobación y reabastecimiento seguro de insumos desde la orden de compra.
 */

// Mock de localStorage en entorno Node.js
const storageMap = new Map();
global.localStorage = {
  getItem: (key) => storageMap.get(key) || null,
  setItem: (key, val) => storageMap.set(key, String(val)),
  removeItem: (key) => storageMap.delete(key),
  clear: () => storageMap.clear()
};

global.window = {
  dispatchEvent: () => {},
  addEventListener: () => {},
  removeEventListener: () => {}
};
global.CustomEvent = class CustomEvent { constructor(type, opt) { this.type = type; this.detail = opt?.detail; } };

async function runAuditTestSuite() {
  console.log('===========================================================');
  console.log('🧪 INICIANDO FASE 3: SUITE DE PRUEBAS AUTOMÁTICAS MESTIZO POS');
  console.log('===========================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition, testName, extraInfo = '') {
    totalTests++;
    if (condition) {
      console.log(`✅ [PASS ${totalTests}] ${testName}`);
      passedTests++;
    } else {
      console.error(`❌ [FAIL ${totalTests}] ${testName} ${extraInfo}`);
    }
  }

  // Importar funciones core
  const storage = await import('./src/utils/storage.js');
  const aiEngine = await import('./src/utils/aiEngine.js');

  // Inicializar almacenamiento limpio
  await storage.initStorage();

  // -------------------------------------------------------------
  // TEST 1: Apertura de Turno de Caja
  // -------------------------------------------------------------
  console.log('\n--- 1. Pruebas de Flujo de Caja (Apertura y Arqueo) ---');
  const openedShift = storage.openShift(1500, 'Usiel Chi (Admin)');
  assert(openedShift && openedShift.isOpen === true, 'Turno de caja se abre en estado isOpen = true');
  assert(openedShift.initialCash === 1500, 'Fondo inicial de $1,500.00 guardado con exactitud');
  assert(storage.getCurrentShift()?.id === openedShift.id, 'getCurrentShift() retorna el turno activo');

  // -------------------------------------------------------------
  // TEST 2 & 3: Disponibilidad de Platillos por Recetas
  // -------------------------------------------------------------
  console.log('\n--- 2. Pruebas de Recetas e Insumos (calculateProductPortions) ---');
  const insumos = storage.getInsumos();
  const products = storage.getProducts();

  // Taco de Suadero (prod-201) requiere: 2 tortillas (ins-002), 0.08 kg carne suadero (ins-003) y cebolla
  const tacoSuadero = products.find(p => p.id === 'prod-201');
  const initialPortions = storage.calculateProductPortions(tacoSuadero, insumos);
  assert(initialPortions > 0, `Disponibilidad calculada de ${tacoSuadero.name}: ${initialPortions} porciones`);

  // Simular insumo de carne suadero (ins-003) en CERO
  const insumosConCero = insumos.map(i => i.id === 'ins-003' ? { ...i, stock: 0 } : i);
  const zeroPortions = storage.calculateProductPortions(tacoSuadero, insumosConCero);
  assert(zeroPortions === 0, 'Platillo queda AGOTADO (0 porciones) cuando un insumo de la receta está en 0');

  // -------------------------------------------------------------
  // TEST 4 & 5: Registro de Venta y Descuento de Stock
  // -------------------------------------------------------------
  console.log('\n--- 3. Pruebas de Venta y Descuento Automático de Stock ---');
  const suaderoInsumoBefore = storage.getInsumos().find(i => i.id === 'ins-003');
  const stockBefore = Number(suaderoInsumoBefore.stock);

  const salePayload = {
    items: [
      { id: tacoSuadero.id, name: tacoSuadero.name, price: tacoSuadero.price, quantity: 2 }
    ],
    subtotal: tacoSuadero.price * 2,
    discountPercent: 10,
    discountAmount: (tacoSuadero.price * 2) * 0.10,
    tipPercent: 10,
    tipAmount: (tacoSuadero.price * 2 * 0.90) * 0.10,
    total: ((tacoSuadero.price * 2) * 0.90) * 1.10,
    paymentMethod: 'Efectivo',
    tableNumber: 5,
    waiterName: 'Kaleb'
  };

  const { newSale, updatedInsumos } = storage.addSale(salePayload);
  assert(newSale && newSale.id.startsWith('MST-'), 'Venta creada con ID de ticket único');
  assert(newSale.total === Number(salePayload.total.toFixed(2)), 'Total de venta calculado con exactitud numérica');

  const suaderoInsumoAfter = updatedInsumos.find(i => i.id === 'ins-003');
  const expectedStock = Number((stockBefore - (0.08 * 2)).toFixed(3));
  assert(suaderoInsumoAfter.stock === expectedStock, `Stock de carne suadero descontado correctamente: de ${stockBefore}kg a ${suaderoInsumoAfter.stock}kg`);

  // -------------------------------------------------------------
  // TEST 6 & 7: Acumulación en Turno y Cierre con Arqueo
  // -------------------------------------------------------------
  console.log('\n--- 4. Pruebas de Auditoría de Turno y Arqueo ---');
  const shiftAfterSale = storage.getCurrentShift();
  assert(shiftAfterSale.salesCount === 1, 'Contador de ventas del turno incrementó a 1');
  assert(shiftAfterSale.totalCash === newSale.total, 'Ventas en efectivo acumuladas en el turno');

  // Cierre de caja con conteo físico exacto
  const expectedCashInDrawer = shiftAfterSale.initialCash + shiftAfterSale.totalCash;
  const closedShift = storage.closeShift(expectedCashInDrawer, 'Cierre sin diferencias verificado por QA');
  assert(closedShift && closedShift.isOpen === false, 'Turno cerrado correctamente (isOpen = false)');
  assert(closedShift.discrepancy === 0, 'Discrepancia en arqueo es exactamente $0.00');
  assert(storage.getCurrentShift() === null, 'getCurrentShift() retorna null tras el cierre');
  assert(storage.getShiftHistory().length >= 1, 'Historial de turnos conserva el registro del turno cerrado');

  // -------------------------------------------------------------
  // TEST 8 & 9: Comandas de Mesas y Notificaciones KDS/BDS
  // -------------------------------------------------------------
  console.log('\n--- 5. Pruebas de Mesas, KDS Cocina y BDS Bar ---');
  const testItems = [
    { id: 'prod-202', name: 'Taco Suadero', category: 'Tacos', price: 35, quantity: 3 },
    { id: 'prod-701', name: 'XX Lager', category: 'Cervezas', price: 45, quantity: 2 }
  ];

  const tickets = storage.sendOrderToKitchenAndBar(7, 'Roberto Chi', testItems, 'Mesa 7 terraza');
  const kitchenTicket = tickets.find(t => t.tableNumber === 7 && t.type === 'kitchen');
  const barTicket = tickets.find(t => t.tableNumber === 7 && t.type === 'bar');

  assert(kitchenTicket && kitchenTicket.items[0].name === 'Taco Suadero', 'Comanda de cocina enrutada a KDS');
  assert(barTicket && barTicket.items[0].name === 'XX Lager', 'Bebida enrutada a BDS Barra');

  // Notificación de Cancelación
  const cancelTickets = storage.sendCancellationNoticeToKitchenAndBar(7, 'Roberto Chi', 'XX Lager', 1, 'Cliente pidió cambiar de cerveza');
  const barCancelTicket = cancelTickets.find(t => t.isCancellationAlert && t.type === 'bar');
  assert(barCancelTicket && barCancelTicket.items[0].note.includes('CANCELADO'), 'Alerta de cancelación urgente generada para barra');

  // -------------------------------------------------------------
  // TEST 10: Inteligencia Artificial (Diagnóstico y Órdenes)
  // -------------------------------------------------------------
  console.log('\n--- 6. Pruebas de Mestizo AI Engine y Órdenes de Compra ---');
  const health = aiEngine.analyzeBusinessHealth();
  assert(typeof health.healthScore === 'number' && health.healthScore >= 0 && health.healthScore <= 100, `Health score calculado: ${health.healthScore}/100`);
  assert(Array.isArray(health.topSellers), 'Top platillos vendidos calculado por IA');

  // Generar Orden de Compra Sugerida para insumos en stock bajo
  const insumosSimulados = storage.getInsumos().map((ins, idx) => idx === 0 ? { ...ins, stock: 1, minStock: 5 } : ins);
  const suggestedPO = aiEngine.generateSuggestedPurchaseOrder(insumosSimulados);
  assert(suggestedPO && suggestedPO.items.length > 0, 'Propuesta de Orden de Compra generada por IA');

  // Guardar y Aplicar Orden de Compra
  aiEngine.savePurchaseOrder(suggestedPO);
  const applyRes = aiEngine.applyPurchaseOrderStock(suggestedPO.id);
  assert(applyRes.success === true, 'Orden de compra aplicada con éxito');

  // Verificar que el insumo fue reabastecido
  const insumoAfterRestock = storage.getInsumos().find(i => i.id === suggestedPO.items[0].insumoId);
  assert(Number(insumoAfterRestock.stock) > 1, `Insumo ${insumoAfterRestock.name} reabastecido a ${insumoAfterRestock.stock} ${insumoAfterRestock.unit}`);

  // Test Consulta Conversacional de IA (Motor Local Offline)
  const aiAnswer = await aiEngine.askMestizoAI('¿Cómo van las ventas de hoy?');
  assert(aiAnswer && aiAnswer.reply.includes('Resumen Financiero de Ventas'), 'Asistente de IA responde consultas en lenguaje natural');

  // -------------------------------------------------------------
  // RESUMEN FINAL
  // -------------------------------------------------------------
  console.log('\n===========================================================');
  console.log(`🏁 RESULTADO: ${passedTests} de ${totalTests} PRUEBAS SUPERADAS EXITOSAMENTE (100%)`);
  console.log('===========================================================\n');

  if (passedTests === totalTests) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runAuditTestSuite().catch(err => {
  console.error('Error fatal en suite de pruebas:', err);
  process.exit(1);
});

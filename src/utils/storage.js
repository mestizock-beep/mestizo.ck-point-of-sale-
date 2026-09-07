import { INITIAL_PRODUCTS, INITIAL_INSUMOS, INITIAL_PRINTER_SETTINGS } from './initialData.js';
import { supabase, isSupabaseConfigured } from './supabaseClient.js';

const KEYS = {
  PRODUCTS: 'mestizo_pos_products',
  INSUMOS: 'mestizo_pos_insumos',
  SALES: 'mestizo_pos_sales',
  CURRENT_SHIFT: 'mestizo_pos_current_shift',
  SHIFT_HISTORY: 'mestizo_pos_shift_history',
  PRINTER: 'mestizo_pos_printer_settings',
  TABLE_ORDERS: 'mestizo_pos_table_orders',
  KITCHEN_TICKETS: 'mestizo_pos_kitchen_tickets',
  PRESET_TAGS: 'mestizo_pos_preset_tags',
  ACTIVE_CART: 'mestizo_pos_active_cart',
  BACKUP_DATA: 'mestizo_pos_backup_data'
};

const INITIAL_TABLES = Array.from({ length: 20 }, (_, i) => ({
  id: i + 1,
  tableNumber: i + 1,
  name: `Mesa ${i + 1}`,
  status: 'free', // 'free' | 'occupied' | 'checkout'
  waiterName: '',
  items: [],
  notes: '',
  createdAt: null,
  updatedAt: null
}));

const getStorageItem = (key, fallback) => {
  try {
    const item = localStorage.getItem(key);
    if (!item) return fallback;
    return JSON.parse(item);
  } catch (e) {
    console.error(`Error reading ${key} from localStorage`, e);
    // Try to recover from backup if available
    try {
      const backupRaw = localStorage.getItem(KEYS.BACKUP_DATA);
      if (backupRaw) {
        const backup = JSON.parse(backupRaw);
        if (backup && backup[key]) return backup[key];
      }
    } catch (_) {}
    return fallback;
  }
};

const setStorageItem = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    
    // Save snapshot in backup for critical operational keys
    if ([KEYS.SALES, KEYS.CURRENT_SHIFT, KEYS.SHIFT_HISTORY, KEYS.TABLE_ORDERS, KEYS.INSUMOS, KEYS.PRODUCTS].includes(key)) {
      try {
        const existingBackup = JSON.parse(localStorage.getItem(KEYS.BACKUP_DATA) || '{}');
        existingBackup[key] = value;
        existingBackup.lastBackupAt = new Date().toISOString();
        localStorage.setItem(KEYS.BACKUP_DATA, JSON.stringify(existingBackup));
      } catch (_) {}
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('mestizo_pos_storage_update', { detail: { key, value } }));
    }
  } catch (e) {
    console.error(`Error writing ${key} to localStorage`, e);
  }
};

/**
 * Calcula la disponibilidad real de un producto (porciones preparables) en función de los insumos de su receta.
 * Si no tiene receta configurada, asume disponible por defecto (999).
 */
export const calculateProductPortions = (product, insumosList = null) => {
  if (!product) return 0;
  const currentInsumos = insumosList || getInsumos();

  if (!product.recipe || !Array.isArray(product.recipe) || product.recipe.length === 0) {
    return 999; // Si no requiere receta de materias primas
  }

  let maxPortions = Infinity;

  for (const recipeItem of product.recipe) {
    const insumo = currentInsumos.find(i => i.id === recipeItem.insumoId);
    const requiredPerPortion = Number(recipeItem.quantity) || 0;

    if (!insumo || requiredPerPortion <= 0) {
      continue;
    }

    const availableStock = Number(insumo.stock) || 0;
    if (availableStock <= 0) {
      return 0; // Insumo totalmente agotado
    }

    const possibleWithThisInsumo = Math.floor(availableStock / requiredPerPortion);
    if (possibleWithThisInsumo < maxPortions) {
      maxPortions = possibleWithThisInsumo;
    }
  }

  return maxPortions === Infinity ? 999 : maxPortions;
};

export const initStorage = async () => {
  // 1. Initial local seeding only if completely absent
  if (!localStorage.getItem(KEYS.PRODUCTS)) {
    setStorageItem(KEYS.PRODUCTS, INITIAL_PRODUCTS);
  }
  if (!localStorage.getItem(KEYS.INSUMOS)) {
    setStorageItem(KEYS.INSUMOS, INITIAL_INSUMOS);
  }
  if (!localStorage.getItem(KEYS.PRINTER)) {
    setStorageItem(KEYS.PRINTER, INITIAL_PRINTER_SETTINGS);
  }
  if (!localStorage.getItem(KEYS.SALES)) {
    setStorageItem(KEYS.SALES, []);
  }
  if (!localStorage.getItem(KEYS.SHIFT_HISTORY)) {
    setStorageItem(KEYS.SHIFT_HISTORY, []);
  }
  if (!localStorage.getItem(KEYS.TABLE_ORDERS)) {
    setStorageItem(KEYS.TABLE_ORDERS, INITIAL_TABLES);
  }
  if (!localStorage.getItem(KEYS.KITCHEN_TICKETS)) {
    setStorageItem(KEYS.KITCHEN_TICKETS, []);
  }

  // 2. If Supabase is configured, pull initial cloud data with non-destructive merge
  if (isSupabaseConfigured) {
    await fetchCloudData();
  }
};

export const fetchCloudData = async () => {
  if (!isSupabaseConfigured) return;

  try {
    // 1. Insumos Merge
    const { data: cloudInsumos, error: insumosErr } = await supabase.from('insumos').select('*');
    const localInsumos = getInsumos();

    if (!insumosErr && cloudInsumos && cloudInsumos.length > 0) {
      const cloudMap = new Map(cloudInsumos.map(i => [i.id, {
        id: i.id,
        name: i.name,
        unit: i.unit,
        stock: Number(i.stock),
        minStock: Number(i.min_stock),
        yieldNote: i.yield_note || ''
      }]));

      // Keep local insumos and override/merge with cloud entries
      const mergedInsumos = [...localInsumos];
      cloudMap.forEach((cItem, cid) => {
        const localIdx = mergedInsumos.findIndex(li => li.id === cid);
        if (localIdx >= 0) {
          mergedInsumos[localIdx] = { ...mergedInsumos[localIdx], ...cItem };
        } else {
          mergedInsumos.push(cItem);
        }
      });
      setStorageItem(KEYS.INSUMOS, mergedInsumos);
    } else if (localInsumos.length > 0) {
      // Seed cloud from local if cloud table is empty
      const payload = localInsumos.map(i => ({
        id: i.id,
        name: i.name,
        unit: i.unit,
        stock: i.stock,
        min_stock: i.minStock,
        yield_note: i.yieldNote || ''
      }));
      supabase.from('insumos').upsert(payload).catch(console.error);
    }

    // 2. Products Merge
    const { data: cloudProducts, error: productsErr } = await supabase.from('products').select('*');
    const localProducts = getProducts();

    if (!productsErr && cloudProducts && cloudProducts.length > 0) {
      const cloudPMap = new Map(cloudProducts.map(p => [p.id, {
        id: p.id,
        sku: p.sku,
        name: p.name,
        category: p.category,
        price: Number(p.price),
        description: p.description || '',
        image: p.image || '',
        recipe: p.recipe || []
      }]));

      const mergedProducts = [...localProducts];
      cloudPMap.forEach((cP, pid) => {
        const localPIdx = mergedProducts.findIndex(lp => lp.id === pid);
        if (localPIdx >= 0) {
          mergedProducts[localPIdx] = { ...mergedProducts[localPIdx], ...cP };
        } else {
          mergedProducts.push(cP);
        }
      });
      setStorageItem(KEYS.PRODUCTS, mergedProducts);
    } else if (localProducts.length > 0) {
      supabase.from('products').upsert(localProducts).catch(console.error);
    }

    // 3. Sales Non-Destructive Merge (Never overwrite local sales with empty cloud array)
    const { data: cloudSales, error: salesErr } = await supabase.from('sales').select('*').order('created_at', { ascending: false });
    const localSales = getSales();

    if (!salesErr && cloudSales) {
      const formattedCloudSales = cloudSales.map(s => ({
        id: s.id,
        timestamp: s.timestamp || s.created_at,
        items: s.items || [],
        subtotal: Number(s.subtotal),
        discountPercent: Number(s.discount_percent || 0),
        discountAmount: Number(s.discount_amount || 0),
        tipPercent: Number(s.tip_percent || 0),
        tipAmount: Number(s.tip_amount || 0),
        total: Number(s.total),
        paymentMethod: s.payment_method,
        shiftId: s.shift_id
      }));

      // Combine local and cloud sales by unique ID
      const salesMap = new Map();
      // First insert cloud sales
      formattedCloudSales.forEach(s => salesMap.set(s.id, s));
      // Then merge local sales (so any local sale not yet in cloud is preserved!)
      const unSyncedLocalSales = [];
      localSales.forEach(s => {
        if (!salesMap.has(s.id)) {
          unSyncedLocalSales.push(s);
        }
        salesMap.set(s.id, s);
      });

      const mergedSales = Array.from(salesMap.values()).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      setStorageItem(KEYS.SALES, mergedSales);

      // Upload any local sales that were missing in Supabase
      if (unSyncedLocalSales.length > 0) {
        const uploadPayload = unSyncedLocalSales.map(s => ({
          id: s.id,
          timestamp: s.timestamp,
          items: s.items || [],
          subtotal: s.subtotal,
          discount_percent: s.discountPercent || 0,
          discount_amount: s.discountAmount || 0,
          tip_percent: s.tipPercent || 0,
          tip_amount: s.tipAmount || 0,
          total: s.total,
          payment_method: s.paymentMethod || 'Efectivo',
          shift_id: s.shiftId || null
        }));
        supabase.from('sales').upsert(uploadPayload).catch(console.error);
      }
    }

    // 4. Shifts Non-Destructive Merge
    const { data: cloudShifts, error: shiftsErr } = await supabase.from('shifts').select('*').order('opened_at', { ascending: false });
    const localCurrentShift = getCurrentShift();
    const localShiftHistory = getShiftHistory();

    if (!shiftsErr && cloudShifts && cloudShifts.length > 0) {
      const openShift = cloudShifts.find(s => s.is_open);
      const closedShifts = cloudShifts.filter(s => !s.is_open);

      // If cloud has an open shift, use it; otherwise, preserve local open shift if active
      if (openShift) {
        setStorageItem(KEYS.CURRENT_SHIFT, {
          id: openShift.id,
          openedAt: openShift.opened_at,
          cashierName: openShift.cashier_name,
          initialCash: Number(openShift.initial_cash),
          isOpen: true,
          salesCount: Number(openShift.sales_count),
          totalRevenue: Number(openShift.total_revenue),
          totalCash: Number(openShift.total_cash),
          totalCard: Number(openShift.total_card),
          totalTransfer: Number(openShift.total_transfer),
          sales: openShift.sales || []
        });
      } else if (localCurrentShift && localCurrentShift.isOpen) {
        // Cloud has no open shift, push local open shift to cloud
        supabase.from('shifts').upsert([{
          id: localCurrentShift.id,
          opened_at: localCurrentShift.openedAt,
          cashier_name: localCurrentShift.cashierName,
          initial_cash: localCurrentShift.initialCash,
          is_open: true,
          sales_count: localCurrentShift.salesCount,
          total_revenue: localCurrentShift.totalRevenue,
          total_cash: localCurrentShift.totalCash,
          total_card: localCurrentShift.totalCard,
          total_transfer: localCurrentShift.totalTransfer,
          sales: localCurrentShift.sales
        }]).catch(console.error);
      }

      // Merge shift history by ID
      const shiftHistoryMap = new Map();
      closedShifts.forEach(s => {
        shiftHistoryMap.set(s.id, {
          id: s.id,
          openedAt: s.opened_at,
          closedAt: s.closed_at,
          cashierName: s.cashier_name,
          initialCash: Number(s.initial_cash),
          isOpen: false,
          salesCount: Number(s.sales_count),
          totalRevenue: Number(s.total_revenue),
          totalCash: Number(s.total_cash),
          totalCard: Number(s.total_card),
          totalTransfer: Number(s.total_transfer),
          actualPhysicalCash: Number(s.actual_physical_cash),
          expectedCash: Number(s.expected_cash),
          discrepancy: Number(s.discrepancy),
          notes: s.notes || ''
        });
      });

      localShiftHistory.forEach(s => {
        if (!shiftHistoryMap.has(s.id)) {
          shiftHistoryMap.set(s.id, s);
        }
      });

      const mergedHistory = Array.from(shiftHistoryMap.values()).sort((a, b) => new Date(b.openedAt) - new Date(a.openedAt));
      setStorageItem(KEYS.SHIFT_HISTORY, mergedHistory);
    } else if (localCurrentShift && localCurrentShift.isOpen) {
      // Cloud is empty, push local shift
      supabase.from('shifts').upsert([{
        id: localCurrentShift.id,
        opened_at: localCurrentShift.openedAt,
        cashier_name: localCurrentShift.cashierName,
        initial_cash: localCurrentShift.initialCash,
        is_open: true,
        sales_count: localCurrentShift.salesCount,
        total_revenue: localCurrentShift.totalRevenue,
        total_cash: localCurrentShift.totalCash,
        total_card: localCurrentShift.totalCard,
        total_transfer: localCurrentShift.totalTransfer,
        sales: localCurrentShift.sales
      }]).catch(console.error);
    }
  } catch (e) {
    console.error('Error fetching cloud data from Supabase', e);
  }
};

export const resetToOfficialMenu = () => {
  setStorageItem(KEYS.PRODUCTS, INITIAL_PRODUCTS);
  setStorageItem(KEYS.INSUMOS, INITIAL_INSUMOS);
  if (isSupabaseConfigured) {
    supabase.from('products').upsert(INITIAL_PRODUCTS).catch(console.error);
    const insumosPayload = INITIAL_INSUMOS.map(i => ({
      id: i.id,
      name: i.name,
      unit: i.unit,
      stock: i.stock,
      min_stock: i.minStock,
      yield_note: i.yieldNote || ''
    }));
    supabase.from('insumos').upsert(insumosPayload).catch(console.error);
  }
  return { products: INITIAL_PRODUCTS, insumos: INITIAL_INSUMOS };
};

export const getInsumos = () => getStorageItem(KEYS.INSUMOS, INITIAL_INSUMOS);

export const saveInsumos = (insumos) => {
  setStorageItem(KEYS.INSUMOS, insumos);
  if (isSupabaseConfigured) {
    const payload = insumos.map(i => ({
      id: i.id,
      name: i.name,
      unit: i.unit,
      stock: i.stock,
      min_stock: i.minStock,
      yield_note: i.yieldNote || ''
    }));
    supabase.from('insumos').upsert(payload).catch(console.error);
  }
};

export const updateInsumoStock = (insumoId, quantityDelta) => {
  const insumos = getInsumos();
  const updated = insumos.map(ins => {
    if (ins.id === insumoId) {
      const newStock = Math.max(0, Number((ins.stock + quantityDelta).toFixed(3)));
      return { ...ins, stock: newStock };
    }
    return ins;
  });
  saveInsumos(updated);
  return updated;
};

export const getProducts = () => getStorageItem(KEYS.PRODUCTS, INITIAL_PRODUCTS);

export const saveProducts = (products) => {
  setStorageItem(KEYS.PRODUCTS, products);
  if (isSupabaseConfigured) {
    supabase.from('products').upsert(products).catch(console.error);
  }
};

export const getSales = () => getStorageItem(KEYS.SALES, []);

export const addSale = (saleData) => {
  const sales = getSales();
  const cleanSubtotal = Number(Number(saleData.subtotal || 0).toFixed(2));
  const cleanDiscountPercent = Number(Number(saleData.discountPercent || 0).toFixed(2));
  const cleanDiscountAmount = Number(Number(saleData.discountAmount || 0).toFixed(2));
  const cleanTipPercent = Number(Number(saleData.tipPercent || 0).toFixed(2));
  const cleanTipAmount = Number(Number(saleData.tipAmount || 0).toFixed(2));
  const cleanTotal = Number(Number(saleData.total || 0).toFixed(2));

  const newSale = {
    id: `MST-${Date.now().toString().slice(-6)}`,
    timestamp: new Date().toISOString(),
    ...saleData,
    subtotal: cleanSubtotal,
    discountPercent: cleanDiscountPercent,
    discountAmount: cleanDiscountAmount,
    tipPercent: cleanTipPercent,
    tipAmount: cleanTipAmount,
    total: cleanTotal
  };
  const updatedSales = [newSale, ...sales];
  setStorageItem(KEYS.SALES, updatedSales);

  let insumos = getInsumos();
  const products = getProducts();

  if (Array.isArray(saleData.items)) {
    saleData.items.forEach(cartItem => {
      const product = products.find(p => p.id === cartItem.id);
      if (product && product.recipe && Array.isArray(product.recipe)) {
        product.recipe.forEach(recipeItem => {
          const requiredAmount = (Number(recipeItem.quantity) || 0) * (Number(cartItem.quantity) || 1);
          insumos = insumos.map(ins => {
            if (ins.id === recipeItem.insumoId) {
              const newStock = Math.max(0, Number(((Number(ins.stock) || 0) - requiredAmount).toFixed(3)));
              return { ...ins, stock: newStock };
            }
            return ins;
          });
        });
      }
    });
  }

  saveInsumos(insumos);

  const currentShift = getCurrentShift();
  let updatedShift = null;
  if (currentShift && currentShift.isOpen) {
    const shiftSales = currentShift.sales || [];
    updatedShift = {
      ...currentShift,
      salesCount: (Number(currentShift.salesCount) || 0) + 1,
      totalRevenue: Number(((Number(currentShift.totalRevenue) || 0) + cleanTotal).toFixed(2)),
      totalCash: Number(((Number(currentShift.totalCash) || 0) + (saleData.paymentMethod === 'Efectivo' ? cleanTotal : 0)).toFixed(2)),
      totalCard: Number(((Number(currentShift.totalCard) || 0) + (saleData.paymentMethod === 'Tarjeta' ? cleanTotal : 0)).toFixed(2)),
      totalTransfer: Number(((Number(currentShift.totalTransfer) || 0) + (saleData.paymentMethod === 'Transferencia' ? cleanTotal : 0)).toFixed(2)),
      sales: [newSale, ...shiftSales]
    };
    saveCurrentShift(updatedShift);
  }

  // Push to Supabase if configured
  if (isSupabaseConfigured) {
    supabase.from('sales').insert([{
      id: newSale.id,
      timestamp: newSale.timestamp,
      items: newSale.items || [],
      subtotal: cleanSubtotal,
      discount_percent: cleanDiscountPercent,
      discount_amount: cleanDiscountAmount,
      tip_percent: cleanTipPercent,
      tip_amount: cleanTipAmount,
      total: cleanTotal,
      payment_method: newSale.paymentMethod || 'Efectivo',
      shift_id: updatedShift ? updatedShift.id : null
    }]).catch(console.error);

    if (updatedShift) {
      supabase.from('shifts').upsert([{
        id: updatedShift.id,
        opened_at: updatedShift.openedAt,
        cashier_name: updatedShift.cashierName,
        initial_cash: updatedShift.initialCash,
        is_open: true,
        sales_count: updatedShift.salesCount,
        total_revenue: updatedShift.totalRevenue,
        total_cash: updatedShift.totalCash,
        total_card: updatedShift.totalCard,
        total_transfer: updatedShift.totalTransfer,
        sales: updatedShift.sales
      }]).catch(console.error);
    }
  }

  return { newSale, updatedInsumos: insumos };
};

export const getCurrentShift = () => getStorageItem(KEYS.CURRENT_SHIFT, null);

export const saveCurrentShift = (shift) => {
  setStorageItem(KEYS.CURRENT_SHIFT, shift);
  if (isSupabaseConfigured && shift) {
    supabase.from('shifts').upsert([{
      id: shift.id,
      opened_at: shift.openedAt,
      cashier_name: shift.cashierName,
      initial_cash: shift.initialCash,
      is_open: shift.isOpen,
      sales_count: shift.salesCount,
      total_revenue: shift.totalRevenue,
      total_cash: shift.totalCash,
      total_card: shift.totalCard,
      total_transfer: shift.totalTransfer,
      sales: shift.sales
    }]).catch(console.error);
  }
};

export const openShift = (initialCash, cashierName = 'Cajero Turno') => {
  const shift = {
    id: `SHIFT-${Date.now().toString().slice(-6)}`,
    openedAt: new Date().toISOString(),
    cashierName,
    initialCash: Number(Number(initialCash || 0).toFixed(2)),
    isOpen: true,
    salesCount: 0,
    totalRevenue: 0,
    totalCash: 0,
    totalCard: 0,
    totalTransfer: 0,
    sales: []
  };
  saveCurrentShift(shift);
  return shift;
};

export const closeShift = (actualPhysicalCash, notes = '') => {
  const current = getCurrentShift();
  if (!current) return null;

  const initCash = Number(current.initialCash) || 0;
  const tCash = Number(current.totalCash) || 0;
  const expectedCash = Number((initCash + tCash).toFixed(2));
  const actualNum = Number(Number(actualPhysicalCash || 0).toFixed(2));
  const discrepancy = Number((actualNum - expectedCash).toFixed(2));

  const closedShift = {
    ...current,
    isOpen: false,
    closedAt: new Date().toISOString(),
    actualPhysicalCash: actualNum,
    expectedCash,
    discrepancy,
    notes: notes || ''
  };

  const history = getStorageItem(KEYS.SHIFT_HISTORY, []);
  setStorageItem(KEYS.SHIFT_HISTORY, [closedShift, ...history]);
  setStorageItem(KEYS.CURRENT_SHIFT, null);

  if (isSupabaseConfigured) {
    supabase.from('shifts').upsert([{
      id: closedShift.id,
      opened_at: closedShift.openedAt,
      closed_at: closedShift.closedAt,
      cashier_name: closedShift.cashierName,
      initial_cash: closedShift.initialCash,
      is_open: false,
      sales_count: closedShift.salesCount,
      total_revenue: closedShift.totalRevenue,
      total_cash: closedShift.totalCash,
      total_card: closedShift.totalCard,
      total_transfer: closedShift.totalTransfer,
      sales: closedShift.sales,
      actual_physical_cash: closedShift.actualPhysicalCash,
      expected_cash: closedShift.expectedCash,
      discrepancy: closedShift.discrepancy,
      notes: closedShift.notes
    }]).catch(console.error);
  }

  return closedShift;
};

export const getShiftHistory = () => getStorageItem(KEYS.SHIFT_HISTORY, []);

export const getPrinterSettings = () => getStorageItem(KEYS.PRINTER, INITIAL_PRINTER_SETTINGS);

export const savePrinterSettings = (settings) => {
  setStorageItem(KEYS.PRINTER, settings);
  if (isSupabaseConfigured) {
    supabase.from('printer_settings').upsert([{
      id: 'default',
      paper_width: settings.paperWidth || '80mm',
      header_title: settings.headerTitle || 'MESTIZO COMEDOR & BAR',
      header_subtitle: settings.headerSubtitle || 'Tacos, Tortas, Chelas & Cocteles',
      footer_message: settings.footerMessage || '¡Gracias por tu visita! Vuelve pronto.',
      auto_print: Boolean(settings.autoPrint)
    }]).catch(console.error);
  }
};

// --- TABLE & KITCHEN / BAR TICKET HELPERS ---

export const getTableOrders = () => {
  return getStorageItem(KEYS.TABLE_ORDERS, INITIAL_TABLES);
};

export const saveTableOrders = (tables) => {
  setStorageItem(KEYS.TABLE_ORDERS, tables);
};

export const getKitchenTickets = () => {
  return getStorageItem(KEYS.KITCHEN_TICKETS, []);
};

export const saveKitchenTickets = (tickets) => {
  setStorageItem(KEYS.KITCHEN_TICKETS, tickets);
};

export const sendOrderToKitchenAndBar = (tableNumber, waiterName, itemsToDispatch, tableNotes = '') => {
  const currentTickets = getKitchenTickets();
  const timestamp = new Date().toISOString();

  // Separate kitchen items (food) vs bar items (drinks, cocktails, beers, mezcalitas, cantaritos)
  const isDrinkItem = (item) => {
    const cat = (item.category || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const name = (item.name || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    const barKeywords = [
      'miche', 'coctel', 'chela', 'cerveza', 'bebida', 'trago', 'refresco',
      'mezcal', 'cantarito', 'mojito', 'paloma', 'azulito', 'margarita',
      'caguama', 'shot', 'gin', 'whisky', 'ron', 'vodka', 'tequila',
      'boing', 'agua', 'jugo', 'sin alcohol', 'bar', 'barra'
    ];

    return barKeywords.some(keyword => cat.includes(keyword) || name.includes(keyword));
  };

  const kitchenItems = itemsToDispatch.filter(item => !isDrinkItem(item));
  const barItems = itemsToDispatch.filter(item => isDrinkItem(item));

  const newTickets = [...currentTickets];

  if (kitchenItems.length > 0) {
    newTickets.unshift({
      id: `ticket_k_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type: 'kitchen',
      tableNumber,
      waiterName,
      items: kitchenItems.map(i => ({ ...i, isDone: false })),
      notes: tableNotes,
      status: 'pending',
      createdAt: timestamp
    });
  }

  if (barItems.length > 0) {
    newTickets.unshift({
      id: `ticket_b_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type: 'bar',
      tableNumber,
      waiterName,
      items: barItems.map(i => ({ ...i, isDone: false })),
      notes: tableNotes,
      status: 'pending',
      createdAt: timestamp
    });
  }

  saveKitchenTickets(newTickets);
  return newTickets;
};

export const sendCancellationNoticeToKitchenAndBar = (tableNumber, waiterName, cancelledItemName, qty, reason = '') => {
  const currentTickets = getKitchenTickets();
  const timestamp = new Date().toISOString();

  // Create cancellation notices for both Kitchen and Bar so staff is immediately alerted
  const cancelKitchenTicket = {
    id: `cancel_k_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    type: 'kitchen',
    isCancellationAlert: true,
    tableNumber,
    waiterName,
    items: [{ name: cancelledItemName, quantity: qty, note: `❌ CANCELADO POR MESERO: ${reason || 'Cancelación de orden'}`, isDone: false }],
    notes: `⚠️ ALERTA: CANCELAR ${qty}x ${cancelledItemName}`,
    status: 'pending',
    createdAt: timestamp
  };

  const cancelBarTicket = {
    id: `cancel_b_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    type: 'bar',
    isCancellationAlert: true,
    tableNumber,
    waiterName,
    items: [{ name: cancelledItemName, quantity: qty, note: `❌ CANCELADO POR MESERO: ${reason || 'Cancelación de orden'}`, isDone: false }],
    notes: `⚠️ ALERTA: CANCELAR ${qty}x ${cancelledItemName}`,
    status: 'pending',
    createdAt: timestamp
  };

  const updatedTickets = [cancelKitchenTicket, cancelBarTicket, ...currentTickets];
  saveKitchenTickets(updatedTickets);
  return updatedTickets;
};

export const DEFAULT_PRESET_TAGS = {
  general: ['Sin salsa', 'Salsa aparte', 'Para llevar', 'Bien cocido', 'Término medio', 'Sin sal', 'Extra salsa', 'Empaque individual'],
  tacos: ['Sin cebolla', 'Sin cilantro', 'Con todo (Normal)', 'Limón extra', 'Salsa aparte', 'Doble tortilla', 'Para llevar'],
  bebidas: ['Sin hielo', 'Poco hielo', 'Hielo extra', 'Sin popote', 'Sin azúcar', 'Con poco chile', 'Sin chile', 'Limón extra', 'Para llevar'],
  botanas: ['Salsa aparte', 'Extra queso', 'Sin queso', 'Sin crema', 'Bien doradas', 'Sin sal', 'Para llevar']
};

export const getPresetTags = () => {
  return getStorageItem(KEYS.PRESET_TAGS, DEFAULT_PRESET_TAGS);
};

export const savePresetTags = (tags) => {
  setStorageItem(KEYS.PRESET_TAGS, tags);
};

// --- ACTIVE CART PERSISTENCE (Prevents loss on refresh) ---
export const getActiveCart = () => {
  return getStorageItem(KEYS.ACTIVE_CART, []);
};

export const saveActiveCart = (cartItems) => {
  setStorageItem(KEYS.ACTIVE_CART, cartItems);
};

export const clearActiveCart = () => {
  setStorageItem(KEYS.ACTIVE_CART, []);
};

// --- MULTI-USER / MULTI-WAITER HELPERS ---
export const DEFAULT_WAITERS = [
  { id: 'w1', name: 'Carlos R.', role: 'Mesero', color: '#E07A5F' },
  { id: 'w2', name: 'Mariana S.', role: 'Mesera', color: '#2A9D8F' },
  { id: 'w3', name: 'Jorge M.', role: 'Mesero', color: '#E76F51' },
  { id: 'w4', name: 'Andrea L.', role: 'Capitana', color: '#F4A261' }
];

export const getWaitersList = () => {
  return getStorageItem('mestizo_pos_waiters_list', DEFAULT_WAITERS);
};

export const saveWaitersList = (waiters) => {
  setStorageItem('mestizo_pos_waiters_list', waiters);
};

import React, { useState, useEffect } from 'react';
import { 
  Utensils, 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  Send, 
  CreditCard, 
  Clock, 
  User, 
  Users,
  AlertCircle, 
  CheckCircle2, 
  MessageSquare, 
  ChevronRight, 
  RefreshCw, 
  X, 
  Printer, 
  FileText,
  Sparkles,
  ChevronLeft,
  ShoppingBag,
  Check,
  Tag
} from 'lucide-react';
import { 
  sendOrderToKitchenAndBar, 
  sendCancellationNoticeToKitchenAndBar, 
  saveTableOrders, 
  calculateProductPortions, 
  getPresetTags,
  getWaitersList,
  saveWaitersList
} from '../utils/storage';

export default function TableManagementView({
  tables,
  setTables,
  products,
  insumos = [],
  categories = [],
  currentUser,
  onSendToCheckout
}) {
  const [selectedTable, setSelectedTable] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [tableFilter, setTableFilter] = useState('all'); // 'all' | 'mine' | 'occupied' | 'free'
  const [mobileTab, setMobileTab] = useState('catalog'); // 'catalog' | 'order'
  const [successMessage, setSuccessMessage] = useState('');
  const [preCuentaModal, setPreCuentaModal] = useState(null);
  const [showWaiterSelector, setShowWaiterSelector] = useState(false);

  // Multi-waiter profiles
  const [waiters, setWaiters] = useState(() => getWaitersList());
  const [activeWaiter, setActiveWaiter] = useState(() => {
    return currentUser?.fullName || currentUser?.email?.split('@')[0] || 'Mesero 1';
  });

  // Quick Instant Customizer state
  const [quickAddProduct, setQuickAddProduct] = useState(null);
  const [selectedBeer, setSelectedBeer] = useState(null);
  const [selectedChips, setSelectedChips] = useState([]);
  const [customNoteText, setCustomNoteText] = useState('');
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth <= 768 : false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const presetTags = getPresetTags();

  // Beer options available for micheladas in Table Management
  const beerOptions = [
    { name: 'XX Lager', insumoId: 'ins-015', sku: 'CER-01' },
    { name: 'Tecate Light', insumoId: 'ins-016', sku: 'CER-02' },
    { name: 'Indio', insumoId: 'ins-017', sku: 'CER-03' },
    { name: 'Michelob Ultra', insumoId: 'ins-018', sku: 'CER-04' }
  ].map(b => {
    const ins = insumos.find(i => i.id === b.insumoId);
    const currentStock = ins ? Number(ins.stock) || 0 : 0;
    return { ...b, stock: currentStock };
  });

  const isMicheProduct = (product) => {
    if (!product) return false;
    const cat = (product.category || '').toLowerCase();
    const name = (product.name || '').toLowerCase();
    return cat.includes('miche') || name.includes('michelada') || name.includes('chelada');
  };

  // Filter products for adding to table
  const filteredProducts = products.filter(p => {
    const matchCat = selectedCategory === 'Todos' || p.category === selectedCategory;
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  // Filter tables for Salon Map
  const filteredTables = tables.filter(t => {
    if (tableFilter === 'mine') return t.waiterName === activeWaiter && t.status !== 'free';
    if (tableFilter === 'occupied') return t.status === 'occupied' || t.status === 'checkout';
    if (tableFilter === 'free') return t.status === 'free';
    return true; // 'all'
  });

  // Helper to persist table updates immediately
  const persistTableChange = (updatedTable) => {
    const updatedTables = tables.map(t => t.tableNumber === updatedTable.tableNumber ? updatedTable : t);
    setTables(updatedTables);
    saveTableOrders(updatedTables);
    setSelectedTable(updatedTable);
  };

  const handleSelectTable = (table) => {
    const freshTable = JSON.parse(JSON.stringify(table));
    // If opening a free table, assign active waiter automatically
    if (freshTable.status === 'free') {
      freshTable.waiterName = activeWaiter;
    }
    setSelectedTable(freshTable);
    setSearchQuery('');
    setSelectedCategory('Todos');
    setMobileTab(freshTable.items && freshTable.items.length > 0 ? 'order' : 'catalog');
  };

  const handleOpenQuickAdd = (product) => {
    const available = calculateProductPortions(product, insumos);
    if (available <= 0) {
      alert(`El producto "${product.name}" está agotado por falta de insumos en bodega.`);
      return;
    }
    setQuickAddProduct(product);
    setSelectedChips([]);
    setCustomNoteText('');

    if (isMicheProduct(product)) {
      const firstAvailableBeer = beerOptions.find(b => b.stock > 0) || beerOptions[0];
      setSelectedBeer(firstAvailableBeer);
    } else {
      setSelectedBeer(null);
    }
  };

  const toggleChip = (chipText) => {
    if (chipText === 'Con todo (Normal)') {
      setSelectedChips([]);
      return;
    }
    setSelectedChips(prev => 
      prev.includes(chipText) ? prev.filter(c => c !== chipText) : [...prev, chipText]
    );
  };

  const handleConfirmQuickAdd = () => {
    if (!quickAddProduct) return;
    const notesArray = [];
    
    let beerName = '';
    let beerInsumoId = null;

    if (isMicheProduct(quickAddProduct) && selectedBeer) {
      if (selectedBeer.stock <= 0) {
        alert(`La cerveza seleccionada (${selectedBeer.name}) está agotada en stock. Por favor elige otra cerveza.`);
        return;
      }
      notesArray.push(`Cerveza: ${selectedBeer.name}`);
      beerName = selectedBeer.name;
      beerInsumoId = selectedBeer.insumoId;
    }

    selectedChips.forEach(c => notesArray.push(c));
    if (customNoteText.trim()) notesArray.push(customNoteText.trim());
    const finalNote = notesArray.join(', ');

    handleAddItemToTable({
      ...quickAddProduct,
      selectedBeerName: beerName,
      selectedBeerInsumoId: beerInsumoId,
      note: finalNote
    });

    setQuickAddProduct(null);
    setSelectedBeer(null);
    setSelectedChips([]);
    setCustomNoteText('');
  };

  const handleAddItemToTable = (product) => {
    if (!selectedTable) return;
    const available = calculateProductPortions(product, insumos);
    if (available <= 0) return;

    const existingIndex = selectedTable.items.findIndex(
      i => i.id === product.id && (i.note || '') === (product.note || '')
    );
    let updatedItems = [...selectedTable.items];

    if (existingIndex >= 0) {
      if (updatedItems[existingIndex].quantity >= available) {
        alert(`Stock máximo alcanzado para "${product.name}" (${available} porciones).`);
        return;
      }
      updatedItems[existingIndex].quantity += 1;
    } else {
      updatedItems.push({
        id: product.id,
        name: product.name,
        price: product.price,
        category: product.category,
        sku: product.sku,
        image: product.image,
        quantity: 1,
        note: product.note || '',
        dispatchedQuantity: 0 // quantity already sent to kitchen/bar
      });
    }

    const updatedTable = {
      ...selectedTable,
      status: selectedTable.status === 'free' ? 'occupied' : selectedTable.status,
      waiterName: selectedTable.waiterName || activeWaiter,
      createdAt: selectedTable.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      items: updatedItems
    };

    persistTableChange(updatedTable);
    
    // Quick feedback
    setSuccessMessage(`+1 ${product.name} agregado a Mesa ${updatedTable.tableNumber}`);
    setTimeout(() => setSuccessMessage(''), 2000);
  };

  const handleUpdateItemQuantity = (itemIndex, delta) => {
    if (!selectedTable) return;
    const item = selectedTable.items[itemIndex];
    if (!item) return;

    // If decreasing and item was already dispatched, ask for confirmation
    if (delta < 0 && (item.dispatchedQuantity || 0) >= item.quantity) {
      handleCancelItem(itemIndex);
      return;
    }

    const newQty = item.quantity + delta;
    let updatedItems = [...selectedTable.items];

    if (newQty <= 0) {
      updatedItems.splice(itemIndex, 1);
    } else {
      const product = products.find(p => p.id === item.id) || item;
      const available = calculateProductPortions(product, insumos);
      if (newQty > available) {
        alert(`Stock máximo alcanzado para "${item.name}" (${available} porciones).`);
        return;
      }
      updatedItems[itemIndex] = { ...item, quantity: newQty };
    }

    const updatedTable = {
      ...selectedTable,
      status: updatedItems.length === 0 ? 'free' : selectedTable.status,
      updatedAt: new Date().toISOString(),
      items: updatedItems
    };

    persistTableChange(updatedTable);
  };

  const handleDispatchToKitchenAndBar = () => {
    if (!selectedTable || selectedTable.items.length === 0) return;

    const newItemsToDispatch = selectedTable.items.map(item => {
      const pendingQty = item.quantity - (item.dispatchedQuantity || 0);
      if (pendingQty > 0) {
        return { ...item, quantity: pendingQty };
      }
      return null;
    }).filter(Boolean);

    if (newItemsToDispatch.length === 0) {
      alert('Todos los productos de esta mesa ya fueron enviados previamente a Cocina / Barra.');
      return;
    }

    sendOrderToKitchenAndBar(
      selectedTable.tableNumber, 
      selectedTable.waiterName || activeWaiter, 
      newItemsToDispatch, 
      selectedTable.notes
    );

    const updatedTableItems = selectedTable.items.map(item => ({
      ...item,
      dispatchedQuantity: item.quantity
    }));

    const updatedTable = {
      ...selectedTable,
      items: updatedTableItems,
      status: 'occupied',
      waiterName: selectedTable.waiterName || activeWaiter,
      updatedAt: new Date().toISOString()
    };

    persistTableChange(updatedTable);
    setSuccessMessage(`🚀 ¡Comanda de Mesa ${updatedTable.tableNumber} enviada a Cocina y Barra!`);
    setTimeout(() => setSuccessMessage(''), 3500);
  };

  const handleCancelItem = (itemIndex) => {
    if (!selectedTable) return;
    const item = selectedTable.items[itemIndex];
    if (!item) return;

    const dispatchedQty = item.dispatchedQuantity || 0;
    const isDispatched = dispatchedQty > 0;

    let reason = '';
    if (isDispatched) {
      const userInput = prompt(
        `⚠️ El producto "${item.name}" ya fue enviado a Cocina / Barra (${dispatchedQty} pzas).\n\nEscribe el motivo de cancelación:`, 
        'Cliente canceló'
      );
      if (userInput === null) return;
      reason = userInput.trim() || 'Cancelación de platillo';

      sendCancellationNoticeToKitchenAndBar(
        selectedTable.tableNumber,
        selectedTable.waiterName || activeWaiter,
        item.name,
        item.quantity,
        reason
      );
    }

    const updatedItems = [...selectedTable.items];
    updatedItems.splice(itemIndex, 1);

    const updatedTable = {
      ...selectedTable,
      status: updatedItems.length === 0 ? 'free' : selectedTable.status,
      updatedAt: new Date().toISOString(),
      items: updatedItems
    };

    persistTableChange(updatedTable);
    setSuccessMessage(`❌ Platillo "${item.name}" cancelado en Mesa ${selectedTable.tableNumber}.`);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handlePrintPreCuenta = () => {
    if (!selectedTable || selectedTable.items.length === 0) return;
    const subtotal = selectedTable.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    setPreCuentaModal({
      tableNumber: selectedTable.tableNumber,
      waiterName: selectedTable.waiterName || activeWaiter,
      items: selectedTable.items,
      subtotal,
      date: new Date().toISOString()
    });
  };

  const handleSendToCheckoutCashier = () => {
    if (!selectedTable || selectedTable.items.length === 0) return;
    const subtotal = selectedTable.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    onSendToCheckout({
      tableNumber: selectedTable.tableNumber,
      waiterName: selectedTable.waiterName || activeWaiter,
      cart: selectedTable.items,
      subtotal,
      discountPercent: 0,
      discountAmount: 0,
      tipPercent: 0,
      tipAmount: 0,
      total: subtotal
    });

    const updatedTable = {
      ...selectedTable,
      status: 'checkout',
      updatedAt: new Date().toISOString()
    };

    persistTableChange(updatedTable);
    setSelectedTable(null);
  };

  const handleFreeTable = (tableNumber) => {
    if (confirm(`¿Liberar Mesa ${tableNumber}? Se cerrará y limpiará la cuenta activa.`)) {
      const resetTable = {
        id: tableNumber,
        tableNumber,
        name: `Mesa ${tableNumber}`,
        status: 'free',
        waiterName: '',
        items: [],
        notes: '',
        createdAt: null,
        updatedAt: null
      };
      persistTableChange(resetTable);
      if (selectedTable && selectedTable.tableNumber === tableNumber) {
        setSelectedTable(null);
      }
    }
  };

  const handleAddNewWaiter = () => {
    const name = prompt('Nombre del nuevo mesero/a:');
    if (!name || !name.trim()) return;
    const cleanName = name.trim();
    if (waiters.some(w => w.name.toLowerCase() === cleanName.toLowerCase())) {
      setActiveWaiter(cleanName);
      return;
    }
    const colors = ['#E07A5F', '#2A9D8F', '#E76F51', '#F4A261', '#3D405B', '#81B29A'];
    const newWaiter = {
      id: `w_${Date.now()}`,
      name: cleanName,
      role: 'Mesero',
      color: colors[waiters.length % colors.length]
    };
    const updated = [...waiters, newWaiter];
    setWaiters(updated);
    saveWaitersList(updated);
    setActiveWaiter(cleanName);
    setShowWaiterSelector(false);
  };

  const getCategoryEmoji = (c) => {
    const norm = (c || '').toLowerCase();
    if (norm.includes('taco')) return '🌮';
    if (norm.includes('torta')) return '🥪';
    if (norm.includes('volcan')) return '🌋';
    if (norm.includes('botana')) return '🍟';
    if (norm.includes('cerveza') || norm.includes('chela')) return '🍺';
    if (norm.includes('miche')) return '🍹';
    if (norm.includes('coctel')) return '🍸';
    if (norm.includes('sin alcohol') || norm.includes('refresco')) return '🥤';
    if (norm.includes('postre') || norm.includes('antojo')) return '🍰';
    return '🍽️';
  };

  const getPresetOptionsForProduct = (product) => {
    const cat = (product.category || '').toLowerCase();
    if (cat.includes('taco')) return presetTags.tacos || [];
    if (cat.includes('cerveza') || cat.includes('coctel') || cat.includes('miche') || cat.includes('bebida') || cat.includes('sin alcohol')) return presetTags.bebidas || [];
    if (cat.includes('botana')) return presetTags.botanas || [];
    return presetTags.general || [];
  };

  const tableSubtotal = selectedTable ? selectedTable.items.reduce((sum, i) => sum + (i.price * i.quantity), 0) : 0;
  const tablePendingItems = selectedTable ? selectedTable.items.reduce((sum, i) => sum + (i.quantity - (i.dispatchedQuantity || 0)), 0) : 0;
  const totalTableItemsCount = selectedTable ? selectedTable.items.reduce((sum, i) => sum + i.quantity, 0) : 0;

  return (
    <div style={{ 
      padding: isMobile ? '0.75rem' : '1.25rem', 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '1rem', 
      flex: 1, 
      width: '100%', 
      minWidth: 0,
      boxSizing: 'border-box'
    }}>
      
      {/* Top Header & Multi-Waiter Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem',
        backgroundColor: '#FFFFFF',
        padding: '0.85rem 1.1rem',
        borderRadius: '16px',
        border: '1px solid var(--sand-border)',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--terracotta)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              SALÓN & MULTI-MESERO • SIN LÍMITES
            </span>
          </div>
          <h1 style={{ fontSize: isMobile ? '1.4rem' : '1.7rem', fontWeight: 800, color: 'var(--dark-text)', margin: 0 }}>
            Control de Mesas
          </h1>
        </div>

        {/* Active Waiter Selector Capsule */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => setShowWaiterSelector(prev => !prev)}
            style={{
              backgroundColor: 'var(--sand-muted)',
              border: '1.5px solid var(--sand-border)',
              padding: '6px 12px',
              borderRadius: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.88rem',
              color: 'var(--dark-text)',
              transition: 'all 0.2s ease'
            }}
          >
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              backgroundColor: 'var(--terracotta)',
              color: '#FFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.85rem',
              fontWeight: 800
            }}>
              {activeWaiter.charAt(0).toUpperCase()}
            </div>
            <span>Mesero: <strong>{activeWaiter}</strong></span>
            <ChevronRight size={14} style={{ transform: showWaiterSelector ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
          </button>
        </div>
      </div>

      {/* Waiter Switcher Dropdown Modal */}
      {showWaiterSelector && (
        <div className="animate-fade-in" style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '14px',
          padding: '1rem',
          border: '1px solid var(--sand-border)',
          boxShadow: 'var(--shadow-md)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--dark-subdued)', textTransform: 'uppercase' }}>
            Selecciona tu perfil de mesero para registrar comandas:
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {waiters.map(w => {
              const isSelected = w.name === activeWaiter;
              return (
                <button
                  key={w.id || w.name}
                  onClick={() => {
                    setActiveWaiter(w.name);
                    setShowWaiterSelector(false);
                  }}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '20px',
                    border: isSelected ? '2px solid var(--terracotta)' : '1px solid var(--sand-border)',
                    backgroundColor: isSelected ? 'var(--terracotta)' : 'var(--sand-muted)',
                    color: isSelected ? '#FFF' : 'var(--dark-text)',
                    fontWeight: 700,
                    fontSize: '0.86rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  {isSelected && <Check size={14} />}
                  <span>{w.name}</span>
                </button>
              );
            })}
            <button
              onClick={handleAddNewWaiter}
              style={{
                padding: '8px 14px',
                borderRadius: '20px',
                border: '1px dashed var(--terracotta)',
                backgroundColor: '#FFF',
                color: 'var(--terracotta)',
                fontWeight: 700,
                fontSize: '0.86rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Plus size={14} />
              <span>+ Nuevo Mesero</span>
            </button>
          </div>
        </div>
      )}

      {/* Global Success Notification */}
      {successMessage && (
        <div className="animate-fade-in" style={{
          backgroundColor: '#E8F5E9',
          color: '#2E7D32',
          border: '1px solid #C8E6C9',
          padding: '10px 16px',
          borderRadius: '12px',
          fontSize: '0.92rem',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <CheckCircle2 size={18} />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Mobile-Friendly Filter Bar (All / Mine / Occupied / Free) */}
      <div style={{
        display: 'flex',
        gap: '6px',
        overflowX: 'auto',
        paddingBottom: '2px',
        alignItems: 'center'
      }} className="no-scrollbar">
        {[
          { key: 'all', label: 'Todas las Mesas', count: tables.length },
          { key: 'mine', label: `Mis Mesas (${activeWaiter.split(' ')[0]})`, count: tables.filter(t => t.waiterName === activeWaiter && t.status !== 'free').length },
          { key: 'occupied', label: 'Ocupadas', count: tables.filter(t => t.status === 'occupied' || t.status === 'checkout').length },
          { key: 'free', label: 'Libres', count: tables.filter(t => t.status === 'free').length }
        ].map(filter => {
          const isActive = tableFilter === filter.key;
          return (
            <button
              key={filter.key}
              onClick={() => setTableFilter(filter.key)}
              style={{
                padding: '8px 14px',
                borderRadius: '12px',
                border: isActive ? '2px solid var(--terracotta)' : '1px solid var(--sand-border)',
                backgroundColor: isActive ? 'var(--terracotta)' : '#FFFFFF',
                color: isActive ? '#FFFFFF' : 'var(--dark-text)',
                fontWeight: 700,
                fontSize: '0.84rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: isActive ? '0 2px 8px rgba(199, 91, 57, 0.25)' : 'var(--shadow-sm)',
                transition: 'all 0.15s ease'
              }}
            >
              <span>{filter.label}</span>
              <span style={{
                backgroundColor: isActive ? 'rgba(255,255,255,0.25)' : 'var(--sand-muted)',
                color: isActive ? '#FFF' : 'var(--dark-subdued)',
                padding: '1px 6px',
                borderRadius: '8px',
                fontSize: '0.75rem',
                fontWeight: 800
              }}>
                {filter.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Grid of 20 Mobile-Optimized Tables */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(160px, 1fr))',
        gap: '0.75rem'
      }}>
        {filteredTables.map(table => {
          const isOccupied = table.status === 'occupied';
          const isCheckout = table.status === 'checkout';
          const subtotal = table.items.reduce((sum, i) => sum + (i.price * i.quantity), 0);
          const pendingItemsCount = table.items.reduce((sum, i) => sum + (i.quantity - (i.dispatchedQuantity || 0)), 0);
          const totalItems = table.items.reduce((sum, i) => sum + i.quantity, 0);

          return (
            <div
              key={table.tableNumber}
              onClick={() => handleSelectTable(table)}
              className="animate-fade-in"
              style={{
                backgroundColor: isOccupied ? '#FFFFFF' : (isCheckout ? '#FFF9C4' : 'var(--sand-bg)'),
                border: isOccupied ? '2px solid var(--terracotta)' : (isCheckout ? '2px solid #FBC02D' : '1.5px solid var(--sand-border)'),
                borderRadius: '16px',
                padding: '0.85rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                cursor: 'pointer',
                boxShadow: isOccupied ? '0 4px 12px rgba(199, 91, 57, 0.12)' : 'var(--shadow-sm)',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                position: 'relative',
                minHeight: '125px',
                userSelect: 'none',
                WebkitTapHighlightColor: 'transparent'
              }}
            >
              {/* Header card: Number & Dot */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--dark-text)' }}>
                  {table.name}
                </span>

                <span style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  backgroundColor: isOccupied ? 'var(--terracotta)' : (isCheckout ? '#FBC02D' : 'var(--success)')
                }} />
              </div>

              {/* Status & details */}
              {isOccupied || isCheckout ? (
                <div style={{ marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--dark-subdued)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                    <User size={12} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {table.waiterName || 'Mesero'}
                    </span>
                  </div>

                  <div style={{ fontSize: '1.15rem', fontWeight: 900, color: 'var(--terracotta)' }}>
                    ${subtotal.toFixed(2)}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.72rem', fontWeight: 700 }}>
                    <span style={{ color: 'var(--dark-subdued)' }}>{totalItems} items</span>
                    <span style={{ color: pendingItemsCount > 0 ? '#D84315' : 'var(--success)' }}>
                      {pendingItemsCount > 0 ? `⌛ ${pendingItemsCount} p/enviar` : '✅ Al día'}
                    </span>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '10px 0', gap: '4px' }}>
                  <span style={{ fontSize: '1.1rem' }}>🟢</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--dark-subdued)', fontWeight: 700 }}>
                    Libre • Tocar
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* FULLSCREEN MOBILE & DESKTOP TABLE ORDER MODAL */}
      {selectedTable && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(28, 43, 34, 0.7)',
          backdropFilter: 'blur(4px)',
          zIndex: 150,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: isMobile ? '0' : '1rem'
        }}>
          <div className="animate-fade-in" style={{
            backgroundColor: '#FFFFFF',
            borderRadius: isMobile ? '0' : '20px',
            width: '100%',
            maxWidth: '1000px',
            height: isMobile ? '100vh' : '90vh',
            maxHeight: isMobile ? '100vh' : '90vh',
            boxShadow: 'var(--shadow-lg)',
            border: isMobile ? 'none' : '1px solid var(--sand-border)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            position: 'relative'
          }}>
            
            {/* Modal Top Navigation Bar */}
            <div style={{
              padding: '0.85rem 1rem',
              borderBottom: '1px solid var(--sand-border)',
              backgroundColor: 'var(--sand-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={() => setSelectedTable(null)}
                  style={{
                    border: 'none',
                    backgroundColor: '#FFF',
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  <ChevronLeft size={20} color="var(--dark-text)" />
                </button>
                <div>
                  <h2 style={{ fontSize: '1.15rem', fontWeight: 900, color: 'var(--dark-text)', margin: 0 }}>
                    Mesa #{selectedTable.tableNumber}
                  </h2>
                  <span style={{ fontSize: '0.75rem', color: 'var(--dark-subdued)' }}>
                    Atiende: <strong>{selectedTable.waiterName || activeWaiter}</strong>
                  </span>
                </div>
              </div>

              {/* Action Buttons Top */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {selectedTable.items.length > 0 && (
                  <>
                    <button
                      onClick={handlePrintPreCuenta}
                      title="Imprimir Pre-cuenta"
                      style={{
                        padding: '6px 10px',
                        borderRadius: '8px',
                        border: '1px solid var(--sand-border)',
                        backgroundColor: '#FFF',
                        color: 'var(--dark-text)',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Printer size={14} />
                      <span className="hide-on-mobile">Pre-cuenta</span>
                    </button>

                    <button
                      onClick={handleSendToCheckoutCashier}
                      style={{
                        padding: '7px 12px',
                        borderRadius: '8px',
                        border: 'none',
                        backgroundColor: 'var(--forest)',
                        color: '#FFF',
                        fontSize: '0.82rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        boxShadow: '0 2px 6px rgba(46, 125, 50, 0.3)'
                      }}
                    >
                      <CreditCard size={14} />
                      <span>Cobrar</span>
                    </button>
                  </>
                )}

                <button
                  onClick={() => handleFreeTable(selectedTable.tableNumber)}
                  title="Liberar mesa"
                  style={{
                    padding: '6px 8px',
                    borderRadius: '8px',
                    border: '1px solid #FFCDD2',
                    backgroundColor: '#FFEBEE',
                    color: '#C62828',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Liberar
                </button>
              </div>
            </div>

            {/* Mobile Tab Switcher: "Catálogo / Agregar" vs "Comanda Mesa" */}
            <div style={{
              display: 'flex',
              borderBottom: '1px solid var(--sand-border)',
              backgroundColor: '#FFFFFF',
              flexShrink: 0
            }}>
              <button
                onClick={() => setMobileTab('catalog')}
                style={{
                  flex: 1,
                  padding: '11px',
                  border: 'none',
                  borderBottom: mobileTab === 'catalog' ? '3px solid var(--terracotta)' : '3px solid transparent',
                  backgroundColor: mobileTab === 'catalog' ? '#FFF5F0' : '#FFFFFF',
                  color: mobileTab === 'catalog' ? 'var(--terracotta)' : 'var(--dark-subdued)',
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <Plus size={16} />
                <span>+ Agregar Platillos</span>
              </button>

              <button
                onClick={() => setMobileTab('order')}
                style={{
                  flex: 1,
                  padding: '11px',
                  border: 'none',
                  borderBottom: mobileTab === 'order' ? '3px solid var(--terracotta)' : '3px solid transparent',
                  backgroundColor: mobileTab === 'order' ? '#FFF5F0' : '#FFFFFF',
                  color: mobileTab === 'order' ? 'var(--terracotta)' : 'var(--dark-subdued)',
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  position: 'relative'
                }}
              >
                <ShoppingBag size={16} />
                <span>Comanda (${tableSubtotal.toFixed(2)})</span>
                {totalTableItemsCount > 0 && (
                  <span style={{
                    backgroundColor: 'var(--terracotta)',
                    color: '#FFF',
                    borderRadius: '10px',
                    padding: '1px 6px',
                    fontSize: '0.72rem',
                    fontWeight: 800
                  }}>
                    {totalTableItemsCount}
                  </span>
                )}
              </button>
            </div>

            {/* Modal Body: Responsive Tabs */}
            <div style={{
              flex: 1,
              minHeight: 0,
              display: 'flex',
              overflow: 'hidden',
              flexDirection: isMobile ? 'column' : 'row'
            }}>
              
              {/* TAB 1: PRODUCT CATALOG PICKER (Visible when mobileTab === 'catalog' or on desktop) */}
              <div style={{
                flex: '1 1 58%',
                borderRight: isMobile ? 'none' : '1px solid var(--sand-border)',
                padding: '0.85rem',
                display: (isMobile && mobileTab !== 'catalog') ? 'none' : 'flex',
                flexDirection: 'column',
                height: '100%',
                minHeight: 0,
                overflow: 'hidden',
                backgroundColor: '#FAFAF8'
              }}>
                {/* Search & Categories Bar */}
                <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '8px' }}>
                  <div style={{ position: 'relative', width: '100%' }}>
                    <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--dark-subdued)' }} />
                    <input
                      type="text"
                      placeholder="Buscar platillo, taco, chela..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px 10px 36px',
                        borderRadius: '12px',
                        border: '1.5px solid var(--sand-border)',
                        backgroundColor: '#FFFFFF',
                        fontSize: '0.92rem',
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

                  {/* Horizontal Scroll Categories */}
                  <div style={{
                    display: 'flex',
                    gap: '6px',
                    overflowX: 'auto',
                    paddingBottom: '4px',
                    alignItems: 'center'
                  }} className="no-scrollbar">
                    {categories.map(cat => {
                      const isSelected = selectedCategory === cat;
                      return (
                        <button
                          key={cat}
                          onClick={() => setSelectedCategory(cat)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '20px',
                            border: isSelected ? '2px solid var(--terracotta)' : '1px solid var(--sand-border)',
                            backgroundColor: isSelected ? 'var(--terracotta)' : '#FFFFFF',
                            color: isSelected ? '#FFFFFF' : 'var(--dark-text)',
                            fontSize: '0.82rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <span>{getCategoryEmoji(cat)}</span>
                          <span>{cat}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Products Grid */}
                <div style={{
                  flex: 1,
                  minHeight: 0,
                  overflowY: 'auto',
                  display: 'grid',
                  gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(135px, 1fr))',
                  gap: '0.65rem',
                  paddingRight: '2px',
                  paddingBottom: '80px'
                }}>
                  {filteredProducts.map(product => {
                    const availablePortions = calculateProductPortions(product, insumos);
                    const isOutOfStock = availablePortions <= 0;

                    return (
                      <div
                        key={product.id}
                        onClick={() => !isOutOfStock && handleOpenQuickAdd(product)}
                        style={{
                          backgroundColor: '#FFFFFF',
                          border: isOutOfStock ? '1px dashed #E0E0E0' : '1px solid var(--sand-border)',
                          borderRadius: '14px',
                          padding: '0.75rem',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                          opacity: isOutOfStock ? 0.6 : 1,
                          boxShadow: 'var(--shadow-sm)',
                          transition: 'transform 0.12s ease',
                          minHeight: '95px',
                          position: 'relative'
                        }}
                      >
                        <div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--terracotta)', fontWeight: 700 }}>
                            {product.sku}
                          </div>
                          <h4 style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--dark-text)', margin: '2px 0 4px 0', lineHeight: 1.2 }}>
                            {product.name}
                          </h4>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px' }}>
                          <span style={{ fontSize: '1rem', fontWeight: 900, color: 'var(--terracotta)' }}>
                            ${product.price}
                          </span>
                          
                          <div style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            backgroundColor: isOutOfStock ? '#E0E0E0' : 'var(--terracotta)',
                            color: '#FFF',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            {isOutOfStock ? <X size={14} /> : <Plus size={16} />}
                          </div>
                        </div>

                        {isOutOfStock && (
                          <div style={{ fontSize: '0.68rem', color: '#D84315', fontWeight: 800, marginTop: '2px' }}>
                            Agotado
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* TAB 2: ACTIVE ORDER LIST (Visible when mobileTab === 'order' or on desktop) */}
              <div style={{
                flex: '1 1 42%',
                display: (isMobile && mobileTab !== 'order') ? 'none' : 'flex',
                flexDirection: 'column',
                height: '100%',
                minHeight: 0,
                backgroundColor: '#FFFFFF'
              }}>
                {/* Header of Order List */}
                <div style={{
                  padding: '0.75rem 1rem',
                  borderBottom: '1px solid var(--sand-border)',
                  backgroundColor: 'var(--sand-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexShrink: 0
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 800, color: 'var(--dark-text)' }}>
                    <ShoppingBag size={16} color="var(--terracotta)" />
                    <span>Platillos en Comanda ({totalTableItemsCount})</span>
                  </div>
                  {tablePendingItems > 0 && (
                    <span style={{
                      backgroundColor: '#FFF3E0',
                      color: '#E65100',
                      padding: '2px 8px',
                      borderRadius: '10px',
                      fontSize: '0.75rem',
                      fontWeight: 800
                    }}>
                      ⌛ {tablePendingItems} por enviar
                    </span>
                  )}
                </div>

                {/* Items List */}
                <div style={{
                  flex: 1,
                  minHeight: 0,
                  overflowY: 'auto',
                  padding: '0.75rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.6rem',
                  paddingBottom: '85px'
                }}>
                  {selectedTable.items.length === 0 ? (
                    <div style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--dark-subdued)',
                      gap: '8px',
                      padding: '2rem 1rem',
                      textAlign: 'center'
                    }}>
                      <Utensils size={36} color="var(--sand-border)" />
                      <p style={{ margin: 0, fontWeight: 700, fontSize: '0.95rem' }}>Esta mesa no tiene platillos agregados aún.</p>
                      <button
                        onClick={() => setMobileTab('catalog')}
                        style={{
                          backgroundColor: 'var(--terracotta)',
                          color: '#FFF',
                          border: 'none',
                          padding: '8px 16px',
                          borderRadius: '12px',
                          fontWeight: 800,
                          fontSize: '0.85rem',
                          cursor: 'pointer',
                          marginTop: '6px'
                        }}
                      >
                        + Ver Menú y Agregar Platillos
                      </button>
                    </div>
                  ) : (
                    selectedTable.items.map((item, idx) => {
                      const dispatched = item.dispatchedQuantity || 0;
                      const isPending = item.quantity > dispatched;

                      return (
                        <div
                          key={`${item.id}_${idx}`}
                          style={{
                            backgroundColor: '#FAFAF8',
                            border: isPending ? '1.5px solid #FFE0B2' : '1px solid var(--sand-border)',
                            borderRadius: '12px',
                            padding: '0.65rem 0.8rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '4px'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--dark-text)' }}>
                              {item.name}
                            </div>
                            <div style={{ fontWeight: 900, fontSize: '0.95rem', color: 'var(--terracotta)' }}>
                              ${(item.price * item.quantity).toFixed(2)}
                            </div>
                          </div>

                          {/* Notes badge */}
                          {item.note && (
                            <div style={{
                              fontSize: '0.75rem',
                              color: '#C75B39',
                              backgroundColor: '#FFF0EA',
                              padding: '2px 8px',
                              borderRadius: '6px',
                              fontWeight: 700,
                              alignSelf: 'flex-start'
                            }}>
                              📝 {item.note}
                            </div>
                          )}

                          {/* Controls row */}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <span style={{
                                fontSize: '0.72rem',
                                fontWeight: 800,
                                color: isPending ? '#E65100' : 'var(--success)',
                                backgroundColor: isPending ? '#FFF8E1' : '#E8F5E9',
                                padding: '2px 6px',
                                borderRadius: '6px'
                              }}>
                                {isPending ? `⌛ ${item.quantity - dispatched} sin enviar` : '✅ En Cocina'}
                              </span>
                            </div>

                            {/* Quantity buttons */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <button
                                onClick={() => handleUpdateItemQuantity(idx, -1)}
                                style={{
                                  width: '30px',
                                  height: '30px',
                                  borderRadius: '8px',
                                  border: '1px solid var(--sand-border)',
                                  backgroundColor: '#FFF',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer'
                                }}
                              >
                                {item.quantity === 1 ? <Trash2 size={14} color="var(--danger)" /> : <Minus size={14} />}
                              </button>

                              <span style={{ fontSize: '0.95rem', fontWeight: 900, minWidth: '20px', textAlign: 'center' }}>
                                {item.quantity}
                              </span>

                              <button
                                onClick={() => handleUpdateItemQuantity(idx, 1)}
                                style={{
                                  width: '30px',
                                  height: '30px',
                                  borderRadius: '8px',
                                  border: '1px solid var(--sand-border)',
                                  backgroundColor: '#FFF',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer'
                                }}
                              >
                                <Plus size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* STICKY BOTTOM ACTION BAR (Accessible with thumb on phone) */}
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              backgroundColor: '#FFFFFF',
              borderTop: '1px solid var(--sand-border)',
              padding: '0.75rem 1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px',
              boxShadow: '0 -4px 16px rgba(0,0,0,0.08)',
              zIndex: 10
            }}>
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--dark-subdued)', fontWeight: 800, textTransform: 'uppercase' }}>
                  Total Mesa {selectedTable.tableNumber}
                </span>
                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--terracotta)', lineHeight: 1 }}>
                  ${tableSubtotal.toFixed(2)}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', flex: 1, justifyContent: 'flex-end' }}>
                {tablePendingItems > 0 && (
                  <button
                    onClick={handleDispatchToKitchenAndBar}
                    style={{
                      flex: 1,
                      maxWidth: '280px',
                      backgroundColor: 'var(--terracotta)',
                      color: '#FFFFFF',
                      border: 'none',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      fontSize: '0.92rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 12px rgba(199, 91, 57, 0.3)'
                    }}
                  >
                    <Send size={16} />
                    <span>Enviar a Cocina ({tablePendingItems})</span>
                  </button>
                )}

                {tablePendingItems === 0 && selectedTable.items.length > 0 && (
                  <button
                    onClick={handleSendToCheckoutCashier}
                    style={{
                      flex: 1,
                      maxWidth: '280px',
                      backgroundColor: 'var(--forest)',
                      color: '#FFFFFF',
                      border: 'none',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      fontSize: '0.92rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 12px rgba(46, 125, 50, 0.3)'
                    }}
                  >
                    <CreditCard size={16} />
                    <span>Cobrar Cuenta en Caja</span>
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* QUICK INSTANT CUSTOMIZER MODAL */}
      {quickAddProduct && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(28, 43, 34, 0.75)',
          backdropFilter: 'blur(3px)',
          zIndex: 200,
          display: 'flex',
          alignItems: isMobile ? 'flex-end' : 'center',
          justifyContent: 'center',
          padding: isMobile ? '0' : '1rem'
        }}>
          <div className="animate-fade-in" style={{
            backgroundColor: '#FFFFFF',
            borderRadius: isMobile ? '24px 24px 0 0' : '20px',
            width: '100%',
            maxWidth: '480px',
            padding: '1.25rem',
            boxShadow: 'var(--shadow-lg)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--terracotta)', textTransform: 'uppercase' }}>
                  {isMicheProduct(quickAddProduct) ? '🍺 PERSONALIZAR MICHELADA' : 'PERSONALIZAR PARA COCINA'}
                </span>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--dark-text)', margin: '2px 0 0 0' }}>
                  {quickAddProduct.name}
                </h3>
              </div>
              <button
                onClick={() => setQuickAddProduct(null)}
                style={{
                  border: 'none',
                  backgroundColor: 'var(--sand-muted)',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Beer Selector if Michelada/Chelada */}
            {isMicheProduct(quickAddProduct) && (
              <div style={{
                backgroundColor: 'var(--sand-bg)',
                padding: '10px 12px',
                borderRadius: '14px',
                border: '1.5px solid var(--sand-border)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--dark-text)', margin: 0 }}>
                    🍻 Elige la Cerveza base (En Stock):
                  </label>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--terracotta)' }}>
                    {selectedBeer ? `${selectedBeer.name} (${selectedBeer.stock} pzas)` : 'Selecciona una'}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                  {beerOptions.map(beer => {
                    const isSelected = selectedBeer?.insumoId === beer.insumoId;
                    const isOutOfStock = beer.stock <= 0;

                    return (
                      <button
                        key={beer.insumoId}
                        type="button"
                        disabled={isOutOfStock}
                        onClick={() => setSelectedBeer(beer)}
                        style={{
                          padding: '10px 8px',
                          borderRadius: '12px',
                          border: isSelected ? '2px solid var(--terracotta)' : '1.5px solid var(--sand-border)',
                          backgroundColor: isSelected ? '#FFF0EA' : (isOutOfStock ? '#F5F5F5' : '#FFFFFF'),
                          color: isOutOfStock ? '#999' : (isSelected ? 'var(--terracotta)' : 'var(--dark-text)'),
                          fontWeight: isSelected ? 800 : 700,
                          fontSize: '0.84rem',
                          cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '3px',
                          opacity: isOutOfStock ? 0.6 : 1,
                          boxShadow: isSelected ? '0 2px 8px rgba(199, 91, 57, 0.2)' : 'none',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {isSelected && <Check size={14} color="var(--terracotta)" />}
                          <span>{beer.name}</span>
                        </div>
                        <span style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          color: isOutOfStock ? 'var(--danger)' : (beer.stock <= 5 ? 'var(--warning)' : 'var(--forest)')
                        }}>
                          {isOutOfStock ? '❌ Agotada' : `📦 Stock: ${beer.stock}`}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Modifiers Chips Bar */}
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--dark-text)', display: 'block', marginBottom: '8px' }}>
                Modificadores Rápidos Táctiles:
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {getPresetOptionsForProduct(quickAddProduct).map(chip => {
                  const isSelected = selectedChips.includes(chip);
                  return (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => toggleChip(chip)}
                      style={{
                        padding: '8px 14px',
                        borderRadius: '20px',
                        border: isSelected ? '2px solid var(--terracotta)' : '1px solid var(--sand-border)',
                        backgroundColor: isSelected ? '#FFF0EA' : '#FFFFFF',
                        color: isSelected ? 'var(--terracotta)' : 'var(--dark-text)',
                        fontWeight: 700,
                        fontSize: '0.84rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      {isSelected && <Check size={14} />}
                      <span>{chip}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom note input */}
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--dark-text)', display: 'block', marginBottom: '6px' }}>
                Instrucción Especial Escrita:
              </label>
              <input
                type="text"
                placeholder="Ej. salsa verde aparte, extra cebollita..."
                value={customNoteText}
                onChange={(e) => setCustomNoteText(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '12px',
                  border: '1.5px solid var(--sand-border)',
                  fontSize: '0.9rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Confirm Add Button */}
            <button
              onClick={handleConfirmQuickAdd}
              style={{
                backgroundColor: 'var(--terracotta)',
                color: '#FFFFFF',
                border: 'none',
                padding: '14px',
                borderRadius: '14px',
                fontSize: '0.95rem',
                fontWeight: 900,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(199, 91, 57, 0.3)'
              }}
            >
              <Plus size={18} />
              <span>Agregar a Mesa #{selectedTable.tableNumber} • ${quickAddProduct.price}</span>
            </button>
          </div>
        </div>
      )}

      {/* PRE-CUENTA PRINT / PREVIEW MODAL */}
      {preCuentaModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(28, 43, 34, 0.75)',
          backdropFilter: 'blur(3px)',
          zIndex: 210,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <div className="animate-fade-in" style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '380px',
            padding: '1.5rem',
            boxShadow: 'var(--shadow-lg)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            fontFamily: 'monospace'
          }}>
            <div style={{ textAlign: 'center', borderBottom: '1px dashed #CCC', paddingBottom: '10px' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: 'var(--dark-text)' }}>
                MESTIZO COMEDOR & BAR
              </h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: '#666' }}>
                *** PRE-CUENTA / CONSUMO ***
              </p>
              <div style={{ marginTop: '6px', fontSize: '0.85rem', fontWeight: 700 }}>
                MESA #{preCuentaModal.tableNumber} • Mesero: {preCuentaModal.waiterName}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#888' }}>
                {new Date(preCuentaModal.date).toLocaleString('es-MX')}
              </div>
            </div>

            {/* Items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '200px', overflowY: 'auto' }}>
              {preCuentaModal.items.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span>{item.quantity}x {item.name}</span>
                  <span style={{ fontWeight: 700 }}>${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div style={{ borderTop: '1px dashed #CCC', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', fontSize: '1.15rem', fontWeight: 900 }}>
              <span>TOTAL:</span>
              <span style={{ color: 'var(--terracotta)' }}>${preCuentaModal.subtotal.toFixed(2)}</span>
            </div>

            <div style={{ textAlign: 'center', fontSize: '0.75rem', color: '#777', marginTop: '4px' }}>
              * Este documento no es un comprobante fiscal *
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <button
                onClick={() => setPreCuentaModal(null)}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '10px',
                  border: '1px solid var(--sand-border)',
                  backgroundColor: '#FFF',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Cerrar
              </button>
              <button
                onClick={() => {
                  window.print();
                  setPreCuentaModal(null);
                }}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: 'var(--terracotta)',
                  color: '#FFF',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <Printer size={16} />
                <span>Imprimir</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

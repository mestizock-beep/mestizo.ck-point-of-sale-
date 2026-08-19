import React, { useState } from 'react';
import { Utensils, Search, Plus, Minus, Trash2, Send, CreditCard, Clock, User, AlertCircle, CheckCircle2, MessageSquare, ChevronRight, RefreshCw, X, Printer, FileText } from 'lucide-react';
import { sendOrderToKitchenAndBar, sendCancellationNoticeToKitchenAndBar, saveTableOrders, calculateProductPortions } from '../utils/storage';

export default function TableManagementView({
  tables,
  setTables,
  products,
  insumos = [],
  categories,
  currentUser,
  onSendToCheckout
}) {
  const [selectedTable, setSelectedTable] = useState(null); // table object
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [itemNoteModal, setItemNoteModal] = useState(null); // item
  const [noteInput, setNoteInput] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [preCuentaModal, setPreCuentaModal] = useState(null);

  // Quick Instant Customizer state
  const [quickAddProduct, setQuickAddProduct] = useState(null);
  const [selectedChips, setSelectedChips] = useState([]);
  const [customNoteText, setCustomNoteText] = useState('');

  const currentWaiterName = currentUser?.fullName || currentUser?.email?.split('@')[0] || 'Mesero';

  // Filter products for adding to table
  const filteredProducts = products.filter(p => {
    const matchCat = selectedCategory === 'Todos' || p.category === selectedCategory;
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const handleOpenQuickAdd = (product) => {
    const available = calculateProductPortions(product, insumos);
    if (available <= 0) {
      alert(`El producto "${product.name}" está agotado por falta de insumos en bodega.`);
      return;
    }
    setQuickAddProduct(product);
    setSelectedChips([]);
    setCustomNoteText('');
  };

  const toggleChip = (chipText) => {
    if (chipText === 'Con todo (Normal)') {
      setSelectedChips([]);
      return;
    }
    setSelectedChips(prev => {
      if (prev.includes(chipText)) {
        return prev.filter(c => c !== chipText);
      } else {
        return [...prev, chipText];
      }
    });
  };

  const handleConfirmQuickAdd = () => {
    if (!quickAddProduct) return;
    const notesArray = [...selectedChips];
    if (customNoteText.trim()) notesArray.push(customNoteText.trim());
    const finalNote = notesArray.join(', ');

    handleAddItemToTable({
      ...quickAddProduct,
      note: finalNote
    });

    setQuickAddProduct(null);
    setSelectedChips([]);
    setCustomNoteText('');
  };

  const handleSelectTable = (table) => {
    // Clone table object to local active state
    setSelectedTable(JSON.parse(JSON.stringify(table)));
    setSearchQuery('');
    setSelectedCategory('Todos');
  };

  const handleAddItemToTable = (product) => {
    if (!selectedTable) return;
    if (product.stock <= 0) return;

    setSelectedTable(prev => {
      const existingIndex = prev.items.findIndex(i => i.id === product.id && i.note === (product.note || ''));
      let updatedItems = [...prev.items];
      if (existingIndex >= 0) {
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
          note: '',
          dispatchedQuantity: 0 // quantity already sent to kitchen
        });
      }
      return {
        ...prev,
        status: prev.status === 'free' ? 'occupied' : prev.status,
        waiterName: prev.waiterName || currentWaiterName,
        createdAt: prev.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        items: updatedItems
      };
    });
  };

  const handleUpdateItemQuantity = (itemIndex, delta) => {
    if (!selectedTable) return;
    setSelectedTable(prev => {
      const updated = [...prev.items];
      const newQty = updated[itemIndex].quantity + delta;
      if (newQty <= 0) {
        updated.splice(itemIndex, 1);
      } else {
        updated[itemIndex].quantity = newQty;
      }
      return {
        ...prev,
        updatedAt: new Date().toISOString(),
        items: updated
      };
    });
  };

  const handleSaveItemNote = () => {
    if (!selectedTable || itemNoteModal === null) return;
    setSelectedTable(prev => {
      const updated = [...prev.items];
      if (updated[itemNoteModal]) {
        updated[itemNoteModal].note = noteInput;
      }
      return { ...prev, items: updated };
    });
    setItemNoteModal(null);
    setNoteInput('');
  };

  const handleDispatchToKitchenAndBar = () => {
    if (!selectedTable || selectedTable.items.length === 0) return;

    // Find items with pending dispatch quantity
    const newItemsToDispatch = selectedTable.items.map(item => {
      const pendingQty = item.quantity - (item.dispatchedQuantity || 0);
      if (pendingQty > 0) {
        return {
          ...item,
          quantity: pendingQty
        };
      }
      return null;
    }).filter(Boolean);

    if (newItemsToDispatch.length === 0) {
      alert('Todos los productos de esta mesa ya fueron enviados previamente a Cocina / Barra.');
      return;
    }

    // Send tickets
    sendOrderToKitchenAndBar(selectedTable.tableNumber, selectedTable.waiterName || currentWaiterName, newItemsToDispatch, selectedTable.notes);

    // Update dispatched quantities
    const updatedTableItems = selectedTable.items.map(item => ({
      ...item,
      dispatchedQuantity: item.quantity
    }));

    const updatedTable = {
      ...selectedTable,
      items: updatedTableItems,
      status: 'occupied',
      waiterName: selectedTable.waiterName || currentWaiterName,
      updatedAt: new Date().toISOString()
    };

    // Save to global tables array
    const updatedTables = tables.map(t => t.tableNumber === updatedTable.tableNumber ? updatedTable : t);
    setTables(updatedTables);
    setSelectedTable(updatedTable);

    setSuccessMessage(`¡Comanda de Mesa ${updatedTable.tableNumber} enviada a Cocina y Barra!`);
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
      const userInput = prompt(`⚠️ El producto "${item.name}" ya fue enviado previamente a Cocina / Barra (${dispatchedQty} pzas).\n\nEscribe el motivo de la cancelación para notificar al cocinero/barman:`, 'Cliente cambió de opinión');
      if (userInput === null) return; // Waiter clicked cancel
      reason = userInput.trim() || 'Cancelación por cliente';

      // Send cancellation notice ticket to Kitchen & Bar immediately
      sendCancellationNoticeToKitchenAndBar(
        selectedTable.tableNumber,
        selectedTable.waiterName || currentWaiterName,
        item.name,
        item.quantity,
        reason
      );
    }

    // Remove item from active table
    setSelectedTable(prev => {
      const updated = [...prev.items];
      updated.splice(itemIndex, 1);
      const updatedTable = {
        ...prev,
        status: updated.length === 0 ? 'free' : prev.status,
        updatedAt: new Date().toISOString(),
        items: updated
      };
      saveTableOrders(tables.map(t => t.tableNumber === updatedTable.tableNumber ? updatedTable : t));
      return updatedTable;
    });

    setSuccessMessage(`❌ Producto "${item.name}" cancelado y removido de la Mesa ${selectedTable.tableNumber}.`);
    setTimeout(() => setSuccessMessage(''), 3500);
  };

  const handleCancelEntireTableOrder = () => {
    if (!selectedTable) return;
    const hasDispatched = selectedTable.items.some(i => (i.dispatchedQuantity || 0) > 0);

    const confirmMsg = hasDispatched
      ? `⚠️ ¿CANCELAR Y ANULAR TODA LA MESA ${selectedTable.tableNumber}?\n\nEsta mesa tiene comandas enviadas a Cocina/Barra. Se enviará una ALERTA DE CANCELACIÓN urgente a Cocina y Barra para detener la preparación.`
      : `¿Estás seguro de cancelar y limpiar toda la Mesa ${selectedTable.tableNumber}?`;

    if (!confirm(confirmMsg)) return;

    if (hasDispatched) {
      const reason = prompt('Motivo de la cancelación de la mesa completa:', 'Mesa canceló su consumo') || 'Mesa cancelada';
      selectedTable.items.forEach(item => {
        if ((item.dispatchedQuantity || 0) > 0) {
          sendCancellationNoticeToKitchenAndBar(
            selectedTable.tableNumber,
            selectedTable.waiterName || currentWaiterName,
            item.name,
            item.dispatchedQuantity,
            reason
          );
        }
      });
    }

    const resetTable = {
      tableNumber: selectedTable.tableNumber,
      status: 'free',
      waiterName: '',
      items: [],
      notes: '',
      createdAt: null,
      updatedAt: null
    };

    const updatedTables = tables.map(t => t.tableNumber === resetTable.tableNumber ? resetTable : t);
    setTables(updatedTables);
    setSelectedTable(null);
    setSuccessMessage(`🚫 Mesa ${resetTable.tableNumber} cancelada y liberada.`);
    setTimeout(() => setSuccessMessage(''), 3500);
  };

  const handlePrintPreCuenta = () => {
    if (!selectedTable || selectedTable.items.length === 0) return;
    const subtotal = selectedTable.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    setPreCuentaModal({
      tableNumber: selectedTable.tableNumber,
      waiterName: selectedTable.waiterName || currentWaiterName,
      items: selectedTable.items,
      subtotal,
      date: new Date().toISOString()
    });
  };

  const handleSendToCheckoutCashier = () => {
    if (!selectedTable || selectedTable.items.length === 0) return;

    const subtotal = selectedTable.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Call cashier checkout callback (No automatic tip)
    onSendToCheckout({
      tableNumber: selectedTable.tableNumber,
      waiterName: selectedTable.waiterName || currentWaiterName,
      cart: selectedTable.items,
      subtotal,
      discountPercent: 0,
      discountAmount: 0,
      tipPercent: 0,
      tipAmount: 0,
      total: subtotal
    });

    // Mark table in checkout status
    const updatedTable = {
      ...selectedTable,
      status: 'checkout',
      updatedAt: new Date().toISOString()
    };

    const updatedTables = tables.map(t => t.tableNumber === updatedTable.tableNumber ? updatedTable : t);
    setTables(updatedTables);
    setSelectedTable(null);
  };

  const handleFreeTable = (tableNumber) => {
    if (confirm(`¿Estás seguro de liberar la Mesa ${tableNumber}? Se borrará la cuenta activa.`)) {
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

      const updatedTables = tables.map(t => t.tableNumber === tableNumber ? resetTable : t);
      setTables(updatedTables);
      if (selectedTable && selectedTable.tableNumber === tableNumber) {
        setSelectedTable(null);
      }
    }
  };

  return (
    <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', flex: 1, width: '100%', minWidth: 0 }}>
      
      {/* Header Banner */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--terracotta)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            CONTROL DE SALÓN & COMANDAS
          </span>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--dark-text)' }}>
            20 Mesas • Cuentas Abiertas
          </h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.85rem', fontWeight: 700 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--success)' }} />
            <span>Mesa Libre ({tables.filter(t => t.status === 'free').length})</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--terracotta)' }} />
            <span>Mesa Ocupada ({tables.filter(t => t.status === 'occupied').length})</span>
          </div>
        </div>
      </div>

      {successMessage && (
        <div className="animate-fade-in" style={{
          backgroundColor: 'var(--success-bg)',
          color: 'var(--success)',
          border: '1px solid #C8E6C9',
          padding: '12px 16px',
          borderRadius: 'var(--radius-md)',
          fontSize: '0.92rem',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <CheckCircle2 size={20} />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Grid of 20 Tables */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
        gap: '1rem'
      }}>
        {tables.map(table => {
          const isOccupied = table.status === 'occupied';
          const isCheckout = table.status === 'checkout';
          const subtotal = table.items.reduce((sum, i) => sum + (i.price * i.quantity), 0);
          const pendingItemsCount = table.items.reduce((sum, i) => sum + (i.quantity - (i.dispatchedQuantity || 0)), 0);

          return (
            <div
              key={table.tableNumber}
              onClick={() => handleSelectTable(table)}
              className="animate-fade-in"
              style={{
                backgroundColor: isOccupied ? '#FFF' : (isCheckout ? '#FFF9C4' : 'var(--sand-bg)'),
                border: isOccupied ? '2px solid var(--terracotta)' : (isCheckout ? '2px solid #FBC02D' : '1px solid var(--sand-border)'),
                borderRadius: 'var(--radius-md)',
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                cursor: 'pointer',
                boxShadow: isOccupied ? 'var(--shadow-md)' : 'var(--shadow-sm)',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                position: 'relative',
                minHeight: '130px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--dark-text)' }}>
                  {table.name}
                </span>

                <span style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  backgroundColor: isOccupied ? 'var(--terracotta)' : (isCheckout ? '#FBC02D' : 'var(--success)')
                }} />
              </div>

              {isOccupied || isCheckout ? (
                <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--dark-subdued)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <User size={12} />
                    <span>{table.waiterName || 'Mesero'}</span>
                  </div>

                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--terracotta)' }}>
                    ${subtotal.toFixed(2)}
                  </div>

                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: pendingItemsCount > 0 ? 'var(--danger)' : 'var(--success)' }}>
                    {pendingItemsCount > 0 ? `⌛ ${pendingItemsCount} por enviar` : '✅ Todo enviado'}
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: '0.82rem', color: 'var(--dark-subdued)', fontWeight: 600, marginTop: '12px' }}>
                  🟢 Disponible
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Table Order Editor Modal */}
      {selectedTable && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(3px)',
          zIndex: 150,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <div className="animate-fade-in" style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 'var(--radius-lg)',
            width: '100%',
            maxWidth: '900px',
            maxHeight: '92vh',
            boxShadow: 'var(--shadow-lg)',
            border: '1px solid var(--sand-border)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            
            {/* Modal Header */}
            <div style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid var(--sand-border)',
              backgroundColor: 'var(--sand-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Utensils size={24} color="var(--terracotta)" />
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--dark-text)' }}>
                    Comanda - Mesa {selectedTable.tableNumber}
                  </h2>
                  <span style={{ fontSize: '0.8rem', color: 'var(--dark-subdued)' }}>
                    Atendida por: <strong>{selectedTable.waiterName || currentWaiterName}</strong>
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {selectedTable.items.length > 0 && (
                  <button
                    onClick={() => handleFreeTable(selectedTable.tableNumber)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--sand-border)',
                      backgroundColor: '#FFF',
                      color: 'var(--danger)',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Liberar Mesa
                  </button>
                )}

                <button
                  onClick={() => {
                    // Persist current state of selectedTable before closing
                    if (selectedTable) {
                      const updatedTables = tables.map(t => t.tableNumber === selectedTable.tableNumber ? selectedTable : t);
                      setTables(updatedTables);
                      saveTableOrders(updatedTables);
                    }
                    setSelectedTable(null);
                  }}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    border: '1px solid var(--sand-border)',
                    backgroundColor: '#FFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Body: Split view (Left: Product Catalog Picker, Right: Active Table Items) */}
            <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
              
              {/* Left Column: Products Selector (Fixed Header + Scrollable Grid) */}
              <div style={{
                flex: '1 1 55%',
                borderRight: '1px solid var(--sand-border)',
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                minHeight: 0,
                overflow: 'hidden'
              }}>
                
                {/* Search & Categories Fixed Top Header */}
                <div style={{
                  flexShrink: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  backgroundColor: 'var(--sand-muted)',
                  padding: '0.85rem',
                  borderRadius: '12px',
                  border: '1px solid var(--sand-border)',
                  marginBottom: '0.85rem'
                }}>
                  {/* Search Box */}
                  <div style={{ position: 'relative', width: '100%' }}>
                    <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--dark-subdued)' }} />
                    <input
                      type="text"
                      placeholder="Buscar platillo, bebida o SKU..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '9px 12px 9px 36px',
                        borderRadius: '8px',
                        border: '1px solid var(--sand-border)',
                        backgroundColor: '#FFFFFF',
                        fontSize: '0.9rem',
                        outline: 'none'
                      }}
                    />
                  </div>

                  {/* Categories Pills Bar */}
                  <div style={{
                    display: 'flex',
                    gap: '6px',
                    overflowX: 'auto',
                    paddingBottom: '2px',
                    alignItems: 'center'
                  }} className="no-scrollbar">
                    {categories.map(cat => {
                      const getEmoji = (c) => {
                        if (c === 'Botanas') return '🍟';
                        if (c === 'Tacos') return '🌮';
                        if (c === 'Volcanes') return '🌋';
                        if (c === 'Tortas') return '🥪';
                        if (c === 'Especiales') return '⭐';
                        if (c === 'Cervezas') return '🍺';
                        if (c === 'Miches') return '🍹';
                        if (c === 'Cócteles') return '🍸';
                        if (c === 'Sin Alcohol') return '🥤';
                        if (c === 'El Último Antojo') return '🍰';
                        return '🍽️';
                      };

                      const isSelected = selectedCategory === cat;

                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setSelectedCategory(cat)}
                          style={{
                            padding: '6px 13px',
                            borderRadius: '16px',
                            border: isSelected ? '2px solid var(--terracotta)' : '1px solid var(--sand-border)',
                            backgroundColor: isSelected ? 'var(--terracotta)' : '#FFFFFF',
                            color: isSelected ? '#FFFFFF' : 'var(--dark-text)',
                            fontSize: '0.82rem',
                            fontWeight: 800,
                            whiteSpace: 'nowrap',
                            cursor: 'pointer',
                            boxShadow: isSelected ? 'var(--shadow-sm)' : 'none',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            flexShrink: 0,
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <span>{getEmoji(cat)}</span>
                          <span>{cat}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Product Grid (Independent Scroll) */}
                <div style={{
                  flex: 1,
                  overflowY: 'auto',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                  gap: '0.75rem',
                  alignContent: 'start',
                  paddingRight: '4px'
                }}>
                  {filteredProducts.map(prod => {
                    const available = calculateProductPortions(prod, insumos);
                    const isOutOfStock = available <= 0;

                    return (
                      <div
                        key={prod.id}
                        onClick={() => !isOutOfStock && handleOpenQuickAdd(prod)}
                        style={{
                          backgroundColor: '#FFF',
                          borderRadius: '8px',
                          border: isOutOfStock ? '1px dashed var(--danger)' : '1px solid var(--sand-border)',
                          padding: '8px',
                          cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                          opacity: isOutOfStock ? 0.6 : 1,
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          minHeight: '85px',
                          transition: 'transform 0.1s ease',
                          position: 'relative'
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--dark-text)' }}>
                            {prod.name}
                          </div>
                          {isOutOfStock && (
                            <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--danger)' }}>
                              Agotado
                            </span>
                          )}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                          <span style={{ fontWeight: 800, color: 'var(--terracotta)', fontSize: '0.88rem' }}>
                            ${prod.price.toFixed(2)}
                          </span>
                          {!isOutOfStock && (
                            <div
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAddItemToTable(prod);
                              }}
                              title="Agregar directo sin modificaciones"
                              style={{
                                backgroundColor: 'var(--terracotta)',
                                color: '#FFF',
                                width: '24px',
                                height: '24px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer'
                              }}
                            >
                              <Plus size={14} />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Table Account Summary */}
              <div style={{ flex: '1 1 45%', padding: '1rem', display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, overflow: 'hidden', backgroundColor: '#FFF' }}>
                
                <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '0.75rem', color: 'var(--dark-text)', flexShrink: 0 }}>
                    Detalle de Consumo ({selectedTable.items.reduce((sum, i) => sum + i.quantity, 0)} ítems)
                  </h3>

                  {selectedTable.items.length === 0 ? (
                    <p style={{ fontSize: '0.85rem', color: 'var(--dark-subdued)', fontStyle: 'italic', textAlign: 'center', padding: '2rem 0' }}>
                      La mesa está vacía. Haz clic en los platillos o bebidas de la izquierda para agregar.
                    </p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
                      {selectedTable.items.map((item, idx) => {
                        const dispatchedQty = item.dispatchedQuantity || 0;
                        const pendingQty = Math.max(0, item.quantity - dispatchedQty);

                        return (
                          <div
                            key={idx}
                            style={{
                              padding: '8px 10px',
                              borderRadius: '8px',
                              border: '1px solid var(--sand-border)',
                              backgroundColor: 'var(--sand-bg)',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '4px'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>{item.name}</span>
                              <span style={{ fontWeight: 800, color: 'var(--terracotta)', fontSize: '0.88rem' }}>
                                ${(item.price * item.quantity).toFixed(2)}
                              </span>
                            </div>

                            {item.note && (
                              <span style={{ fontSize: '0.75rem', color: 'var(--terracotta)', fontStyle: 'italic' }}>
                                📝 {item.note}
                              </span>
                            )}

                            {/* Status badges */}
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '2px' }}>
                              {dispatchedQty > 0 && (
                                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--success)', backgroundColor: '#E8F5E9', padding: '2px 6px', borderRadius: '4px' }}>
                                  ✓ Enviado a Cocina ({dispatchedQty})
                                </span>
                              )}
                              {pendingQty > 0 && (
                                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--danger)', backgroundColor: '#FFEBEE', padding: '2px 6px', borderRadius: '4px' }}>
                                  ⌛ Pendiente por enviar ({pendingQty})
                                </span>
                              )}
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateItemQuantity(idx, -1)}
                                  style={{ border: '1px solid var(--sand-border)', background: '#FFF', borderRadius: '4px', padding: '2px 6px', cursor: 'pointer' }}
                                >
                                  <Minus size={12} />
                                </button>
                                <span style={{ fontWeight: 800, fontSize: '0.88rem', padding: '0 4px' }}>{item.quantity}</span>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateItemQuantity(idx, 1)}
                                  style={{ border: '1px solid var(--sand-border)', background: '#FFF', borderRadius: '4px', padding: '2px 6px', cursor: 'pointer' }}
                                >
                                  <Plus size={12} />
                                </button>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <button
                                  type="button"
                                  title="Editar nota especial"
                                  onClick={() => {
                                    setItemNoteModal(idx);
                                    setNoteInput(item.note || '');
                                  }}
                                  style={{ border: 'none', background: 'none', color: 'var(--dark-subdued)', cursor: 'pointer', padding: '2px' }}
                                >
                                  <MessageSquare size={15} />
                                </button>

                                <button
                                  type="button"
                                  title="Cancelar / Anular producto"
                                  onClick={() => handleCancelItem(idx)}
                                  style={{ border: 'none', background: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '2px' }}
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Subtotal & Actions */}
                <div style={{ borderTop: '1px solid var(--sand-border)', paddingTop: '0.85rem', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.65rem', flexShrink: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 800 }}>
                    <span>TOTAL MESA:</span>
                    <span style={{ color: 'var(--terracotta)' }}>
                      ${selectedTable.items.reduce((sum, i) => sum + (i.price * i.quantity), 0).toFixed(2)}
                    </span>
                  </div>

                  {/* Dispatch & Checkout buttons */}
                  {(() => {
                    const pendingCount = selectedTable.items.reduce((sum, i) => sum + Math.max(0, i.quantity - (i.dispatchedQuantity || 0)), 0);

                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            type="button"
                            onClick={handleDispatchToKitchenAndBar}
                            disabled={selectedTable.items.length === 0 || pendingCount === 0}
                            style={{
                              flex: 1,
                              backgroundColor: pendingCount > 0 ? 'var(--terracotta)' : '#C8E6C9',
                              color: pendingCount > 0 ? '#FFF' : '#2E7D32',
                              border: 'none',
                              padding: '11px 8px',
                              borderRadius: '9px',
                              fontWeight: 800,
                              fontSize: '0.82rem',
                              cursor: (selectedTable.items.length === 0 || pendingCount === 0) ? 'not-allowed' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px'
                            }}
                          >
                            <Send size={15} />
                            <span>
                              {pendingCount > 0 ? `ENVIAR NUEVOS (${pendingCount})` : '✓ COMANDAS ENVIADAS'}
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={handleSendToCheckoutCashier}
                            disabled={selectedTable.items.length === 0}
                            style={{
                              flex: 1,
                              backgroundColor: 'var(--forest)',
                              color: '#FFF',
                              border: 'none',
                              padding: '11px 8px',
                              borderRadius: '9px',
                              fontWeight: 800,
                              fontSize: '0.86rem',
                              cursor: selectedTable.items.length === 0 ? 'not-allowed' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px',
                              boxShadow: '0 2px 6px rgba(46, 125, 50, 0.3)'
                            }}
                          >
                            <CreditCard size={16} />
                            <span>💳 COBRAR EN CAJA</span>
                          </button>
                        </div>

                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            type="button"
                            onClick={handlePrintPreCuenta}
                            disabled={selectedTable.items.length === 0}
                            style={{
                              flex: 1,
                              backgroundColor: '#FFF',
                              color: 'var(--dark-text)',
                              border: '1px solid var(--sand-border)',
                              padding: '8px',
                              borderRadius: '8px',
                              fontWeight: 700,
                              fontSize: '0.8rem',
                              cursor: selectedTable.items.length === 0 ? 'not-allowed' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px'
                            }}
                          >
                            <Printer size={14} />
                            <span>IMPRIMIR PRE-CUENTA</span>
                          </button>

                          {/* Cancel entire table order button */}
                          <button
                            type="button"
                            onClick={handleCancelEntireTableOrder}
                            disabled={selectedTable.items.length === 0}
                            style={{
                              flex: 1,
                              backgroundColor: '#FFF',
                              color: 'var(--danger)',
                              border: '1px solid var(--danger)',
                              padding: '8px',
                              borderRadius: '8px',
                              fontWeight: 700,
                              fontSize: '0.8rem',
                              cursor: selectedTable.items.length === 0 ? 'not-allowed' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px',
                              opacity: selectedTable.items.length === 0 ? 0.5 : 1
                            }}
                          >
                            <Trash2 size={14} />
                            <span>ANULAR MESA</span>
                          </button>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* Item Note Modal */}
      {itemNoteModal !== null && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ backgroundColor: '#FFF', padding: '1.25rem', borderRadius: '12px', width: '320px', boxShadow: 'var(--shadow-lg)' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem' }}>Nota especial para el cocinero/bar</h3>
            <input
              type="text"
              placeholder="Ej: Sin cebolla, poco hielo, etc."
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
              style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--sand-border)', marginBottom: '0.75rem', fontSize: '0.9rem' }}
            />

            {/* Quick preset tags */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '1rem' }}>
              {['Sin cebolla', 'Salsa aparte', 'Hielo extra', 'Sin hielo', 'Para llevar', 'Bien cocido'].map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setNoteInput(prev => prev ? `${prev}, ${tag}` : tag)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '12px',
                    border: '1px solid var(--sand-border)',
                    backgroundColor: 'var(--sand-bg)',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  +{tag}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={() => setItemNoteModal(null)} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--sand-border)', background: '#FFF' }}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Instant Quick Customizer Modal */}
      {quickAddProduct && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(3px)',
          zIndex: 250,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <div className="animate-fade-in" style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 'var(--radius-lg)',
            padding: '1.5rem',
            width: '100%',
            maxWidth: '420px',
            boxShadow: 'var(--shadow-lg)',
            border: '1px solid var(--sand-border)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--terracotta)', textTransform: 'uppercase' }}>
                  {quickAddProduct.category}
                </span>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--dark-text)' }}>
                  {quickAddProduct.name}
                </h3>
              </div>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--terracotta)' }}>
                ${quickAddProduct.price.toFixed(2)}
              </span>
            </div>

            <div style={{ borderTop: '1px solid var(--sand-border)', paddingTop: '0.85rem' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--dark-text)', display: 'block', marginBottom: '8px' }}>
                Selecciona modificaciones con 1 toque:
              </label>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {(quickAddProduct.category.toLowerCase().includes('miche') || quickAddProduct.category.toLowerCase().includes('coctel') || quickAddProduct.category.toLowerCase().includes('cerveza') || quickAddProduct.category.toLowerCase().includes('bebida') || quickAddProduct.category.toLowerCase().includes('alcohol')
                  ? ['Sin hielo', 'Poco hielo', 'Con poco chile', 'Sin chile', 'Limón extra', 'Para llevar']
                  : ['Sin cebolla', 'Sin cilantro', 'Sin salsa', 'Salsa aparte', 'Con todo (Normal)', 'Limón extra', 'Bien cocido', 'Para llevar']
                ).map(chip => {
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
                        backgroundColor: isSelected ? 'var(--terracotta)' : 'var(--sand-bg)',
                        color: isSelected ? '#FFFFFF' : 'var(--dark-text)',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        boxShadow: isSelected ? 'var(--shadow-sm)' : 'none',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {isSelected ? `✓ ${chip}` : chip}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--dark-subdued)', display: 'block', marginBottom: '4px' }}>
                Otra especificación opcional:
              </label>
              <input
                type="text"
                placeholder="Ej: Extra queso, término medio..."
                value={customNoteText}
                onChange={(e) => setCustomNoteText(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '8px',
                  border: '1px solid var(--sand-border)',
                  fontSize: '0.88rem'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setQuickAddProduct(null)}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '8px',
                  border: '1px solid var(--sand-border)',
                  backgroundColor: '#FFF',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  cursor: 'pointer'
                }}
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleConfirmQuickAdd}
                style={{
                  flex: 2,
                  padding: '10px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: 'var(--terracotta)',
                  color: '#FFF',
                  fontWeight: 800,
                  fontSize: '0.92rem',
                  cursor: 'pointer',
                  boxShadow: 'var(--shadow-md)'
                }}
              >
                🚀 AGREGAR A MESA
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL DE IMPRESIÓN DE PRE-CUENTA (ESTADO DE CUENTA DE MESA) */}
      {preCuentaModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(28, 43, 34, 0.7)',
          backdropFilter: 'blur(4px)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <div className="animate-fade-in" style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 'var(--radius-lg)',
            width: '420px',
            maxWidth: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '1.5rem',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--sand-border)', paddingBottom: '8px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--dark-text)' }}>
                Pre-Cuenta: Mesa {preCuentaModal.tableNumber}
              </h3>
              <button
                onClick={() => setPreCuentaModal(null)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  border: '1px solid var(--sand-border)',
                  backgroundColor: '#FFF',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={16} />
              </button>
            </div>

            <div
              id="printable-ticket"
              style={{
                backgroundColor: '#FAFAFA',
                border: '1px dashed #CCC',
                padding: '1rem',
                borderRadius: '8px',
                fontFamily: "'Courier New', Courier, monospace",
                fontSize: '0.85rem',
                lineHeight: 1.4,
                marginBottom: '1rem'
              }}
            >
              <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '1rem', marginBottom: '4px' }}>
                MESTIZO COMEDOR & BAR
              </div>
              <div style={{ textAlign: 'center', fontSize: '0.75rem', color: '#666', marginBottom: '8px' }}>
                *** ESTADO DE CUENTA / PRE-CUENTA ***
                <br />(Documento no fiscal)
              </div>
              <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }} />
              <div>Mesa: #{preCuentaModal.tableNumber}</div>
              <div>Mesero: {preCuentaModal.waiterName}</div>
              <div>Fecha: {new Date(preCuentaModal.date).toLocaleString('es-MX')}</div>
              <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }} />
              
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', margin: '4px 0' }}>
                <span>CANT. PLATILLO</span>
                <span>TOTAL</span>
              </div>
              
              {preCuentaModal.items.map((item, idx) => (
                <div key={idx} style={{ margin: '4px 0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>{item.quantity}x {item.name}</span>
                    <span>${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                  {item.note && (
                    <div style={{ fontSize: '0.75rem', fontStyle: 'italic', paddingLeft: '8px', color: '#555' }}>
                      └ Nota: {item.note}
                    </div>
                  )}
                </div>
              ))}

              <div style={{ borderTop: '1px dashed #000', margin: '8px 0 6px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.05rem', paddingTop: '4px' }}>
                <span>TOTAL A PAGAR:</span>
                <span>${preCuentaModal.subtotal.toFixed(2)}</span>
              </div>
              <div style={{ borderTop: '1px dashed #000', margin: '8px 0 4px 0' }} />
              <div style={{ textAlign: 'center', fontSize: '0.75rem', fontStyle: 'italic', marginTop: '6px' }}>
                ¡Gracias por su preferencia!
                <br />Propina no incluida.
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setPreCuentaModal(null)}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '8px',
                  border: '1px solid var(--sand-border)',
                  backgroundColor: '#FFF',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  cursor: 'pointer'
                }}
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                style={{
                  flex: 1.5,
                  padding: '10px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: 'var(--terracotta)',
                  color: '#FFF',
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <Printer size={16} />
                <span>Imprimir Pre-Cuenta</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

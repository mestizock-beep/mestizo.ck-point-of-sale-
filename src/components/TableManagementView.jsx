import React, { useState } from 'react';
import { Utensils, Search, Plus, Minus, Trash2, Send, CreditCard, Clock, User, AlertCircle, CheckCircle2, MessageSquare, ChevronRight, RefreshCw, X } from 'lucide-react';
import { sendOrderToKitchenAndBar } from '../utils/storage';

export default function TableManagementView({
  tables,
  setTables,
  products,
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

  const currentWaiterName = currentUser?.fullName || currentUser?.email?.split('@')[0] || 'Mesero';

  // Filter products for adding to table
  const filteredProducts = products.filter(p => {
    const matchCat = selectedCategory === 'Todos' || p.category === selectedCategory;
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

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

  const handleSendToCheckoutCashier = () => {
    if (!selectedTable || selectedTable.items.length === 0) return;

    const subtotal = selectedTable.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Call cashier checkout callback
    onSendToCheckout({
      tableNumber: selectedTable.tableNumber,
      waiterName: selectedTable.waiterName || currentWaiterName,
      cart: selectedTable.items,
      subtotal,
      discountPercent: 0,
      discountAmount: 0,
      tipPercent: 10,
      tipAmount: (subtotal * 0.1),
      total: subtotal * 1.1
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
                  onClick={() => setSelectedTable(null)}
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
              
              {/* Left Column: Products Selector */}
              <div style={{ flex: '1 1 55%', borderRight: '1px solid var(--sand-border)', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', overflowY: 'auto' }}>
                
                {/* Search */}
                <div style={{ position: 'relative', width: '100%' }}>
                  <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--dark-subdued)' }} />
                  <input
                    type="text"
                    placeholder="Buscar producto o bebida..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px 8px 36px', borderRadius: '8px', border: '1px solid var(--sand-border)', backgroundColor: 'var(--sand-bg)', fontSize: '0.88rem' }}
                  />
                </div>

                {/* Categories */}
                <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }} className="no-scrollbar">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '16px',
                        border: selectedCategory === cat ? '1px solid var(--terracotta)' : '1px solid var(--sand-border)',
                        backgroundColor: selectedCategory === cat ? 'var(--terracotta)' : 'var(--sand-bg)',
                        color: selectedCategory === cat ? '#FFF' : 'var(--dark-text)',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                        cursor: 'pointer'
                      }}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Product Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.75rem' }}>
                  {filteredProducts.map(prod => (
                    <div
                      key={prod.id}
                      onClick={() => handleAddItemToTable(prod)}
                      style={{
                        backgroundColor: '#FFF',
                        borderRadius: '8px',
                        border: '1px solid var(--sand-border)',
                        padding: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        minHeight: '85px',
                        transition: 'transform 0.1s ease'
                      }}
                    >
                      <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--dark-text)' }}>
                        {prod.name}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                        <span style={{ fontWeight: 800, color: 'var(--terracotta)', fontSize: '0.88rem' }}>
                          ${prod.price.toFixed(2)}
                        </span>
                        <div style={{ backgroundColor: 'var(--terracotta)', color: '#FFF', width: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Plus size={14} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Table Account Summary */}
              <div style={{ flex: '1 1 45%', padding: '1rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', backgroundColor: '#FFF' }}>
                
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '0.75rem', color: 'var(--dark-text)' }}>
                    Detalle de Consumo ({selectedTable.items.reduce((sum, i) => sum + i.quantity, 0)} ítems)
                  </h3>

                  {selectedTable.items.length === 0 ? (
                    <p style={{ fontSize: '0.85rem', color: 'var(--dark-subdued)', fontStyle: 'italic', textAlign: 'center', padding: '2rem 0' }}>
                      La mesa está vacía. Haz clic en los platillos o bebidas de la izquierda para agregar.
                    </p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '350px', overflowY: 'auto' }}>
                      {selectedTable.items.map((item, idx) => {
                        const pendingQty = item.quantity - (item.dispatchedQuantity || 0);

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

                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <button
                                  onClick={() => handleUpdateItemQuantity(idx, -1)}
                                  style={{ border: 'none', background: '#FFF', borderRadius: '4px', padding: '2px 6px', cursor: 'pointer' }}
                                >
                                  <Minus size={12} />
                                </button>
                                <span style={{ fontWeight: 800, fontSize: '0.85rem' }}>{item.quantity}</span>
                                <button
                                  onClick={() => handleUpdateItemQuantity(idx, 1)}
                                  style={{ border: 'none', background: '#FFF', borderRadius: '4px', padding: '2px 6px', cursor: 'pointer' }}
                                >
                                  <Plus size={12} />
                                </button>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: pendingQty > 0 ? 'var(--danger)' : 'var(--success)' }}>
                                  {pendingQty > 0 ? `⌛ ${pendingQty} pendiente` : '✅ Enviado'}
                                </span>

                                <button
                                  onClick={() => {
                                    setItemNoteModal(idx);
                                    setNoteInput(item.note || '');
                                  }}
                                  style={{ border: 'none', background: 'none', color: 'var(--dark-subdued)', cursor: 'pointer' }}
                                >
                                  <MessageSquare size={14} />
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
                <div style={{ borderTop: '1px solid var(--sand-border)', paddingTop: '1rem', marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 800 }}>
                    <span>TOTAL MESA:</span>
                    <span style={{ color: 'var(--terracotta)' }}>
                      ${selectedTable.items.reduce((sum, i) => sum + (i.price * i.quantity), 0).toFixed(2)}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={handleDispatchToKitchenAndBar}
                      disabled={selectedTable.items.length === 0}
                      style={{
                        flex: 1,
                        backgroundColor: 'var(--terracotta)',
                        color: '#FFF',
                        border: 'none',
                        padding: '10px',
                        borderRadius: '8px',
                        fontWeight: 800,
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <Send size={16} />
                      <span>ENVIAR A COCINA Y BARRA</span>
                    </button>

                    <button
                      onClick={handleSendToCheckoutCashier}
                      disabled={selectedTable.items.length === 0}
                      style={{
                        flex: 1,
                        backgroundColor: 'var(--dark-text)',
                        color: '#FFF',
                        border: 'none',
                        padding: '10px',
                        borderRadius: '8px',
                        fontWeight: 800,
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <CreditCard size={16} />
                      <span>ENVIAR A CAJA</span>
                    </button>
                  </div>
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
              <button onClick={handleSaveItemNote} style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', background: 'var(--terracotta)', color: '#FFF', fontWeight: 700 }}>
                Guardar Nota
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

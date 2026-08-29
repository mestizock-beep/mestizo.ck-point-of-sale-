import React, { useState, useEffect } from 'react';
import { Search, Plus, Minus, Trash2, ShoppingCart, Percent, DollarSign, MessageSquare, AlertCircle, CheckCircle, ArrowRight, X, Receipt, Clock } from 'lucide-react';
import { getSales, calculateProductPortions, getPresetTags } from '../utils/storage';

export default function POSView({
  products,
  insumos = [],
  categories,
  cart,
  setCart,
  onOpenCheckout,
  currentShift,
  currentUser,
  tables = [],
  onSelectTableForCheckout
}) {
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [tipPercent, setTipPercent] = useState(0);
  const [itemNoteModal, setItemNoteModal] = useState(null);
  const [noteInput, setNoteInput] = useState('');
  
  // Quick Instant Customizer state
  const [quickAddProduct, setQuickAddProduct] = useState(null);
  const [selectedChips, setSelectedChips] = useState([]);
  const [customNoteText, setCustomNoteText] = useState('');

  const [mobileTab, setMobileTab] = useState('menu'); // 'menu' | 'cart'
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth <= 768 : false);

  const activeTablesWithOrders = tables.filter(t => t.items && t.items.length > 0);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'Todos' || product.category === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          product.sku.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleOpenQuickAdd = (product) => {
    const availableStock = calculateProductPortions(product, insumos);
    if (availableStock <= 0) {
      alert(`El platillo "${product.name}" está agotado porque se terminaron los ingredientes en bodega.`);
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
    setSelectedChips(prev => prev.includes(chipText) ? prev.filter(c => c !== chipText) : [...prev, chipText]);
  };

  const handleConfirmQuickAdd = () => {
    if (!quickAddProduct) return;
    const notesArray = [...selectedChips];
    if (customNoteText.trim()) notesArray.push(customNoteText.trim());
    const finalNote = notesArray.join(', ');

    addToCartCustomized(quickAddProduct, finalNote);

    setQuickAddProduct(null);
    setSelectedChips([]);
    setCustomNoteText('');
  };

  const addToCartCustomized = (product, note = '') => {
    const availableStock = calculateProductPortions(product, insumos);
    if (availableStock <= 0) {
      alert(`El platillo "${product.name}" no está disponible por falta de insumos.`);
      return;
    }

    setCart(prevCart => {
      const existing = prevCart.find(item => item.id === product.id && (item.note || '') === note);
      if (existing) {
        if (existing.quantity >= availableStock) {
          alert(`No hay más unidades preparables de "${product.name}". Máximo por insumos: ${availableStock}`);
          return prevCart;
        }
        return prevCart.map(item =>
          (item.id === product.id && (item.note || '') === note) ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        return [...prevCart, { ...product, quantity: 1, note, maxPortions: availableStock }];
      }
    });
  };

  const addToCart = (product) => {
    addToCartCustomized(product, '');
  };

  const updateQuantity = (id, delta) => {
    setCart(prevCart => {
      return prevCart.map(item => {
        if (item.id === id) {
          const newQty = item.quantity + delta;
          if (newQty <= 0) return null;
          const product = products.find(p => p.id === item.id) || item;
          const availableStock = calculateProductPortions(product, insumos);
          if (newQty > availableStock) {
            alert(`Stock máximo alcanzado para "${item.name}" según insumos disponibles (${availableStock} porciones).`);
            return item;
          }
          return { ...item, quantity: newQty };
        }
        return item;
      }).filter(Boolean);
    });
  };

  const removeFromCart = (id) => {
    setCart(prevCart => prevCart.filter(item => item.id !== id));
  };

  const handleSaveNote = () => {
    if (!itemNoteModal) return;
    setCart(prevCart => prevCart.map(item =>
      item.id === itemNoteModal.itemId ? { ...item, note: noteInput } : item
    ));
    setItemNoteModal(null);
    setNoteInput('');
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discountAmount = (subtotal * discountPercent) / 100;
  const subtotalWithDiscount = Math.max(0, subtotal - discountAmount);
  const tipAmount = (subtotalWithDiscount * tipPercent) / 100;
  const total = subtotalWithDiscount + tipAmount;

  const handleAttemptCheckout = () => {
    if (!currentShift || !currentShift.isOpen) {
      alert('Atención: La caja no está abierta actualmente. Debes abrir el turno en "Corte de Caja" para cobrar.');
      return;
    }

    onOpenCheckout({
      cart,
      subtotal,
      discountPercent,
      discountAmount,
      tipPercent,
      tipAmount,
      total
    });
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: isMobile ? 'column' : 'row',
      flex: 1,
      height: isMobile ? 'auto' : 'calc(100vh - 72px)',
      gap: isMobile ? '0.75rem' : '1.25rem',
      padding: isMobile ? '0.75rem' : '1.25rem',
      overflow: isMobile ? 'auto' : 'hidden',
      paddingBottom: (isMobile && cart.length > 0 && mobileTab === 'menu') ? '80px' : (isMobile ? '0.75rem' : '1.25rem')
    }}>
      
      {/* Mobile Top Segmented Tab Switcher */}
      {isMobile && (
        <div style={{ display: 'flex', gap: '6px', backgroundColor: 'var(--sand-muted)', padding: '4px', borderRadius: '12px' }}>
          <button
            onClick={() => setMobileTab('menu')}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '9px',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: 'pointer',
              backgroundColor: mobileTab === 'menu' ? 'var(--terracotta)' : 'transparent',
              color: mobileTab === 'menu' ? '#FFFFFF' : 'var(--dark-subdued)'
            }}
          >
            🍔 Menú de Platillos
          </button>
          <button
            onClick={() => setMobileTab('cart')}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '9px',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: 'pointer',
              backgroundColor: mobileTab === 'cart' ? 'var(--terracotta)' : 'transparent',
              color: mobileTab === 'cart' ? '#FFFFFF' : 'var(--dark-subdued)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <ShoppingCart size={16} />
            <span>Comanda ({cart.reduce((a, c) => a + c.quantity, 0)})</span>
          </button>
        </div>
      )}

      {/* Left Column: Menu & Products */}
      <div style={{
        flex: '1 1 0%',
        minWidth: 0,
        height: isMobile ? 'auto' : '100%',
        display: (isMobile && mobileTab !== 'menu') ? 'none' : 'flex',
        flexDirection: 'column',
        gap: '0.85rem',
        overflow: 'hidden'
      }}>
        
        {/* Active Tables with Orders Banner for Fast Cashier Billing */}
        {activeTablesWithOrders.length > 0 && (
          <div style={{
            backgroundColor: '#FFF8E1',
            border: '1px solid #FFE082',
            borderRadius: 'var(--radius-md)',
            padding: '0.75rem 1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '8px',
            boxShadow: 'var(--shadow-sm)',
            flexShrink: 0
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#E65100', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                🔔 Mesas con Cuenta Activa ({activeTablesWithOrders.length}):
              </span>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {activeTablesWithOrders.map(t => {
                const tableSubtotal = t.items.reduce((s, i) => s + (i.price * i.quantity), 0);
                const isReadyToPay = t.status === 'checkout';
                return (
                  <button
                    key={t.tableNumber}
                    onClick={() => onSelectTableForCheckout && onSelectTableForCheckout(t)}
                    style={{
                      backgroundColor: isReadyToPay ? '#FF6F00' : 'var(--terracotta)',
                      color: '#FFFFFF',
                      border: isReadyToPay ? '2px solid #E65100' : '1px solid var(--terracotta-dark)',
                      borderRadius: '8px',
                      padding: '6px 12px',
                      fontSize: '0.85rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      boxShadow: 'var(--shadow-sm)',
                      transition: 'transform 0.1s ease'
                    }}
                  >
                    <span>Mesa {t.tableNumber}: ${tableSubtotal.toFixed(2)}</span>
                    <span style={{
                      backgroundColor: isReadyToPay ? '#E65100' : 'rgba(0,0,0,0.2)',
                      color: '#FFFFFF',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      fontSize: '0.74rem',
                      fontWeight: 700
                    }}>
                      {isReadyToPay ? '💳 Pagar Cuenta' : 'Cobrar'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {!currentShift || !currentShift.isOpen ? (
          <div style={{
            backgroundColor: 'var(--warning-bg)',
            border: '1px solid #FFE0B2',
            color: 'var(--warning)',
            padding: '0.85rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '0.9rem',
            fontWeight: 600,
            flexShrink: 0
          }}>
            <AlertCircle size={20} />
            <span>Atención: La caja no está abierta actualmente. Abre el turno en la pestaña "Corte de Caja" para registrar ventas formalmente.</span>
          </div>
        ) : null}

        <div style={{
          backgroundColor: '#FFFFFF',
          padding: '0.85rem 1rem',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          flexShrink: 0
        }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--dark-subdued)' }} />
            <input
              type="text"
              placeholder="Buscar platillo, coctel o SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px 10px 42px',
                borderRadius: '10px',
                border: '1px solid var(--sand-border)',
                backgroundColor: 'var(--sand-bg)',
                fontSize: '0.92rem',
                outline: 'none'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '2px' }} className="no-scrollbar">
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

              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '20px',
                    border: selectedCategory === cat ? '2px solid var(--terracotta)' : '1px solid var(--sand-border)',
                    backgroundColor: selectedCategory === cat ? 'var(--terracotta)' : 'var(--sand-bg)',
                    color: selectedCategory === cat ? '#FFFFFF' : 'var(--dark-text)',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    boxShadow: selectedCategory === cat ? 'var(--shadow-sm)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {getEmoji(cat)} {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Scrollable Products Area */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          paddingRight: '4px',
          display: 'grid',
          gridTemplateColumns: isMobile ? 'repeat(auto-fill, minmax(135px, 1fr))' : 'repeat(auto-fill, minmax(180px, 1fr))',
          gridAutoRows: 'max-content',
          gap: isMobile ? '0.75rem' : '1rem',
          paddingBottom: '1rem'
        }}>
          {filteredProducts.map(product => {
            const availableStock = calculateProductPortions(product, insumos);
            const isOutOfStock = availableStock <= 0;
            const isLowStock = availableStock > 0 && availableStock <= 3;

            return (
              <div
                key={product.id}
                className="animate-fade-in"
                onClick={() => !isOutOfStock && handleOpenQuickAdd(product)}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: 'var(--radius-md)',
                  overflow: 'hidden',
                  boxShadow: 'var(--shadow-sm)',
                  border: '1px solid var(--sand-border)',
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                  opacity: isOutOfStock ? 0.65 : 1,
                  position: 'relative',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                }}
              >
                <div style={{ position: 'relative', height: '125px', backgroundColor: 'var(--sand-muted)' }}>
                  <img
                    src={product.image}
                    alt={product.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  
                  {isOutOfStock ? (
                    <span style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      backgroundColor: 'var(--danger)',
                      color: '#FFF',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: '12px'
                    }}>
                      Agotado
                    </span>
                  ) : isLowStock ? (
                    <span style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      backgroundColor: 'var(--warning)',
                      color: '#FFF',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: '12px'
                    }}>
                      Últimos {availableStock}
                    </span>
                  ) : null}
                </div>

                <div style={{ padding: '0.9rem', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
                  <div>
                    <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--terracotta)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {product.category}
                    </span>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--dark-text)', marginTop: '2px', lineHeight: 1.25 }}>
                      {product.name}
                    </h3>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.75rem' }}>
                    <span style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--dark-text)' }}>
                      ${product.price.toFixed(2)}
                    </span>
                    <button
                      disabled={isOutOfStock}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isOutOfStock) addToCart(product);
                      }}
                      title="Agregar directo sin modificaciones"
                      style={{
                        backgroundColor: isOutOfStock ? '#CCC' : 'var(--terracotta)',
                        color: '#FFF',
                        border: 'none',
                        borderRadius: '8px',
                        width: '32px',
                        height: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: isOutOfStock ? 'not-allowed' : 'pointer'
                      }}
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Column: Comanda Actual & Ventas Sidebar */}
      <div style={{
        width: isMobile ? '100%' : '380px',
        flexShrink: 0,
        height: isMobile ? 'auto' : '100%',
        display: (isMobile && mobileTab !== 'cart') ? 'none' : 'flex',
        flexDirection: 'column',
        gap: '1rem',
        overflowY: isMobile ? 'visible' : 'auto'
      }}>
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-md)',
          border: '1px solid var(--sand-border)',
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          minHeight: '380px'
        }}>
        <div style={{
          padding: '1.25rem',
          borderBottom: '1px solid var(--sand-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'var(--sand-muted)',
          borderTopLeftRadius: 'var(--radius-md)',
          borderTopRightRadius: 'var(--radius-md)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShoppingCart size={20} color="var(--terracotta)" />
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Comanda Actual</h2>
          </div>
          {cart.length > 0 && (
            <button
              onClick={() => setCart([])}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--danger)',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Vaciar
            </button>
          )}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {cart.length === 0 ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: 'var(--dark-subdued)',
              textAlign: 'center',
              padding: '2rem'
            }}>
              <ShoppingCart size={48} strokeWidth={1.2} color="var(--sand-border)" />
              <p style={{ marginTop: '1rem', fontSize: '0.95rem', fontWeight: 600 }}>La comanda está vacía</p>
              <p style={{ fontSize: '0.82rem', marginTop: '4px', opacity: 0.8 }}>Selecciona platillos del menú para comenzar la orden</p>
            </div>
          ) : (
            cart.map(item => (
              <div
                key={item.id}
                style={{
                  backgroundColor: 'var(--sand-bg)',
                  borderRadius: '10px',
                  padding: '10px 12px',
                  border: '1px solid var(--sand-border)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--dark-text)' }}>{item.name}</h4>
                    <span style={{ fontSize: '0.82rem', color: 'var(--dark-subdued)' }}>${item.price.toFixed(2)} c/u</span>
                  </div>
                  <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--dark-text)' }}>
                    ${(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>

                {item.note ? (
                  <div style={{ fontSize: '0.78rem', color: 'var(--terracotta)', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MessageSquare size={12} />
                    <span>Nota: "{item.note}"</span>
                  </div>
                ) : null}

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
                  <button
                    onClick={() => {
                      setItemNoteModal({ itemId: item.id, currentNote: item.note || '' });
                      setNoteInput(item.note || '');
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--dark-subdued)',
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '3px'
                    }}
                  >
                    <MessageSquare size={13} />
                    {item.note ? 'Editar nota' : '+ Nota platillo'}
                  </button>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      onClick={() => updateQuantity(item.id, -1)}
                      style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: '6px',
                        border: '1px solid var(--sand-border)',
                        backgroundColor: '#FFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer'
                      }}
                    >
                      <Minus size={14} />
                    </button>

                    <span style={{ fontSize: '0.9rem', fontWeight: 700, width: '20px', textAlign: 'center' }}>
                      {item.quantity}
                    </span>

                    <button
                      onClick={() => updateQuantity(item.id, 1)}
                      style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: '6px',
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

                    <button
                      onClick={() => removeFromCart(item.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--danger)',
                        marginLeft: '6px',
                        cursor: 'pointer'
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {cart.length > 0 && (
          <div style={{
            padding: '1rem 1.25rem',
            borderTop: '1px solid var(--sand-border)',
            backgroundColor: 'var(--sand-muted)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            borderBottomLeftRadius: 'var(--radius-md)',
            borderBottomRightRadius: 'var(--radius-md)'
          }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--dark-subdued)', display: 'block', marginBottom: '3px' }}>
                  Propina
                </span>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {[0, 10, 15, 20].map(tip => (
                    <button
                      key={tip}
                      onClick={() => setTipPercent(tip)}
                      style={{
                        flex: 1,
                        padding: '4px 0',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        borderRadius: '6px',
                        border: tipPercent === tip ? '1px solid var(--terracotta)' : '1px solid var(--sand-border)',
                        backgroundColor: tipPercent === tip ? 'var(--terracotta)' : '#FFF',
                        color: tipPercent === tip ? '#FFF' : 'var(--dark-text)',
                        cursor: 'pointer'
                      }}
                    >
                      {tip}%
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ width: '90px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--dark-subdued)', display: 'block', marginBottom: '3px' }}>
                  Descuento
                </span>
                <select
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '4px 6px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    borderRadius: '6px',
                    border: '1px solid var(--sand-border)',
                    backgroundColor: '#FFF'
                  }}
                >
                  <option value={0}>0%</option>
                  <option value={5}>5%</option>
                  <option value={10}>10%</option>
                  <option value={15}>15%</option>
                  <option value={20}>20%</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--dark-subdued)' }}>
                <span>Subtotal:</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              {discountPercent > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--danger)' }}>
                  <span>Descuento ({discountPercent}%):</span>
                  <span>-${discountAmount.toFixed(2)}</span>
                </div>
              )}
              {tipPercent > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--dark-subdued)' }}>
                  <span>Propina ({tipPercent}%):</span>
                  <span>+${tipAmount.toFixed(2)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 800, color: 'var(--dark-text)', marginTop: '4px', paddingTop: '6px', borderTop: '1px dashed var(--sand-border)' }}>
                <span>TOTAL:</span>
                <span style={{ color: 'var(--terracotta)' }}>${total.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={handleAttemptCheckout}
              style={{
                width: '100%',
                backgroundColor: 'var(--terracotta)',
                color: '#FFF',
                border: 'none',
                padding: '12px',
                borderRadius: '10px',
                fontSize: '1rem',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: 'var(--shadow-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'background-color 0.2s ease'
              }}
            >
              <span>COBRAR ORDEN</span>
              <span>•</span>
              <span>${total.toFixed(2)}</span>
            </button>
          </div>
        )}
      </div>

      {/* ===== VENTAS DEL DÍA (Dentro de la barra lateral derecha) ===== */}
      {!isMobile && (() => {
        const allSales = getSales();
        const today = new Date();
        const todaySales = allSales.filter(s => {
          const d = new Date(s.timestamp || s.createdAt);
          return d.getFullYear() === today.getFullYear() &&
                 d.getMonth() === today.getMonth() &&
                 d.getDate() === today.getDate();
        });
        const todayTotal = todaySales.reduce((sum, s) => sum + (Number(s.total) || 0), 0);

        return (
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-sm)',
            border: '1px solid var(--sand-border)',
            overflow: 'hidden',
            flexShrink: 0,
            marginTop: '1rem'
          }}>
            <div style={{
              padding: '0.75rem 1rem',
              backgroundColor: 'var(--sand-muted)',
              borderBottom: '1px solid var(--sand-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Receipt size={16} color="var(--terracotta)" />
                <span style={{ fontWeight: 800, fontSize: '0.88rem', color: 'var(--dark-text)' }}>
                  Ventas del Día
                </span>
                <span style={{
                  backgroundColor: 'var(--terracotta)', color: '#FFF',
                  fontSize: '0.7rem', fontWeight: 800,
                  padding: '2px 7px', borderRadius: '20px'
                }}>
                  {todaySales.length}
                </span>
              </div>
              <span style={{ fontWeight: 800, fontSize: '0.88rem', color: 'var(--forest)' }}>
                ${todayTotal.toFixed(2)}
              </span>
            </div>

            {todaySales.length === 0 ? (
              <div style={{ padding: '1.25rem 1rem', textAlign: 'center', color: 'var(--dark-subdued)', fontSize: '0.82rem' }}>
                <Receipt size={28} strokeWidth={1} color="var(--sand-border)" style={{ marginBottom: '6px' }} />
                <p style={{ fontWeight: 600 }}>Aún no hay ventas registradas hoy</p>
                <p style={{ fontSize: '0.74rem', marginTop: '2px', opacity: 0.7 }}>Aparecerán aquí al completar cobros.</p>
              </div>
            ) : (
              <div style={{ maxHeight: '180px', overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                  <tbody>
                    {todaySales.slice(0, 10).map((sale, idx) => {
                      const saleDate = new Date(sale.timestamp || sale.createdAt);
                      const timeStr = saleDate.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
                      const methodColors = {
                        'Efectivo': { bg: '#E8F5E9', color: '#2E7D32' },
                        'Tarjeta': { bg: '#E3F2FD', color: '#1565C0' },
                        'Transferencia': { bg: '#FFF8E1', color: '#E65100' }
                      };
                      const mc = methodColors[sale.paymentMethod] || { bg: 'var(--sand-bg)', color: 'var(--dark-text)' };

                      return (
                        <tr key={sale.id} style={{ borderTop: '1px solid var(--sand-border)', backgroundColor: idx % 2 === 0 ? '#FFFFFF' : 'var(--sand-bg)' }}>
                          <td style={{ padding: '6px 10px', fontWeight: 700, color: 'var(--terracotta)', fontFamily: 'monospace' }}>#{sale.id}</td>
                          <td style={{ padding: '6px 8px', color: 'var(--dark-subdued)' }}>{timeStr}</td>
                          <td style={{ padding: '6px 8px' }}>
                            <span style={{ backgroundColor: mc.bg, color: mc.color, padding: '2px 6px', borderRadius: '10px', fontWeight: 700, fontSize: '0.7rem' }}>
                              {sale.paymentMethod}
                            </span>
                          </td>
                          <td style={{ padding: '6px 10px', fontWeight: 800, color: 'var(--forest)', textAlign: 'right' }}>
                            ${Number(sale.total).toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })()}
      </div>

      {/* Floating Bottom Cart Bar for Mobile */}
      {isMobile && mobileTab === 'menu' && cart.length > 0 && (
        <div
          onClick={() => setMobileTab('cart')}
          className="animate-fade-in"
          style={{
            position: 'fixed',
            bottom: '16px',
            left: '16px',
            right: '16px',
            backgroundColor: 'var(--terracotta)',
            color: '#FFFFFF',
            padding: '12px 18px',
            borderRadius: '16px',
            boxShadow: 'var(--shadow-lg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            zIndex: 90,
            cursor: 'pointer'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShoppingCart size={22} />
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.92rem' }}>
                {cart.reduce((a, c) => a + c.quantity, 0)} platillos en comanda
              </div>
              <div style={{ fontSize: '0.78rem', opacity: 0.9 }}>
                Total: ${total.toFixed(2)}
              </div>
            </div>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontWeight: 800,
            fontSize: '0.85rem',
            backgroundColor: '#FFFFFF',
            color: 'var(--terracotta)',
            padding: '8px 14px',
            borderRadius: '20px'
          }}>
            <span>Ver Orden</span>
            <ArrowRight size={16} />
          </div>
        </div>
      )}

      {itemNoteModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.5)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: '#FFF',
            borderRadius: '16px',
            padding: '1.5rem',
            width: '100%',
            maxWidth: '400px',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.75rem', color: 'var(--dark-text)' }}>
              Nota para la Comanda
            </h3>
            <textarea
              rows={3}
              placeholder="Ej: Sin cebolla, término medio, extra salsa..."
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                border: '1px solid var(--sand-border)',
                marginBottom: '1rem',
                fontSize: '0.9rem',
                fontFamily: 'inherit'
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                onClick={() => { setItemNoteModal(null); setNoteInput(''); }}
                style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid var(--sand-border)', background: '#FFF', fontWeight: 700 }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveNote}
                style={{ padding: '8px 14px', borderRadius: '8px', border: 'none', background: 'var(--terracotta)', color: '#FFF', fontWeight: 700 }}
              >
                Guardar Nota
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

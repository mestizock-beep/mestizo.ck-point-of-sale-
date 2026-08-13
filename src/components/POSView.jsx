import React, { useState, useEffect } from 'react';
import { Search, Plus, Minus, Trash2, ShoppingCart, Percent, DollarSign, MessageSquare, AlertCircle, CheckCircle, ArrowRight, Lock, ShieldAlert, X } from 'lucide-react';

export default function POSView({
  products,
  categories,
  cart,
  setCart,
  onOpenCheckout,
  currentShift,
  currentUser
}) {
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [tipPercent, setTipPercent] = useState(10);
  const [itemNoteModal, setItemNoteModal] = useState(null);
  const [noteInput, setNoteInput] = useState('');
  const [shiftLockError, setShiftLockError] = useState(null);
  
  const [mobileTab, setMobileTab] = useState('menu'); // 'menu' | 'cart'
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth <= 768 : false);

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

  const addToCart = (product) => {
    if (product.stock <= 0) return;

    setCart(prevCart => {
      const existing = prevCart.find(item => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          alert(`No hay más unidades disponibles de "${product.name}". Stock actual: ${product.stock}`);
          return prevCart;
        }
        return prevCart.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        return [...prevCart, { ...product, quantity: 1, note: '' }];
      }
    });
  };

  const updateQuantity = (id, delta) => {
    setCart(prevCart => {
      return prevCart.map(item => {
        if (item.id === id) {
          const newQty = item.quantity + delta;
          if (newQty <= 0) return null;
          if (newQty > item.stock) {
            alert(`Stock máximo alcanzado para este producto (${item.stock} disps.)`);
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
  const handleAttemptCheckout = () => {
    if (!currentShift || !currentShift.isOpen) {
      alert('Atención: La caja no está abierta actualmente. Debes abrir el turno en "Corte de Caja" para cobrar.');
      return;
    }

    const shiftOwner = currentShift.cashierName || 'Usiel Chi';
    const currentName = currentUser ? (currentUser.fullName || currentUser.email) : '';
    
    // Admin or shift opener matches currentUser
    const isOwner = currentUser && (
      currentUser.role === 'admin' ||
      (currentName && shiftOwner.toLowerCase().includes(currentName.toLowerCase())) ||
      (currentName && currentName.toLowerCase().includes(shiftOwner.toLowerCase())) ||
      (currentUser.email && currentUser.email.toLowerCase().includes('usiel'))
    );

    if (!isOwner) {
      setShiftLockError(`🔒 Control de Caja: Este turno fue abierto por "${shiftOwner}". Únicamente ${shiftOwner} o el Administrador pueden autorizar y registrar cobros en efectivo/tarjeta.`);
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
      minHeight: 'calc(100vh - 72px)',
      gap: isMobile ? '0.75rem' : '1.25rem',
      padding: isMobile ? '0.75rem' : '1.25rem',
      overflow: 'hidden',
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
        display: (isMobile && mobileTab !== 'menu') ? 'none' : 'flex',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        
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
            fontWeight: 600
          }}>
            <AlertCircle size={20} />
            <span>Atención: La caja no está abierta actualmente. Abre el turno en la pestaña "Corte de Caja" para registrar ventas formalmente.</span>
          </div>
        ) : null}

        <div style={{
          backgroundColor: '#FFFFFF',
          padding: '1rem',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.85rem'
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

          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }} className="no-scrollbar">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '20px',
                  border: selectedCategory === cat ? '1px solid var(--terracotta)' : '1px solid var(--sand-border)',
                  backgroundColor: selectedCategory === cat ? 'var(--terracotta)' : 'var(--sand-bg)',
                  color: selectedCategory === cat ? '#FFFFFF' : 'var(--dark-text)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease'
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? 'repeat(auto-fill, minmax(135px, 1fr))' : 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: isMobile ? '0.75rem' : '1rem',
          overflowY: 'auto',
          paddingRight: '4px'
        }}>
          {filteredProducts.map(product => {
            const isOutOfStock = product.stock <= 0;
            const isLowStock = product.stock > 0 && product.stock <= product.minStock;

            return (
              <div
                key={product.id}
                className="animate-fade-in"
                onClick={() => !isOutOfStock && addToCart(product)}
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
                      fontWeight: 800,
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
                      fontWeight: 800,
                      padding: '3px 8px',
                      borderRadius: '12px'
                    }}>
                      Quedan {product.stock}
                    </span>
                  ) : (
                    <span style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      backgroundColor: 'rgba(28, 43, 34, 0.75)',
                      color: '#FFF',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      padding: '3px 8px',
                      borderRadius: '12px'
                    }}>
                      Stock: {product.stock}
                    </span>
                  )}
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

      {/* Right Column: Comanda Actual Sidebar */}
      <div style={{
        width: isMobile ? '100%' : '340px',
        flexShrink: 0,
        backgroundColor: '#FFFFFF',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-md)',
        border: '1px solid var(--sand-border)',
        display: (isMobile && mobileTab !== 'cart') ? 'none' : 'flex',
        flexDirection: 'column',
        height: isMobile ? 'auto' : 'calc(100vh - 96px)',
        position: isMobile ? 'static' : 'sticky',
        top: '80px'
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
          justifyContent: 'center'
        }}>
          <div style={{
            backgroundColor: '#FFF',
            padding: '1.5rem',
            borderRadius: 'var(--radius-md)',
            width: '360px',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.75rem' }}>Agregar nota al platillo</h3>
            <input
              type="text"
              placeholder="Ej: Sin cebolla, extra salsa, etc."
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                border: '1px solid var(--sand-border)',
                marginBottom: '1rem',
                fontSize: '0.95rem'
              }}
            />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setItemNoteModal(null)}
                style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid var(--sand-border)', background: '#FFF' }}
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveNote}
                style={{ padding: '8px 14px', borderRadius: '8px', border: 'none', background: 'var(--terracotta)', color: '#FFF', fontWeight: 700 }}
              >
                Guardar Nota
              </button>
            </div>
          </div>
        </div>
      )}

      {shiftLockError && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(3px)',
          zIndex: 300,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <div className="animate-fade-in" style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 'var(--radius-lg)',
            padding: '1.5rem',
            maxWidth: '440px',
            width: '100%',
            boxShadow: 'var(--shadow-lg)',
            border: '1px solid var(--sand-border)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--terracotta)' }}>
              <Lock size={26} />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Cobro Restringido por Control de Caja</h3>
            </div>

            <p style={{ fontSize: '0.9rem', color: 'var(--dark-text)', lineHeight: 1.5 }}>
              {shiftLockError}
            </p>

            <div style={{
              backgroundColor: 'var(--sand-muted)',
              padding: '10px 12px',
              borderRadius: '8px',
              fontSize: '0.8rem',
              color: 'var(--dark-subdued)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <ShieldAlert size={16} color="var(--terracotta)" />
              <span>Esta medida protege el cuadre de efectivo y evita discrepancias en el arqueo de caja.</span>
            </div>

            <button
              onClick={() => setShiftLockError(null)}
              style={{
                marginTop: '0.5rem',
                backgroundColor: 'var(--terracotta)',
                color: '#FFF',
                border: 'none',
                padding: '10px 16px',
                borderRadius: '8px',
                fontSize: '0.9rem',
                fontWeight: 700,
                cursor: 'pointer',
                alignSelf: 'flex-end'
              }}
            >
              Entendido
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

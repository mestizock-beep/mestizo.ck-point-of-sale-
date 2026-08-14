import React, { useState } from 'react';
import { DollarSign, CreditCard, ArrowRight, X, Check, Phone, User, AlertCircle } from 'lucide-react';

export default function PaymentModal({
  orderData,
  onClose,
  onCompleteSale
}) {
  const { total, subtotal, discountAmount, tipAmount, cart } = orderData;

  const [paymentMethod, setPaymentMethod] = useState('Efectivo');
  const [cashTendered, setCashTendered] = useState(Math.ceil(total));
  const [cardType, setCardType] = useState('Débito');
  const [authCode, setAuthCode] = useState('');
  const [transferRef, setTransferRef] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const tenderedNum = Number(cashTendered) || 0;
  const changeDue = Math.max(0, Number((tenderedNum - total).toFixed(2)));
  const isCashInsufficient = paymentMethod === 'Efectivo' && tenderedNum < total;

  const quickBills = [
    { label: 'Exacto', value: Math.ceil(total) },
    { label: '$100', value: 100 },
    { label: '$200', value: 200 },
    { label: '$500', value: 500 },
    { label: '$1,000', value: 1000 }
  ];

  const handleFinish = () => {
    if (isSubmitting) return;

    if (isCashInsufficient) {
      alert(`El monto ingresado ($${tenderedNum.toFixed(2)}) es menor al total a pagar ($${total.toFixed(2)})`);
      return;
    }

    setIsSubmitting(true);

    const salePayload = {
      items: cart,
      subtotal: Number(Number(subtotal || 0).toFixed(2)),
      discountAmount: Number(Number(discountAmount || 0).toFixed(2)),
      tipAmount: Number(Number(tipAmount || 0).toFixed(2)),
      total: Number(Number(total || 0).toFixed(2)),
      paymentMethod,
      tableNumber: orderData.tableNumber || null,
      waiterName: orderData.waiterName || null,
      cashTendered: paymentMethod === 'Efectivo' ? Number(tenderedNum.toFixed(2)) : Number(total.toFixed(2)),
      changeDue: paymentMethod === 'Efectivo' ? changeDue : 0,
      cardType: paymentMethod === 'Tarjeta' ? cardType : null,
      authCode: paymentMethod === 'Tarjeta' ? authCode : null,
      transferRef: paymentMethod === 'Transferencia' ? transferRef : null,
      customerName: customerName.trim() || (orderData.tableNumber ? `Mesa ${orderData.tableNumber}` : 'Cliente General'),
      customerPhone: customerPhone.trim()
    };

    onCompleteSale(salePayload);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(28, 43, 34, 0.65)',
      backdropFilter: 'blur(4px)',
      zIndex: 90,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem'
    }}>
      <div className="animate-fade-in" style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 'var(--radius-lg)',
        width: '540px',
        maxWidth: '100%',
        maxHeight: '92vh',
        overflowY: 'auto',
        boxShadow: 'var(--shadow-lg)',
        border: '1px solid var(--sand-border)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--sand-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'var(--sand-muted)',
          borderTopLeftRadius: 'var(--radius-lg)',
          borderTopRightRadius: 'var(--radius-lg)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--terracotta)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                PROCESAR PAGO
              </span>
              {orderData.tableNumber && (
                <span style={{ backgroundColor: 'var(--terracotta)', color: '#FFF', padding: '2px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800 }}>
                  MESA #{orderData.tableNumber} {orderData.waiterName ? `(${orderData.waiterName})` : ''}
                </span>
              )}
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--dark-text)', marginTop: '2px' }}>
              Total a cobrar: <span style={{ color: 'var(--terracotta)' }}>${total.toFixed(2)}</span>
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              border: '1px solid var(--sand-border)',
              backgroundColor: '#FFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--dark-subdued)'
            }}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--dark-text)', display: 'block', marginBottom: '8px' }}>
              Método de Pago
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setPaymentMethod('Efectivo')}
                style={{
                  padding: '12px',
                  borderRadius: '10px',
                  border: paymentMethod === 'Efectivo' ? '2px solid var(--terracotta)' : '1px solid var(--sand-border)',
                  backgroundColor: paymentMethod === 'Efectivo' ? 'var(--sand-muted)' : '#FFF',
                  color: paymentMethod === 'Efectivo' ? 'var(--terracotta)' : 'var(--dark-text)',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <DollarSign size={22} />
                Efectivo
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('Tarjeta')}
                style={{
                  padding: '12px',
                  borderRadius: '10px',
                  border: paymentMethod === 'Tarjeta' ? '2px solid var(--terracotta)' : '1px solid var(--sand-border)',
                  backgroundColor: paymentMethod === 'Tarjeta' ? 'var(--sand-muted)' : '#FFF',
                  color: paymentMethod === 'Tarjeta' ? 'var(--terracotta)' : 'var(--dark-text)',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <CreditCard size={22} />
                Tarjeta
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('Transferencia')}
                style={{
                  padding: '12px',
                  borderRadius: '10px',
                  border: paymentMethod === 'Transferencia' ? '2px solid var(--terracotta)' : '1px solid var(--sand-border)',
                  backgroundColor: paymentMethod === 'Transferencia' ? 'var(--sand-muted)' : '#FFF',
                  color: paymentMethod === 'Transferencia' ? 'var(--terracotta)' : 'var(--dark-text)',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <ArrowRight size={22} />
                Transferencia
              </button>
            </div>
          </div>

          {paymentMethod === 'Efectivo' && (
            <div style={{ backgroundColor: 'var(--sand-bg)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--sand-border)' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                Monto Recibido en Efectivo
              </label>
              <div style={{ position: 'relative', marginBottom: '10px' }}>
                <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '1.4rem', fontWeight: 800, color: 'var(--terracotta)' }}>$</span>
                <input
                  type="number"
                  step="any"
                  value={cashTendered}
                  onChange={(e) => setCashTendered(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px 12px 36px',
                    borderRadius: '10px',
                    border: '1px solid var(--sand-border)',
                    fontSize: '1.3rem',
                    fontWeight: 800,
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '1rem' }}>
                {quickBills.map(b => (
                  <button
                    key={b.label}
                    type="button"
                    onClick={() => setCashTendered(b.value)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: '1px solid var(--sand-border)',
                      backgroundColor: '#FFF',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    {b.label}
                  </button>
                ))}
              </div>

              <div style={{
                backgroundColor: isCashInsufficient ? 'var(--danger-bg)' : 'var(--success-bg)',
                border: `1px solid ${isCashInsufficient ? '#FFCDD2' : '#C8E6C9'}`,
                padding: '12px 16px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <span style={{ fontSize: '0.95rem', fontWeight: 700, color: isCashInsufficient ? 'var(--danger)' : 'var(--success)' }}>
                  {isCashInsufficient ? 'Monto Insuficiente:' : 'Cambio a entregar:'}
                </span>
                <span style={{ fontSize: '1.4rem', fontWeight: 800, color: isCashInsufficient ? 'var(--danger)' : 'var(--success)' }}>
                  ${changeDue.toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {paymentMethod === 'Tarjeta' && (
            <div style={{ backgroundColor: 'var(--sand-bg)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--sand-border)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '6px' }}>Tipo de Tarjeta</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {['Débito', 'Crédito'].map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setCardType(type)}
                      style={{
                        flex: 1,
                        padding: '8px',
                        borderRadius: '8px',
                        border: cardType === type ? '2px solid var(--terracotta)' : '1px solid var(--sand-border)',
                        backgroundColor: cardType === type ? 'var(--sand-muted)' : '#FFF',
                        fontWeight: 700,
                        fontSize: '0.85rem'
                      }}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                  Código de Autorización / Lote (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ej: 849201"
                  value={authCode}
                  onChange={(e) => setAuthCode(e.target.value)}
                  style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid var(--sand-border)', fontSize: '0.9rem' }}
                />
              </div>
            </div>
          )}

          {paymentMethod === 'Transferencia' && (
            <div style={{ backgroundColor: 'var(--sand-bg)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--sand-border)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ fontSize: '0.82rem', color: 'var(--dark-subdued)', borderBottom: '1px dashed var(--sand-border)', paddingBottom: '6px' }}>
                <strong>Datos de Cuenta:</strong> Mestizo Comedor & Bar | BBVA | CLABE: 0121 8001 5489 3019
              </div>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                  Número de Referencia / Rastreo SPEI
                </label>
                <input
                  type="text"
                  placeholder="Ej: 12345678"
                  value={transferRef}
                  onChange={(e) => setTransferRef(e.target.value)}
                  style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid var(--sand-border)', fontSize: '0.9rem' }}
                />
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingTop: '6px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--dark-subdued)', textTransform: 'uppercase' }}>
              Datos del Cliente (Opcional para recibo digital)
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--dark-subdued)' }} />
                <input
                  type="text"
                  placeholder="Nombre cliente"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  style={{ width: '100%', padding: '8px 8px 8px 32px', borderRadius: '8px', border: '1px solid var(--sand-border)', fontSize: '0.85rem' }}
                />
              </div>
              <div style={{ position: 'relative' }}>
                <Phone size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--dark-subdued)' }} />
                <input
                  type="tel"
                  placeholder="WhatsApp / Tel (10 dígitos)"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  style={{ width: '100%', padding: '8px 8px 8px 32px', borderRadius: '8px', border: '1px solid var(--sand-border)', fontSize: '0.85rem' }}
                />
              </div>
            </div>
          </div>

        </div>

        <div style={{ padding: '1.25rem 1.5rem', borderTop: '1px solid var(--sand-border)', backgroundColor: 'var(--sand-muted)', borderBottomLeftRadius: 'var(--radius-lg)', borderBottomRightRadius: 'var(--radius-lg)' }}>
          <button
            onClick={handleFinish}
            disabled={isCashInsufficient || isSubmitting}
            style={{
              width: '100%',
              backgroundColor: (isCashInsufficient || isSubmitting) ? '#CCC' : 'var(--terracotta)',
              color: '#FFF',
              border: 'none',
              padding: '14px',
              borderRadius: '10px',
              fontSize: '1.05rem',
              fontWeight: 800,
              cursor: (isCashInsufficient || isSubmitting) ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: 'var(--shadow-md)'
            }}
          >
            <Check size={20} />
            <span>{isSubmitting ? 'Procesando Venta...' : `FINALIZAR VENTA ($${total.toFixed(2)})`}</span>
          </button>
        </div>

      </div>
    </div>
  );
}

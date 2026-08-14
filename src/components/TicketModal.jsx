import React, { useState, useEffect } from 'react';
import { Printer, MessageCircle, Phone, Copy, Check, X, ArrowLeft, Usb } from 'lucide-react';
import Logo from './Logo';
import { getSavedUSBPrinterInfo, sendRawToUSBPrinter, textToEscPosBytes } from '../utils/usbPrinter';

export default function TicketModal({
  saleData,
  printerSettings,
  onClose,
  onNewSale
}) {
  const [copied, setCopied] = useState(false);
  const [targetPhone, setTargetPhone] = useState(saleData.customerPhone || '');
  const [usbPrinter, setUsbPrinter] = useState(null);
  const [usbPrinting, setUsbPrinting] = useState(false);
  const [printFeedback, setPrintFeedback] = useState('');

  useEffect(() => {
    setUsbPrinter(getSavedUSBPrinterInfo());
  }, []);

  const generateTicketText = () => {
    const lines = [
      `*${printerSettings.businessName || 'MESTIZO COMEDOR & BAR'}*`,
      `${printerSettings.address || ''}`,
      `Tel: ${printerSettings.phone || ''}`,
      `--------------------------------`,
      `Ticket: #${saleData.id}`,
      `Fecha: ${new Date(saleData.timestamp).toLocaleString('es-MX')}`,
      `Cliente: ${saleData.customerName || 'Cliente General'}`,
      `--------------------------------`,
      `CANT.  PRODUCTO           TOTAL`,
      `--------------------------------`
    ];

    saleData.items.forEach(item => {
      lines.push(`${item.quantity}x ${item.name} ($${(item.price * item.quantity).toFixed(2)})`);
      if (item.note) lines.push(`   └ Note: ${item.note}`);
    });

    lines.push(`--------------------------------`);
    lines.push(`Subtotal: $${saleData.subtotal.toFixed(2)}`);
    if (saleData.discountAmount > 0) {
      lines.push(`Descuento: -$${saleData.discountAmount.toFixed(2)}`);
    }
    if (saleData.tipAmount > 0) {
      lines.push(`Propina: +$${saleData.tipAmount.toFixed(2)}`);
    }
    lines.push(`*TOTAL: $${saleData.total.toFixed(2)}*`);
    lines.push(`Forma de Pago: ${saleData.paymentMethod}`);

    if (saleData.paymentMethod === 'Efectivo') {
      lines.push(`Efectivo Recibido: $${saleData.cashTendered.toFixed(2)}`);
      lines.push(`Cambio: $${saleData.changeDue.toFixed(2)}`);
    } else if (saleData.paymentMethod === 'Tarjeta' && saleData.authCode) {
      lines.push(`Auth Tarjeta: ${saleData.authCode}`);
    } else if (saleData.paymentMethod === 'Transferencia' && saleData.transferRef) {
      lines.push(`Ref. SPEI: ${saleData.transferRef}`);
    }

    lines.push(`--------------------------------`);
    lines.push(printerSettings.footerMessage || '¡Gracias por su compra en Mestizo!');

    return lines.join('\n');
  };

  const ticketText = generateTicketText();

  const handlePrint = async () => {
    if (usbPrinter) {
      setUsbPrinting(true);
      setPrintFeedback('Enviando a impresora USB...');
      try {
        const rawBytes = textToEscPosBytes(ticketText);
        await sendRawToUSBPrinter(rawBytes);
        setPrintFeedback('✓ ¡Ticket impreso por cable USB!');
        setTimeout(() => setPrintFeedback(''), 3000);
        return;
      } catch (err) {
        console.warn('Error en USB directo, usando impresión estándar:', err);
        setPrintFeedback('Abriendo ventana de impresión...');
      } finally {
        setUsbPrinting(false);
      }
    }
    window.print();
  };

  const handleSendWhatsApp = () => {
    if (!targetPhone) {
      alert('Ingresa el número telefónico del cliente para enviar por WhatsApp.');
      return;
    }
    const cleanPhone = targetPhone.replace(/\D/g, '');
    const encodedText = encodeURIComponent(ticketText);
    const waUrl = `https://wa.me/${cleanPhone.length === 10 ? '52' + cleanPhone : cleanPhone}?text=${encodedText}`;
    window.open(waUrl, '_blank');
  };

  const handleSendSMS = () => {
    if (!targetPhone) {
      alert('Ingresa el número telefónico del cliente para enviar por SMS.');
      return;
    }
    const cleanPhone = targetPhone.replace(/\D/g, '');
    const encodedText = encodeURIComponent(ticketText);
    window.open(`sms:${cleanPhone}?body=${encodedText}`, '_self');
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(ticketText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(28, 43, 34, 0.75)',
      backdropFilter: 'blur(5px)',
      zIndex: 100,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem'
    }}>
      <div className="animate-fade-in" style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 'var(--radius-lg)',
        width: '780px',
        maxWidth: '100%',
        maxHeight: '94vh',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-lg)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--sand-border)',
          backgroundColor: 'var(--sand-muted)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--success)', textTransform: 'uppercase' }}>
              ✓ VENTA REGISTRADA CON ÉXITO
            </span>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--dark-text)' }}>
              Ticket #{saleData.id}
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
              cursor: 'pointer'
            }}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          <div style={{
            flex: 1,
            backgroundColor: '#EAEAEA',
            padding: '1.5rem',
            overflowY: 'auto',
            display: 'flex',
            justifyContent: 'center'
          }}>
            <div
              id="printable-ticket"
              style={{
                width: printerSettings.paperWidth === '58mm' ? '280px' : '340px',
                backgroundColor: '#FFFFFF',
                padding: '1.25rem 1rem',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                borderRadius: '4px',
                fontFamily: "'Courier New', Courier, monospace",
                color: '#000',
                fontSize: '0.82rem',
                lineHeight: 1.35
              }}
            >
              <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '6px' }}>
                  <Logo size="sm" variant="dark" />
                </div>
                <div style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>{printerSettings.businessName}</div>
                <div>{printerSettings.address}</div>
                <div>Tel: {printerSettings.phone}</div>
                {printerSettings.rfc && <div>RFC: {printerSettings.rfc}</div>}
              </div>

              <div style={{ borderTop: '1px dashed #000', margin: '8px 0' }} />

              <div>Ticket #: {saleData.id}</div>
              <div>Fecha: {new Date(saleData.timestamp).toLocaleString('es-MX')}</div>
              <div>Cliente: {saleData.customerName || 'Cliente General'}</div>

              <div style={{ borderTop: '1px dashed #000', margin: '8px 0' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                <span>CANT. PLATILLO</span>
                <span>TOTAL</span>
              </div>
              <div style={{ borderTop: '1px solid #000', margin: '4px 0 8px 0' }} />

              {saleData.items.map(item => (
                <div key={item.id} style={{ marginBottom: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>{item.quantity}x {item.name}</span>
                    <span>${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                  {item.note && (
                    <div style={{ fontSize: '0.75rem', fontStyle: 'italic', paddingLeft: '8px' }}>
                      └ Nota: {item.note}
                    </div>
                  )}
                </div>
              ))}

              <div style={{ borderTop: '1px dashed #000', margin: '10px 0 6px 0' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Subtotal:</span>
                <span>${saleData.subtotal.toFixed(2)}</span>
              </div>
              {saleData.discountAmount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Descuento:</span>
                  <span>-${saleData.discountAmount.toFixed(2)}</span>
                </div>
              )}
              {saleData.tipAmount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Propina:</span>
                  <span>+${saleData.tipAmount.toFixed(2)}</span>
                </div>
              )}
              
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1rem', marginTop: '4px', paddingTop: '4px', borderTop: '1px solid #000' }}>
                <span>TOTAL:</span>
                <span>${saleData.total.toFixed(2)}</span>
              </div>

              <div style={{ borderTop: '1px dashed #000', margin: '10px 0 6px 0' }} />

              <div>Forma de Pago: {saleData.paymentMethod}</div>
              {saleData.paymentMethod === 'Efectivo' && (
                <>
                  <div>Efectivo Recibido: ${saleData.cashTendered.toFixed(2)}</div>
                  <div>Cambio a entregar: ${saleData.changeDue.toFixed(2)}</div>
                </>
              )}
              {saleData.paymentMethod === 'Tarjeta' && saleData.authCode && (
                <div>Cod. Autorización: {saleData.authCode}</div>
              )}
              {saleData.paymentMethod === 'Transferencia' && saleData.transferRef && (
                <div>Ref. SPEI: {saleData.transferRef}</div>
              )}

              <div style={{ borderTop: '1px dashed #000', margin: '12px 0 8px 0' }} />
              
              <div style={{ textAlign: 'center', fontSize: '0.78rem', whiteSpace: 'pre-line' }}>
                {printerSettings.footerMessage}
              </div>
            </div>
          </div>

          <div style={{
            width: '320px',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
            backgroundColor: '#FFFFFF',
            borderLeft: '1px solid var(--sand-border)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Opciones de Ticket</h3>
              {usbPrinter && (
                <span style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success)', border: '1px solid #C8E6C9', padding: '2px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Usb size={12} />
                  <span>USB Directo</span>
                </span>
              )}
            </div>

            {printFeedback && (
              <div style={{
                padding: '8px 10px',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: 700,
                backgroundColor: printFeedback.includes('✓') ? 'var(--success-bg)' : '#E0F2FE',
                color: printFeedback.includes('✓') ? 'var(--success)' : '#0369A1'
              }}>
                {printFeedback}
              </div>
            )}

            <button
              onClick={handlePrint}
              disabled={usbPrinting}
              style={{
                padding: '12px',
                borderRadius: '10px',
                backgroundColor: 'var(--terracotta)',
                color: '#FFF',
                border: 'none',
                fontWeight: 800,
                fontSize: '0.95rem',
                cursor: usbPrinting ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <Printer size={20} />
              <span>{usbPrinting ? 'Enviando a USB...' : 'Imprimir Ticket Térmico'}</span>
            </button>

            <div style={{ borderTop: '1px solid var(--sand-border)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--dark-text)' }}>
                Envío de Ticket Digital
              </label>
              <input
                type="tel"
                placeholder="Número celular (10 dígitos)"
                value={targetPhone}
                onChange={(e) => setTargetPhone(e.target.value)}
                style={{
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--sand-border)',
                  fontSize: '0.9rem',
                  outline: 'none'
                }}
              />

              <button
                onClick={handleSendWhatsApp}
                style={{
                  padding: '10px',
                  borderRadius: '8px',
                  backgroundColor: '#25D366',
                  color: '#FFF',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <MessageCircle size={18} />
                Enviar por WhatsApp
              </button>

              <button
                onClick={handleSendSMS}
                style={{
                  padding: '10px',
                  borderRadius: '8px',
                  backgroundColor: '#1E2922',
                  color: '#FFF',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <Phone size={18} />
                Enviar por SMS
              </button>
            </div>

            <button
              onClick={handleCopyText}
              style={{
                padding: '8px',
                borderRadius: '8px',
                backgroundColor: 'var(--sand-bg)',
                color: 'var(--dark-text)',
                border: '1px solid var(--sand-border)',
                fontWeight: 600,
                fontSize: '0.82rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              {copied ? <Check size={16} color="var(--success)" /> : <Copy size={16} />}
              {copied ? 'Copiado al portapapeles' : 'Copiar texto del ticket'}
            </button>

            <div style={{ marginTop: 'auto', borderTop: '1px solid var(--sand-border)', paddingTop: '1rem' }}>
              <button
                onClick={onNewSale}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--sand-muted)',
                  color: 'var(--dark-text)',
                  border: '1px solid var(--sand-border)',
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <ArrowLeft size={18} />
                Nueva Venta
              </button>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}

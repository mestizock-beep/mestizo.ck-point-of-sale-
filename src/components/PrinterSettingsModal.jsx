import React, { useState, useEffect } from 'react';
import { Printer, X, Check, RefreshCw, Usb, CheckCircle2, AlertCircle, Trash2, HelpCircle } from 'lucide-react';
import {
  isWebUSBSupported,
  getSavedUSBPrinterInfo,
  connectUSBPrinter,
  disconnectUSBPrinter,
  printUSBTestTicket
} from '../utils/usbPrinter';

export default function PrinterSettingsModal({
  settings,
  onSave,
  onClose
}) {
  const [formState, setFormState] = useState({ ...settings });
  const [usbPrinter, setUsbPrinter] = useState(null);
  const [usbLoading, setUsbLoading] = useState(false);
  const [usbMessage, setUsbMessage] = useState(null);

  useEffect(() => {
    setUsbPrinter(getSavedUSBPrinterInfo());
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formState);
    onClose();
  };

  const handleConnectUSB = async () => {
    setUsbLoading(true);
    setUsbMessage(null);
    try {
      const res = await connectUSBPrinter();
      setUsbPrinter(res.printerInfo);
      setUsbMessage({ type: 'success', text: `¡Impresora "${res.printerInfo.productName}" conectada por cable USB exitosamente!` });
    } catch (err) {
      if (err.name !== 'NotFoundError' && !err.message?.includes('No se seleccionó')) {
        setUsbMessage({ type: 'error', text: err.message || 'No se pudo conectar con el dispositivo USB.' });
      }
    } finally {
      setUsbLoading(false);
    }
  };

  const handleDisconnectUSB = () => {
    disconnectUSBPrinter();
    setUsbPrinter(null);
    setUsbMessage({ type: 'info', text: 'Impresora USB desvinculada.' });
  };

  const handleUSBTestPrint = async () => {
    setUsbLoading(true);
    try {
      await printUSBTestTicket(formState);
      setUsbMessage({ type: 'success', text: '✓ Ticket de prueba enviado exitosamente a la impresora USB.' });
    } catch (err) {
      setUsbMessage({ type: 'error', text: `Error al imprimir por USB: ${err.message}. Verifica que esté encendida y con papel.` });
    } finally {
      setUsbLoading(false);
    }
  };

  const handleSystemTestPrint = () => {
    window.print();
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
      zIndex: 110,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem'
    }}>
      <form onSubmit={handleSubmit} className="animate-fade-in" style={{
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
          backgroundColor: 'var(--sand-muted)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTopLeftRadius: 'var(--radius-lg)',
          borderTopRightRadius: 'var(--radius-lg)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ backgroundColor: '#FFF', padding: '8px', borderRadius: '10px', color: 'var(--terracotta)' }}>
              <Printer size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Configuración de Impresora</h2>
              <span style={{ fontSize: '0.78rem', color: 'var(--dark-subdued)' }}>Detección por cable USB y formato térmico</span>
            </div>
          </div>
          <button type="button" onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--dark-subdued)' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* SECCIÓN DE DETECCIÓN USB DIRECTA */}
          <div style={{
            backgroundColor: usbPrinter ? 'var(--success-bg)' : 'var(--sand-bg)',
            border: `1px solid ${usbPrinter ? '#C8E6C9' : 'var(--sand-border)'}`,
            padding: '1.25rem',
            borderRadius: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.85rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Usb size={20} color={usbPrinter ? 'var(--success)' : 'var(--terracotta)'} />
                <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--dark-text)' }}>
                  Detección de Impresora por Cable USB
                </span>
              </div>
              {usbPrinter ? (
                <span style={{ backgroundColor: 'var(--success)', color: '#FFF', padding: '3px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800 }}>
                  🟢 Conectada
                </span>
              ) : (
                <span style={{ backgroundColor: '#EEE', color: '#666', padding: '3px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}>
                  Sin vincular
                </span>
              )}
            </div>

            {usbPrinter ? (
              <div style={{ fontSize: '0.85rem', color: 'var(--dark-text)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div><strong>Dispositivo:</strong> {usbPrinter.productName}</div>
                <div><strong>Fabricante:</strong> {usbPrinter.manufacturerName} (USB ID: {usbPrinter.vendorId}:{usbPrinter.productId})</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--dark-subdued)', marginTop: '4px' }}>
                  ✓ Los tickets se imprimirán de forma directa e instantánea a través del cable USB.
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                  <button
                    type="button"
                    onClick={handleUSBTestPrint}
                    disabled={usbLoading}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: '8px',
                      backgroundColor: 'var(--forest)',
                      color: '#FFF',
                      border: 'none',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <Printer size={15} />
                    <span>{usbLoading ? 'Imprimiendo...' : 'Probar Impresión USB'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDisconnectUSB}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      backgroundColor: '#FFF',
                      color: 'var(--danger)',
                      border: '1px solid var(--danger)',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Trash2 size={14} />
                    <span>Desvincular</span>
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <p style={{ fontSize: '0.82rem', color: 'var(--dark-subdued)', marginBottom: '10px' }}>
                  Conecta tu impresora térmica a la computadora con su cable USB. Al hacer clic abajo, se abrirá la ventana para detectarla y dejarla configurada.
                </p>
                <button
                  type="button"
                  onClick={handleConnectUSB}
                  disabled={usbLoading}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--terracotta)',
                    color: '#FFF',
                    border: 'none',
                    fontWeight: 800,
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  <Usb size={18} />
                  <span>{usbLoading ? 'Detectando impresora USB...' : '🔌 Detectar y Vincular Impresora USB (Cable)'}</span>
                </button>
              </div>
            )}

            {usbMessage && (
              <div style={{
                padding: '8px 12px',
                borderRadius: '8px',
                fontSize: '0.82rem',
                fontWeight: 700,
                backgroundColor: usbMessage.type === 'success' ? 'var(--success-bg)' : usbMessage.type === 'error' ? 'var(--danger-bg)' : '#E0F2FE',
                color: usbMessage.type === 'success' ? 'var(--success)' : usbMessage.type === 'error' ? 'var(--danger)' : '#0369A1',
                border: `1px solid ${usbMessage.type === 'success' ? '#C8E6C9' : usbMessage.type === 'error' ? '#FFCDD2' : '#BAE6FD'}`
              }}>
                {usbMessage.text}
              </div>
            )}
          </div>

          {/* ANCHO DE PAPEL */}
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
              Ancho de Papel Térmico
            </label>
            <div style={{ display: 'flex', gap: '10px' }}>
              {['58mm', '80mm'].map(width => (
                <button
                  key={width}
                  type="button"
                  onClick={() => setFormState({ ...formState, paperWidth: width })}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '8px',
                    border: formState.paperWidth === width ? '2px solid var(--terracotta)' : '1px solid var(--sand-border)',
                    backgroundColor: formState.paperWidth === width ? 'var(--sand-muted)' : '#FFF',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    cursor: 'pointer'
                  }}
                >
                  {width} ({width === '80mm' ? 'Estándar 80mm' : 'Mini 58mm'})
                </button>
              ))}
            </div>
          </div>

          {/* DATOS DEL TICKET */}
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
              Nombre del Negocio en Ticket
            </label>
            <input
              type="text"
              value={formState.businessName || ''}
              onChange={(e) => setFormState({ ...formState, businessName: e.target.value })}
              style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--sand-border)' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Teléfono</label>
              <input
                type="text"
                value={formState.phone || ''}
                onChange={(e) => setFormState({ ...formState, phone: e.target.value })}
                style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--sand-border)' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>RFC</label>
              <input
                type="text"
                value={formState.rfc || ''}
                onChange={(e) => setFormState({ ...formState, rfc: e.target.value })}
                style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--sand-border)' }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Dirección</label>
            <input
              type="text"
              value={formState.address || ''}
              onChange={(e) => setFormState({ ...formState, address: e.target.value })}
              style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--sand-border)' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
              Mensaje al Pie del Ticket
            </label>
            <textarea
              value={formState.footerMessage || ''}
              onChange={(e) => setFormState({ ...formState, footerMessage: e.target.value })}
              rows={2}
              style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--sand-border)', fontSize: '0.85rem' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'var(--sand-bg)', padding: '10px 14px', borderRadius: '8px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Prueba con ventana de impresión estándar:</span>
            <button
              type="button"
              onClick={handleSystemTestPrint}
              style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--sand-border)', backgroundColor: '#FFF', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem' }}
            >
              Probar Impresión
            </button>
          </div>
        </div>

        <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--sand-border)', backgroundColor: 'var(--sand-muted)', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button type="button" onClick={onClose} style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid var(--sand-border)', background: '#FFF' }}>Cancelar</button>
          <button type="submit" style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: 'var(--terracotta)', color: '#FFF', fontWeight: 700 }}>Guardar Configuración</button>
        </div>
      </form>
    </div>
  );
}

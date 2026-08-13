import React, { useState } from 'react';
import { Settings, Lock, User, Key, Printer, Shield, CheckCircle, AlertCircle, X, LogOut, Save } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../utils/supabaseClient';

export default function SettingsModal({
  currentUser,
  printerSettings,
  onSavePrinterSettings,
  onLogout,
  onClose
}) {
  const [activeTab, setActiveTab] = useState('security'); // 'security' | 'printer'

  // Password Change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordStatus, setPasswordStatus] = useState(null); // { type: 'success'|'error', text: '' }
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Printer Settings state
  const [paperWidth, setPaperWidth] = useState(printerSettings.paperWidth || '80mm');
  const [headerTitle, setHeaderTitle] = useState(printerSettings.headerTitle || 'MESTIZO COMEDOR & BAR');
  const [headerSubtitle, setHeaderSubtitle] = useState(printerSettings.headerSubtitle || 'Tacos, Tortas, Chelas & Cocteles');
  const [footerMessage, setFooterMessage] = useState(printerSettings.footerMessage || '¡Gracias por tu visita! Vuelve pronto.');
  const [autoPrint, setAutoPrint] = useState(Boolean(printerSettings.autoPrint));
  const [printerSuccess, setPrinterSuccess] = useState(false);

  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordStatus(null);

    if (newPassword.length < 6) {
      setPasswordStatus({ type: 'error', text: 'La nueva contraseña debe tener al menos 6 caracteres.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordStatus({ type: 'error', text: 'Las nuevas contraseñas no coinciden.' });
      return;
    }

    setPasswordLoading(true);

    try {
      if (isSupabaseConfigured) {
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) throw error;
      } else {
        // Save local password update
        const storedUser = JSON.parse(localStorage.getItem('mestizo_pos_user_session') || '{}');
        storedUser.password = newPassword;
        localStorage.setItem('mestizo_pos_user_session', JSON.stringify(storedUser));
      }

      setPasswordStatus({ type: 'success', text: '¡Contraseña actualizada correctamente!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordStatus({ type: 'error', text: err.message || 'Error al cambiar contraseña.' });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleSavePrinterSubmit = (e) => {
    e.preventDefault();
    onSavePrinterSettings({
      paperWidth,
      headerTitle,
      headerSubtitle,
      footerMessage,
      autoPrint
    });
    setPrinterSuccess(true);
    setTimeout(() => setPrinterSuccess(false), 3000);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(0,0,0,0.6)',
      backdropFilter: 'blur(3px)',
      zIndex: 200,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem'
    }}>
      <div className="animate-fade-in" style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 'var(--radius-lg)',
        width: '100%',
        maxWidth: '560px',
        maxHeight: '90vh',
        boxShadow: 'var(--shadow-lg)',
        border: '1px solid var(--sand-border)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--sand-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'var(--sand-muted)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Settings size={22} color="var(--terracotta)" />
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--dark-text)' }}>Ajustes & Configuración</h2>
              <span style={{ fontSize: '0.78rem', color: 'var(--dark-subdued)' }}>Seguridad, perfil y tickets de impresión</span>
            </div>
          </div>

          <button
            onClick={onClose}
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

        {/* Subtabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--sand-border)', backgroundColor: 'var(--sand-bg)' }}>
          <button
            onClick={() => setActiveTab('security')}
            style={{
              flex: 1,
              padding: '12px',
              border: 'none',
              borderBottom: activeTab === 'security' ? '3px solid var(--terracotta)' : '3px solid transparent',
              backgroundColor: activeTab === 'security' ? '#FFF' : 'transparent',
              color: activeTab === 'security' ? 'var(--terracotta)' : 'var(--dark-subdued)',
              fontSize: '0.88rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <Shield size={16} />
            <span>Perfil & Seguridad</span>
          </button>

          <button
            onClick={() => setActiveTab('printer')}
            style={{
              flex: 1,
              padding: '12px',
              border: 'none',
              borderBottom: activeTab === 'printer' ? '3px solid var(--terracotta)' : '3px solid transparent',
              backgroundColor: activeTab === 'printer' ? '#FFF' : 'transparent',
              color: activeTab === 'printer' ? 'var(--terracotta)' : 'var(--dark-subdued)',
              fontSize: '0.88rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <Printer size={16} />
            <span>Tickets & Impresora</span>
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '1.5rem', flex: 1, overflowY: 'auto' }}>
          
          {activeTab === 'security' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* User badge */}
              <div style={{
                backgroundColor: 'var(--sand-muted)',
                padding: '1rem',
                borderRadius: '12px',
                border: '1px solid var(--sand-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--terracotta)', textTransform: 'uppercase' }}>
                    USUARIO INICIADO
                  </span>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginTop: '2px' }}>
                    {currentUser?.fullName || currentUser?.email}
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--dark-subdued)' }}>{currentUser?.email}</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                  <span style={{
                    backgroundColor: currentUser?.role === 'admin' ? 'var(--terracotta)' : 'var(--dark-subdued)',
                    color: '#FFF',
                    fontSize: '0.75rem',
                    padding: '3px 10px',
                    borderRadius: '12px',
                    fontWeight: 700,
                    textTransform: 'uppercase'
                  }}>
                    {currentUser?.role === 'admin' ? 'Administrador (Usiel)' : 'Cajero'}
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onLogout();
                    }}
                    style={{
                      backgroundColor: 'var(--danger-bg)',
                      color: 'var(--danger)',
                      border: '1px solid #FFCDD2',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      marginTop: '4px'
                    }}
                  >
                    <LogOut size={14} />
                    <span>Cerrar Sesión</span>
                  </button>
                </div>
              </div>

              {/* Password Form */}
              <form onSubmit={handleChangePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--dark-text)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Key size={18} color="var(--terracotta)" />
                  <span>Modificar Contraseña de Acceso</span>
                </h4>

                {passwordStatus && (
                  <div style={{
                    backgroundColor: passwordStatus.type === 'success' ? 'var(--success-bg)' : 'var(--danger-bg)',
                    color: passwordStatus.type === 'success' ? 'var(--success)' : 'var(--danger)',
                    border: `1px solid ${passwordStatus.type === 'success' ? '#C8E6C9' : '#FFCDD2'}`,
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    {passwordStatus.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                    <span>{passwordStatus.text}</span>
                  </div>
                )}

                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--dark-text)', display: 'block', marginBottom: '4px' }}>
                    Nueva Contraseña
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="Mínimo 6 caracteres"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--sand-border)',
                      fontSize: '0.9rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--dark-text)', display: 'block', marginBottom: '4px' }}>
                    Confirmar Nueva Contraseña
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="Repite la nueva contraseña"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--sand-border)',
                      fontSize: '0.9rem'
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={passwordLoading}
                  style={{
                    backgroundColor: 'var(--terracotta)',
                    color: '#FFF',
                    border: 'none',
                    padding: '10px 16px',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    alignSelf: 'flex-start',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Save size={16} />
                  <span>{passwordLoading ? 'Guardando...' : 'Guardar Nueva Contraseña'}</span>
                </button>
              </form>

            </div>
          )}

          {activeTab === 'printer' && (
            <form onSubmit={handleSavePrinterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {printerSuccess && (
                <div style={{
                  backgroundColor: 'var(--success-bg)',
                  color: 'var(--success)',
                  border: '1px solid #C8E6C9',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <CheckCircle size={16} />
                  <span>¡Ajustes de impresora guardados con éxito!</span>
                </div>
              )}

              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--dark-text)', display: 'block', marginBottom: '6px' }}>
                  Ancho de Papel Térmico
                </label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {['80mm', '58mm'].map(width => (
                    <button
                      key={width}
                      type="button"
                      onClick={() => setPaperWidth(width)}
                      style={{
                        flex: 1,
                        padding: '10px',
                        borderRadius: '8px',
                        border: paperWidth === width ? '2px solid var(--terracotta)' : '1px solid var(--sand-border)',
                        backgroundColor: paperWidth === width ? 'var(--sand-muted)' : '#FFF',
                        color: paperWidth === width ? 'var(--terracotta)' : 'var(--dark-text)',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      {width} (Estándar POS)
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--dark-text)', display: 'block', marginBottom: '4px' }}>
                  Título Encabezado Ticket
                </label>
                <input
                  type="text"
                  value={headerTitle}
                  onChange={(e) => setHeaderTitle(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--sand-border)', fontSize: '0.9rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--dark-text)', display: 'block', marginBottom: '4px' }}>
                  Subtítulo Encabezado Ticket
                </label>
                <input
                  type="text"
                  value={headerSubtitle}
                  onChange={(e) => setHeaderSubtitle(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--sand-border)', fontSize: '0.9rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--dark-text)', display: 'block', marginBottom: '4px' }}>
                  Pie de Página del Ticket
                </label>
                <input
                  type="text"
                  value={footerMessage}
                  onChange={(e) => setFooterMessage(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--sand-border)', fontSize: '0.9rem' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
                <input
                  type="checkbox"
                  id="autoPrintCheckbox"
                  checked={autoPrint}
                  onChange={(e) => setAutoPrint(e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <label htmlFor="autoPrintCheckbox" style={{ fontSize: '0.88rem', fontWeight: 600, cursor: 'pointer' }}>
                  Imprimir ticket automáticamente al completar cobro
                </label>
              </div>

              <button
                type="submit"
                style={{
                  backgroundColor: 'var(--terracotta)',
                  color: '#FFF',
                  border: 'none',
                  padding: '10px 16px',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  alignSelf: 'flex-start',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginTop: '0.5rem'
                }}
              >
                <Save size={16} />
                <span>Guardar Ajustes de Impresora</span>
              </button>
            </form>
          )}

        </div>

      </div>
    </div>
  );
}

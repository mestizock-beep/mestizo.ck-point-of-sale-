import React, { useState } from 'react';
import { Settings, Lock, User, Key, Printer, Shield, CheckCircle, AlertCircle, X, LogOut, Save, UserPlus, Users, Trash2, ShieldCheck } from 'lucide-react';
import { supabase, isSupabaseConfigured, signUpWithEmail } from '../utils/supabaseClient';

export default function SettingsModal({
  currentUser,
  printerSettings,
  onSavePrinterSettings,
  onLogout,
  onClose
}) {
  const isAdmin = currentUser?.role === 'admin' ||
                  (currentUser?.email && (currentUser.email.toLowerCase().includes('usiel') || currentUser.email.toLowerCase().includes('admin')));
  const [activeTab, setActiveTab] = useState(isAdmin ? 'team' : 'security'); // Default to 'team' for admin so Usiel sees it immediately!

  // Password Change state
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

  // Team Users state (Admin Only)
  const [teamUsers, setTeamUsers] = useState(() => {
    try {
      const stored = localStorage.getItem('mestizo_pos_team_users');
      return stored ? JSON.parse(stored) : [
        { email: 'usiel@restaurantemestizo.com', fullName: 'Usiel Chi (Dueño)', password: 'Mestizo2026!', role: 'admin' },
        { email: 'fer@restaurantemestizo.com', fullName: 'Fer Segura', password: 'FerSegura123@', role: 'cajero' },
        { email: 'kaleb@restaurantemestizo.com', fullName: 'Kaleb (Mesero)', password: 'KalebMestizo123@', role: 'mesero' },
        { email: 'roberto@restaurantemestizo.com', fullName: 'Roberto Chi', password: 'RobertoChi123@', role: 'cajero' },
        { email: 'cajero@restaurantemestizo.com', fullName: 'Cajero de Turno', password: 'Caja123456', role: 'cajero' }
      ];
    } catch (e) {
      return [];
    }
  });

  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState('cajero');
  const [teamStatus, setTeamStatus] = useState(null);
  const [teamLoading, setTeamLoading] = useState(false);

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
        const storedUser = JSON.parse(localStorage.getItem('mestizo_pos_user_session') || '{}');
        storedUser.password = newPassword;
        localStorage.setItem('mestizo_pos_user_session', JSON.stringify(storedUser));
      }

      setPasswordStatus({ type: 'success', text: '¡Contraseña actualizada correctamente!' });
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

  const handleCreateUserSubmit = async (e) => {
    e.preventDefault();
    setTeamStatus(null);

    if (!isAdmin) {
      setTeamStatus({ type: 'error', text: 'Solo el Administrador (Usiel) puede crear nuevos usuarios.' });
      return;
    }

    if (newUserPassword.length < 6) {
      setTeamStatus({ type: 'error', text: 'La contraseña asignada debe tener al menos 6 caracteres.' });
      return;
    }

    const existing = teamUsers.find(u => u.email.toLowerCase() === newUserEmail.toLowerCase());
    if (existing) {
      setTeamStatus({ type: 'error', text: 'Ya existe un usuario registrado con este correo.' });
      return;
    }

    setTeamLoading(true);

    try {
      if (isSupabaseConfigured) {
        const { error } = await signUpWithEmail(newUserEmail, newUserPassword, {
          fullName: newUserName,
          role: newUserRole
        });
        if (error && !error.message.includes('API key')) {
          throw error;
        }
      }

      const newUserObj = {
        email: newUserEmail,
        fullName: newUserName || newUserEmail.split('@')[0],
        password: newUserPassword,
        role: newUserRole
      };

      const updatedList = [newUserObj, ...teamUsers];
      setTeamUsers(updatedList);
      localStorage.setItem('mestizo_pos_team_users', JSON.stringify(updatedList));

      setTeamStatus({ type: 'success', text: `¡Usuario "${newUserName || newUserEmail}" creado exitosamente!` });
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserName('');
      setNewUserRole('cajero');
    } catch (err) {
      setTeamStatus({ type: 'error', text: err.message || 'Error al crear usuario.' });
    } finally {
      setTeamLoading(false);
    }
  };

  const handleDeleteUser = (userEmail) => {
    if (userEmail.toLowerCase() === currentUser?.email?.toLowerCase()) {
      alert('No puedes eliminar tu propia cuenta activa.');
      return;
    }

    if (confirm(`¿Estás seguro de eliminar el usuario "${userEmail}"? Ya no podrá acceder al sistema.`)) {
      const updated = teamUsers.filter(u => u.email.toLowerCase() !== userEmail.toLowerCase());
      setTeamUsers(updated);
      localStorage.setItem('mestizo_pos_team_users', JSON.stringify(updated));
    }
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
        maxWidth: '580px',
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
              <span style={{ fontSize: '0.78rem', color: 'var(--dark-subdued)' }}>Seguridad, personal y tickets de impresión</span>
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
              padding: '12px 8px',
              border: 'none',
              borderBottom: activeTab === 'security' ? '3px solid var(--terracotta)' : '3px solid transparent',
              backgroundColor: activeTab === 'security' ? '#FFF' : 'transparent',
              color: activeTab === 'security' ? 'var(--terracotta)' : 'var(--dark-subdued)',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <Shield size={16} />
            <span>Perfil & Seguridad</span>
          </button>

          {isAdmin && (
            <button
              onClick={() => setActiveTab('team')}
              style={{
                flex: 1,
                padding: '12px 8px',
                border: 'none',
                borderBottom: activeTab === 'team' ? '3px solid var(--terracotta)' : '3px solid transparent',
                backgroundColor: activeTab === 'team' ? '#FFF' : 'transparent',
                color: activeTab === 'team' ? 'var(--terracotta)' : 'var(--dark-subdued)',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <Users size={16} />
              <span>Gestión de Personal</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('printer')}
            style={{
              flex: 1,
              padding: '12px 8px',
              border: 'none',
              borderBottom: activeTab === 'printer' ? '3px solid var(--terracotta)' : '3px solid transparent',
              backgroundColor: activeTab === 'printer' ? '#FFF' : 'transparent',
              color: activeTab === 'printer' ? 'var(--terracotta)' : 'var(--dark-subdued)',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
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

          {activeTab === 'team' && isAdmin && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              <form onSubmit={handleCreateUserSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', backgroundColor: 'var(--sand-bg)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--sand-border)' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--dark-text)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <UserPlus size={18} color="var(--terracotta)" />
                  <span>Crear Nuevo Usuario / Asignar Cajero</span>
                </h4>

                {teamStatus && (
                  <div style={{
                    backgroundColor: teamStatus.type === 'success' ? 'var(--success-bg)' : 'var(--danger-bg)',
                    color: teamStatus.type === 'success' ? 'var(--success)' : 'var(--danger)',
                    border: `1px solid ${teamStatus.type === 'success' ? '#C8E6C9' : '#FFCDD2'}`,
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    {teamStatus.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                    <span>{teamStatus.text}</span>
                  </div>
                )}

                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--dark-text)', display: 'block', marginBottom: '4px' }}>
                    Nombre del Colaborador
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Usiel Morales / Pedro Cajero"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--sand-border)', fontSize: '0.9rem', backgroundColor: '#FFF' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--dark-text)', display: 'block', marginBottom: '4px' }}>
                    Correo Electrónico de Ingreso
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="cajero1@restaurantemestizo.com"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--sand-border)', fontSize: '0.9rem', backgroundColor: '#FFF' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--dark-text)', display: 'block', marginBottom: '4px' }}>
                    Contraseña Asignada
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="Mínimo 6 caracteres"
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--sand-border)', fontSize: '0.9rem', backgroundColor: '#FFF' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--dark-text)', display: 'block', marginBottom: '4px' }}>
                    Rol Asignado
                  </label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--sand-border)', fontSize: '0.9rem', backgroundColor: '#FFF', fontWeight: 700 }}
                  >
                    <option value="cajero">Cajero / Encargado de Caja (Fer Segura / Operador)</option>
                    <option value="mesero">Mesero (Fer Segura, Kaleb - Toma de Comandas en Mesas)</option>
                    <option value="cocina">Cocina (Cocinero - Pantalla KDS)</option>
                    <option value="barra">Barra (Bartender - Pantalla BDS)</option>
                    <option value="admin">Administrador (Usiel Chi - Acceso Total)</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={teamLoading}
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
                    marginTop: '0.25rem'
                  }}
                >
                  <UserPlus size={16} />
                  <span>{teamLoading ? 'Creando...' : 'Crear Usuario'}</span>
                </button>
              </form>

              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--dark-text)', marginBottom: '0.75rem' }}>
                  Personal Registrado ({teamUsers.length})
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {teamUsers.map(user => (
                    <div
                      key={user.email}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: '1px solid var(--sand-border)',
                        backgroundColor: '#FFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{user.fullName || user.email}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--dark-subdued)' }}>{user.email}</div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          backgroundColor: user.role === 'admin' ? 'var(--terracotta)' : 'var(--dark-subdued)',
                          color: '#FFF',
                          fontSize: '0.7rem',
                          padding: '2px 8px',
                          borderRadius: '10px',
                          fontWeight: 700,
                          textTransform: 'uppercase'
                        }}>
                          {user.role === 'admin' ? 'Admin' : 'Cajero'}
                        </span>

                        {user.email.toLowerCase() !== currentUser?.email?.toLowerCase() && (
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(user.email)}
                            title="Eliminar usuario"
                            style={{
                              backgroundColor: 'var(--danger-bg)',
                              color: 'var(--danger)',
                              border: 'none',
                              width: '28px',
                              height: '28px',
                              borderRadius: '6px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer'
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

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

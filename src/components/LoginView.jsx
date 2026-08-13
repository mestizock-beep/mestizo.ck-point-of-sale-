import React, { useState } from 'react';
import { Lock, Mail, User, ShieldCheck, ArrowRight, AlertCircle, KeyRound, Store } from 'lucide-react';
import Logo from './Logo';

export default function LoginView({ onLoginSuccess }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('cajero'); // 'admin' | 'cajero'
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email || !password) {
      setErrorMessage('Por favor ingresa tu correo y contraseña.');
      return;
    }

    setLoading(true);

    try {
      if (onLoginSuccess) {
        const result = await onLoginSuccess({
          isSignUp,
          email,
          password,
          fullName: fullName || (email.split('@')[0]),
          role
        });

        if (result && result.error) {
          setErrorMessage(result.error);
        }
      }
    } catch (err) {
      setErrorMessage(err.message || 'Error al autenticar. Verifica tus datos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      backgroundColor: 'var(--sand-bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem',
      position: 'relative',
      boxSizing: 'border-box'
    }}>
      <div className="animate-fade-in" style={{
        width: '100%',
        maxWidth: '440px',
        backgroundColor: '#FFFFFF',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-lg)',
        border: '1px solid var(--sand-border)',
        overflow: 'hidden'
      }}>
        
        {/* Header Branding */}
        <div style={{
          backgroundColor: 'var(--sand-muted)',
          padding: '2rem 1.5rem 1.5rem 1.5rem',
          textAlign: 'center',
          borderBottom: '1px solid var(--sand-border)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>
          <Logo size="lg" variant="terracotta" />
          <p style={{ fontSize: '0.85rem', color: 'var(--dark-subdued)', marginTop: '8px', fontWeight: 600 }}>
            Acceso Privado al Sistema de Punto de Venta
          </p>
        </div>

        {/* Form Body */}
        <div style={{ padding: '1.75rem' }}>
          
          {errorMessage && (
            <div style={{
              backgroundColor: 'var(--danger-bg)',
              color: 'var(--danger)',
              border: '1px solid #FFCDD2',
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.85rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '1.25rem'
            }}>
              <AlertCircle size={18} />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            
            {isSignUp && (
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--dark-text)', display: 'block', marginBottom: '6px' }}>
                  Nombre Completo
                </label>
                <div style={{ position: 'relative' }}>
                  <User size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--dark-subdued)' }} />
                  <input
                    type="text"
                    required
                    placeholder="Ej. Usiel Morales"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px 10px 38px',
                      borderRadius: '8px',
                      border: '1px solid var(--sand-border)',
                      fontSize: '0.92rem',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>
            )}

            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--dark-text)', display: 'block', marginBottom: '6px' }}>
                Correo Electrónico
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--dark-subdued)' }} />
                <input
                  type="email"
                  required
                  placeholder="usuario@restaurantemestizo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 38px',
                    borderRadius: '8px',
                    border: '1px solid var(--sand-border)',
                    fontSize: '0.92rem',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--dark-text)', display: 'block', marginBottom: '6px' }}>
                Contraseña
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--dark-subdued)' }} />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 38px',
                    borderRadius: '8px',
                    border: '1px solid var(--sand-border)',
                    fontSize: '0.92rem',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            {isSignUp && (
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--dark-text)', display: 'block', marginBottom: '6px' }}>
                  Rol de Usuario
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--sand-border)',
                    fontSize: '0.92rem',
                    backgroundColor: '#FFF',
                    fontWeight: 600
                  }}
                >
                  <option value="cajero">Cajero / Operador de Caja</option>
                  <option value="admin">Administrador (Acceso Total)</option>
                </select>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: '0.5rem',
                backgroundColor: 'var(--terracotta)',
                color: '#FFF',
                border: 'none',
                padding: '12px',
                borderRadius: '9px',
                fontSize: '1rem',
                fontWeight: 700,
                cursor: loading ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: 'var(--shadow-sm)',
                transition: 'background-color 0.2s ease'
              }}
            >
              <span>{loading ? 'Ingresando...' : isSignUp ? 'Crear Cuenta' : 'Iniciar Sesión'}</span>
              <ArrowRight size={18} />
            </button>
          </form>

          <div style={{ marginTop: '1.25rem', textAlign: 'center' }}>
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setErrorMessage('');
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--terracotta)',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              {isSignUp ? '¿Ya tienes cuenta? Inicia sesión aquí' : '¿Nuevo colaborador? Registrar usuario'}
            </button>
          </div>

        </div>

        {/* Footer info */}
        <div style={{
          backgroundColor: 'var(--sand-bg)',
          padding: '0.85rem',
          textAlign: 'center',
          borderTop: '1px solid var(--sand-border)',
          fontSize: '0.78rem',
          color: 'var(--dark-subdued)'
        }}>
          <span>Mestizo Comedor & Bar • Sistema de Seguridad Protegido</span>
        </div>

      </div>
    </div>
  );
}

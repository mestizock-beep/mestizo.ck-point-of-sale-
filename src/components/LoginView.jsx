import React, { useState } from 'react';
import { Lock, Mail, ArrowRight, AlertCircle, ShieldAlert } from 'lucide-react';
import Logo from './Logo';

export default function LoginView({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
          email,
          password
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
        maxWidth: '420px',
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
              <span>{loading ? 'Verificando...' : 'Iniciar Sesión'}</span>
              <ArrowRight size={18} />
            </button>
          </form>

          {/* Security note */}
          <div style={{
            marginTop: '1.5rem',
            padding: '12px',
            backgroundColor: 'var(--sand-bg)',
            borderRadius: '8px',
            border: '1px solid var(--sand-border)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
            fontSize: '0.78rem',
            color: 'var(--dark-subdued)',
            lineHeight: 1.4
          }}>
            <ShieldAlert size={18} style={{ color: 'var(--terracotta)', flexShrink: 0, marginTop: '2px' }} />
            <span>
              <strong>Acceso Restringido:</strong> Por seguridad, las cuentas de personal deben ser creadas y asignadas directamente por el <strong>Administrador (Usiel)</strong> desde el panel de Ajustes.
            </span>
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

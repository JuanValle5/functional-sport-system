import React, { useEffect, useState } from 'react';

const TAB_META = {
  monitor: {
    titulo: 'Monitor de Control de Acceso Biométrico',
    descripcion: ''
  },
  clientes: {
    titulo: 'Directorio de Socios y Enrolamiento Biométrico',
    descripcion: 'Registro rápido en frío y captura de huellas dactilares en memoria RAM'
  },
  membresias: {
    titulo: 'Planes, Renovaciones y Congelamiento Médico',
    descripcion: 'Activación con corte dinámico, pago completo anticipado y pausas con certificado médico'
  },
  caja: {
    titulo: 'Control de Turnos de Caja y Cuadre Diario',
    descripcion: 'Administración de turnos Mañana y Tarde en los 5 canales oficiales de recaudo'
  },
  admin: {
    titulo: 'Panel Ejecutivo de Gerencia y Respaldo',
    descripcion: 'Métricas de rentabilidad, usuarios del sistema, auditoría Admin y backups cifrados'
  },
  perfil: {
    titulo: 'Perfil del Operador y Seguridad de Sesión',
    descripcion: 'Información de la cuenta activa, matriz de permisos asignada y control de sesión'
  }
};

/**
 * Extrae las 2 iniciales del operador (primera letra del nombre + primera letra del apellido).
 * Limpia sufijos descriptivos tras guiones como "Jhorman - Administrador Funcional Sport Col".
 */
export function obtenerInicialesOperador(nombreCompleto, username) {
  const base = String(nombreCompleto || '')
    .split(/\s+[-–—]\s+/)[0]
    .trim();

  const partes = base.split(/\s+/).filter(Boolean);
  if (partes.length >= 2) {
    return `${partes[0][0]}${partes[partes.length - 1][0]}`.toUpperCase();
  }
  if (partes.length === 1 && partes[0].length >= 2) {
    return partes[0].slice(0, 2).toUpperCase();
  }
  const cleanUser = String(username || 'FS').replace(/[^a-zA-Z0-9]/g, '');
  return (cleanUser.slice(0, 2) || 'FS').toUpperCase();
}

export function Sidebar({ usuario, activeTab, onSelectTab }) {
  const esAdmin = usuario?.rol === 'ADMIN';
  const iniciales = obtenerInicialesOperador(usuario?.nombreCompleto, usuario?.username);
  const nombreCorto =
    String(usuario?.nombreCompleto || usuario?.username || 'Operador')
      .split(/\s+[-–—]\s+/)[0]
      .trim();

  return (
    <aside className="sidebar" aria-label="Navegación principal">
      {/* Esquina superior izquierda: únicamente el logo */}
      <div className="sidebar-brand">
        <button
          type="button"
          className="sidebar-brand-btn"
          onClick={() => onSelectTab('monitor')}
          data-tooltip="Funcional Sport Col"
          title="Funcional Sport Col — Ir al Monitor"
          aria-label="Funcional Sport Col — Ir al Monitor de Acceso"
        >
          <img
            src="/logos/web-monograma-fs-neon.png"
            alt="Funcional Sport"
            className="sidebar-logo"
          />
        </button>
      </div>

      {/* Navegación central minimalista (solo íconos + línea neón activa) */}
      <div className="sidebar-scroll-area">
        <nav className="sidebar-nav">
          <button
            type="button"
            className={`nav-item ${activeTab === 'monitor' ? 'active' : ''}`}
            onClick={() => onSelectTab('monitor')}
            data-tooltip="Monitor de Acceso"
            title="Monitor de Acceso"
            aria-label="Monitor de Acceso"
            aria-current={activeTab === 'monitor' ? 'page' : undefined}
          >
            <svg
              className="nav-item-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.1"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
            </svg>
          </button>

          <button
            type="button"
            className={`nav-item ${activeTab === 'clientes' ? 'active' : ''}`}
            onClick={() => onSelectTab('clientes')}
            data-tooltip="Socios y Huellas"
            title="Socios y Huellas"
            aria-label="Socios y Huellas"
            aria-current={activeTab === 'clientes' ? 'page' : undefined}
          >
            <svg
              className="nav-item-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.1"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 00-3-3.87m-4-12a4 4 0 010 7.75" />
            </svg>
          </button>

          <button
            type="button"
            className={`nav-item ${activeTab === 'membresias' ? 'active' : ''}`}
            onClick={() => onSelectTab('membresias')}
            data-tooltip="Planes y Membresías"
            title="Planes y Membresías"
            aria-label="Planes y Membresías"
            aria-current={activeTab === 'membresias' ? 'page' : undefined}
          >
            <svg
              className="nav-item-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.1"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="2" y="5" width="20" height="14" rx="2" />
              <line x1="2" y1="10" x2="22" y2="10" />
            </svg>
          </button>

          <button
            type="button"
            className={`nav-item ${activeTab === 'caja' ? 'active' : ''}`}
            onClick={() => onSelectTab('caja')}
            data-tooltip="Caja y Turnos"
            title="Caja y Turnos"
            aria-label="Caja y Turnos"
            aria-current={activeTab === 'caja' ? 'page' : undefined}
          >
            <svg
              className="nav-item-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.1"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
            </svg>
          </button>

          {esAdmin && (
            <button
              type="button"
              className={`nav-item ${activeTab === 'admin' ? 'active' : ''}`}
              onClick={() => onSelectTab('admin')}
              data-tooltip="Panel Gerencia"
              title="Panel Gerencia"
              aria-label="Panel Gerencia"
              aria-current={activeTab === 'admin' ? 'page' : undefined}
            >
              <svg
                className="nav-item-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.1"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 20V10M12 20V4M6 20v-6" />
              </svg>
            </button>
          )}
        </nav>

        {/* Pie de barra lateral: 2do Monitor y Botón de Perfil con 2 Iniciales */}
        <div className="sidebar-footer">
          <a
            href="/?vista=monitor-cliente"
            target="_blank"
            rel="noreferrer"
            className="nav-item sidebar-monitor-btn"
            data-tooltip="Pantalla Cliente (2do Monitor)"
            title="Abrir Pantalla Cliente (2do Monitor)"
            aria-label="Abrir Pantalla Cliente (2do Monitor)"
          >
            <svg
              className="nav-item-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.1"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
          </a>

          <button
            type="button"
            className={`sidebar-profile-btn ${activeTab === 'perfil' ? 'active' : ''}`}
            onClick={() => onSelectTab('perfil')}
            data-tooltip={`Mi Perfil • ${nombreCorto}`}
            title={`Mi Perfil (${nombreCorto})`}
            aria-label={`Abrir apartado de perfil de ${nombreCorto}`}
            aria-current={activeTab === 'perfil' ? 'page' : undefined}
          >
            <span className="sidebar-profile-initials">{iniciales}</span>
            <span
              className={`sidebar-profile-status-dot ${
                esAdmin ? 'is-admin' : 'is-operator'
              }`}
              aria-hidden="true"
            />
          </button>
        </div>
      </div>
    </aside>
  );
}

export function TopHeader({ activeTab, turnoAbierto, onIrACaja }) {
  const [hora, setHora] = useState(
    new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setHora(
        new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
      );
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  const meta = TAB_META[activeTab] || TAB_META.monitor;

  return (
    <header className="workspace-header">
      <div className="workspace-title">
        <h1>
          <img src="/logos/web-monograma-fs-neon.png" alt="FS" style={{ height: '24px' }} />
          {meta.titulo}
        </h1>
        {meta.descripcion && <p>{meta.descripcion}</p>}
      </div>

      <div className="header-status-group">
        <button
          type="button"
          className={`cash-status-pill ${turnoAbierto ? 'open' : 'closed'}`}
          onClick={onIrACaja}
          title="Haz clic para ir al control de turnos de caja"
        >
          <span className="status-dot" />
          {turnoAbierto
            ? `CAJA ABIERTA • TURNO ${turnoAbierto.jornada} ($${Number(
                turnoAbierto.totalGeneralRecaudo || 0
              ).toLocaleString('es-CO')})`
            : 'CAJA CERRADA • CLIC PARA ABRIR TURNO'}
        </button>

        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            padding: '0.4rem 0.85rem',
            borderRadius: '8px',
            fontSize: '0.82rem',
            fontWeight: 800,
            color: 'var(--text-secondary)'
          }}
        >
          {hora}
        </div>
      </div>
    </header>
  );
}

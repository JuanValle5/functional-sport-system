import React, { useEffect, useState } from 'react';

const TAB_META = {
  monitor: {
    titulo: 'Monitor de Control de Acceso Biométrico',
    descripcion: 'Validación en tiempo real (< 1s) con sensor ZKTeco • Anti-Passback diario activo'
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
  }
};

export function Sidebar({ usuario, activeTab, onSelectTab, onLogout }) {
  const esAdmin = usuario?.rol === 'ADMIN';

  return (
    <aside className="sidebar">
      <div>
        <div className="sidebar-brand">
          <img
            src="/logos/web-logo-horizontal-blanco-neon.png"
            alt="Funcional Sport"
            className="sidebar-logo"
          />
          <span className="sidebar-tag">Sistema Local de Control Biométrico</span>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-label">Operación de Recepción</div>

          <button
            type="button"
            className={`nav-item ${activeTab === 'monitor' ? 'active' : ''}`}
            onClick={() => onSelectTab('monitor')}
          >
            <svg className="nav-item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
            </svg>
            <div className="nav-item-text">
              <span className="nav-item-title">Monitor de Acceso</span>
              <span className="nav-item-sub">Semáforo y Lector ZKTeco</span>
            </div>
          </button>

          <button
            type="button"
            className={`nav-item ${activeTab === 'clientes' ? 'active' : ''}`}
            onClick={() => onSelectTab('clientes')}
          >
            <svg className="nav-item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 00-3-3.87m-4-12a4 4 0 010 7.75" />
            </svg>
            <div className="nav-item-text">
              <span className="nav-item-title">Socios y Huellas</span>
              <span className="nav-item-sub">Registro y Enrolamiento</span>
            </div>
          </button>

          <button
            type="button"
            className={`nav-item ${activeTab === 'membresias' ? 'active' : ''}`}
            onClick={() => onSelectTab('membresias')}
          >
            <svg className="nav-item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <rect x="2" y="5" width="20" height="14" rx="2" />
              <line x1="2" y1="10" x2="22" y2="10" />
            </svg>
            <div className="nav-item-text">
              <span className="nav-item-title">Planes y Membresías</span>
              <span className="nav-item-sub">Ventas y Congelamiento</span>
            </div>
          </button>

          <button
            type="button"
            className={`nav-item ${activeTab === 'caja' ? 'active' : ''}`}
            onClick={() => onSelectTab('caja')}
          >
            <svg className="nav-item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
            </svg>
            <div className="nav-item-text">
              <span className="nav-item-title">Caja y Turnos</span>
              <span className="nav-item-sub">Mañana / Tarde y Cuadre</span>
            </div>
          </button>

          {esAdmin && (
            <>
              <div className="nav-section-label" style={{ marginTop: '0.75rem' }}>
                Administración
              </div>
              <button
                type="button"
                className={`nav-item ${activeTab === 'admin' ? 'active' : ''}`}
                onClick={() => onSelectTab('admin')}
              >
                <svg className="nav-item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M18 20V10M12 20V4M6 20v-6" />
                </svg>
                <div className="nav-item-text">
                  <span className="nav-item-title">Panel Gerencia</span>
                  <span className="nav-item-sub">Rentabilidad y Backups</span>
                </div>
              </button>
            </>
          )}
        </nav>
      </div>

      <div className="sidebar-footer">
        <a
          href="/?vista=monitor-cliente"
          target="_blank"
          rel="noreferrer"
          className="btn btn-outline"
          style={{ width: '100%', textDecoration: 'none', fontSize: '0.75rem' }}
        >
          Abrir Pantalla Cliente (2do Monitor)
        </a>

        <div className="operator-card">
          <img
            src="/logos/web-monograma-fs-neon.png"
            alt="FS"
            style={{ height: '30px', width: 'auto' }}
          />
          <div className="operator-info">
            <div className="operator-name">{usuario?.nombreCompleto}</div>
            <span
              className={`semaforo-badge ${
                esAdmin ? 'badge-verde' : 'badge-neutral'
              }`}
              style={{ fontSize: '0.62rem', padding: '0.12rem 0.5rem' }}
            >
              {usuario?.rol}
            </span>
          </div>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={onLogout}
            title="Cambiar de operador"
          >
            Salir
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
        <p>{meta.descripcion}</p>
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

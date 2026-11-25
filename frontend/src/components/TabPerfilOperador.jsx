import React from 'react';
import { obtenerInicialesOperador } from './Navbar.jsx';

const CATALOGO_PERMISOS = [
  {
    clave: 'registrarClientesYHuellas',
    titulo: 'Registro de Socios y Biometría',
    descripcion: 'Alta rápida de deportistas en recepción y captura de huellas en RAM.'
  },
  {
    clave: 'venderYRenovarMembresias',
    titulo: 'Venta y Renovación de Planes',
    descripcion: 'Activación de membresías con corte dinámico en los 5 canales.'
  },
  {
    clave: 'abrirYCerrarTurnoCaja',
    titulo: 'Apertura y Cierre de Turnos',
    descripcion: 'Gestión de jornadas Mañana/Tarde y acta de cuadre diario.'
  },
  {
    clave: 'editarOAnularPagosAsentados',
    titulo: 'Anulación de Pagos Asentados',
    descripcion: 'Reversión de movimientos financieros registrados en un turno.'
  },
  {
    clave: 'alterarFechasVigenciaSinClaveAdmin',
    titulo: 'Alteración Manual de Vigencias',
    descripcion: 'Cambio de fechas de corte sin requerir desbloqueo adicional.'
  },
  {
    clave: 'anularMembresiasActivas',
    titulo: 'Anulación de Membresías Activas',
    descripcion: 'Cancelación administrativa de planes vigentes.'
  },
  {
    clave: 'verReportesGlobalesRentabilidad',
    titulo: 'Panel Ejecutivo y Antifraude',
    descripcion: 'Consulta de métricas globales y bitácora de autorizaciones.'
  },
  {
    clave: 'gestionarUsuariosYPlanes',
    titulo: 'Operadores, Tarifas y Backups AES',
    descripcion: 'Creación de cuentas, configuración de planes y respaldos cifrados.'
  }
];

export default function TabPerfilOperador({
  usuario,
  turnoAbierto,
  onIrACaja,
  onIrAGerencia,
  onLogout
}) {
  const esAdmin = usuario?.rol === 'ADMIN';
  const iniciales = obtenerInicialesOperador(usuario?.nombreCompleto, usuario?.username);
  const permisosMapa = usuario?.matrizPermisos || {};

  const totalPermisos = CATALOGO_PERMISOS.length;
  const permisosHabilitados = CATALOGO_PERMISOS.filter((p) =>
    permisosMapa[p.clave] !== undefined ? Boolean(permisosMapa[p.clave]) : esAdmin
  ).length;

  const fechaCreacionFormateada = usuario?.createdAt
    ? new Date(usuario.createdAt).toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    : 'Cuenta Oficial';

  return (
    <section className="tab-viewport">
      {/* KPIs superiores del perfil */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-label">Perfil de Seguridad</div>
          <div className="kpi-value" style={{ color: 'var(--brand-neon)', fontSize: '1.28rem' }}>
            {usuario?.rol || 'OPERADOR'}
          </div>
          <div className="kpi-sub">
            {esAdmin ? 'Control gerencial y auditoría total' : 'Operación de recepción y caja'}
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Estado de Credencial</div>
          <div className="kpi-value" style={{ fontSize: '1.28rem' }}>
            {usuario?.activo !== false ? 'ACTIVA' : 'INACTIVA'}
          </div>
          <div className="kpi-sub">Sesión autenticada en servidor local</div>
        </div>

        <div className={`kpi-card ${turnoAbierto ? '' : 'warn'}`}>
          <div className="kpi-label">Estado de Caja Actual</div>
          <div
            className="kpi-value"
            style={{
              fontSize: '1.28rem',
              color: turnoAbierto ? 'var(--brand-neon)' : 'var(--semaforo-amarillo)'
            }}
          >
            {turnoAbierto ? `TURNO ${turnoAbierto.jornada}` : 'CAJA CERRADA'}
          </div>
          <div className="kpi-sub">
            {turnoAbierto
              ? `Recaudo: $${Number(turnoAbierto.totalGeneralRecaudo || 0).toLocaleString('es-CO')} COP`
              : 'Sin turno operativo abierto'}
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Permisos Directos</div>
          <div className="kpi-value" style={{ fontSize: '1.28rem' }}>
            {permisosHabilitados} / {totalPermisos}
          </div>
          <div className="kpi-sub">Matriz de Seguridad (Sección 3.5)</div>
        </div>
      </div>

      <div className="tab-split-fill">
        {/* Columna Izquierda: Tarjeta de Identidad y Control de Sesión */}
        <div className="card card-fill profile-identity-card">
          <div>
            <div className="profile-hero">
              <div className="profile-avatar-xl" aria-hidden="true">
                <span>{iniciales}</span>
                <span className="profile-online-dot" title="Sesión activa" />
              </div>

              <div className="profile-hero-info">
                <div className="profile-badges-row">
                  <span className={`semaforo-badge ${esAdmin ? 'badge-verde' : 'badge-neutral'}`}>
                    {usuario?.rol}
                  </span>
                  <span className="profile-status-pill">
                    <span className="status-dot" />
                    En sesión
                  </span>
                </div>
                <h2 className="profile-fullname">{usuario?.nombreCompleto || 'Operador'}</h2>
                <p className="profile-username">@{usuario?.username}</p>
              </div>
            </div>

            <div className="profile-details-grid-2x2" style={{ marginTop: '0.75rem' }}>
              <div className="profile-detail-box">
                <span className="profile-detail-label">Usuario</span>
                <strong className="profile-detail-value">@{usuario?.username}</strong>
              </div>
              <div className="profile-detail-box">
                <span className="profile-detail-label">Documento</span>
                <strong className="profile-detail-value">{usuario?.numeroDocumento || '—'}</strong>
              </div>
              <div className="profile-detail-box">
                <span className="profile-detail-label">Alta en Sistema</span>
                <strong className="profile-detail-value">{fechaCreacionFormateada}</strong>
              </div>
              <div className="profile-detail-box">
                <span className="profile-detail-label">ID Interno</span>
                <strong className="profile-detail-value profile-mono">
                  {usuario?.id ? String(usuario.id).slice(0, 10).toUpperCase() : 'LOCAL-AUTH'}
                </strong>
              </div>
            </div>

            {/* Resumen rápido del turno en curso */}
            <div className="profile-shift-box" style={{ marginTop: '0.75rem' }}>
              <div className="profile-shift-header">
                <span className="profile-shift-title">Puesto de Recepción y Turno</span>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={onIrACaja}
                >
                  Ir a Caja →
                </button>
              </div>
              <p className="profile-shift-desc">
                {turnoAbierto
                  ? `Turno ${turnoAbierto.jornada} abierto por ${
                      turnoAbierto.usuarioNombreCompleto || usuario?.nombreCompleto
                    }.`
                  : 'Caja cerrada. Para facturar planes debes abrir turno de recepción.'}
              </p>
            </div>
          </div>

          {/* Botones de Acción de Puesto y Cierre de Sesión */}
          <div className="profile-actions-stack">
            <div style={{ display: 'flex', gap: '0.45rem' }}>
              <a
                href="/?vista=monitor-cliente"
                target="_blank"
                rel="noreferrer"
                className="btn btn-outline"
                style={{ flex: 1, textDecoration: 'none', padding: '0.48rem 0.65rem' }}
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                >
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                  <line x1="8" y1="21" x2="16" y2="21" />
                  <line x1="12" y1="17" x2="12" y2="21" />
                </svg>
                <span>2do Monitor</span>
              </a>

              {esAdmin && onIrAGerencia && (
                <button
                  type="button"
                  className="btn btn-outline"
                  style={{ flex: 1, padding: '0.48rem 0.65rem' }}
                  onClick={onIrAGerencia}
                >
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                  >
                    <path d="M18 20V10M12 20V4M6 20v-6" />
                  </svg>
                  <span>Panel Gerencia</span>
                </button>
              )}
            </div>

            <button
              type="button"
              className="btn btn-danger"
              style={{ width: '100%' }}
              onClick={onLogout}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
              >
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span>Cerrar Sesión / Cambiar de Operador</span>
            </button>
          </div>
        </div>

        {/* Columna Derecha: Matriz de Permisos de Seguridad (2x4 Sin Scroll) */}
        <div className="card card-fill">
          <div className="card-header">
            <div className="card-title">
              <img src="/logos/web-monograma-fs-neon.png" alt="FS" style={{ height: '16px' }} />
              Matriz de Permisos y Alcance de la Cuenta
            </div>
            <span className={`semaforo-badge ${esAdmin ? 'badge-verde' : 'badge-amarillo'}`}>
              {esAdmin ? 'NIVEL GERENCIA (ADMIN)' : 'NIVEL RECEPCIÓN'}
            </span>
          </div>

          <p
            style={{
              fontSize: '0.77rem',
              color: 'var(--text-secondary)',
              marginBottom: '0.65rem',
              flexShrink: 0
            }}
          >
            Políticas de seguridad activas para tu sesión actual. Las operaciones restringidas en
            recepción solicitan autorización con contraseña de Administrador.
          </p>

          <div className="permissions-grid">
            {CATALOGO_PERMISOS.map((perm) => {
              const habilitado =
                permisosMapa[perm.clave] !== undefined
                  ? Boolean(permisosMapa[perm.clave])
                  : esAdmin;

              return (
                <div
                  key={perm.clave}
                  className={`permission-item-card ${habilitado ? 'enabled' : 'restricted'}`}
                >
                  <div className="permission-icon-box" aria-hidden="true">
                    {habilitado ? (
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : (
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0110 0v4" />
                      </svg>
                    )}
                  </div>

                  <div className="permission-content">
                    <div className="permission-header-row">
                      <span className="permission-title">{perm.titulo}</span>
                      <span
                        className={`permission-badge ${
                          habilitado ? 'perm-ok' : 'perm-admin-key'
                        }`}
                      >
                        {habilitado ? 'Habilitado' : 'Clave Admin'}
                      </span>
                    </div>
                    <p className="permission-desc">{perm.descripcion}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

import React, { useEffect, useState } from 'react';
import { peticionApi } from '../services/api';

export default function TabGerenciaAdmin({ usuario, mostrarAlerta }) {
  const [dashboard, setDashboard] = useState(null);
  const [auditorias, setAuditorias] = useState([]);
  const [usuariosLista, setUsuariosLista] = useState([]);

  const [paginaUsuarios, setPaginaUsuarios] = useState(1);
  const [paginaAuditorias, setPaginaAuditorias] = useState(1);
  const [mostrarModalOperador, setMostrarModalOperador] = useState(false);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [numeroDocumento, setNumeroDocumento] = useState('');
  const [rol, setRol] = useState('RECEPCIONISTA');

  const USUARIOS_POR_PAGINA = 6;
  const AUDITORIAS_POR_PAGINA = 5;

  const cargarDatosAdmin = async () => {
    try {
      const [dash, auds, usrs] = await Promise.all([
        peticionApi(`/api/v1/admin/dashboard-movil?adminSolicitanteId=${usuario.id}`),
        peticionApi(`/api/v1/auth/auditoria-autorizaciones?adminSolicitanteId=${usuario.id}`),
        peticionApi('/api/v1/usuarios')
      ]);
      setDashboard(dash);
      setAuditorias(auds);
      setUsuariosLista(usrs);
    } catch (err) {
      mostrarAlerta(err.message, 'error');
    }
  };

  useEffect(() => {
    if (usuario?.rol === 'ADMIN') {
      cargarDatosAdmin();
    }
  }, [usuario]);

  const handleCrearUsuario = async (e) => {
    e.preventDefault();
    try {
      const creado = await peticionApi('/api/v1/usuarios', {
        method: 'POST',
        body: JSON.stringify({
          adminEjecutorId: usuario.id,
          username,
          password,
          nombreCompleto,
          numeroDocumento,
          rol
        })
      });
      mostrarAlerta(`Usuario creado: ${creado.username} (${creado.rol})`);
      setUsername('');
      setPassword('');
      setNombreCompleto('');
      setNumeroDocumento('');
      setMostrarModalOperador(false);
      await cargarDatosAdmin();
    } catch (err) {
      mostrarAlerta(err.message, 'error');
    }
  };

  const handleBackupManual = async () => {
    try {
      const b = await peticionApi(
        `/api/v1/admin/backups/ejecutar?adminSolicitanteId=${usuario.id}`,
        { method: 'POST' }
      );
      mostrarAlerta(
        `Respaldo cifrado AES generado: ${b.nombreArchivo} (${b.tamanoBytes} bytes)`
      );
      await cargarDatosAdmin();
    } catch (err) {
      mostrarAlerta(err.message, 'error');
    }
  };

  const totalPagUsuarios = Math.max(1, Math.ceil(usuariosLista.length / USUARIOS_POR_PAGINA));
  const pagUsuariosSegura = Math.min(paginaUsuarios, totalPagUsuarios);
  const inicioUsuarios = (pagUsuariosSegura - 1) * USUARIOS_POR_PAGINA;
  const usuariosPaginados = usuariosLista.slice(
    inicioUsuarios,
    inicioUsuarios + USUARIOS_POR_PAGINA
  );

  const totalPagAuditorias = Math.max(1, Math.ceil(auditorias.length / AUDITORIAS_POR_PAGINA));
  const pagAuditoriasSegura = Math.min(paginaAuditorias, totalPagAuditorias);
  const inicioAuditorias = (pagAuditoriasSegura - 1) * AUDITORIAS_POR_PAGINA;
  const auditoriasPaginadas = auditorias.slice(
    inicioAuditorias,
    inicioAuditorias + AUDITORIAS_POR_PAGINA
  );

  return (
    <section className="tab-viewport">
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-label">Socios Empadronados</div>
          <div className="kpi-value">{dashboard?.totalClientesRegistrados ?? 0}</div>
          <div className="kpi-sub">Total histórico en base de datos</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Membresías Vigentes</div>
          <div className="kpi-value" style={{ color: 'var(--brand-neon)' }}>
            {dashboard?.totalMembresiasActivasVigentes ?? 0}
          </div>
          <div className="kpi-sub">Socios con acceso autorizado</div>
        </div>
        <div className="kpi-card warn">
          <div className="kpi-label">Por Vencer (≤ 3 días)</div>
          <div className="kpi-value" style={{ color: 'var(--semaforo-amarillo)' }}>
            {dashboard?.totalMembresiasPorVencerEn3Dias ?? 0}
          </div>
          <div className="kpi-sub">En alerta amarilla de renovación</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Facturación Total Hoy</div>
          <div className="kpi-value" style={{ color: 'var(--brand-neon)' }}>
            ${Number(dashboard?.facturacionDiaTotalCop || 0).toLocaleString('es-CO')}
          </div>
          <div className="kpi-sub">Consolidado de turnos del día</div>
        </div>
      </div>

      <div className="tab-split-fill">
        {/* Columna Izquierda: Directorio Paginado de Operadores + Modal de Alta */}
        <div className="card card-fill">
          <div className="card-header">
            <div className="card-title">
              <img src="/logos/web-monograma-fs-neon.png" alt="FS" style={{ height: '16px' }} />
              Operadores del Sistema ({usuariosLista.length})
            </div>
            <button
              type="button"
              className="btn btn-success btn-sm"
              onClick={() => setMostrarModalOperador(true)}
            >
              + Nuevo Operador
            </button>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Nombre Completo</th>
                  <th>Usuario</th>
                  <th>Documento</th>
                  <th>Rol</th>
                </tr>
              </thead>
              <tbody>
                {usuariosLista.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                      No hay operadores registrados.
                    </td>
                  </tr>
                ) : (
                  usuariosPaginados.map((u) => (
                    <tr key={u.id}>
                      <td>
                        <strong>{u.nombreCompleto}</strong>
                      </td>
                      <td style={{ color: 'var(--brand-neon)', fontWeight: 700 }}>
                        @{u.username}
                      </td>
                      <td>{u.numeroDocumento || '—'}</td>
                      <td>
                        <span
                          className={`semaforo-badge ${
                            u.rol === 'ADMIN' ? 'badge-verde' : 'badge-neutral'
                          }`}
                        >
                          {u.rol}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="pagination-bar">
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              {usuariosLista.length === 0 ? (
                '0 operadores'
              ) : (
                <>
                  Mostrando{' '}
                  <strong style={{ color: 'var(--text-primary)' }}>
                    {inicioUsuarios + 1}–{Math.min(inicioUsuarios + USUARIOS_POR_PAGINA, usuariosLista.length)}
                  </strong>{' '}
                  de <strong style={{ color: 'var(--brand-neon)' }}>{usuariosLista.length}</strong>{' '}
                  cuentas
                </>
              )}
            </span>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                disabled={pagUsuariosSegura <= 1}
                onClick={() => setPaginaUsuarios((p) => Math.max(1, p - 1))}
              >
                ← Anterior
              </button>

              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  padding: '0.2rem 0.55rem',
                  color: 'var(--text-primary)'
                }}
              >
                Página {pagUsuariosSegura} de {totalPagUsuarios}
              </span>

              <button
                type="button"
                className="btn btn-outline btn-sm"
                disabled={pagUsuariosSegura >= totalPagUsuarios}
                onClick={() => setPaginaUsuarios((p) => Math.min(totalPagUsuarios, p + 1))}
              >
                Siguiente →
              </button>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Respaldo Cifrado AES y Bitácora Antifraude Paginada */}
        <div className="card card-fill">
          <div className="card-header">
            <div className="card-title">
              <img src="/logos/web-monograma-fs-neon.png" alt="FS" style={{ height: '16px' }} />
              Respaldo Cifrado AES y Bitácora Antifraude ({auditorias.length})
            </div>
            <button type="button" className="btn btn-success btn-sm" onClick={handleBackupManual}>
              Generar Backup Cifrado Ahora
            </button>
          </div>

          {dashboard?.ultimoBackupNube && (
            <div
              style={{
                background: 'var(--brand-neon-soft)',
                border: '1px solid var(--brand-neon)',
                padding: '0.45rem 0.85rem',
                borderRadius: '8px',
                marginBottom: '0.65rem',
                fontSize: '0.76rem',
                flexShrink: 0
              }}
            >
              Último respaldo automático/manual:{' '}
              <strong style={{ color: 'var(--brand-neon)' }}>
                {dashboard.ultimoBackupNube.nombreArchivo}
              </strong>{' '}
              ({dashboard.ultimoBackupNube.estado})
            </div>
          )}

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Fecha y Hora</th>
                  <th>Operación Autorizada</th>
                  <th>Recepcionista en Turno</th>
                  <th>Justificación Registrada</th>
                </tr>
              </thead>
              <tbody>
                {auditorias.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                      No se han registrado desbloqueos con clave de Administrador.
                    </td>
                  </tr>
                ) : (
                  auditoriasPaginadas.map((a) => (
                    <tr key={a.id}>
                      <td>{new Date(a.fechaHora).toLocaleString('es-CO')}</td>
                      <td>
                        <span className="semaforo-badge badge-amarillo">
                          {a.tipoOperacion}
                        </span>
                      </td>
                      <td>{a.recepcionistaNombreCompleto || 'Directo Admin'}</td>
                      <td>{a.justificacion}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="pagination-bar">
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              {auditorias.length === 0 ? (
                '0 eventos en bitácora'
              ) : (
                <>
                  Mostrando{' '}
                  <strong style={{ color: 'var(--text-primary)' }}>
                    {inicioAuditorias + 1}–{Math.min(inicioAuditorias + AUDITORIAS_POR_PAGINA, auditorias.length)}
                  </strong>{' '}
                  de <strong style={{ color: 'var(--brand-neon)' }}>{auditorias.length}</strong>{' '}
                  auditorías
                </>
              )}
            </span>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                disabled={pagAuditoriasSegura <= 1}
                onClick={() => setPaginaAuditorias((p) => Math.max(1, p - 1))}
              >
                ← Anterior
              </button>

              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  padding: '0.2rem 0.55rem',
                  color: 'var(--text-primary)'
                }}
              >
                Página {pagAuditoriasSegura} de {totalPagAuditorias}
              </span>

              <button
                type="button"
                className="btn btn-outline btn-sm"
                disabled={pagAuditoriasSegura >= totalPagAuditorias}
                onClick={() => setPaginaAuditorias((p) => Math.min(totalPagAuditorias, p + 1))}
              >
                Siguiente →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Nuevo Operador (Recepcionista / Admin) */}
      {mostrarModalOperador && (
        <div className="modal-backdrop">
          <form className="modal-card" onSubmit={handleCrearUsuario}>
            <div className="card-header">
              <div className="card-title">
                <img src="/logos/web-monograma-fs-neon.png" alt="FS" style={{ height: '18px' }} />
                Nuevo Operador (Recepcionista / Admin)
              </div>
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label>Usuario (Login) *</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Ej: recepcion_manana"
                  required
                />
              </div>
              <div className="form-group">
                <label>Contraseña *</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Nombre Completo *</label>
              <input
                type="text"
                value={nombreCompleto}
                onChange={(e) => setNombreCompleto(e.target.value)}
                placeholder="Nombre y apellidos del empleado"
                required
              />
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label>Documento *</label>
                <input
                  type="text"
                  value={numeroDocumento}
                  onChange={(e) => setNumeroDocumento(e.target.value)}
                  placeholder="Cédula"
                  required
                />
              </div>
              <div className="form-group">
                <label>Perfil de Seguridad *</label>
                <select value={rol} onChange={(e) => setRol(e.target.value)}>
                  <option value="RECEPCIONISTA">RECEPCIONISTA</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setMostrarModalOperador(false)}
              >
                Cancelar
              </button>
              <button type="submit" className="btn btn-success">
                Crear Cuenta de Operador
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}

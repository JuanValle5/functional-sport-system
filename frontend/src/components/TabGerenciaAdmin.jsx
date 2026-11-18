import React, { useEffect, useState } from 'react';
import { peticionApi } from '../services/api';

export default function TabGerenciaAdmin({ usuario, mostrarAlerta }) {
  const [dashboard, setDashboard] = useState(null);
  const [auditorias, setAuditorias] = useState([]);
  const [usuariosLista, setUsuariosLista] = useState([]);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [numeroDocumento, setNumeroDocumento] = useState('');
  const [rol, setRol] = useState('RECEPCIONISTA');

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

  return (
    <section>
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

      <div className="grid-layout-asymmetric">
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <img src="/logos/web-monograma-fs-neon.png" alt="FS" style={{ height: '18px' }} />
              Nuevo Operador (Recepcionista / Admin)
            </div>
          </div>

          <form onSubmit={handleCrearUsuario}>
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

            <button type="submit" className="btn btn-success" style={{ width: '100%' }}>
              Crear Cuenta de Operador
            </button>
          </form>

          <div
            style={{
              marginTop: '1.35rem',
              paddingTop: '1.1rem',
              borderTop: '1px solid var(--border-color)'
            }}
          >
            <div className="card-title" style={{ marginBottom: '0.75rem', fontSize: '0.84rem' }}>
              Operadores Registrados ({usuariosLista.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              {usuariosLista.map((u) => (
                <div
                  key={u.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.55rem 0.75rem',
                    background: 'var(--bg-input)',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    fontSize: '0.82rem'
                  }}
                >
                  <div>
                    <strong>{u.nombreCompleto}</strong>{' '}
                    <span style={{ color: 'var(--text-secondary)' }}>({u.username})</span>
                  </div>
                  <span
                    className={`semaforo-badge ${
                      u.rol === 'ADMIN' ? 'badge-verde' : 'badge-neutral'
                    }`}
                  >
                    {u.rol}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <img src="/logos/web-monograma-fs-neon.png" alt="FS" style={{ height: '18px' }} />
              Respaldo Cifrado AES y Bitácora Antifraude
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
                padding: '0.75rem 1rem',
                borderRadius: '10px',
                marginBottom: '1.1rem',
                fontSize: '0.82rem'
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
                  auditorias.map((a) => (
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
        </div>
      </div>
    </section>
  );
}

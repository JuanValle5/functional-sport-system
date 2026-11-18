import React, { useEffect, useState } from 'react';
import { peticionApi } from '../services/api';

export default function TabTurnosCaja({ usuario, mostrarAlerta, onCambioEstadoCaja }) {
  const [turnoAbierto, setTurnoAbierto] = useState(null);
  const [pagosTurno, setPagosTurno] = useState([]);

  const [jornada, setJornada] = useState('MANANA');
  const [baseInicialEfectivo, setBaseInicialEfectivo] = useState(50000);
  const [efectivoFisicoDeclarado, setEfectivoFisicoDeclarado] = useState('');
  const [observacionesCierre, setObservacionesCierre] = useState('');

  const cargarEstadoTurno = async () => {
    try {
      const t = await peticionApi('/api/v1/caja/turnos/abierto');
      setTurnoAbierto(t);
      const pagos = await peticionApi(`/api/v1/caja/turnos/${t.id}/pagos`);
      setPagosTurno(pagos);
      if (onCambioEstadoCaja) onCambioEstadoCaja(t);
    } catch {
      setTurnoAbierto(null);
      setPagosTurno([]);
      if (onCambioEstadoCaja) onCambioEstadoCaja(null);
    }
  };

  useEffect(() => {
    cargarEstadoTurno();
  }, []);

  const handleAbrirTurno = async (e) => {
    e.preventDefault();
    try {
      await peticionApi('/api/v1/caja/turnos/abrir', {
        method: 'POST',
        body: JSON.stringify({
          usuarioId: usuario.id,
          jornada,
          baseInicialEfectivo: Number(baseInicialEfectivo || 0)
        })
      });
      mostrarAlerta(`Turno de caja ${jornada} ABIERTO exitosamente.`);
      await cargarEstadoTurno();
    } catch (err) {
      mostrarAlerta(err.message, 'error');
    }
  };

  const handleCerrarTurno = async (e) => {
    e.preventDefault();
    try {
      const acta = await peticionApi('/api/v1/caja/turnos/cerrar', {
        method: 'POST',
        body: JSON.stringify({
          usuarioId: usuario.id,
          efectivoFisicoDeclarado: Number(efectivoFisicoDeclarado || 0),
          observacionesCierre
        })
      });
      mostrarAlerta(
        `Turno CERRADO. Recaudo Total: $${Number(acta.totalGeneralRecaudo).toLocaleString(
          'es-CO'
        )} COP | Diferencia Efectivo: $${Number(acta.diferenciaEfectivo).toLocaleString(
          'es-CO'
        )} COP`
      );
      setEfectivoFisicoDeclarado('');
      setObservacionesCierre('');
      await cargarEstadoTurno();
    } catch (err) {
      mostrarAlerta(err.message, 'error');
    }
  };

  const efectivoEsperado = Number(turnoAbierto?.efectivoEsperadoEnCaja || 0);
  const diferenciaEnVivo =
    efectivoFisicoDeclarado !== ''
      ? Number(efectivoFisicoDeclarado) - efectivoEsperado
      : null;

  return (
    <section>
      {/* Resumen de los 5 Canales en la parte superior */}
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(175px, 1fr))' }}>
        <div className="kpi-card">
          <div className="kpi-label">1. Efectivo</div>
          <div className="kpi-value" style={{ fontSize: '1.4rem' }}>
            ${Number(turnoAbierto?.totalEfectivo || 0).toLocaleString('es-CO')}
          </div>
          <div className="kpi-sub">Recaudo en billetes/monedas</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">2. Nequi</div>
          <div className="kpi-value" style={{ fontSize: '1.4rem' }}>
            ${Number(turnoAbierto?.totalNequi || 0).toLocaleString('es-CO')}
          </div>
          <div className="kpi-sub">Transferencia Nequi</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">3. Daviplata</div>
          <div className="kpi-value" style={{ fontSize: '1.4rem' }}>
            ${Number(turnoAbierto?.totalDaviplata || 0).toLocaleString('es-CO')}
          </div>
          <div className="kpi-sub">Transferencia Daviplata</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">4. Bancolombia</div>
          <div className="kpi-value" style={{ fontSize: '1.4rem' }}>
            ${Number(turnoAbierto?.totalBancolombia || 0).toLocaleString('es-CO')}
          </div>
          <div className="kpi-sub">QR / App Bancolombia</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">5. Llave Bre-B</div>
          <div className="kpi-value" style={{ fontSize: '1.4rem' }}>
            ${Number(turnoAbierto?.totalLlaveBreB || 0).toLocaleString('es-CO')}
          </div>
          <div className="kpi-sub">Transferencia inmediata</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Recaudo Total Turno</div>
          <div className="kpi-value" style={{ fontSize: '1.4rem', color: 'var(--brand-neon)' }}>
            ${Number(turnoAbierto?.totalGeneralRecaudo || 0).toLocaleString('es-CO')}
          </div>
          <div className="kpi-sub">Suma de los 5 canales</div>
        </div>
      </div>

      <div className="grid-layout-asymmetric">
        {/* Panel Izquierdo: Apertura o Cierre con Calculadora en Vivo */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <img src="/logos/web-monograma-fs-neon.png" alt="FS" style={{ height: '18px' }} />
              {turnoAbierto
                ? `Cierre y Cuadre — Turno ${turnoAbierto.jornada}`
                : 'Apertura de Turno de Caja'}
            </div>
          </div>

          {!turnoAbierto ? (
            <form onSubmit={handleAbrirTurno}>
              <p
                style={{
                  fontSize: '0.84rem',
                  color: 'var(--text-secondary)',
                  marginBottom: '1rem'
                }}
              >
                Seleccione la jornada (Mañana o Tarde) y registre la base de efectivo con
                la que inicia el cajón para habilitar las ventas en recepción.
              </p>

              <div className="form-group">
                <label>Jornada Operativa (Sección 3.4)</label>
                <div className="channel-pills">
                  <button
                    type="button"
                    className={`channel-pill ${jornada === 'MANANA' ? 'selected' : ''}`}
                    onClick={() => setJornada('MANANA')}
                  >
                    TURNO MAÑANA
                  </button>
                  <button
                    type="button"
                    className={`channel-pill ${jornada === 'TARDE' ? 'selected' : ''}`}
                    onClick={() => setJornada('TARDE')}
                  >
                    TURNO TARDE
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label>Base Inicial de Efectivo en Cajón ($ COP)</label>
                <input
                  type="number"
                  value={baseInicialEfectivo}
                  onChange={(e) => setBaseInicialEfectivo(e.target.value)}
                />
              </div>

              <button type="submit" className="btn btn-success" style={{ width: '100%' }}>
                Abrir Turno de Recepción
              </button>
            </form>
          ) : (
            <form onSubmit={handleCerrarTurno}>
              <div
                style={{
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '10px',
                  padding: '1rem',
                  marginBottom: '1rem'
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.84rem',
                    marginBottom: '0.35rem'
                  }}
                >
                  <span style={{ color: 'var(--text-secondary)' }}>Responsable:</span>
                  <strong>{turnoAbierto.usuarioNombreCompleto}</strong>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.84rem',
                    marginBottom: '0.35rem'
                  }}
                >
                  <span style={{ color: 'var(--text-secondary)' }}>Base Inicial Efectivo:</span>
                  <strong>
                    ${Number(turnoAbierto.baseInicialEfectivo).toLocaleString('es-CO')} COP
                  </strong>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.84rem',
                    marginBottom: '0.35rem'
                  }}
                >
                  <span style={{ color: 'var(--text-secondary)' }}>
                    + Ventas en Efectivo del Turno:
                  </span>
                  <strong>
                    ${Number(turnoAbierto.totalEfectivo).toLocaleString('es-CO')} COP
                  </strong>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.96rem',
                    borderTop: '1px solid var(--border-color)',
                    paddingTop: '0.5rem',
                    marginTop: '0.4rem'
                  }}
                >
                  <span style={{ color: 'var(--brand-neon)', fontWeight: 800 }}>
                    Efectivo Esperado en Cajón:
                  </span>
                  <strong style={{ color: 'var(--brand-neon)' }}>
                    ${efectivoEsperado.toLocaleString('es-CO')} COP
                  </strong>
                </div>
              </div>

              <div className="form-group">
                <label>Efectivo Físico Contado al Cierre ($ COP) *</label>
                <input
                  type="number"
                  value={efectivoFisicoDeclarado}
                  onChange={(e) => setEfectivoFisicoDeclarado(e.target.value)}
                  placeholder="Ingrese la suma de billetes y monedas en caja..."
                  required
                />
              </div>

              {diferenciaEnVivo !== null && (
                <div
                  style={{
                    padding: '0.7rem 0.9rem',
                    borderRadius: '8px',
                    marginBottom: '0.9rem',
                    fontSize: '0.84rem',
                    fontWeight: 800,
                    background:
                      diferenciaEnVivo === 0
                        ? 'var(--semaforo-verde-bg)'
                        : diferenciaEnVivo > 0
                        ? 'var(--semaforo-amarillo-bg)'
                        : 'var(--semaforo-rojo-bg)',
                    color:
                      diferenciaEnVivo === 0
                        ? 'var(--brand-neon)'
                        : diferenciaEnVivo > 0
                        ? 'var(--semaforo-amarillo)'
                        : '#fca5a5'
                  }}
                >
                  {diferenciaEnVivo === 0
                    ? '✓ CUADRE EXACTO ($0 COP de diferencia)'
                    : diferenciaEnVivo > 0
                    ? `SOBRANTE EN CAJA: +$${diferenciaEnVivo.toLocaleString('es-CO')} COP`
                    : `FALTANTE EN CAJA: -$${Math.abs(diferenciaEnVivo).toLocaleString(
                        'es-CO'
                      )} COP`}
                </div>
              )}

              <div className="form-group">
                <label>Observaciones del Acta de Cuadre</label>
                <input
                  type="text"
                  value={observacionesCierre}
                  onChange={(e) => setObservacionesCierre(e.target.value)}
                  placeholder="Opcional: notas de entrega de turno"
                />
              </div>

              <button type="submit" className="btn btn-warning" style={{ width: '100%' }}>
                Cerrar Turno y Guardar Acta de Cuadre
              </button>
            </form>
          )}
        </div>

        {/* Panel Derecho: Movimientos Asentados en el Turno */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <img src="/logos/web-monograma-fs-neon.png" alt="FS" style={{ height: '18px' }} />
              Pagos Asentados en el Turno Actual ({pagosTurno.length})
            </div>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Hora</th>
                  <th>Deportista</th>
                  <th>Plan Facturado</th>
                  <th>Canal</th>
                  <th>Monto</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {pagosTurno.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                      No hay pagos registrados en el turno actual.
                    </td>
                  </tr>
                ) : (
                  pagosTurno.map((p) => (
                    <tr key={p.id}>
                      <td>{new Date(p.fechaHoraPago).toLocaleTimeString('es-CO')}</td>
                      <td>
                        <strong>{p.clienteNombreCompleto}</strong>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                          {p.clienteDocumento}
                        </div>
                      </td>
                      <td>{p.planNombre}</td>
                      <td>
                        <span className="semaforo-badge badge-neutral">
                          {p.canalRecaudo}
                        </span>
                      </td>
                      <td>
                        <strong style={{ color: 'var(--brand-neon)' }}>
                          ${Number(p.montoCop).toLocaleString('es-CO')}
                        </strong>
                      </td>
                      <td>
                        <span
                          className={`semaforo-badge ${
                            p.estado === 'ASENTADO' ? 'badge-verde' : 'badge-rojo'
                          }`}
                        >
                          {p.estado}
                        </span>
                      </td>
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

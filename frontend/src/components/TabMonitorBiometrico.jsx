import React, { useEffect, useState } from 'react';
import { obtenerUrlStreamSse, peticionApi } from '../services/api';

export default function TabMonitorBiometrico({ mostrarAlerta }) {
  const [resumenDia, setResumenDia] = useState({
    totalIngresosAutorizadosHoy: 0,
    totalAlertasAmarillasHoy: 0,
    totalBloqueosRojosHoy: 0,
    plantillasBiometricasEnMemoria: 0
  });
  const [historial, setHistorial] = useState([]);
  const [paginaActual, setPaginaActual] = useState(1);
  const [ultimoResultado, setUltimoResultado] = useState(null);
  const [huellaInput, setHuellaInput] = useState('');
  const [documentoInput, setDocumentoInput] = useState('');

  // Máximo 6 registros visibles en pantalla para garantizar cero scroll vertical
  const ITEMS_POR_PAGINA = 6;

  const cargarDatosMonitor = async () => {
    try {
      const [resumen, hist] = await Promise.all([
        peticionApi('/api/v1/acceso/resumen-dia'),
        peticionApi('/api/v1/acceso/historial-reciente')
      ]);
      setResumenDia(resumen);
      setHistorial(hist);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    cargarDatosMonitor();
    let fechaActualStr = new Date().toLocaleDateString('es-CO');

    const verificadorCambioDeDia = setInterval(() => {
      const nuevaFechaStr = new Date().toLocaleDateString('es-CO');
      if (nuevaFechaStr !== fechaActualStr) {
        fechaActualStr = nuevaFechaStr;
        setUltimoResultado(null);
        setPaginaActual(1);
        cargarDatosMonitor();
      }
    }, 30000);

    const evtSource = new EventSource(obtenerUrlStreamSse());
    evtSource.addEventListener('validacion-acceso', (event) => {
      try {
        const resultado = JSON.parse(event.data);
        setUltimoResultado(resultado);
        setPaginaActual(1);
        cargarDatosMonitor();
      } catch (e) {
        console.error(e);
      }
    });
    return () => {
      clearInterval(verificadorCambioDeDia);
      evtSource.close();
    };
  }, []);

  const handleValidarHuella = async (e) => {
    e.preventDefault();
    if (!huellaInput.trim()) return;
    try {
      const res = await peticionApi('/api/v1/acceso/validar-huella', {
        method: 'POST',
        body: JSON.stringify({ templateBiometricoBase64: huellaInput })
      });
      setUltimoResultado(res);
      setPaginaActual(1);
      cargarDatosMonitor();
    } catch (err) {
      mostrarAlerta(err.message, 'error');
    }
  };

  const ejecutarValidacionPorDocumento = async (doc) => {
    if (!doc || !doc.trim()) return;
    try {
      const res = await peticionApi('/api/v1/acceso/validar-documento', {
        method: 'POST',
        body: JSON.stringify({ numeroDocumento: doc.trim() })
      });
      setUltimoResultado(res);
      setPaginaActual(1);
      cargarDatosMonitor();
    } catch (err) {
      mostrarAlerta(err.message, 'error');
    }
  };

  const handleValidarDocumento = async (e) => {
    e.preventDefault();
    await ejecutarValidacionPorDocumento(documentoInput);
  };

  const colorSemaforo = ultimoResultado?.colorSemaforo || '';
  const osoSrc =
    colorSemaforo === 'VERDE'
      ? '/logos/web-oso-neon.png'
      : '/logos/web-oso-blanco-neon.png';

  const claseBadgeSemaforo = (color) => {
    if (color === 'VERDE') return 'semaforo-badge badge-verde';
    if (color === 'AMARILLO') return 'semaforo-badge badge-amarillo';
    if (color === 'ROJO') return 'semaforo-badge badge-rojo';
    return 'semaforo-badge badge-neutral';
  };

  const textoRestante = () => {
    if (!ultimoResultado) return '—';
    let t =
      ultimoResultado.diasRestantes !== null && ultimoResultado.diasRestantes !== undefined
        ? `${ultimoResultado.diasRestantes} día(s)`
        : '—';
    if (
      ultimoResultado.sesionesRestantes !== null &&
      ultimoResultado.sesionesRestantes !== undefined
    ) {
      t += ` • ${ultimoResultado.sesionesRestantes} ses.`;
    }
    return t;
  };

  const totalPaginas = Math.max(1, Math.ceil(historial.length / ITEMS_POR_PAGINA));
  const paginaSegura = Math.min(paginaActual, totalPaginas);
  const indiceInicio = (paginaSegura - 1) * ITEMS_POR_PAGINA;
  const historialPaginado = historial.slice(indiceInicio, indiceInicio + ITEMS_POR_PAGINA);

  return (
    <section className="tab-viewport">
      {/* Fila Superior Compacta: 3 Indicadores del Día */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-label">Ingresos Autorizados Hoy</div>
          <div className="kpi-value" style={{ color: 'var(--brand-neon)' }}>
            {resumenDia.totalIngresosAutorizadosHoy}
          </div>
          <div className="kpi-sub">Socios que entrenaron hoy</div>
        </div>

        <div className="kpi-card warn">
          <div className="kpi-label">Alertas Preventivas (≤ 3 Días)</div>
          <div className="kpi-value" style={{ color: 'var(--semaforo-amarillo)' }}>
            {resumenDia.totalAlertasAmarillasHoy}
          </div>
          <div className="kpi-sub">Próximos a renovar membresía</div>
        </div>

        <div className="kpi-card danger">
          <div className="kpi-label">Accesos Bloqueados Hoy</div>
          <div className="kpi-value" style={{ color: 'var(--semaforo-rojo)' }}>
            {resumenDia.totalBloqueosRojosHoy}
          </div>
          <div className="kpi-sub">Vencidos o 2do intento Anti-Passback</div>
        </div>
      </div>

      {/* Cuerpo Principal en 2 Columnas a Altura Completa (Sin Scroll) */}
      <div className="tab-split-fill">
        {/* Columna Izquierda: Semáforo en Vivo + Validación de Ingreso */}
        <div className="monitor-left-stack">
          <div className={`semaforo-hero ${colorSemaforo}`}>
            <div className="semaforo-hero-top">
              <div className="semaforo-emblem-box">
                <img
                  src={osoSrc}
                  alt="Oso Funcional Sport"
                  style={{ height: '50px', width: 'auto', marginBottom: '0.4rem' }}
                />
                <span className={claseBadgeSemaforo(colorSemaforo)}>
                  {ultimoResultado ? ultimoResultado.colorSemaforo : 'EN ESPERA'}
                </span>
              </div>

              <div style={{ minWidth: 0, flex: 1 }}>
                <div
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: 'var(--brand-neon)',
                    marginBottom: '0.15rem'
                  }}
                >
                  {ultimoResultado
                    ? `MOTIVO: ${ultimoResultado.motivoResultado}`
                    : 'MONITOR BIOMÉTRICO LISTO'}
                </div>

                <div className="semaforo-cliente-nombre">
                  {ultimoResultado
                    ? ultimoResultado.clienteNombreCompleto || 'USUARIO NO IDENTIFICADO'
                    : 'Coloque el dedo en el lector'}
                </div>

                <div
                  style={{
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    color: ultimoResultado ? '#FFFFFF' : 'var(--text-secondary)',
                    lineHeight: 1.3
                  }}
                >
                  {ultimoResultado
                    ? ultimoResultado.mensajePantalla
                    : 'Esperando lectura de huella ZKTeco o validación por documento.'}
                </div>
              </div>
            </div>

            <div className="semaforo-meta-strip">
              <div>
                <div className="kpi-label">Plan Activo</div>
                <div style={{ fontWeight: 800, fontSize: '0.84rem', marginTop: '0.1rem' }}>
                  {ultimoResultado?.planNombre || '—'}
                </div>
              </div>
              <div>
                <div className="kpi-label">Vencimiento</div>
                <div style={{ fontWeight: 800, fontSize: '0.84rem', marginTop: '0.1rem' }}>
                  {ultimoResultado?.fechaExactaVencimiento || '—'}
                </div>
              </div>
              <div>
                <div className="kpi-label">Restante</div>
                <div
                  style={{
                    fontWeight: 900,
                    fontSize: '0.84rem',
                    marginTop: '0.1rem',
                    color: 'var(--brand-neon)'
                  }}
                >
                  {textoRestante()}
                </div>
              </div>
            </div>
          </div>

          <div className="card" style={{ flexShrink: 0 }}>
            <div className="card-header">
              <div className="card-title">
                <img src="/logos/web-monograma-fs-neon.png" alt="FS" style={{ height: '16px' }} />
                Validar Ingreso de Deportista
              </div>
            </div>

            <form className="form-group" onSubmit={handleValidarDocumento}>
              <label>1. Por Cédula / Documento (Mostrador)</label>
              <div style={{ display: 'flex', gap: '0.45rem' }}>
                <input
                  type="text"
                  value={documentoInput}
                  onChange={(e) => setDocumentoInput(e.target.value)}
                  placeholder="Digite número de documento..."
                />
                <button type="submit" className="btn btn-success">
                  Validar
                </button>
              </div>
            </form>

            <form className="form-group" style={{ marginBottom: 0 }} onSubmit={handleValidarHuella}>
              <label>2. Por Sensor USB ZKTeco</label>
              <div style={{ display: 'flex', gap: '0.45rem' }}>
                <input
                  type="text"
                  value={huellaInput}
                  onChange={(e) => setHuellaInput(e.target.value)}
                  placeholder="Plantilla capturada por el lector..."
                />
                <button type="submit" className="btn btn-outline">
                  Leer Huella
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Columna Derecha: Bitácora del Día con Paginación Fija (Sin Scroll) */}
        <div className="card card-fill">
          <div className="card-header">
            <div className="card-title">
              <img src="/logos/web-monograma-fs-neon.png" alt="FS" style={{ height: '16px' }} />
              Ingresos y Marcaciones de Hoy ({historial.length})
            </div>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={cargarDatosMonitor}
            >
              Actualizar
            </button>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Hora</th>
                  <th>Deportista</th>
                  <th>Plan Evaluado</th>
                  <th>Semáforo</th>
                  <th>Resultado</th>
                  <th>Vigencia Restante</th>
                </tr>
              </thead>
              <tbody>
                {historial.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                      Aún no se han registrado entradas en el día de hoy.
                    </td>
                  </tr>
                ) : (
                  historialPaginado.map((item) => (
                    <tr key={item.registroAccesoId}>
                      <td>
                        {item.fechaHoraExacta
                          ? new Date(item.fechaHoraExacta).toLocaleTimeString('es-CO')
                          : '—'}
                      </td>
                      <td>
                        <strong>{item.clienteNombreCompleto}</strong>
                        {item.clienteDocumento && (
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                            {item.clienteDocumento}
                          </div>
                        )}
                      </td>
                      <td>{item.planNombre}</td>
                      <td>
                        <span className={claseBadgeSemaforo(item.colorSemaforo)}>
                          {item.colorSemaforo}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.75rem', fontWeight: 700 }}>
                        {item.motivoResultado}
                      </td>
                      <td>
                        {item.diasRestantes ?? '—'} día(s)
                        {item.sesionesRestantes !== null &&
                          item.sesionesRestantes !== undefined &&
                          ` • ${item.sesionesRestantes} ses.`}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="pagination-bar">
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              {historial.length === 0 ? (
                '0 registros hoy'
              ) : (
                <>
                  Mostrando{' '}
                  <strong style={{ color: 'var(--text-primary)' }}>
                    {indiceInicio + 1}–{Math.min(indiceInicio + ITEMS_POR_PAGINA, historial.length)}
                  </strong>{' '}
                  de <strong style={{ color: 'var(--brand-neon)' }}>{historial.length}</strong>{' '}
                  ingresos
                </>
              )}
            </span>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                disabled={paginaSegura <= 1}
                onClick={() => setPaginaActual((p) => Math.max(1, p - 1))}
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
                Página {paginaSegura} de {totalPaginas}
              </span>

              <button
                type="button"
                className="btn btn-outline btn-sm"
                disabled={paginaSegura >= totalPaginas}
                onClick={() => setPaginaActual((p) => Math.min(totalPaginas, p + 1))}
              >
                Siguiente →
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

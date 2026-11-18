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
  const [clientesRapidos, setClientesRapidos] = useState([]);
  const [ultimoResultado, setUltimoResultado] = useState(null);
  const [huellaInput, setHuellaInput] = useState('');
  const [documentoInput, setDocumentoInput] = useState('');

  const cargarDatosMonitor = async () => {
    try {
      const [resumen, hist, listaClientes] = await Promise.all([
        peticionApi('/api/v1/acceso/resumen-dia'),
        peticionApi('/api/v1/acceso/historial-reciente'),
        peticionApi('/api/v1/clientes')
      ]);
      setResumenDia(resumen);
      setHistorial(hist);
      setClientesRapidos(listaClientes);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    cargarDatosMonitor();
    const evtSource = new EventSource(obtenerUrlStreamSse());
    evtSource.addEventListener('validacion-acceso', (event) => {
      try {
        const resultado = JSON.parse(event.data);
        setUltimoResultado(resultado);
        cargarDatosMonitor();
      } catch (e) {
        console.error(e);
      }
    });
    return () => evtSource.close();
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

  return (
    <section>
      {/* Indicadores del Día */}
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

        <div className="kpi-card">
          <div className="kpi-label">Huellas ZKTeco en Memoria RAM</div>
          <div className="kpi-value">{resumenDia.plantillasBiometricasEnMemoria}</div>
          <div className="kpi-sub">Búsqueda 1:N en &lt; 5 milisegundos</div>
        </div>
      </div>

      {/* Semáforo Visual Principal */}
      <div className={`semaforo-hero ${colorSemaforo}`}>
        <div className="semaforo-emblem-box">
          <img
            src={osoSrc}
            alt="Oso Funcional Sport"
            style={{ height: '74px', width: 'auto', marginBottom: '0.6rem' }}
          />
          <span className={claseBadgeSemaforo(colorSemaforo)}>
            {ultimoResultado ? ultimoResultado.colorSemaforo : 'EN ESPERA'}
          </span>
          {ultimoResultado && (
            <small
              style={{
                marginTop: '0.35rem',
                fontSize: '0.7rem',
                color: 'var(--text-secondary)'
              }}
            >
               Respuesta: {ultimoResultado.tiempoRespuestaMs || 1} ms
            </small>
          )}
        </div>

        <div>
          <div
            style={{
              fontSize: '0.75rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.07em',
              color: 'var(--brand-neon)',
              marginBottom: '0.2rem'
            }}
          >
            {ultimoResultado
              ? `MOTIVO: ${ultimoResultado.motivoResultado} • OPERACIÓN SILENCIOSA`
              : 'MONITOR BIOMÉTRICO SILENCIOSO LISTO'}
          </div>

          <div className="semaforo-cliente-nombre">
            {ultimoResultado
              ? ultimoResultado.clienteNombreCompleto || 'USUARIO NO IDENTIFICADO'
              : 'Coloque el dedo en el sensor ZKTeco'}
          </div>

          <div
            style={{
              fontSize: '1.02rem',
              fontWeight: 600,
              color: ultimoResultado ? '#FFFFFF' : 'var(--text-secondary)'
            }}
          >
            {ultimoResultado
              ? ultimoResultado.mensajePantalla
              : 'También puede validar el ingreso ingresando o seleccionando el documento del deportista abajo.'}
          </div>

          <div className="semaforo-meta-strip">
            <div>
              <div className="kpi-label">Plan Activo</div>
              <div style={{ fontWeight: 800, fontSize: '0.98rem', marginTop: '0.15rem' }}>
                {ultimoResultado?.planNombre || '—'}
              </div>
            </div>
            <div>
              <div className="kpi-label">Fecha de Vencimiento</div>
              <div style={{ fontWeight: 800, fontSize: '0.98rem', marginTop: '0.15rem' }}>
                {ultimoResultado?.fechaExactaVencimiento || '—'}
              </div>
            </div>
            <div>
              <div className="kpi-label">Días / Sesiones Restantes</div>
              <div
                style={{
                  fontWeight: 900,
                  fontSize: '0.98rem',
                  marginTop: '0.15rem',
                  color: 'var(--brand-neon)'
                }}
              >
                {textoRestante()}
              </div>
            </div>
            <div>
              <div className="kpi-label">Deudas en Caja</div>
              <div style={{ fontWeight: 800, fontSize: '0.98rem', marginTop: '0.15rem' }}>
                ${Number(ultimoResultado?.saldoPendienteCaja || 0).toLocaleString('es-CO')} COP
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Paneles Inferiores: Validación y Bitácora */}
      <div className="grid-layout-asymmetric">
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <img src="/logos/web-monograma-fs-neon.png" alt="FS" style={{ height: '18px' }} />
              Validar Ingreso de Deportista
            </div>
          </div>

          <form className="form-group" onSubmit={handleValidarDocumento}>
            <label>1. Validar por Cédula / Documento (Respaldo en Mostrador)</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
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

          <form className="form-group" onSubmit={handleValidarHuella}>
            <label>2. Validar por Lectura de Sensor USB ZKTeco</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                value={huellaInput}
                onChange={(e) => setHuellaInput(e.target.value)}
                placeholder="Plantilla capturada por el lector ZKTeco..."
              />
              <button type="submit" className="btn btn-outline">
                Leer Huella
              </button>
            </div>
          </form>

          {clientesRapidos.length > 0 && (
            <div
              style={{
                marginTop: '1.15rem',
                paddingTop: '1rem',
                borderTop: '1px solid var(--border-color)'
              }}
            >
              <label
                style={{
                  display: 'block',
                  fontSize: '0.73rem',
                  color: 'var(--text-secondary)',
                  textTransform: 'uppercase',
                  fontWeight: 800,
                  marginBottom: '0.55rem'
                }}
              >
                Prueba Rápida con 1 Clic (Socios Registrados)
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                {clientesRapidos.slice(0, 5).map((c) => (
                  <div
                    key={c.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.5rem 0.75rem',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      fontSize: '0.82rem'
                    }}
                  >
                    <div>
                      <strong>{c.nombreCompleto}</strong>{' '}
                      <span style={{ color: 'var(--text-secondary)' }}>
                        ({c.numeroDocumento})
                      </span>
                    </div>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() => {
                        setDocumentoInput(c.numeroDocumento);
                        ejecutarValidacionPorDocumento(c.numeroDocumento);
                      }}
                    >
                      Probar Ingreso
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <img src="/logos/web-monograma-fs-neon.png" alt="FS" style={{ height: '18px' }} />
              Bitácora de Marcaciones Recientes
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
                      Aún no se han registrado marcaciones de acceso.
                    </td>
                  </tr>
                ) : (
                  historial.slice(0, 14).map((item) => (
                    <tr key={item.registroAccesoId}>
                      <td>
                        {item.fechaHoraExacta
                          ? new Date(item.fechaHoraExacta).toLocaleTimeString('es-CO')
                          : '—'}
                      </td>
                      <td>
                        <strong>{item.clienteNombreCompleto}</strong>
                        {item.clienteDocumento && (
                          <div style={{ fontSize: '0.73rem', color: 'var(--text-secondary)' }}>
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
                      <td style={{ fontSize: '0.78rem', fontWeight: 700 }}>
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
        </div>
      </div>
    </section>
  );
}

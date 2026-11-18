import React, { useEffect, useState } from 'react';
import { obtenerUrlStreamSse } from '../services/api';

export default function MonitorClienteFullscreen() {
  const [reloj, setReloj] = useState(new Date().toLocaleString('es-CO'));
  const [estadoSse, setEstadoSse] = useState('Conectando...');
  const [ultimoAcceso, setUltimoAcceso] = useState(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setReloj(new Date().toLocaleString('es-CO'));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const evtSource = new EventSource(obtenerUrlStreamSse());
    evtSource.onopen = () => setEstadoSse('EN VIVO (Cero Latencia)');
    evtSource.addEventListener('validacion-acceso', (event) => {
      try {
        const data = JSON.parse(event.data);
        setUltimoAcceso(data);
      } catch (e) {
        console.error(e);
      }
    });
    evtSource.onerror = () => setEstadoSse('Reconectando...');
    return () => evtSource.close();
  }, []);

  const colorSemaforo = ultimoAcceso?.colorSemaforo || '';
  const osoSrc =
    colorSemaforo === 'VERDE'
      ? '/logos/web-oso-neon.png'
      : '/logos/web-oso-blanco-neon.png';

  const textoContador = () => {
    if (!ultimoAcceso) return '—';
    let txt =
      ultimoAcceso.diasRestantes !== null && ultimoAcceso.diasRestantes !== undefined
        ? `${ultimoAcceso.diasRestantes} día(s)`
        : '—';
    if (
      ultimoAcceso.sesionesRestantes !== null &&
      ultimoAcceso.sesionesRestantes !== undefined
    ) {
      txt += ` / ${ultimoAcceso.sesionesRestantes} ses.`;
    }
    return txt;
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        minHeight: '100vh',
        padding: '1.75rem 2.25rem',
        background: 'radial-gradient(circle at top, #101810 0%, #050605 100%)'
      }}
    >
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '2px solid var(--brand-neon)',
          paddingBottom: '1rem'
        }}
      >
        <div className="brand">
          <img
            src="/logos/web-logo-horizontal-blanco-neon.png"
            alt="Funcional Sport"
            style={{ height: '54px' }}
          />
          <span className="brand-subtitle">
            Monitor de Validación Biométrica • Operación Silenciosa
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--brand-neon)' }}>
            {reloj}
          </div>
          <img src="/logos/web-monograma-fs-neon.png" alt="FS" style={{ height: '42px' }} />
        </div>
      </header>

      <main
        className={`semaforo-box ${colorSemaforo}`}
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          borderRadius: '24px',
          padding: '2.5rem',
          margin: '1.35rem 0',
          borderWidth: '4px'
        }}
      >
        <img
          src={osoSrc}
          alt="Oso Funcional Sport"
          style={{
            height: '96px',
            width: 'auto',
            marginBottom: '0.75rem',
            filter: 'drop-shadow(0 0 18px rgba(112, 232, 86, 0.3))'
          }}
        />
        <span
          className="semaforo-badge"
          style={
            !colorSemaforo
              ? {
                  background: '#1e291e',
                  color: '#70E856',
                  border: '1px solid #70E856',
                  fontSize: '1rem'
                }
              : { fontSize: '1rem' }
          }
        >
          {ultimoAcceso
            ? `${ultimoAcceso.colorSemaforo} • ${ultimoAcceso.motivoResultado}`
            : 'ESPERANDO LECTURA DE HUELLA EN SENSOR ZKTECO'}
        </span>

        <div
          style={{
            fontSize: '3.1rem',
            fontWeight: 900,
            textTransform: 'uppercase',
            margin: '0.5rem 0'
          }}
        >
          {ultimoAcceso
            ? ultimoAcceso.clienteNombreCompleto || 'NO IDENTIFICADO'
            : 'Coloque su dedo en el lector'}
        </div>

        <div
          style={{
            fontSize: '1.45rem',
            fontWeight: 700,
            marginBottom: '1.85rem',
            color: ultimoAcceso ? '#FFFFFF' : 'var(--text-secondary)'
          }}
        >
          {ultimoAcceso
            ? ultimoAcceso.mensajePantalla
            : 'Validación instantánea • Máximo 1 ingreso permitido por día'}
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, minmax(180px, 1fr))',
            gap: '1.2rem',
            width: '100%',
            maxWidth: '1140px'
          }}
        >
          <div className="stat-card" style={{ borderLeft: 'none', borderTop: '3px solid var(--brand-neon)' }}>
            <div className="label">Plan Activo</div>
            <div className="value" style={{ fontSize: '1.45rem' }}>
              {ultimoAcceso?.planNombre || '—'}
            </div>
          </div>
          <div className="stat-card" style={{ borderLeft: 'none', borderTop: '3px solid var(--brand-neon)' }}>
            <div className="label">Fecha Exacta Vencimiento</div>
            <div className="value" style={{ fontSize: '1.45rem' }}>
              {ultimoAcceso?.fechaExactaVencimiento || '—'}
            </div>
          </div>
          <div className="stat-card" style={{ borderLeft: 'none', borderTop: '3px solid var(--brand-neon)' }}>
            <div className="label">Días / Sesiones Restantes</div>
            <div className="value" style={{ fontSize: '1.45rem', color: 'var(--brand-neon)' }}>
              {textoContador()}
            </div>
          </div>
          <div className="stat-card" style={{ borderLeft: 'none', borderTop: '3px solid var(--brand-neon)' }}>
            <div className="label">Saldo Pendiente en Caja</div>
            <div className="value" style={{ fontSize: '1.45rem' }}>
              ${Number(ultimoAcceso?.saldoPendienteCaja || 0).toLocaleString('es-CO')} COP
            </div>
          </div>
        </div>
      </main>

      <footer
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          color: 'var(--text-secondary)',
          fontSize: '0.85rem'
        }}
      >
        <span>
          Estado del canal SSE:{' '}
          <strong style={{ color: 'var(--brand-neon)' }}>{estadoSse}</strong>
        </span>
        <span>
          Latencia última lectura:{' '}
          <strong style={{ color: '#fff' }}>
            {ultimoAcceso ? `${ultimoAcceso.tiempoRespuestaMs || 1} ms` : '—'}
          </strong>
        </span>
      </footer>
    </div>
  );
}

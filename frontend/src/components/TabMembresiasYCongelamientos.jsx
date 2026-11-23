import React, { useEffect, useState } from 'react';
import { peticionApi } from '../services/api';

const PLANES_CATALOGO = [
  {
    codigo: 'DIA',
    nombre: 'Pase Día / Clase',
    precio: '$10.000',
    detalle: 'Vigencia 1 día • 1 ingreso'
  },
  {
    codigo: 'QUINCENA',
    nombre: 'Quincena',
    precio: '$50.000',
    detalle: '15 días calendario • 1 ingreso/día'
  },
  {
    codigo: 'MES_3XSEM',
    nombre: 'Mensualidad 3xSemana',
    precio: '$70.000',
    detalle: '30 días • 12 sesiones (máx 3/sem)'
  },
  {
    codigo: 'MES_FULL',
    nombre: 'Mensualidad Full',
    precio: '$80.000',
    detalle: '30 días • Todos los días (1/día)'
  }
];

const CANALES_RECAUDO = [
  { codigo: 'EFECTIVO', nombre: 'Efectivo' },
  { codigo: 'NEQUI', nombre: 'Nequi' },
  { codigo: 'DAVIPLATA', nombre: 'Daviplata' },
  { codigo: 'BANCOLOMBIA', nombre: 'Bancolombia QR' },
  { codigo: 'LLAVE_BRE_B', nombre: 'Llave Bre-B' }
];

export default function TabMembresiasYCongelamientos({
  usuario,
  clientePreseleccionado,
  mostrarAlerta,
  onVentaExitosa
}) {
  const [docCliente, setDocCliente] = useState(
    clientePreseleccionado?.numeroDocumento || ''
  );
  const [cliente, setCliente] = useState(clientePreseleccionado || null);
  const [membresias, setMembresias] = useState([]);

  const [planCodigo, setPlanCodigo] = useState('MES_FULL');
  const [canalRecaudo, setCanalRecaudo] = useState('EFECTIVO');
  const [referenciaComprobante, setReferenciaComprobante] = useState('');

  // Modal de acciones administrativas (Congelar o Anular)
  const [modalAccion, setModalAccion] = useState(null); // { tipo: 'CONGELAR' | 'ANULAR', membresia }
  const [referenciaCertificadoMedico, setReferenciaCertificadoMedico] = useState('');
  const [claveAdmin, setClaveAdmin] = useState('');

  const cargarHistorialCliente = async (clienteId) => {
    try {
      const hist = await peticionApi(`/api/v1/membresias/cliente/${clienteId}`);
      setMembresias(hist);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (clientePreseleccionado) {
      setCliente(clientePreseleccionado);
      setDocCliente(clientePreseleccionado.numeroDocumento);
      cargarHistorialCliente(clientePreseleccionado.id);
    }
  }, [clientePreseleccionado]);

  const handleBuscarCliente = async (e) => {
    e.preventDefault();
    if (!docCliente.trim()) return;
    try {
      const c = await peticionApi(
        `/api/v1/clientes/documento/${encodeURIComponent(docCliente.trim())}`
      );
      setCliente(c);
      await cargarHistorialCliente(c.id);
    } catch (err) {
      mostrarAlerta(err.message, 'error');
    }
  };

  const handleVender = async (e) => {
    e.preventDefault();
    if (!cliente) {
      mostrarAlerta('Primero busque y seleccione un deportista por su cédula.', 'error');
      return;
    }
    try {
      const m = await peticionApi('/api/v1/membresias/vender', {
        method: 'POST',
        body: JSON.stringify({
          clienteId: cliente.id,
          planCodigo,
          vendedorUsuarioId: usuario.id,
          canalRecaudo,
          referenciaComprobante,
          observaciones: 'Venta en mostrador'
        })
      });
      mostrarAlerta(
        `Membresía activada: ${m.planNombre} (Vence el ${m.fechaVencimientoActual})`
      );
      setReferenciaComprobante('');
      await cargarHistorialCliente(cliente.id);
      if (onVentaExitosa) onVentaExitosa();
    } catch (err) {
      mostrarAlerta(err.message, 'error');
    }
  };

  const handleReactivarDirecto = async (membresiaId) => {
    try {
      const m = await peticionApi(`/api/v1/membresias/${membresiaId}/reactivar`, {
        method: 'POST',
        body: JSON.stringify({
          usuarioOperadorId: usuario.id,
          observaciones: 'Reactivación en recepción'
        })
      });
      mostrarAlerta(
        `Membresía REACTIVADA. Nueva fecha de corte: ${m.fechaVencimientoActual}`
      );
      if (cliente) await cargarHistorialCliente(cliente.id);
    } catch (err) {
      mostrarAlerta(err.message, 'error');
    }
  };

  const handleConfirmarModal = async (e) => {
    e.preventDefault();
    if (!modalAccion) return;
    const { tipo, membresia } = modalAccion;

    try {
      if (tipo === 'CONGELAR') {
        await peticionApi(`/api/v1/membresias/${membresia.id}/congelar`, {
          method: 'POST',
          body: JSON.stringify({
            recepcionistaEnTurnoId: usuario.id,
            claveAdmin,
            certificadoMedicoVerificado: true,
            referenciaCertificadoMedico,
            observaciones: 'Congelamiento médico con certificado verificado'
          })
        });
        mostrarAlerta('Membresía CONGELADA por salud con certificado médico.');
      } else if (tipo === 'ANULAR') {
        await peticionApi(`/api/v1/membresias/${membresia.id}/anular`, {
          method: 'POST',
          body: JSON.stringify({
            recepcionistaEnTurnoId: usuario.id,
            claveAdmin,
            motivoAnulacion: 'Anulación autorizada con clave de Administrador'
          })
        });
        mostrarAlerta('Membresía y pago anulados correctamente.');
        if (onVentaExitosa) onVentaExitosa();
      }
      setModalAccion(null);
      setClaveAdmin('');
      setReferenciaCertificadoMedico('');
      if (cliente) await cargarHistorialCliente(cliente.id);
    } catch (err) {
      mostrarAlerta(err.message, 'error');
    }
  };

  const badgeEstadoMembresia = (estado) => {
    if (estado === 'ACTIVA') return 'semaforo-badge badge-verde';
    if (estado === 'CONGELADA') return 'semaforo-badge badge-amarillo';
    return 'semaforo-badge badge-rojo';
  };

  return (
    <section className="grid-layout-asymmetric">
      {/* Columna Izquierda: Facturación de Plan */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <img src="/logos/web-monograma-fs-neon.png" alt="FS" style={{ height: '18px' }} />
            Activar o Renovar Plan (Corte Dinámico)
          </div>
        </div>

        <form className="form-group" onSubmit={handleBuscarCliente}>
          <label>1. Buscar Socio por Documento</label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              value={docCliente}
              onChange={(e) => setDocCliente(e.target.value)}
              placeholder="Cédula del deportista..."
            />
            <button type="submit" className="btn">
              Cargar
            </button>
          </div>
        </form>

        {cliente && (
          <div
            style={{
              background: 'var(--brand-neon-soft)',
              border: '1px solid var(--brand-neon)',
              padding: '0.8rem 1rem',
              borderRadius: '10px',
              marginBottom: '1.1rem'
            }}
          >
            <div style={{ fontWeight: 900, color: 'var(--brand-neon)' }}>
              {cliente.nombreCompleto}
            </div>
            <div style={{ fontSize: '0.78rem' }}>
              {cliente.tipoDocumento} {cliente.numeroDocumento} • WhatsApp:{' '}
              {cliente.telefonoWhatsapp}
            </div>
          </div>
        )}

        <form onSubmit={handleVender}>
          <label
            style={{
              display: 'block',
              fontSize: '0.76rem',
              color: 'var(--text-secondary)',
              textTransform: 'uppercase',
              fontWeight: 700,
              marginBottom: '0.45rem'
            }}
          >
            2. Seleccione el Plan Vigente
          </label>
          <div className="plan-selector-grid">
            {PLANES_CATALOGO.map((p) => (
              <div
                key={p.codigo}
                className={`plan-option-card ${
                  planCodigo === p.codigo ? 'selected' : ''
                }`}
                onClick={() => setPlanCodigo(p.codigo)}
              >
                <div className="plan-option-name">{p.nombre}</div>
                <div className="plan-option-price">{p.precio}</div>
                <div className="plan-option-meta">{p.detalle}</div>
              </div>
            ))}
          </div>

          <label
            style={{
              display: 'block',
              fontSize: '0.76rem',
              color: 'var(--text-secondary)',
              textTransform: 'uppercase',
              fontWeight: 700,
              marginBottom: '0.45rem'
            }}
          >
            3. Canal de Recaudo (Pago Completo Anticipado)
          </label>
          <div className="channel-pills">
            {CANALES_RECAUDO.map((c) => (
              <button
                key={c.codigo}
                type="button"
                className={`channel-pill ${
                  canalRecaudo === c.codigo ? 'selected' : ''
                }`}
                onClick={() => setCanalRecaudo(c.codigo)}
              >
                {c.nombre}
              </button>
            ))}
          </div>

          {canalRecaudo !== 'EFECTIVO' && (
            <div className="form-group">
              <label>Referencia / Comprobante {canalRecaudo}</label>
              <input
                type="text"
                value={referenciaComprobante}
                onChange={(e) => setReferenciaComprobante(e.target.value)}
                placeholder="Número de comprobante o referencia..."
              />
            </div>
          )}

          <button type="submit" className="btn btn-success" style={{ width: '100%' }}>
            Facturar Plan y Activar Vigencia
          </button>
        </form>
      </div>

      {/* Columna Derecha: Historial y Acciones Directas sobre Membresías */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <img src="/logos/web-monograma-fs-neon.png" alt="FS" style={{ height: '18px' }} />
            Membresías y Congelamientos del Socio
          </div>
        </div>

        {!cliente ? (
          <div
            style={{
              padding: '2.5rem 1.5rem',
              textAlign: 'center',
              color: 'var(--text-secondary)',
              background: 'var(--bg-input)',
              borderRadius: '10px',
              border: '1px dashed var(--border-color)'
            }}
          >
            Busque un socio por su documento a la izquierda (o selecciónelo desde la
            pestaña <strong>Socios y Huellas</strong>) para ver sus membresías, congelar
            por incapacidad médica o renovar su plan.
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Plan</th>
                  <th>Vigencia</th>
                  <th>Restante</th>
                  <th>Pago / Canal</th>
                  <th>Estado</th>
                  <th>Acciones Operativas</th>
                </tr>
              </thead>
              <tbody>
                {membresias.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                      Este socio aún no tiene membresías registradas.
                    </td>
                  </tr>
                ) : (
                  membresias.map((m) => (
                    <tr key={m.id}>
                      <td>
                        <strong>{m.planNombre}</strong>
                      </td>
                      <td>
                        <div>Inicio: {m.fechaInicio}</div>
                        <div style={{ fontWeight: 800, color: 'var(--brand-neon)' }}>
                          Corte: {m.fechaVencimientoActual}
                        </div>
                      </td>
                      <td>
                        <strong>{m.diasRestantes} día(s)</strong>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                          {m.sesionesRestantes !== null && m.sesionesRestantes !== undefined
                            ? `${m.sesionesRestantes} sesiones disp.`
                            : 'Todos los días (1/día)'}
                        </div>
                      </td>
                      <td>
                        <strong>${Number(m.valorPagado).toLocaleString('es-CO')}</strong>
                        <div style={{ fontSize: '0.73rem', color: 'var(--text-secondary)' }}>
                          {m.canalRecaudo || '—'}
                        </div>
                      </td>
                      <td>
                        <span className={badgeEstadoMembresia(m.estado)}>{m.estado}</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                          {m.estado === 'ACTIVA' && m.planCodigo !== 'DIA' && (
                            <button
                              type="button"
                              className="btn btn-warning btn-sm"
                              onClick={() =>
                                setModalAccion({ tipo: 'CONGELAR', membresia: m })
                              }
                            >
                              Congelar (Salud)
                            </button>
                          )}

                          {m.estado === 'CONGELADA' && (
                            <button
                              type="button"
                              className="btn btn-success btn-sm"
                              onClick={() => handleReactivarDirecto(m.id)}
                            >
                              Reactivar Plan
                            </button>
                          )}

                          {m.estado !== 'ANULADA' && (
                            <button
                              type="button"
                              className="btn btn-danger btn-sm"
                              onClick={() =>
                                setModalAccion({ tipo: 'ANULAR', membresia: m })
                              }
                            >
                              Anular
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal para Congelar por Salud o Anular con Clave de Administrador */}
      {modalAccion && (
        <div className="modal-backdrop">
          <form className="modal-card" onSubmit={handleConfirmarModal}>
            <div className="card-header">
              <div className="card-title">
                <img
                  src="/logos/web-monograma-fs-neon.png"
                  alt="FS"
                  style={{ height: '18px' }}
                />
                {modalAccion.tipo === 'CONGELAR'
                  ? 'Congelar Membresía por Salud (Regla 1.5)'
                  : 'Anular Membresía con Clave Admin (Regla 3.5)'}
              </div>
            </div>

            <p
              style={{
                fontSize: '0.84rem',
                color: 'var(--text-secondary)',
                marginBottom: '1rem'
              }}
            >
              Plan afectado: <strong>{modalAccion.membresia.planNombre}</strong> (Corte:{' '}
              {modalAccion.membresia.fechaVencimientoActual})
            </p>

            {modalAccion.tipo === 'CONGELAR' ? (
              <div className="form-group">
                <label>Referencia de Certificado Médico / EPS (Obligatorio) *</label>
                <input
                  type="text"
                  value={referenciaCertificadoMedico}
                  onChange={(e) => setReferenciaCertificadoMedico(e.target.value)}
                  placeholder="Ej: Incapacidad EPS Sura #88412"
                  required
                />
              </div>
            ) : (
              <div className="form-group">
                <label>Clave de Autorización del Administrador (Jhorman) *</label>
                <input
                  type="password"
                  value={claveAdmin}
                  onChange={(e) => setClaveAdmin(e.target.value)}
                  placeholder="Ingrese clave de ADMIN..."
                  required
                />
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setModalAccion(null)}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className={`btn ${
                  modalAccion.tipo === 'CONGELAR' ? 'btn-warning' : 'btn-danger'
                }`}
              >
                {modalAccion.tipo === 'CONGELAR'
                  ? 'Confirmar Congelamiento Médico'
                  : 'Confirmar Anulación'}
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}

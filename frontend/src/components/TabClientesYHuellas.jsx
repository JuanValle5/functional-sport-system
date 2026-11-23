import React, { useEffect, useState } from 'react';
import { peticionApi } from '../services/api';

const DEDOS_DISPONIBLES = [
  { codigo: 'INDICE_DER', nombre: 'Índice Der.' },
  { codigo: 'PULGAR_DER', nombre: 'Pulgar Der.' },
  { codigo: 'INDICE_IZQ', nombre: 'Índice Izq.' },
  { codigo: 'PULGAR_IZQ', nombre: 'Pulgar Izq.' },
  { codigo: 'MEDIO_DER', nombre: 'Medio Der.' }
];

export default function TabClientesYHuellas({
  usuario,
  mostrarAlerta,
  onIrAVenderPlan
}) {
  const [tipoDocumento, setTipoDocumento] = useState('CC');
  const [numeroDocumento, setNumeroDocumento] = useState('');
  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [telefonoWhatsapp, setTelefonoWhatsapp] = useState('');
  const [observaciones, setObservaciones] = useState('');

  const [clientes, setClientes] = useState([]);
  const [filtroBusqueda, setFiltroBusqueda] = useState('');

  const [clienteEnrolar, setClienteEnrolar] = useState(null);
  const [posicionDedo, setPosicionDedo] = useState('INDICE_DER');
  const [plantillaHuella, setPlantillaHuella] = useState('');

  // Modal de confirmación para eliminar cliente (con clave de Admin)
  const [clienteAEliminar, setClienteAEliminar] = useState(null);
  const [claveAdminEliminar, setClaveAdminEliminar] = useState('');
  const [motivoEliminacion, setMotivoEliminacion] = useState('');

  // Modal para editar datos de un cliente
  const [clienteAEditar, setClienteAEditar] = useState(null);

  const cargarClientes = async () => {
    try {
      const data = await peticionApi('/api/v1/clientes');
      setClientes(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    cargarClientes();
  }, []);

  const handleRegistrar = async (e) => {
    e.preventDefault();
    try {
      const creado = await peticionApi('/api/v1/clientes', {
        method: 'POST',
        body: JSON.stringify({
          tipoDocumento,
          numeroDocumento,
          nombres,
          apellidos,
          telefonoWhatsapp,
          observaciones
        })
      });
      mostrarAlerta(`Deportista registrado: ${creado.nombreCompleto}`);
      setNumeroDocumento('');
      setNombres('');
      setApellidos('');
      setTelefonoWhatsapp('');
      setObservaciones('');
      setClienteEnrolar(creado);
      setPlantillaHuella(`ZKTECO_${creado.numeroDocumento}_${posicionDedo}`);
      await cargarClientes();
    } catch (err) {
      mostrarAlerta(err.message, 'error');
    }
  };

  const seleccionarClienteParaHuella = (c) => {
    setClienteEnrolar(c);
    setPlantillaHuella(`ZKTECO_${c.numeroDocumento}_${posicionDedo}`);
  };

  const handleEnrolarHuella = async (e) => {
    e.preventDefault();
    if (!clienteEnrolar) return;
    try {
      await peticionApi(`/api/v1/clientes/${clienteEnrolar.id}/huellas`, {
        method: 'POST',
        body: JSON.stringify({
          posicionDedo,
          templateBiometricoBase64: plantillaHuella,
          calidadCaptura: 98
        })
      });
      mostrarAlerta(
        `Huella enrolada para ${clienteEnrolar.nombreCompleto} en ${posicionDedo}`
      );
      const actualizado = await peticionApi(
        `/api/v1/clientes/documento/${encodeURIComponent(clienteEnrolar.numeroDocumento)}`
      );
      setClienteEnrolar(actualizado);
      await cargarClientes();
    } catch (err) {
      mostrarAlerta(err.message, 'error');
    }
  };

  const handleConfirmarEliminar = async (e) => {
    e.preventDefault();
    if (!clienteAEliminar) return;
    try {
      await peticionApi(`/api/v1/clientes/${clienteAEliminar.id}`, {
        method: 'DELETE',
        body: JSON.stringify({
          recepcionistaEnTurnoId: usuario?.id,
          claveAdmin: claveAdminEliminar,
          motivoEliminacion:
            motivoEliminacion ||
            `Eliminación autorizada del socio ${clienteAEliminar.nombreCompleto} (${clienteAEliminar.numeroDocumento})`
        })
      });
      mostrarAlerta(`Socio eliminado con autorización Admin: ${clienteAEliminar.nombreCompleto}`);
      if (clienteEnrolar?.id === clienteAEliminar.id) {
        setClienteEnrolar(null);
      }
      setClienteAEliminar(null);
      setClaveAdminEliminar('');
      setMotivoEliminacion('');
      await cargarClientes();
    } catch (err) {
      mostrarAlerta(err.message, 'error');
    }
  };

  const handleGuardarEdicion = async (e) => {
    e.preventDefault();
    if (!clienteAEditar) return;
    try {
      const actualizado = await peticionApi(`/api/v1/clientes/${clienteAEditar.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          tipoDocumento: clienteAEditar.tipoDocumento,
          nombres: clienteAEditar.nombres,
          apellidos: clienteAEditar.apellidos,
          telefonoWhatsapp: clienteAEditar.telefonoWhatsapp,
          estado: clienteAEditar.estado,
          observaciones: clienteAEditar.observaciones
        })
      });
      mostrarAlerta(`Datos actualizados: ${actualizado.nombreCompleto}`);
      setClienteAEditar(null);
      if (clienteEnrolar?.id === actualizado.id) {
        setClienteEnrolar(actualizado);
      }
      await cargarClientes();
    } catch (err) {
      mostrarAlerta(err.message, 'error');
    }
  };

  const clientesFiltrados = clientes.filter((c) => {
    const q = filtroBusqueda.trim().toLowerCase();
    if (!q) return true;
    return (
      c.nombreCompleto.toLowerCase().includes(q) ||
      c.numeroDocumento.toLowerCase().includes(q) ||
      (c.telefonoWhatsapp && c.telefonoWhatsapp.toLowerCase().includes(q))
    );
  });

  return (
    <section className="grid-layout-asymmetric">
      {/* Columna Izquierda: Registro + Enrolamiento */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.35rem' }}>
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <img src="/logos/web-monograma-fs-neon.png" alt="FS" style={{ height: '18px' }} />
              Nuevo Socio (Registro en Frío)
            </div>
          </div>

          <form onSubmit={handleRegistrar}>
            <div className="form-row-2">
              <div className="form-group">
                <label>Tipo Doc. *</label>
                <select
                  value={tipoDocumento}
                  onChange={(e) => setTipoDocumento(e.target.value)}
                >
                  <option value="CC">Cédula (CC)</option>
                  <option value="TI">Tarjeta Identidad (TI)</option>
                  <option value="PASAPORTE">Pasaporte</option>
                  <option value="CE">Cédula Extranjería (CE)</option>
                </select>
              </div>
              <div className="form-group">
                <label>Nro. Documento *</label>
                <input
                  type="text"
                  value={numeroDocumento}
                  onChange={(e) => setNumeroDocumento(e.target.value)}
                  placeholder="Ej: 1088223344"
                  required
                />
              </div>
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label>Nombres *</label>
                <input
                  type="text"
                  value={nombres}
                  onChange={(e) => setNombres(e.target.value)}
                  placeholder="Nombres"
                  required
                />
              </div>
              <div className="form-group">
                <label>Apellidos *</label>
                <input
                  type="text"
                  value={apellidos}
                  onChange={(e) => setApellidos(e.target.value)}
                  placeholder="Apellidos"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Celular / WhatsApp (Notificaciones) *</label>
              <input
                type="text"
                value={telefonoWhatsapp}
                onChange={(e) => setTelefonoWhatsapp(e.target.value)}
                placeholder="Ej: 3101234567"
                required
              />
            </div>

            <div className="form-group">
              <label>Observaciones Médicas / Notas</label>
              <input
                type="text"
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Opcional (ej. lesión de rodilla, etc.)"
              />
            </div>

            <button type="submit" className="btn btn-success" style={{ width: '100%' }}>
              Guardar Socio y Pasar a Huella
            </button>
          </form>
        </div>

        {/* Tarjeta de Enrolamiento Biométrico */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <img src="/logos/web-monograma-fs-neon.png" alt="FS" style={{ height: '18px' }} />
              Enrolamiento Biométrico ZKTeco
            </div>
          </div>

          {!clienteEnrolar ? (
            <div
              style={{
                padding: '1.25rem',
                textAlign: 'center',
                color: 'var(--text-secondary)',
                background: 'var(--bg-input)',
                borderRadius: '10px',
                border: '1px dashed var(--border-color)',
                fontSize: '0.85rem'
              }}
            >
              Seleccione el botón <strong>"Huella"</strong> en cualquier socio del
              directorio de la derecha (o registre uno nuevo) para enrolar su dedo en el
              sensor USB ZKTeco.
            </div>
          ) : (
            <form onSubmit={handleEnrolarHuella}>
              <div
                style={{
                  background: 'var(--brand-neon-soft)',
                  border: '1px solid var(--brand-neon)',
                  padding: '0.85rem 1rem',
                  borderRadius: '10px',
                  marginBottom: '1rem'
                }}
              >
                <div style={{ fontWeight: 900, color: 'var(--brand-neon)' }}>
                  {clienteEnrolar.nombreCompleto}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-primary)' }}>
                  Doc: {clienteEnrolar.numeroDocumento} • Huellas activas:{' '}
                  <strong>{clienteEnrolar.cantidadHuellasActivas} dedo(s)</strong>
                </div>
              </div>

              <label
                style={{
                  display: 'block',
                  fontSize: '0.75rem',
                  color: 'var(--text-secondary)',
                  textTransform: 'uppercase',
                  fontWeight: 700,
                  marginBottom: '0.4rem'
                }}
              >
                1. Seleccione el Dedo a Capturar
              </label>
              <div className="finger-pills">
                {DEDOS_DISPONIBLES.map((d) => (
                  <button
                    key={d.codigo}
                    type="button"
                    className={`finger-pill ${
                      posicionDedo === d.codigo ? 'selected' : ''
                    }`}
                    onClick={() => {
                      setPosicionDedo(d.codigo);
                      setPlantillaHuella(
                        `ZKTECO_${clienteEnrolar.numeroDocumento}_${d.codigo}`
                      );
                    }}
                  >
                    {d.nombre}
                  </button>
                ))}
              </div>

              <div className="form-group">
                <label>2. Plantilla Capturada del Sensor ZKTeco SilkID</label>
                <input
                  type="text"
                  value={plantillaHuella}
                  onChange={(e) => setPlantillaHuella(e.target.value)}
                  placeholder="Plantilla biométrica..."
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button type="submit" className="btn btn-success" style={{ flex: 1 }}>
                  Guardar Huella en RAM
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => onIrAVenderPlan(clienteEnrolar)}
                >
                  Ir a Venderle Plan →
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Columna Derecha: Directorio Interactivo con Buscador Instantáneo */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <img src="/logos/web-monograma-fs-neon.png" alt="FS" style={{ height: '18px' }} />
            Directorio de Socios ({clientesFiltrados.length})
          </div>
          <div style={{ width: '280px' }}>
            <input
              type="text"
              value={filtroBusqueda}
              onChange={(e) => setFiltroBusqueda(e.target.value)}
              placeholder="Buscar por nombre, cédula o celular..."
            />
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Documento</th>
                <th>Nombre Completo</th>
                <th>WhatsApp</th>
                <th>Biometría</th>
                <th>Estado</th>
                <th>Acciones Rápidas</th>
              </tr>
            </thead>
            <tbody>
              {clientesFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                    No se encontraron socios con ese criterio.
                  </td>
                </tr>
              ) : (
                clientesFiltrados.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <strong>{c.tipoDocumento}</strong> {c.numeroDocumento}
                    </td>
                    <td>
                      <strong>{c.nombreCompleto}</strong>
                      {c.observaciones && (
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                          {c.observaciones}
                        </div>
                      )}
                    </td>
                    <td>{c.telefonoWhatsapp}</td>
                    <td>
                      <span
                        className={`semaforo-badge ${
                          c.cantidadHuellasActivas > 0 ? 'badge-verde' : 'badge-amarillo'
                        }`}
                      >
                        {c.cantidadHuellasActivas} dedo(s)
                      </span>
                    </td>
                    <td>{c.estado}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          onClick={() => seleccionarClienteParaHuella(c)}
                        >
                          Huella
                        </button>
                        <button
                          type="button"
                          className="btn btn-success btn-sm"
                          onClick={() => onIrAVenderPlan(c)}
                        >
                          Plan
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          onClick={() => setClienteAEditar({ ...c })}
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => setClienteAEliminar(c)}
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Confirmación con Contraseña Admin para Eliminar Socio */}
      {clienteAEliminar && (
        <div className="modal-backdrop">
          <form className="modal-card" onSubmit={handleConfirmarEliminar}>
            <div className="card-header">
              <div className="card-title" style={{ color: 'var(--semaforo-rojo)' }}>
                Eliminar Socio — Requiere Autorización ADMIN
              </div>
            </div>
            <p style={{ fontSize: '0.88rem', marginBottom: '1rem' }}>
              Socio a eliminar: <strong>{clienteAEliminar.nombreCompleto}</strong> (
              {clienteAEliminar.tipoDocumento} {clienteAEliminar.numeroDocumento}).
              <br />
              <small style={{ color: 'var(--text-secondary)' }}>
                Se eliminarán sus huellas biométricas e historial asociado y quedará
                registrado en la Bitácora Antifraude.
              </small>
            </p>

            <div className="form-group">
              <label>Motivo de la Eliminación *</label>
              <input
                type="text"
                value={motivoEliminacion}
                onChange={(e) => setMotivoEliminacion(e.target.value)}
                placeholder="Ej: Registro de prueba o duplicado por error"
                required
              />
            </div>

            <div className="form-group">
              <label>Contraseña del Administrador (Jhorman) *</label>
              <input
                type="password"
                value={claveAdminEliminar}
                onChange={(e) => setClaveAdminEliminar(e.target.value)}
                placeholder="Ingrese la contraseña de ADMIN..."
                required
              />
            </div>

            <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => {
                  setClienteAEliminar(null);
                  setClaveAdminEliminar('');
                  setMotivoEliminacion('');
                }}
              >
                Cancelar
              </button>
              <button type="submit" className="btn btn-danger">
                Autorizar y Eliminar Socio
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal para Editar Datos del Socio */}
      {clienteAEditar && (
        <div className="modal-backdrop">
          <form className="modal-card" onSubmit={handleGuardarEdicion}>
            <div className="card-header">
              <div className="card-title">
                Editar Socio — {clienteAEditar.numeroDocumento}
              </div>
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label>Tipo Doc.</label>
                <select
                  value={clienteAEditar.tipoDocumento}
                  onChange={(e) =>
                    setClienteAEditar({ ...clienteAEditar, tipoDocumento: e.target.value })
                  }
                >
                  <option value="CC">Cédula (CC)</option>
                  <option value="TI">Tarjeta Identidad (TI)</option>
                  <option value="PASAPORTE">Pasaporte</option>
                  <option value="CE">Cédula Extranjería (CE)</option>
                </select>
              </div>
              <div className="form-group">
                <label>Estado del Socio</label>
                <select
                  value={clienteAEditar.estado}
                  onChange={(e) =>
                    setClienteAEditar({ ...clienteAEditar, estado: e.target.value })
                  }
                >
                  <option value="ACTIVO">ACTIVO</option>
                  <option value="INACTIVO">INACTIVO</option>
                  <option value="SUSPENDIDO">SUSPENDIDO</option>
                </select>
              </div>
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label>Nombres *</label>
                <input
                  type="text"
                  value={clienteAEditar.nombres}
                  onChange={(e) =>
                    setClienteAEditar({ ...clienteAEditar, nombres: e.target.value })
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label>Apellidos *</label>
                <input
                  type="text"
                  value={clienteAEditar.apellidos}
                  onChange={(e) =>
                    setClienteAEditar({ ...clienteAEditar, apellidos: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Celular / WhatsApp *</label>
              <input
                type="text"
                value={clienteAEditar.telefonoWhatsapp}
                onChange={(e) =>
                  setClienteAEditar({
                    ...clienteAEditar,
                    telefonoWhatsapp: e.target.value
                  })
                }
                required
              />
            </div>

            <div className="form-group">
              <label>Observaciones</label>
              <input
                type="text"
                value={clienteAEditar.observaciones || ''}
                onChange={(e) =>
                  setClienteAEditar({ ...clienteAEditar, observaciones: e.target.value })
                }
              />
            </div>

            <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setClienteAEditar(null)}
              >
                Cancelar
              </button>
              <button type="submit" className="btn btn-success">
                Guardar Cambios
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}

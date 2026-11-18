import React, { useEffect, useState } from 'react';
import { peticionApi } from '../services/api';

const DEDOS_DISPONIBLES = [
  { codigo: 'INDICE_DER', nombre: 'Índice Der.' },
  { codigo: 'PULGAR_DER', nombre: 'Pulgar Der.' },
  { codigo: 'INDICE_IZQ', nombre: 'Índice Izq.' },
  { codigo: 'PULGAR_IZQ', nombre: 'Pulgar Izq.' },
  { codigo: 'MEDIO_DER', nombre: 'Medio Der.' }
];

export default function TabClientesYHuellas({ mostrarAlerta, onIrAVenderPlan }) {
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
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
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
                          Vender Plan
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
    </section>
  );
}

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { peticionApi } from '../services/api';

const DEDOS_DISPONIBLES = [
  { codigo: 'INDICE_DER', nombre: 'Índice Der.' },
  { codigo: 'PULGAR_DER', nombre: 'Pulgar Der.' },
  { codigo: 'INDICE_IZQ', nombre: 'Índice Izq.' },
  { codigo: 'PULGAR_IZQ', nombre: 'Pulgar Izq.' },
  { codigo: 'MEDIO_DER', nombre: 'Medio Der.' }
];

const ESTADO_SOCIO_MAP = {
  ACTIVO: { label: 'Activo', color: 'var(--semaforo-verde)' },
  INACTIVO: { label: 'Inactivo', color: 'var(--socios-text-sub)' },
  SUSPENDIDO: { label: 'Suspendido', color: 'var(--semaforo-rojo)' },
  VENCIDO: { label: 'Vencido', color: 'var(--semaforo-rojo)' }
};

const CHIPS_FILTRO_SOCIOS = [
  { id: 'TODOS', label: 'Todos' },
  { id: 'ACTIVOS', label: 'Activos' },
  { id: 'SIN_HUELLA', label: 'Sin huella' },
  { id: 'VENCIDOS', label: 'Vencidos' }
];

function obtenerInicialesSocio(c) {
  const n = (c.nombres || c.nombreCompleto || '').trim();
  const a = (c.apellidos || '').trim();
  if (n && a) return `${n[0]}${a[0]}`.toUpperCase();
  const partes = n.split(/\s+/).filter(Boolean);
  if (partes.length >= 2) return `${partes[0][0]}${partes[1][0]}`.toUpperCase();
  return (n.slice(0, 2) || 'FS').toUpperCase();
}

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
  const [filtroChip, setFiltroChip] = useState('TODOS');
  const [paginaActual, setPaginaActual] = useState(1);
  const [menuAbiertoId, setMenuAbiertoId] = useState(null);
  const tablaRef = useRef(null);

  const SOCIOS_POR_PAGINA = 6;

  const [clienteEnrolar, setClienteEnrolar] = useState(null);
  const [mostrarModalRegistro, setMostrarModalRegistro] = useState(false);
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

  useEffect(() => {
    if (!menuAbiertoId) return undefined;

    const handleClickOutside = (event) => {
      if (tablaRef.current && !tablaRef.current.contains(event.target)) {
        setMenuAbiertoId(null);
      } else if (!event.target.closest('.kebab-wrapper')) {
        setMenuAbiertoId(null);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setMenuAbiertoId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [menuAbiertoId]);

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
      setMostrarModalRegistro(false);
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

  const conteosChip = useMemo(() => {
    return {
      TODOS: clientes.length,
      ACTIVOS: clientes.filter((c) => c.estado === 'ACTIVO').length,
      SIN_HUELLA: clientes.filter((c) => !(c.cantidadHuellasActivas > 0)).length,
      VENCIDOS: clientes.filter(
        (c) =>
          c.estado === 'VENCIDO' ||
          c.estado === 'SUSPENDIDO' ||
          c.estado === 'INACTIVO'
      ).length
    };
  }, [clientes]);

  const clientesFiltrados = useMemo(() => {
    const q = filtroBusqueda.trim().toLowerCase();
    return clientes.filter((c) => {
      const coincideTexto =
        !q ||
        c.nombreCompleto.toLowerCase().includes(q) ||
        c.numeroDocumento.toLowerCase().includes(q) ||
        (c.telefonoWhatsapp && c.telefonoWhatsapp.toLowerCase().includes(q));

      if (!coincideTexto) return false;

      if (filtroChip === 'ACTIVOS') return c.estado === 'ACTIVO';
      if (filtroChip === 'SIN_HUELLA') return !(c.cantidadHuellasActivas > 0);
      if (filtroChip === 'VENCIDOS') {
        return (
          c.estado === 'VENCIDO' ||
          c.estado === 'SUSPENDIDO' ||
          c.estado === 'INACTIVO'
        );
      }
      return true;
    });
  }, [clientes, filtroBusqueda, filtroChip]);

  const totalPaginas = Math.max(1, Math.ceil(clientesFiltrados.length / SOCIOS_POR_PAGINA));
  const paginaSegura = Math.min(paginaActual, totalPaginas);
  const indiceInicio = (paginaSegura - 1) * SOCIOS_POR_PAGINA;
  const clientesPaginados = clientesFiltrados.slice(
    indiceInicio,
    indiceInicio + SOCIOS_POR_PAGINA
  );

  return (
    <section className="tab-viewport">
      {/* Directorio de Socios a Ancho Completo (Sin Scroll Vertical) */}
      <div className="card card-fill" ref={tablaRef}>
        <div className="socios-header-bar">
          <div className="card-title">
            <img src="/logos/web-monograma-fs-neon.png" alt="FS" style={{ height: '16px' }} />
            Directorio de Socios ({clientesFiltrados.length})
          </div>

          <div className="socios-header-controls">
            <div className="socios-search-wrap">
              <svg
                className="socios-search-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                className="socios-search-input"
                value={filtroBusqueda}
                onChange={(e) => {
                  setFiltroBusqueda(e.target.value);
                  setPaginaActual(1);
                }}
                placeholder="Buscar por nombre, cédula o celular..."
                aria-label="Buscar socio por nombre, cédula o celular"
              />
            </div>

            <button
              type="button"
              className="btn btn-success"
              onClick={() => setMostrarModalRegistro(true)}
            >
              + Nuevo Socio
            </button>
          </div>
        </div>

        <div className="socios-filter-chips" role="tablist" aria-label="Filtrar directorio de socios">
          {CHIPS_FILTRO_SOCIOS.map((chip) => (
            <button
              key={chip.id}
              type="button"
              role="tab"
              aria-selected={filtroChip === chip.id}
              className={`socios-chip ${filtroChip === chip.id ? 'active' : ''}`}
              onClick={() => {
                setFiltroChip(chip.id);
                setPaginaActual(1);
              }}
            >
              <span>{chip.label}</span>
              <span className="socios-chip-count">({conteosChip[chip.id] ?? 0})</span>
            </button>
          ))}
        </div>

        <div className="socios-table-wrap">
          <table className="socios-table">
            <colgroup>
              <col className="col-socio" />
              <col className="col-whatsapp" />
              <col className="col-biometria" />
              <col className="col-estado" />
              <col className="col-acciones" />
            </colgroup>
            <thead>
              <tr>
                <th>Socio</th>
                <th>WhatsApp</th>
                <th>Biometría</th>
                <th>Estado</th>
                <th className="th-acciones">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {clientesFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                    No se encontraron socios con ese criterio.
                  </td>
                </tr>
              ) : (
                clientesPaginados.map((c) => {
                  const socioKey = c.id || c.numeroDocumento;
                  const tieneHuella = c.cantidadHuellasActivas > 0;
                  const textoHuellas = tieneHuella
                    ? `${c.cantidadHuellasActivas} huella${
                        c.cantidadHuellasActivas === 1 ? '' : 's'
                      }`
                    : 'Sin huella';
                  const estadoInfo = ESTADO_SOCIO_MAP[c.estado] || {
                    label: c.estado || '—',
                    color: 'var(--socios-text-sub)'
                  };
                  const menuAbierto = menuAbiertoId === socioKey;

                  return (
                    <tr key={socioKey}>
                      <td>
                        <div className="socio-cell">
                          <span className="socio-avatar" aria-hidden="true">
                            {obtenerInicialesSocio(c)}
                          </span>
                          <div className="socio-meta">
                            <div className="socio-name" title={c.nombreCompleto}>
                              {c.nombreCompleto}
                            </div>
                            <div className="socio-doc">
                              {c.tipoDocumento} {c.numeroDocumento}
                              {c.observaciones ? ` · ${c.observaciones}` : ''}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="cell-nowrap" data-label="WhatsApp">
                        {c.telefonoWhatsapp || '—'}
                      </td>

                      <td className="cell-nowrap" data-label="Biometría">
                        <span
                          className={`biometria-pill ${
                            tieneHuella ? 'has-finger' : 'no-finger'
                          }`}
                        >
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <path d="M12 11c0 3.517-1.009 6.799-2.753 9.571" />
                            <path d="M8 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3" />
                            <path d="M3 15.364c.64-1.319 1-2.8 1-4.364a8 8 0 0116 0c0 2.473-.345 4.866-.99 7.132" />
                          </svg>
                          <span>{textoHuellas}</span>
                        </span>
                      </td>

                      <td className="cell-nowrap" data-label="Estado">
                        <span className="estado-indicator">
                          <span
                            className="estado-dot"
                            style={{ backgroundColor: estadoInfo.color }}
                            aria-hidden="true"
                          />
                          <span>{estadoInfo.label}</span>
                        </span>
                      </td>

                      <td className="acciones-cell" data-label="Acciones">
                        <div className="acciones-toolbar">
                          <button
                            type="button"
                            className="btn-action-plan"
                            onClick={() => onIrAVenderPlan(c)}
                          >
                            Plan
                          </button>

                          <button
                            type="button"
                            className="btn-icon-ghost"
                            title="Enrolar huella"
                            aria-label={`Enrolar huella de ${c.nombreCompleto}`}
                            onClick={() => seleccionarClienteParaHuella(c)}
                          >
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              aria-hidden="true"
                            >
                              <path d="M12 11c0 3.517-1.009 6.799-2.753 9.571" />
                              <path d="M8 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3" />
                              <path d="M3 15.364c.64-1.319 1-2.8 1-4.364a8 8 0 0116 0c0 2.473-.345 4.866-.99 7.132" />
                            </svg>
                          </button>

                          <button
                            type="button"
                            className="btn-icon-ghost"
                            title="Editar socio"
                            aria-label={`Editar datos de ${c.nombreCompleto}`}
                            onClick={() => setClienteAEditar({ ...c })}
                          >
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              aria-hidden="true"
                            >
                              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </button>

                          <div className="kebab-wrapper">
                            <button
                              type="button"
                              className="btn-icon-ghost"
                              title="Más acciones"
                              aria-label={`Más acciones para ${c.nombreCompleto}`}
                              aria-haspopup="menu"
                              aria-expanded={menuAbierto}
                              onClick={() =>
                                setMenuAbiertoId((prev) =>
                                  prev === socioKey ? null : socioKey
                                )
                              }
                            >
                              <svg
                                viewBox="0 0 24 24"
                                fill="currentColor"
                                aria-hidden="true"
                              >
                                <circle cx="5" cy="12" r="1.8" />
                                <circle cx="12" cy="12" r="1.8" />
                                <circle cx="19" cy="12" r="1.8" />
                              </svg>
                            </button>

                            {menuAbierto && (
                              <div
                                className="kebab-dropdown"
                                role="menu"
                                aria-label={`Opciones de ${c.nombreCompleto}`}
                              >
                                <button
                                  type="button"
                                  role="menuitem"
                                  className="kebab-menuitem"
                                  onClick={() => {
                                    setMenuAbiertoId(null);
                                    setClienteAEliminar(c);
                                  }}
                                >
                                  <svg
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    aria-hidden="true"
                                  >
                                    <polyline points="3 6 5 6 21 6" />
                                    <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                                  </svg>
                                  <span>Eliminar</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="pagination-bar">
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            {clientesFiltrados.length === 0 ? (
              '0 socios en vista'
            ) : (
              <>
                Mostrando{' '}
                <strong style={{ color: 'var(--text-primary)' }}>
                  {indiceInicio + 1}–{Math.min(indiceInicio + SOCIOS_POR_PAGINA, clientesFiltrados.length)}
                </strong>{' '}
                de <strong style={{ color: 'var(--brand-neon)' }}>{clientesFiltrados.length}</strong>{' '}
                socios
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

      {/* Modal: Nuevo Socio (Registro en Frío) */}
      {mostrarModalRegistro && (
        <div className="modal-backdrop">
          <form className="modal-card" onSubmit={handleRegistrar}>
            <div className="card-header">
              <div className="card-title">
                <img src="/logos/web-monograma-fs-neon.png" alt="FS" style={{ height: '18px' }} />
                Nuevo Socio (Registro en Frío)
              </div>
            </div>

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

            <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setMostrarModalRegistro(false)}
              >
                Cancelar
              </button>
              <button type="submit" className="btn btn-success">
                Guardar Socio y Pasar a Huella
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Enrolamiento Biométrico */}
      {clienteEnrolar && (
        <div className="modal-backdrop">
          <form className="modal-card" onSubmit={handleEnrolarHuella}>
            <div className="card-header">
              <div className="card-title">
                <img src="/logos/web-monograma-fs-neon.png" alt="FS" style={{ height: '18px' }} />
                Enrolamiento Biométrico
              </div>
            </div>

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
                <strong>{clienteEnrolar.cantidadHuellasActivas} huella(s)</strong>
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
              <label>2. Plantilla Capturada del Lector de Huella</label>
              <input
                type="text"
                value={plantillaHuella}
                onChange={(e) => setPlantillaHuella(e.target.value)}
                placeholder="Plantilla biométrica..."
                required
              />
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setClienteEnrolar(null)}
              >
                Cerrar
              </button>
              <button type="submit" className="btn btn-success">
                Guardar Huella
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
        </div>
      )}

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

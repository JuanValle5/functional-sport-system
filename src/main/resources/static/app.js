let usuarioActual = null;
let turnoAbiertoActual = null;

function mostrarAlerta(mensaje, tipo = 'ok') {
    const el = document.getElementById('alertaGlobal');
    el.textContent = mensaje;
    el.className = 'alert-banner ' + tipo;
    el.classList.remove('hidden');
    setTimeout(() => el.classList.add('hidden'), 5500);
}

async function peticionApi(url, options = {}) {
    const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
    const response = await fetch(url, { ...options, headers });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(data.mensaje || 'Error en la operación (' + response.status + ')');
    }
    return data;
}

async function iniciarSesion() {
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    const alertaLogin = document.getElementById('alertaLogin');
    alertaLogin.classList.add('hidden');

    try {
        usuarioActual = await peticionApi('/api/v1/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });

        document.getElementById('vistaLogin').classList.add('hidden');
        document.getElementById('vistaApp').classList.remove('hidden');
        document.getElementById('btnCerrarSesion').classList.remove('hidden');

        document.getElementById('infoOperador').textContent = usuarioActual.nombreCompleto;
        const badgeRol = document.getElementById('badgeRolOperador');
        badgeRol.textContent = usuarioActual.rol;
        badgeRol.className = 'role-pill ' + (usuarioActual.rol === 'ADMIN' ? 'admin' : '');
        badgeRol.classList.remove('hidden');

        // Matriz de permisos 3.5: Ocultar pestaña de Gerencia/Rentabilidad si es RECEPCIONISTA
        const btnTabAdmin = document.getElementById('btnTabAdmin');
        if (usuarioActual.rol === 'ADMIN') {
            btnTabAdmin.classList.remove('hidden');
        } else {
            btnTabAdmin.classList.add('hidden');
        }

        conectarStreamSseRecepcion();
        await actualizarDatosMonitor();
        await cargarEstadoTurnoActual();
    } catch (err) {
        alertaLogin.textContent = err.message;
        alertaLogin.classList.remove('hidden');
    }
}

function cerrarSesion() {
    usuarioActual = null;
    document.getElementById('vistaApp').classList.add('hidden');
    document.getElementById('vistaLogin').classList.remove('hidden');
    document.getElementById('btnCerrarSesion').classList.add('hidden');
    document.getElementById('badgeRolOperador').classList.add('hidden');
    document.getElementById('infoOperador').textContent = 'Sesión no iniciada';
}

function cambiarTab(tabId, btnEl) {
    document.querySelectorAll('.tab-section').forEach(s => s.classList.add('hidden'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(tabId).classList.remove('hidden');
    btnEl.classList.add('active');

    if (tabId === 'tabMonitor') actualizarDatosMonitor();
    if (tabId === 'tabClientes') cargarDirectorioClientes();
    if (tabId === 'tabCaja') cargarEstadoTurnoActual();
    if (tabId === 'tabAdmin' && usuarioActual?.rol === 'ADMIN') cargarDashboardGerencia();
}

/* ==================== TAB 1: MONITOR BIOMÉTRICO EN VIVO ==================== */
function conectarStreamSseRecepcion() {
    const evtSource = new EventSource('/api/v1/acceso/monitor/stream');
    evtSource.addEventListener('validacion-acceso', (event) => {
        const resultado = JSON.parse(event.data);
        pintarSemaforoEnRecepcion(resultado);
        actualizarDatosMonitor();
    });
}

function pintarSemaforoEnRecepcion(r) {
    const box = document.getElementById('cajaSemaforoRecepcion');
    box.className = 'semaforo-box ' + r.colorSemaforo;

    document.getElementById('semaforoBadge').textContent =
        r.colorSemaforo + ' • ' + r.motivoResultado + ' (' + (r.tiempoRespuestaMs || 1) + ' ms)';
    document.getElementById('semaforoNombre').textContent = r.clienteNombreCompleto || 'NO IDENTIFICADO';
    document.getElementById('semaforoMensaje').textContent = r.mensajePantalla || '';
    document.getElementById('semaforoPlan').textContent = r.planNombre || '—';
    document.getElementById('semaforoVencimiento').textContent = r.fechaExactaVencimiento || '—';

    let textoRestante = (r.diasRestantes !== null && r.diasRestantes !== undefined)
        ? r.diasRestantes + ' día(s)'
        : '—';
    if (r.sesionesRestantes !== null && r.sesionesRestantes !== undefined) {
        textoRestante += ' | ' + r.sesionesRestantes + ' ses.';
    }
    document.getElementById('semaforoRestantes').textContent = textoRestante;
    document.getElementById('semaforoSaldo').textContent =
        '$' + Number(r.saldoPendienteCaja || 0).toLocaleString('es-CO') + ' COP';
}

async function validarPorHuella() {
    const template = document.getElementById('inputHuellaValidar').value;
    try {
        const res = await peticionApi('/api/v1/acceso/validar-huella', {
            method: 'POST',
            body: JSON.stringify({ templateBiometricoBase64: template })
        });
        pintarSemaforoEnRecepcion(res);
        await actualizarDatosMonitor();
    } catch (err) {
        mostrarAlerta(err.message, 'error');
    }
}

async function validarPorDocumento() {
    const doc = document.getElementById('inputDocValidar').value;
    try {
        const res = await peticionApi('/api/v1/acceso/validar-documento', {
            method: 'POST',
            body: JSON.stringify({ numeroDocumento: doc })
        });
        pintarSemaforoEnRecepcion(res);
        await actualizarDatosMonitor();
    } catch (err) {
        mostrarAlerta(err.message, 'error');
    }
}

async function actualizarDatosMonitor() {
    try {
        const [resumen, historial] = await Promise.all([
            peticionApi('/api/v1/acceso/resumen-dia'),
            peticionApi('/api/v1/acceso/historial-reciente')
        ]);

        document.getElementById('statAutorizadosHoy').textContent = resumen.totalIngresosAutorizadosHoy;
        document.getElementById('statAmarillosHoy').textContent = resumen.totalAlertasAmarillasHoy;
        document.getElementById('statRojosHoy').textContent = resumen.totalBloqueosRojosHoy;
        document.getElementById('statHuellasRam').textContent = resumen.plantillasBiometricasEnMemoria;

        const tbody = document.getElementById('tablaHistorialAccesos');
        tbody.innerHTML = historial.slice(0, 12).map(item => `
            <tr>
                <td>${item.fechaHoraExacta ? new Date(item.fechaHoraExacta).toLocaleTimeString('es-CO') : '—'}</td>
                <td><strong>${item.clienteNombreCompleto}</strong></td>
                <td>${item.planNombre}</td>
                <td><span class="role-pill">${item.colorSemaforo}</span></td>
                <td>${item.motivoResultado}</td>
                <td>${item.diasRestantes ?? '—'}d / ${item.sesionesRestantes ?? '—'}s</td>
            </tr>
        `).join('');
    } catch (e) {
        console.error(e);
    }
}

/* ==================== TAB 2: CLIENTES Y ENROLAMIENTO ==================== */
async function registrarCliente() {
    try {
        const payload = {
            tipoDocumento: document.getElementById('cliTipoDoc').value,
            numeroDocumento: document.getElementById('cliNumDoc').value,
            nombres: document.getElementById('cliNombres').value,
            apellidos: document.getElementById('cliApellidos').value,
            telefonoWhatsapp: document.getElementById('cliWhatsapp').value,
            observaciones: document.getElementById('cliObs').value
        };
        const creado = await peticionApi('/api/v1/clientes', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        mostrarAlerta('Deportista registrado exitosamente: ' + creado.nombreCompleto);
        document.getElementById('buscarDocEnrolar').value = creado.numeroDocumento;
        await buscarClientePorCedula();
        await cargarDirectorioClientes();
    } catch (err) {
        mostrarAlerta(err.message, 'error');
    }
}

async function buscarClientePorCedula() {
    const doc = document.getElementById('buscarDocEnrolar').value;
    try {
        const c = await peticionApi('/api/v1/clientes/documento/' + encodeURIComponent(doc));
        document.getElementById('fichaClienteEncontrado').classList.remove('hidden');
        document.getElementById('clienteSeleccionadoId').value = c.id;
        document.getElementById('lblClienteSeleccionado').textContent = c.nombreCompleto + ' (' + c.numeroDocumento + ')';
        document.getElementById('lblClienteDetalle').textContent =
            'WhatsApp: ' + c.telefonoWhatsapp + ' • Huellas enroladas: ' + c.cantidadHuellasActivas;
    } catch (err) {
        mostrarAlerta(err.message, 'error');
    }
}

async function enrolarHuellaCliente() {
    const clienteId = document.getElementById('clienteSeleccionadoId').value;
    const posicionDedo = document.getElementById('huellaPosicionDedo').value;
    const templateBiometricoBase64 = document.getElementById('huellaPlantillaInput').value;
    try {
        await peticionApi(`/api/v1/clientes/${clienteId}/huellas`, {
            method: 'POST',
            body: JSON.stringify({ posicionDedo, templateBiometricoBase64, calidadCaptura: 95 })
        });
        mostrarAlerta('Huella enrolada en BD y sincronizada en memoria RAM (' + posicionDedo + ')');
        await buscarClientePorCedula();
        await cargarDirectorioClientes();
    } catch (err) {
        mostrarAlerta(err.message, 'error');
    }
}

async function cargarDirectorioClientes() {
    try {
        const lista = await peticionApi('/api/v1/clientes');
        const tbody = document.getElementById('tablaClientes');
        tbody.innerHTML = lista.map(c => `
            <tr>
                <td>${c.tipoDocumento} ${c.numeroDocumento}</td>
                <td><strong>${c.nombreCompleto}</strong></td>
                <td>${c.telefonoWhatsapp}</td>
                <td>${c.cantidadHuellasActivas} dedo(s)</td>
                <td>${c.estado}</td>
            </tr>
        `).join('');
    } catch (e) {
        console.error(e);
    }
}

/* ==================== TAB 3: VENTA DE PLANES Y CONGELAMIENTOS ==================== */
async function cargarClienteParaVenta() {
    const doc = document.getElementById('ventaDocCliente').value;
    try {
        const c = await peticionApi('/api/v1/clientes/documento/' + encodeURIComponent(doc));
        document.getElementById('ventaClienteId').value = c.id;
        document.getElementById('infoClienteVenta').textContent =
            'Cliente seleccionado: ' + c.nombreCompleto + ' • WhatsApp: ' + c.telefonoWhatsapp;
        await listarMembresiasDeCliente(c.id);
    } catch (err) {
        mostrarAlerta(err.message, 'error');
    }
}

async function listarMembresiasDeCliente(clienteId) {
    const historial = await peticionApi('/api/v1/membresias/cliente/' + clienteId);
    const tbody = document.getElementById('tablaMembresiasCliente');
    tbody.innerHTML = historial.map(m => `
        <tr>
            <td><strong>${m.planNombre}</strong></td>
            <td>${m.fechaInicio}</td>
            <td>${m.fechaVencimientoActual} (${m.diasRestantes}d)</td>
            <td>${m.sesionesRestantes ?? 'Ilimitado'}</td>
            <td>${m.estado}</td>
            <td>
                <button class="btn btn-outline" style="padding:0.25rem 0.5rem; font-size:0.75rem;"
                    onclick="document.getElementById('accionMembresiaId').value='${m.id}'">
                    Seleccionar
                </button>
            </td>
        </tr>
    `).join('');
}

async function venderMembresia() {
    const clienteId = document.getElementById('ventaClienteId').value;
    if (!clienteId) {
        mostrarAlerta('Primero busque y cargue al deportista por su número de documento.', 'error');
        return;
    }
    try {
        const payload = {
            clienteId,
            planCodigo: document.getElementById('ventaPlanCodigo').value,
            vendedorUsuarioId: usuarioActual.id,
            canalRecaudo: document.getElementById('ventaCanalRecaudo').value,
            referenciaComprobante: document.getElementById('ventaReferencia').value,
            observaciones: 'Venta en mostrador'
        };
        const m = await peticionApi('/api/v1/membresias/vender', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        mostrarAlerta('Membresía activada hasta ' + m.fechaVencimientoActual + ' (' + m.planNombre + ')');
        await listarMembresiasDeCliente(clienteId);
    } catch (err) {
        mostrarAlerta(err.message, 'error');
    }
}

async function congelarMembresia() {
    const membresiaId = document.getElementById('accionMembresiaId').value;
    try {
        await peticionApi(`/api/v1/membresias/${membresiaId}/congelar`, {
            method: 'POST',
            body: JSON.stringify({
                recepcionistaEnTurnoId: usuarioActual.id,
                claveAdmin: document.getElementById('accionClaveAdmin').value,
                certificadoMedicoVerificado: true,
                referenciaCertificadoMedico: document.getElementById('congelarRefMedica').value,
                observaciones: 'Congelamiento médico verificado'
            })
        });
        mostrarAlerta('Membresía CONGELADA por motivo de salud con certificado médico.');
        const clienteId = document.getElementById('ventaClienteId').value;
        if (clienteId) await listarMembresiasDeCliente(clienteId);
    } catch (err) {
        mostrarAlerta(err.message, 'error');
    }
}

async function reactivarMembresia() {
    const membresiaId = document.getElementById('accionMembresiaId').value;
    try {
        const m = await peticionApi(`/api/v1/membresias/${membresiaId}/reactivar`, {
            method: 'POST',
            body: JSON.stringify({
                usuarioOperadorId: usuarioActual.id,
                observaciones: 'Reactivación en recepción'
            })
        });
        mostrarAlerta('Membresía REACTIVADA. Nueva fecha de vencimiento: ' + m.fechaVencimientoActual);
        const clienteId = document.getElementById('ventaClienteId').value;
        if (clienteId) await listarMembresiasDeCliente(clienteId);
    } catch (err) {
        mostrarAlerta(err.message, 'error');
    }
}

async function anularMembresia() {
    const membresiaId = document.getElementById('accionMembresiaId').value;
    try {
        await peticionApi(`/api/v1/membresias/${membresiaId}/anular`, {
            method: 'POST',
            body: JSON.stringify({
                recepcionistaEnTurnoId: usuarioActual.id,
                claveAdmin: document.getElementById('accionClaveAdmin').value,
                motivoAnulacion: 'Anulación autorizada con clave de Administrador'
            })
        });
        mostrarAlerta('Membresía y pago anulados con autorización de Administrador.');
        const clienteId = document.getElementById('ventaClienteId').value;
        if (clienteId) await listarMembresiasDeCliente(clienteId);
    } catch (err) {
        mostrarAlerta(err.message, 'error');
    }
}

/* ==================== TAB 4: TURNOS DE CAJA Y 5 CANALES ==================== */
async function cargarEstadoTurnoActual() {
    try {
        const t = await peticionApi('/api/v1/caja/turnos/abierto');
        turnoAbiertoActual = t;
        document.getElementById('formAbrirTurno').classList.add('hidden');
        document.getElementById('formCerrarTurno').classList.remove('hidden');

        document.getElementById('estadoTurnoActualBox').innerHTML = `
            <div style="color:#10b981; font-weight:800;">TURNO ABIERTO — JORNADA ${t.jornada}</div>
            <div style="font-size:0.85rem; color:var(--text-secondary);">
                Responsable: ${t.usuarioNombreCompleto} • Base Inicial: $${Number(t.baseInicialEfectivo).toLocaleString('es-CO')} COP
                • Efectivo Esperado en Cajón: <strong>$${Number(t.efectivoEsperadoEnCaja).toLocaleString('es-CO')} COP</strong>
            </div>
        `;

        document.getElementById('tEfectivo').textContent = '$' + Number(t.totalEfectivo).toLocaleString('es-CO');
        document.getElementById('tNequi').textContent = '$' + Number(t.totalNequi).toLocaleString('es-CO');
        document.getElementById('tDaviplata').textContent = '$' + Number(t.totalDaviplata).toLocaleString('es-CO');
        document.getElementById('tBancolombia').textContent = '$' + Number(t.totalBancolombia).toLocaleString('es-CO');
        document.getElementById('tLlaveBreB').textContent = '$' + Number(t.totalLlaveBreB).toLocaleString('es-CO');
        document.getElementById('tGeneral').textContent = '$' + Number(t.totalGeneralRecaudo).toLocaleString('es-CO');

        const pagos = await peticionApi(`/api/v1/caja/turnos/${t.id}/pagos`);
        document.getElementById('tablaPagosTurno').innerHTML = pagos.map(p => `
            <tr>
                <td>${new Date(p.fechaHoraPago).toLocaleTimeString('es-CO')}</td>
                <td>${p.clienteNombreCompleto}</td>
                <td>${p.planNombre}</td>
                <td><span class="role-pill">${p.canalRecaudo}</span></td>
                <td><strong>$${Number(p.montoCop).toLocaleString('es-CO')}</strong></td>
                <td>${p.estado}</td>
            </tr>
        `).join('');
    } catch (e) {
        turnoAbiertoActual = null;
        document.getElementById('formAbrirTurno').classList.remove('hidden');
        document.getElementById('formCerrarTurno').classList.add('hidden');
        document.getElementById('estadoTurnoActualBox').innerHTML = `
            <div style="color:#f59e0b; font-weight:800;">CAJA CERRADA</div>
            <div style="font-size:0.85rem; color:var(--text-secondary);">
                Debe abrir el turno (Mañana o Tarde) antes de registrar cobros de membresías.
            </div>
        `;
        document.getElementById('tablaPagosTurno').innerHTML = '';
    }
}

async function abrirTurnoCaja() {
    try {
        await peticionApi('/api/v1/caja/turnos/abrir', {
            method: 'POST',
            body: JSON.stringify({
                usuarioId: usuarioActual.id,
                jornada: document.getElementById('cajaJornada').value,
                baseInicialEfectivo: Number(document.getElementById('cajaBaseInicial').value || 0)
            })
        });
        mostrarAlerta('Turno de caja ABIERTO exitosamente.');
        await cargarEstadoTurnoActual();
    } catch (err) {
        mostrarAlerta(err.message, 'error');
    }
}

async function cerrarTurnoCaja() {
    try {
        const acta = await peticionApi('/api/v1/caja/turnos/cerrar', {
            method: 'POST',
            body: JSON.stringify({
                usuarioId: usuarioActual.id,
                efectivoFisicoDeclarado: Number(document.getElementById('cajaEfectivoDeclarado').value || 0),
                observacionesCierre: document.getElementById('cajaObsCierre').value
            })
        });
        mostrarAlerta(
            `Turno CERRADO. Recaudo Total: $${Number(acta.totalGeneralRecaudo).toLocaleString('es-CO')} COP | Diferencia Efectivo: $${Number(acta.diferenciaEfectivo).toLocaleString('es-CO')} COP`
        );
        await cargarEstadoTurnoActual();
    } catch (err) {
        mostrarAlerta(err.message, 'error');
    }
}

/* ==================== TAB 5: GERENCIA, RENTABILIDAD Y BACKUPS (ADMIN) ==================== */
async function cargarDashboardGerencia() {
    if (!usuarioActual || usuarioActual.rol !== 'ADMIN') return;
    try {
        const [dash, auditorias] = await Promise.all([
            peticionApi(`/api/v1/admin/dashboard-movil?adminSolicitanteId=${usuarioActual.id}`),
            peticionApi(`/api/v1/auth/auditoria-autorizaciones?adminSolicitanteId=${usuarioActual.id}`)
        ]);

        document.getElementById('admTotalClientes').textContent = dash.totalClientesRegistrados;
        document.getElementById('admMembresiasActivas').textContent = dash.totalMembresiasActivasVigentes;
        document.getElementById('admPorVencer').textContent = dash.totalMembresiasPorVencerEn3Dias;
        document.getElementById('admFacturacionHoy').textContent =
            '$' + Number(dash.facturacionDiaTotalCop).toLocaleString('es-CO');

        if (dash.ultimoBackupNube) {
            document.getElementById('infoUltimoBackup').textContent =
                `Último respaldo: ${dash.ultimoBackupNube.nombreArchivo} (${dash.ultimoBackupNube.estado})`;
        }

        document.getElementById('tablaAuditoriasAdmin').innerHTML = auditorias.map(a => `
            <tr>
                <td>${new Date(a.fechaHora).toLocaleString('es-CO')}</td>
                <td><span class="role-pill">${a.tipoOperacion}</span></td>
                <td>${a.recepcionistaNombreCompleto || 'Directo Admin'}</td>
                <td>${a.justificacion}</td>
            </tr>
        `).join('');
    } catch (err) {
        mostrarAlerta(err.message, 'error');
    }
}

async function crearNuevoUsuario() {
    try {
        const creado = await peticionApi('/api/v1/usuarios', {
            method: 'POST',
            body: JSON.stringify({
                adminEjecutorId: usuarioActual.id,
                username: document.getElementById('usrUsername').value,
                password: document.getElementById('usrPassword').value,
                nombreCompleto: document.getElementById('usrNombre').value,
                numeroDocumento: document.getElementById('usrDoc').value,
                rol: document.getElementById('usrRol').value
            })
        });
        mostrarAlerta('Usuario creado exitosamente: ' + creado.username + ' (' + creado.rol + ')');
    } catch (err) {
        mostrarAlerta(err.message, 'error');
    }
}

async function dispararBackupManual() {
    try {
        const b = await peticionApi(`/api/v1/admin/backups/ejecutar?adminSolicitanteId=${usuarioActual.id}`, {
            method: 'POST'
        });
        mostrarAlerta('Copia de seguridad cifrada generada: ' + b.nombreArchivo + ' (' + b.tamanoBytes + ' bytes)');
        await cargarDashboardGerencia();
    } catch (err) {
        mostrarAlerta(err.message, 'error');
    }
}

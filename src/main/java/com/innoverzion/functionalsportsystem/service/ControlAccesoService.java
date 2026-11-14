package com.innoverzion.functionalsportsystem.service;

import com.innoverzion.functionalsportsystem.domain.entity.*;
import com.innoverzion.functionalsportsystem.domain.enums.*;
import com.innoverzion.functionalsportsystem.dto.acceso.*;
import com.innoverzion.functionalsportsystem.exception.BusinessRuleException;
import com.innoverzion.functionalsportsystem.repository.ClienteRepository;
import com.innoverzion.functionalsportsystem.repository.MembresiaClienteRepository;
import com.innoverzion.functionalsportsystem.repository.RegistroAccesoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.time.temporal.TemporalAdjusters;
import java.util.List;
import java.util.Optional;

/**
 * Motor del Módulo 3 y Sección 2 (Reglas de Validación Biométrica y Acceso en Recepción):
 * - Identificación en memoria RAM (< 1 segundo).
 * - Regla 2.1: Alerta preventiva amarilla 3 días antes del vencimiento.
 * - Regla 2.2: 0 días de gracia (bloqueo inmediato si venció).
 * - Regla 2.3 y 1.1: Anti-Passback estricto a 1 marcación diaria.
 * - Regla 1.1: Tope semanal de 3 ingresos por semana en el plan de $70.000 (MES_3XSEM).
 * - Regla 1.3: Descuento unitario de sesión en cada marcación biométrica autorizada.
 * - Regla 2.4 y 2.5: Interfaz visual 100% silenciosa con nombre completo, plan, vencimiento, días restantes y deudas.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ControlAccesoService {

    private final BiometricCacheService biometricCacheService;
    private final ClienteRepository clienteRepository;
    private final MembresiaClienteRepository membresiaClienteRepository;
    private final RegistroAccesoRepository registroAccesoRepository;
    private final MonitorAccesoSseService monitorAccesoSseService;

    /**
     * Valida en tiempo real la huella biométrica capturada por el lector USB ZKTeco ZK-9500.
     */
    @Transactional
    public ResultadoValidacionAccesoDto validarAccesoPorHuella(ValidarHuellaRequestDto request) {
        long inicioNano = System.nanoTime();

        Optional<HuellaBiometrica> huellaOpt = biometricCacheService.identificarHuella(
                request.templateBiometricoBase64()
        );

        if (huellaOpt.isEmpty()) {
            return registrarYNotificarResultado(
                    null,
                    null,
                    null,
                    ColorSemaforo.ROJO,
                    false,
                    MotivoResultadoAcceso.HUELLA_DESCONOCIDA,
                    "ACCESO DENEGADO: Huella no registrada en el sistema. Diríjase a recepción.",
                    null,
                    null,
                    null,
                    inicioNano
            );
        }

        HuellaBiometrica huella = huellaOpt.get();
        Cliente cliente = huella.getCliente();
        return evaluarReglasDeAccesoCliente(cliente, huella, inicioNano);
    }

    /**
     * Validación de respaldo en recepción mediante el número de documento del deportista.
     */
    @Transactional
    public ResultadoValidacionAccesoDto validarAccesoPorDocumento(ValidarDocumentoRequestDto request) {
        long inicioNano = System.nanoTime();

        if (request.numeroDocumento() == null || request.numeroDocumento().isBlank()) {
            throw new BusinessRuleException("Debe ingresar el número de documento a validar.");
        }

        Optional<Cliente> clienteOpt = clienteRepository.findByNumeroDocumento(request.numeroDocumento().trim());
        if (clienteOpt.isEmpty()) {
            return registrarYNotificarResultado(
                    null,
                    null,
                    null,
                    ColorSemaforo.ROJO,
                    false,
                    MotivoResultadoAcceso.HUELLA_DESCONOCIDA,
                    "ACCESO DENEGADO: No existe ningún cliente registrado con el documento " + request.numeroDocumento(),
                    null,
                    null,
                    null,
                    inicioNano
            );
        }

        return evaluarReglasDeAccesoCliente(clienteOpt.get(), null, inicioNano);
    }

    private ResultadoValidacionAccesoDto evaluarReglasDeAccesoCliente(
            Cliente cliente,
            HuellaBiometrica huella,
            long inicioNano
    ) {
        LocalDate hoy = LocalDate.now();

        // 1. Verificar si el cliente está SUSPENDIDO o INACTIVO
        if (cliente.getEstado() != EstadoCliente.ACTIVO) {
            return registrarYNotificarResultado(
                    cliente,
                    null,
                    huella,
                    ColorSemaforo.ROJO,
                    false,
                    MotivoResultadoAcceso.CLIENTE_SUSPENDIDO,
                    "ACCESO DENEGADO: El usuario se encuentra " + cliente.getEstado() + ". Consulte en recepción.",
                    0,
                    null,
                    null,
                    inicioNano
            );
        }

        // 2. Verificar si tiene saldo pendiente / deudas en caja (Sección 2.4)
        if (cliente.getSaldoPendienteCaja() != null
                && cliente.getSaldoPendienteCaja().compareTo(BigDecimal.ZERO) > 0) {
            return registrarYNotificarResultado(
                    cliente,
                    null,
                    huella,
                    ColorSemaforo.ROJO,
                    false,
                    MotivoResultadoAcceso.SALDO_PENDIENTE,
                    "ACCESO DENEGADO: Presenta saldo pendiente en caja por $" + cliente.getSaldoPendienteCaja() + " COP.",
                    0,
                    null,
                    null,
                    inicioNano
            );
        }

        // 3. Verificar si su membresía actual está CONGELADA por incapacidad médica
        Optional<MembresiaCliente> congeladaOpt = membresiaClienteRepository
                .findFirstByClienteIdAndEstadoOrderByFechaVencimientoActualDesc(cliente.getId(), EstadoMembresia.CONGELADA);
        if (congeladaOpt.isPresent()) {
            MembresiaCliente cong = congeladaOpt.get();
            return registrarYNotificarResultado(
                    cliente,
                    cong,
                    huella,
                    ColorSemaforo.ROJO,
                    false,
                    MotivoResultadoAcceso.CONGELADA,
                    "ACCESO DENEGADO: Su membresía se encuentra CONGELADA por salud. Solicite su reactivación en recepción.",
                    calcularDiasRestantes(hoy, cong.getFechaVencimientoActual()),
                    cong.getSesionesRestantes(),
                    null,
                    inicioNano
            );
        }

        // 4. Buscar membresía ACTIVA y validar vigencia con 0 días de gracia (Regla 2.2)
        Optional<MembresiaCliente> activaOpt = membresiaClienteRepository
                .findFirstByClienteIdAndEstadoOrderByFechaVencimientoActualDesc(cliente.getId(), EstadoMembresia.ACTIVA);

        if (activaOpt.isEmpty()) {
            return registrarYNotificarResultado(
                    cliente,
                    null,
                    huella,
                    ColorSemaforo.ROJO,
                    false,
                    MotivoResultadoAcceso.VENCIDA,
                    "ACCESO DENEGADO: No cuenta con una membresía activa. Debe cancelar su mensualidad o pase diario en caja.",
                    0,
                    0,
                    null,
                    inicioNano
            );
        }

        MembresiaCliente membresia = activaOpt.get();
        Plan plan = membresia.getPlan();

        // Regla 2.2: 0 días de gracia ("Tiene que pagar la mensualidad o la clase o irse")
        if (hoy.isAfter(membresia.getFechaVencimientoActual())) {
            membresia.setEstado(EstadoMembresia.VENCIDA);
            membresiaClienteRepository.save(membresia);

            return registrarYNotificarResultado(
                    cliente,
                    membresia,
                    huella,
                    ColorSemaforo.ROJO,
                    false,
                    MotivoResultadoAcceso.VENCIDA,
                    "ACCESO DENEGADO: Membresía vencida el " + membresia.getFechaVencimientoActual()
                            + ". Debe renovar su plan o pagar la clase del día.",
                    0,
                    membresia.getSesionesRestantes(),
                    null,
                    inicioNano
            );
        }

        int diasRestantes = calcularDiasRestantes(hoy, membresia.getFechaVencimientoActual());

        // 5. Validar si agotó las sesiones de su tiquetera / plan
        if (Boolean.TRUE.equals(plan.getDescuentaPorMarcacion())
                && membresia.getSesionesRestantes() != null
                && membresia.getSesionesRestantes() <= 0) {
            membresia.setEstado(EstadoMembresia.AGOTADA);
            membresiaClienteRepository.save(membresia);

            return registrarYNotificarResultado(
                    cliente,
                    membresia,
                    huella,
                    ColorSemaforo.ROJO,
                    false,
                    MotivoResultadoAcceso.SESIONES_AGOTADAS,
                    "ACCESO DENEGADO: Ha consumido la totalidad de sesiones de su plan.",
                    diasRestantes,
                    0,
                    null,
                    inicioNano
            );
        }

        // 6. Regla 1.1 y 2.3 (Anti-Passback): Restringido estrictamente a 1 marcación diaria
        boolean yaIngresoHoy = registroAccesoRepository
                .existsByClienteIdAndFechaAccesoAndAccesoAutorizadoTrue(cliente.getId(), hoy);

        if (yaIngresoHoy) {
            return registrarYNotificarResultado(
                    cliente,
                    membresia,
                    huella,
                    ColorSemaforo.ROJO,
                    false,
                    MotivoResultadoAcceso.YA_INGRESO_HOY,
                    "ACCESO DENEGADO (Anti-Passback): Ya registró su ingreso el día de hoy. Solo se permite 1 ingreso por día.",
                    diasRestantes,
                    membresia.getSesionesRestantes(),
                    null,
                    inicioNano
            );
        }

        // 7. Regla 1.1: Validar tope semanal si el plan tiene límite (ej. Mensualidad 3 días por semana = máx 3/semana)
        Integer ingresosSemanaMostrar = null;
        if (plan.getMaxIngresosPorSemana() != null) {
            LocalDate lunesSemana = hoy.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
            LocalDate domingoSemana = hoy.with(TemporalAdjusters.nextOrSame(DayOfWeek.SUNDAY));

            long ingresosEstaSemana = registroAccesoRepository
                    .countByClienteIdAndAccesoAutorizadoTrueAndFechaAccesoBetween(
                            cliente.getId(), lunesSemana, domingoSemana
                    );

            if (ingresosEstaSemana >= plan.getMaxIngresosPorSemana()) {
                return registrarYNotificarResultado(
                        cliente,
                        membresia,
                        huella,
                        ColorSemaforo.ROJO,
                        false,
                        MotivoResultadoAcceso.CUPO_SEMANAL_AGOTADO,
                        "ACCESO DENEGADO: Ya completó sus " + plan.getMaxIngresosPorSemana()
                                + " ingresos permitidos en esta semana para el plan '" + plan.getNombre() + "'.",
                        diasRestantes,
                        membresia.getSesionesRestantes(),
                        (int) ingresosEstaSemana,
                        inicioNano
                );
            }
            ingresosSemanaMostrar = (int) ingresosEstaSemana + 1;
        }

        // 8. Ingreso Autorizado: aplicar descuento unitario de sesión si corresponde (Regla 1.3)
        Integer sesionesRestantesTrasIngreso = membresia.getSesionesRestantes();
        if (Boolean.TRUE.equals(plan.getDescuentaPorMarcacion()) && sesionesRestantesTrasIngreso != null) {
            int nuevasConsumidas = (membresia.getSesionesConsumidas() != null ? membresia.getSesionesConsumidas() : 0) + 1;
            int nuevasRestantes = Math.max(0, sesionesRestantesTrasIngreso - 1);
            membresia.setSesionesConsumidas(nuevasConsumidas);
            membresia.setSesionesRestantes(nuevasRestantes);
            membresiaClienteRepository.save(membresia);
            sesionesRestantesTrasIngreso = nuevasRestantes;
        }

        // 9. Evaluar Semáforo AMARILLO (Regla 2.1: Alerta preventiva 3 días antes del vencimiento) vs VERDE
        int umbralAmarillo = plan.getDiasAlertaAmarilla() != null ? plan.getDiasAlertaAmarilla() : 3;
        if (umbralAmarillo > 0 && diasRestantes <= umbralAmarillo) {
            String msgAmarillo = "ACCESO AUTORIZADO — PRÓXIMO A VENCER: Su plan vence en "
                    + diasRestantes + " día(s) (" + membresia.getFechaVencimientoActual() + "). Recuerde renovar.";
            return registrarYNotificarResultado(
                    cliente,
                    membresia,
                    huella,
                    ColorSemaforo.AMARILLO,
                    true,
                    MotivoResultadoAcceso.ALERTA_3_DIAS,
                    msgAmarillo,
                    diasRestantes,
                    sesionesRestantesTrasIngreso,
                    ingresosSemanaMostrar,
                    inicioNano
            );
        }

        String msgVerde = "¡BIENVENIDO A FUNCIONAL SPORT COL! Acceso autorizado.";
        return registrarYNotificarResultado(
                cliente,
                membresia,
                huella,
                ColorSemaforo.VERDE,
                true,
                MotivoResultadoAcceso.OK,
                msgVerde,
                diasRestantes,
                sesionesRestantesTrasIngreso,
                ingresosSemanaMostrar,
                inicioNano
        );
    }

    @Transactional(readOnly = true)
    public List<ResultadoValidacionAccesoDto> listarUltimosAccesosMonitor() {
        return registroAccesoRepository.findTop50ByOrderByFechaHoraExactaDesc()
                .stream()
                .map(r -> mapearRegistroADto(r, construirMensajeResumen(r), null))
                .toList();
    }

    @Transactional(readOnly = true)
    public ResumenAsistenciaDiaDto obtenerResumenAsistenciaHoy() {
        LocalDate hoy = LocalDate.now();
        long autorizados = registroAccesoRepository.countByFechaAccesoAndAccesoAutorizadoTrue(hoy);
        long verdes = registroAccesoRepository.countByFechaAccesoAndColorSemaforo(hoy, ColorSemaforo.VERDE);
        long amarillos = registroAccesoRepository.countByFechaAccesoAndColorSemaforo(hoy, ColorSemaforo.AMARILLO);
        long rojos = registroAccesoRepository.countByFechaAccesoAndColorSemaforo(hoy, ColorSemaforo.ROJO);

        return new ResumenAsistenciaDiaDto(
                hoy,
                autorizados,
                verdes,
                amarillos,
                rojos,
                biometricCacheService.obtenerCantidadPlantillasEnMemoria()
        );
    }

    private ResultadoValidacionAccesoDto registrarYNotificarResultado(
            Cliente cliente,
            MembresiaCliente membresia,
            HuellaBiometrica huella,
            ColorSemaforo colorSemaforo,
            boolean accesoAutorizado,
            MotivoResultadoAcceso motivo,
            String mensajePantalla,
            Integer diasRestantes,
            Integer sesionesRestantes,
            Integer ingresosEstaSemana,
            long inicioNano
    ) {
        int tiempoMs = (int) Math.max(1L, (System.nanoTime() - inicioNano) / 1_000_000L);

        RegistroAcceso registro = RegistroAcceso.builder()
                .cliente(cliente)
                .membresia(membresia)
                .huella(huella)
                .fechaAcceso(LocalDate.now())
                .fechaHoraExacta(LocalDateTime.now())
                .colorSemaforo(colorSemaforo)
                .accesoAutorizado(accesoAutorizado)
                .motivoResultado(motivo)
                .diasRestantesMostrar(diasRestantes)
                .sesionesRestantesMostrar(sesionesRestantes)
                .pulsoElectroimanEnviado(accesoAutorizado)
                .tiempoRespuestaMs(tiempoMs)
                .build();

        RegistroAcceso guardado = registroAccesoRepository.save(registro);
        ResultadoValidacionAccesoDto dto = mapearRegistroADto(guardado, mensajePantalla, ingresosEstaSemana);

        monitorAccesoSseService.notificarPantallasEnTiempoReal(dto);

        log.info("Validación de acceso: cliente={} semaforo={} motivo={} autorizado={} tiempo={}ms",
                cliente != null ? cliente.getNumeroDocumento() : "DESCONOCIDO",
                colorSemaforo, motivo, accesoAutorizado, tiempoMs);

        return dto;
    }

    private ResultadoValidacionAccesoDto mapearRegistroADto(
            RegistroAcceso r,
            String mensajePantalla,
            Integer ingresosEstaSemana
    ) {
        Cliente c = r.getCliente();
        MembresiaCliente m = r.getMembresia();
        Plan p = m != null ? m.getPlan() : null;

        BigDecimal saldoTotal = BigDecimal.ZERO;
        if (c != null && c.getSaldoPendienteCaja() != null) {
            saldoTotal = saldoTotal.add(c.getSaldoPendienteCaja());
        }
        if (m != null && m.getSaldoPendiente() != null) {
            saldoTotal = saldoTotal.add(m.getSaldoPendiente());
        }

        return new ResultadoValidacionAccesoDto(
                r.getId(),
                r.getFechaHoraExacta(),
                Boolean.TRUE.equals(r.getAccesoAutorizado()),
                r.getColorSemaforo(),
                r.getMotivoResultado(),
                mensajePantalla,
                c != null ? c.getId() : null,
                c != null ? c.getNombres() + " " + c.getApellidos() : "USUARIO NO IDENTIFICADO",
                c != null ? c.getNumeroDocumento() : null,
                p != null ? p.getNombre() : "SIN PLAN ACTIVO",
                m != null ? m.getFechaVencimientoActual() : null,
                r.getDiasRestantesMostrar(),
                r.getSesionesRestantesMostrar(),
                ingresosEstaSemana,
                p != null ? p.getMaxIngresosPorSemana() : null,
                saldoTotal,
                true, // Regla 2.5: Operación 100% silenciosa
                Boolean.TRUE.equals(r.getPulsoElectroimanEnviado()),
                r.getTiempoRespuestaMs() != null ? r.getTiempoRespuestaMs() : 1
        );
    }

    private int calcularDiasRestantes(LocalDate hoy, LocalDate fechaVencimiento) {
        if (fechaVencimiento == null) {
            return 0;
        }
        return (int) Math.max(0L, ChronoUnit.DAYS.between(hoy, fechaVencimiento));
    }

    private String construirMensajeResumen(RegistroAcceso r) {
        return switch (r.getMotivoResultado()) {
            case OK -> "¡BIENVENIDO A FUNCIONAL SPORT COL! Acceso autorizado.";
            case ALERTA_3_DIAS -> "ACCESO AUTORIZADO — PRÓXIMO A VENCER (" + r.getDiasRestantesMostrar() + " días restantes).";
            case YA_INGRESO_HOY -> "ACCESO DENEGADO: Ya registró su ingreso el día de hoy (Anti-Passback).";
            case CUPO_SEMANAL_AGOTADO -> "ACCESO DENEGADO: Cupo semanal de 3 ingresos completado.";
            case VENCIDA -> "ACCESO DENEGADO: Membresía vencida.";
            case SESIONES_AGOTADAS -> "ACCESO DENEGADO: Sesiones agotadas.";
            case CONGELADA -> "ACCESO DENEGADO: Membresía congelada por salud.";
            case CLIENTE_SUSPENDIDO -> "ACCESO DENEGADO: Cliente suspendido o inactivo.";
            case SALDO_PENDIENTE -> "ACCESO DENEGADO: Saldo pendiente en caja.";
            case HUELLA_DESCONOCIDA -> "ACCESO DENEGADO: Huella no registrada.";
        };
    }
}

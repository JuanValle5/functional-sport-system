package com.innoverzion.functionalsportsystem.service;

import com.innoverzion.functionalsportsystem.domain.entity.*;
import com.innoverzion.functionalsportsystem.domain.enums.*;
import com.innoverzion.functionalsportsystem.dto.auth.AuditoriaAutorizacionResponseDto;
import com.innoverzion.functionalsportsystem.dto.auth.ValidarClaveAdminRequestDto;
import com.innoverzion.functionalsportsystem.dto.caja.AnularPagoRequestDto;
import com.innoverzion.functionalsportsystem.dto.membresia.*;
import com.innoverzion.functionalsportsystem.exception.BusinessRuleException;
import com.innoverzion.functionalsportsystem.exception.ResourceNotFoundException;
import com.innoverzion.functionalsportsystem.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Implementa el Módulo 2 (Control de Membresías, Planes, Tiqueteras y Congelamientos):
 * - Regla 1.4: Corte dinámico en renovaciones (la nueva vigencia inicia el día del pago efectivo).
 * - Regla 1.5: Congelamiento exclusivo por motivo de salud/enfermedad con Certificado Médico obligatorio.
 * - Regla 3.2: Pago completo anticipado obligatorio (sin pagos fraccionados).
 * - Regla 3.5: Prohibir al recepcionista alterar fechas de vigencia o anular membresías sin clave de ADMIN.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class MembresiaService {

    private final MembresiaClienteRepository membresiaClienteRepository;
    private final CongelamientoMembresiaRepository congelamientoMembresiaRepository;
    private final PagoRepository pagoRepository;
    private final UsuarioSistemaRepository usuarioSistemaRepository;
    private final ClienteService clienteService;
    private final PlanService planService;
    private final TurnoCajaService turnoCajaService;
    private final MatrizPermisosService matrizPermisosService;
    private final AutorizacionAdminService autorizacionAdminService;

    /**
     * Vende o renueva una membresía registrando en una sola transacción atómica:
     * 1. La membresía con corte dinámico.
     * 2. El pago anticipado por el 100% del valor del plan en el turno de caja abierto.
     */
    @Transactional
    public MembresiaResponseDto venderORenovarMembresia(VenderMembresiaRequestDto request) {
        if (request.clienteId() == null) {
            throw new BusinessRuleException("Debe indicar el cliente que adquiere la membresía.");
        }
        if (request.canalRecaudo() == null) {
            throw new BusinessRuleException(
                    "Debe seleccionar el canal de recaudo (EFECTIVO, NEQUI, DAVIPLATA, BANCOLOMBIA, LLAVE_BRE_B)."
            );
        }

        UsuarioSistema vendedor = matrizPermisosService.obtenerUsuarioActivo(request.vendedorUsuarioId());
        Cliente cliente = clienteService.obtenerEntidadPorId(request.clienteId());

        if (cliente.getEstado() == EstadoCliente.SUSPENDIDO) {
            throw new BusinessRuleException(
                    "El cliente se encuentra SUSPENDIDO y no puede adquirir membresías hasta que el Administrador levante la suspensión."
            );
        }

        Plan plan = planService.obtenerPlanActivoPorCodigo(request.planCodigo());
        LocalDate hoy = LocalDate.now();

        Optional<MembresiaCliente> membresiaActivaOpt = membresiaClienteRepository
                .findFirstByClienteIdAndEstadoOrderByFechaVencimientoActualDesc(cliente.getId(), EstadoMembresia.ACTIVA);

        LocalDate fechaInicioNueva = hoy;
        if (membresiaActivaOpt.isPresent()) {
            MembresiaCliente anterior = membresiaActivaOpt.get();
            if (anterior.getFechaVencimientoActual().isBefore(hoy)) {
                // La membresía anterior ya estaba vencida: se marca VENCIDA y aplica Corte Dinámico desde hoy (Regla 1.4)
                anterior.setEstado(EstadoMembresia.VENCIDA);
                membresiaClienteRepository.save(anterior);
                fechaInicioNueva = hoy;
            } else {
                // Renovación anticipada (ej. dentro de los 3 días de alerta amarilla): inicia al día siguiente del corte actual
                fechaInicioNueva = anterior.getFechaVencimientoActual().plusDays(1);
            }
        }

        LocalDate fechaVencimiento = calcularFechaVencimiento(fechaInicioNueva, plan.getDuracionDias());

        MembresiaCliente nuevaMembresia = MembresiaCliente.builder()
                .cliente(cliente)
                .plan(plan)
                .vendidoPorUsuario(vendedor)
                .fechaInicio(fechaInicioNueva)
                .fechaVencimientoOriginal(fechaVencimiento)
                .fechaVencimientoActual(fechaVencimiento)
                .sesionesTotales(plan.getSesionesTotalesTiquetera())
                .sesionesConsumidas(0)
                .sesionesRestantes(plan.getSesionesTotalesTiquetera())
                .valorPagado(plan.getPrecioCop())
                .saldoPendiente(BigDecimal.ZERO)
                .estado(EstadoMembresia.ACTIVA)
                .build();

        MembresiaCliente membresiaGuardada = membresiaClienteRepository.save(nuevaMembresia);

        Pago pagoRegistrado = turnoCajaService.registrarPagoDeMembresia(
                membresiaGuardada,
                cliente,
                vendedor,
                plan.getPrecioCop(),
                request.canalRecaudo(),
                request.referenciaComprobante()
        );

        log.info("Membresía vendida: plan={} cliente={} vigencia={} a {} pago=${} ({})",
                plan.getCodigo(), cliente.getNumeroDocumento(),
                fechaInicioNueva, fechaVencimiento, plan.getPrecioCop(), request.canalRecaudo());

        return mapearADto(membresiaGuardada, pagoRegistrado);
    }

    /**
     * Regla 1.5: Política de congelamiento exclusivo en caso de salud o enfermedad,
     * debiendo contar obligatoriamente con Certificado Médico.
     * Permitido directamente para el Recepcionista o Administrador en turno.
     */
    @Transactional
    public CongelamientoResponseDto congelarMembresiaPorSalud(
            UUID membresiaId,
            CongelarMembresiaRequestDto request
    ) {
        MembresiaCliente membresia = obtenerMembresiaPorId(membresiaId);

        if (membresia.getEstado() != EstadoMembresia.ACTIVA) {
            throw new BusinessRuleException(
                    "Solo se pueden congelar membresías que se encuentren en estado ACTIVA (estado actual: "
                            + membresia.getEstado() + ")."
            );
        }
        if (!Boolean.TRUE.equals(membresia.getPlan().getPermiteCongelamiento())) {
            throw new BusinessRuleException(
                    "El plan '" + membresia.getPlan().getNombre() + "' no permite congelamiento."
            );
        }
        if (!Boolean.TRUE.equals(request.certificadoMedicoVerificado())
                || request.referenciaCertificadoMedico() == null
                || request.referenciaCertificadoMedico().isBlank()) {
            throw new BusinessRuleException(
                    "Regla 1.5: El congelamiento solo se permite en caso de salud o enfermedad y requiere obligatoriamente verificar y referenciar el Certificado Médico."
            );
        }

        UsuarioSistema operador = matrizPermisosService.obtenerUsuarioActivo(request.recepcionistaEnTurnoId());

        membresia.setEstado(EstadoMembresia.CONGELADA);
        membresiaClienteRepository.save(membresia);

        CongelamientoMembresia congelamiento = CongelamientoMembresia.builder()
                .membresia(membresia)
                .registradoPorUsuario(operador)
                .autorizadoPorAdmin(operador)
                .fechaInicio(LocalDate.now())
                .fechaFinEstimada(request.fechaFinEstimada())
                .diasReconocidos(0)
                .motivo(MotivoCongelamiento.SALUD_ENFERMEDAD)
                .certificadoMedicoVerificado(true)
                .referenciaCertificadoMedico(request.referenciaCertificadoMedico().trim())
                .observaciones(request.observaciones())
                .estado(EstadoCongelamiento.ACTIVO)
                .build();

        CongelamientoMembresia guardado = congelamientoMembresiaRepository.save(congelamiento);
        log.info("Membresía {} CONGELADA por salud por {}. Certificado médico: {}",
                membresia.getId(), operador.getUsername(), guardado.getReferenciaCertificadoMedico());

        return mapearCongelamientoADto(guardado);
    }

    /**
     * Reactiva una membresía congelada sumando los días pausados a la fecha de vencimiento actual.
     */
    @Transactional
    public MembresiaResponseDto reactivarMembresiaCongelada(
            UUID membresiaId,
            ReactivarMembresiaRequestDto request
    ) {
        matrizPermisosService.obtenerUsuarioActivo(request.usuarioOperadorId());
        MembresiaCliente membresia = obtenerMembresiaPorId(membresiaId);

        if (membresia.getEstado() != EstadoMembresia.CONGELADA) {
            throw new BusinessRuleException("La membresía no se encuentra en estado CONGELADA.");
        }

        CongelamientoMembresia congelamiento = congelamientoMembresiaRepository
                .findByMembresiaIdAndEstado(membresiaId, EstadoCongelamiento.ACTIVO)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No se encontró un registro de congelamiento activo para esta membresía."
                ));

        LocalDate hoy = LocalDate.now();
        long diasPausados = Math.max(0, ChronoUnit.DAYS.between(congelamiento.getFechaInicio(), hoy));
        int diasReconocidos = (int) diasPausados;

        congelamiento.setFechaReanudacionReal(hoy);
        congelamiento.setDiasReconocidos(diasReconocidos);
        congelamiento.setEstado(EstadoCongelamiento.FINALIZADO);
        if (request.observaciones() != null && !request.observaciones().isBlank()) {
            String obsPrevias = congelamiento.getObservaciones() != null ? congelamiento.getObservaciones() + " | " : "";
            congelamiento.setObservaciones(obsPrevias + request.observaciones().trim());
        }
        congelamientoMembresiaRepository.save(congelamiento);

        membresia.setFechaVencimientoActual(membresia.getFechaVencimientoActual().plusDays(diasReconocidos));
        membresia.setEstado(EstadoMembresia.ACTIVA);
        MembresiaCliente actualizada = membresiaClienteRepository.save(membresia);

        Pago pago = pagoRepository.findFirstByMembresiaIdAndEstado(actualizada.getId(), EstadoPago.ASENTADO)
                .orElse(null);

        return mapearADto(actualizada, pago);
    }

    /**
     * Regla 3.5: Prohibir al recepcionista la alteración manual de fechas de vigencia sin clave de Administrador.
     */
    @Transactional
    public MembresiaResponseDto alterarFechaVigenciaConClaveAdmin(
            UUID membresiaId,
            AlterarVigenciaMembresiaRequestDto request
    ) {
        if (request.nuevaFechaVencimiento() == null) {
            throw new BusinessRuleException("Debe indicar la nueva fecha de vencimiento.");
        }
        MembresiaCliente membresia = obtenerMembresiaPorId(membresiaId);
        LocalDate fechaAnterior = membresia.getFechaVencimientoActual();

        autorizacionAdminService.validarClaveYRegistrarAuditoria(
                new ValidarClaveAdminRequestDto(
                        request.claveAdmin(),
                        request.recepcionistaEnTurnoId(),
                        TipoOperacionAuditoria.ALTERACION_FECHA_VIGENCIA,
                        "MEMBRESIAS_CLIENTE",
                        membresia.getId(),
                        fechaAnterior.toString(),
                        request.nuevaFechaVencimiento().toString(),
                        request.justificacion()
                )
        );

        membresia.setFechaVencimientoActual(request.nuevaFechaVencimiento());
        if (!request.nuevaFechaVencimiento().isBefore(LocalDate.now())
                && membresia.getEstado() == EstadoMembresia.VENCIDA) {
            membresia.setEstado(EstadoMembresia.ACTIVA);
        }

        MembresiaCliente actualizada = membresiaClienteRepository.save(membresia);
        Pago pago = pagoRepository.findFirstByMembresiaIdAndEstado(actualizada.getId(), EstadoPago.ASENTADO)
                .orElse(null);

        return mapearADto(actualizada, pago);
    }

    /**
     * Regla 3.5: Prohibir al recepcionista la anulación de membresías activas sin clave de Administrador.
     */
    @Transactional
    public MembresiaResponseDto anularMembresiaConClaveAdmin(
            UUID membresiaId,
            AnularMembresiaRequestDto request
    ) {
        MembresiaCliente membresia = obtenerMembresiaPorId(membresiaId);

        if (membresia.getEstado() == EstadoMembresia.ANULADA) {
            throw new BusinessRuleException("La membresía ya se encuentra ANULADA.");
        }

        AuditoriaAutorizacionResponseDto auditoria = autorizacionAdminService.validarClaveYRegistrarAuditoria(
                new ValidarClaveAdminRequestDto(
                        request.claveAdmin(),
                        request.recepcionistaEnTurnoId(),
                        TipoOperacionAuditoria.ANULACION_MEMBRESIA,
                        "MEMBRESIAS_CLIENTE",
                        membresia.getId(),
                        "estado=" + membresia.getEstado(),
                        "estado=ANULADA",
                        request.motivoAnulacion()
                )
        );

        UsuarioSistema adminAutorizador = usuarioSistemaRepository.findById(auditoria.adminUsuarioId())
                .orElseThrow(() -> new ResourceNotFoundException("Administrador no encontrado."));

        membresia.setEstado(EstadoMembresia.ANULADA);
        membresia.setAnuladaPorAdmin(adminAutorizador);
        membresia.setMotivoAnulacion(request.motivoAnulacion());
        MembresiaCliente guardada = membresiaClienteRepository.save(membresia);

        Optional<Pago> pagoOpt = pagoRepository.findFirstByMembresiaIdAndEstado(guardada.getId(), EstadoPago.ASENTADO);
        if (pagoOpt.isPresent()) {
            Pago pago = pagoOpt.get();
            pago.setEstado(EstadoPago.ANULADO_POR_ADMIN);
            pago.setAnuladoPorAdmin(adminAutorizador);
            pago.setMotivoAnulacion("Anulación automática por anulación de membresía: " + request.motivoAnulacion());
            pagoRepository.save(pago);
            turnoCajaService.recalcularTotalesTurno(pago.getTurnoCaja());
        }

        return mapearADto(guardada, pagoOpt.orElse(null));
    }

    @Transactional(readOnly = true)
    public List<MembresiaResponseDto> listarHistorialPorCliente(UUID clienteId) {
        clienteService.obtenerEntidadPorId(clienteId);
        return membresiaClienteRepository.findByClienteIdOrderByCreatedAtDesc(clienteId)
                .stream()
                .map(m -> {
                    Pago pago = pagoRepository.findFirstByMembresiaIdAndEstado(m.getId(), EstadoPago.ASENTADO)
                            .orElse(null);
                    return mapearADto(m, pago);
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public List<CongelamientoResponseDto> listarCongelamientosDeMembresia(UUID membresiaId) {
        obtenerMembresiaPorId(membresiaId);
        return congelamientoMembresiaRepository.findByMembresiaIdOrderByCreatedAtDesc(membresiaId)
                .stream()
                .map(this::mapearCongelamientoADto)
                .toList();
    }

    private MembresiaCliente obtenerMembresiaPorId(UUID membresiaId) {
        return membresiaClienteRepository.findById(membresiaId)
                .orElseThrow(() -> new ResourceNotFoundException("Membresía no encontrada con ID: " + membresiaId));
    }

    private LocalDate calcularFechaVencimiento(LocalDate fechaInicio, int duracionDias) {
        if (duracionDias <= 1) {
            return fechaInicio;
        }
        return fechaInicio.plusDays(duracionDias);
    }

    public MembresiaResponseDto mapearADto(MembresiaCliente m, Pago pago) {
        long diasRestantes = Math.max(0, ChronoUnit.DAYS.between(LocalDate.now(), m.getFechaVencimientoActual()));
        return new MembresiaResponseDto(
                m.getId(),
                m.getCliente().getId(),
                m.getCliente().getNombres() + " " + m.getCliente().getApellidos(),
                m.getCliente().getNumeroDocumento(),
                m.getPlan().getId(),
                m.getPlan().getCodigo(),
                m.getPlan().getNombre(),
                m.getVendidoPorUsuario().getNombreCompleto(),
                m.getFechaInicio(),
                m.getFechaVencimientoOriginal(),
                m.getFechaVencimientoActual(),
                diasRestantes,
                m.getSesionesTotales(),
                m.getSesionesConsumidas(),
                m.getSesionesRestantes(),
                m.getValorPagado(),
                m.getSaldoPendiente(),
                m.getEstado(),
                pago != null ? pago.getId() : null,
                pago != null ? pago.getCanalRecaudo() : null,
                m.getCreatedAt()
        );
    }

    private CongelamientoResponseDto mapearCongelamientoADto(CongelamientoMembresia c) {
        return new CongelamientoResponseDto(
                c.getId(),
                c.getMembresia().getId(),
                c.getRegistradoPorUsuario().getNombreCompleto(),
                c.getAutorizadoPorAdmin().getNombreCompleto(),
                c.getFechaInicio(),
                c.getFechaFinEstimada(),
                c.getFechaReanudacionReal(),
                c.getDiasReconocidos(),
                c.getMotivo(),
                c.getCertificadoMedicoVerificado(),
                c.getReferenciaCertificadoMedico(),
                c.getObservaciones(),
                c.getEstado(),
                c.getCreatedAt()
        );
    }
}

package com.innoverzion.functionalsportsystem.service;

import com.innoverzion.functionalsportsystem.domain.entity.*;
import com.innoverzion.functionalsportsystem.domain.enums.*;
import com.innoverzion.functionalsportsystem.dto.auth.AuditoriaAutorizacionResponseDto;
import com.innoverzion.functionalsportsystem.dto.auth.ValidarClaveAdminRequestDto;
import com.innoverzion.functionalsportsystem.dto.caja.*;
import com.innoverzion.functionalsportsystem.exception.BusinessRuleException;
import com.innoverzion.functionalsportsystem.exception.ResourceNotFoundException;
import com.innoverzion.functionalsportsystem.repository.PagoRepository;
import com.innoverzion.functionalsportsystem.repository.TurnoCajaRepository;
import com.innoverzion.functionalsportsystem.repository.UsuarioSistemaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Implementa el Módulo 4 y la Sección 3 (Control de Caja, Pagos y Turnos de Recepción):
 * - 2 turnos operativos: MANANA y TARDE.
 * - 5 canales de recaudo: EFECTIVO, NEQUI, DAVIPLATA, BANCOLOMBIA, LLAVE_BRE_B.
 * - Prohibición al recepcionista de editar/anular pagos asentados sin clave ADMIN.
 * - Prohibición al recepcionista de ver reportes globales de rentabilidad.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class TurnoCajaService {

    private final TurnoCajaRepository turnoCajaRepository;
    private final PagoRepository pagoRepository;
    private final UsuarioSistemaRepository usuarioSistemaRepository;
    private final MatrizPermisosService matrizPermisosService;
    private final AutorizacionAdminService autorizacionAdminService;

    @Transactional
    public TurnoCajaResponseDto abrirTurno(AbrirTurnoCajaRequestDto request) {
        UsuarioSistema operador = matrizPermisosService.obtenerUsuarioActivo(request.usuarioId());

        if (request.jornada() == null) {
            throw new BusinessRuleException("Debe seleccionar la jornada del turno (MANANA o TARDE).");
        }
        if (turnoCajaRepository.existsByEstado(EstadoTurnoCaja.ABIERTO)) {
            throw new BusinessRuleException(
                    "Ya existe un turno de caja ABIERTO. Debe cerrarse y cuadrarse el turno actual antes de abrir uno nuevo."
            );
        }

        BigDecimal baseInicial = request.baseInicialEfectivo() != null
                ? request.baseInicialEfectivo()
                : BigDecimal.ZERO;

        if (baseInicial.compareTo(BigDecimal.ZERO) < 0) {
            throw new BusinessRuleException("La base inicial de efectivo no puede ser negativa.");
        }

        TurnoCaja nuevoTurno = TurnoCaja.builder()
                .usuario(operador)
                .fechaOperacion(LocalDate.now())
                .jornada(request.jornada())
                .fechaHoraApertura(LocalDateTime.now())
                .baseInicialEfectivo(baseInicial)
                .totalEfectivo(BigDecimal.ZERO)
                .totalNequi(BigDecimal.ZERO)
                .totalDaviplata(BigDecimal.ZERO)
                .totalBancolombia(BigDecimal.ZERO)
                .totalLlaveBreB(BigDecimal.ZERO)
                .totalGeneralRecaudo(BigDecimal.ZERO)
                .estado(EstadoTurnoCaja.ABIERTO)
                .build();

        TurnoCaja guardado = turnoCajaRepository.save(nuevoTurno);
        log.info("Turno de caja ABIERTO: jornada={} por usuario={} con base=${}",
                guardado.getJornada(), operador.getUsername(), baseInicial);

        return mapearTurnoADto(guardado);
    }

    @Transactional(readOnly = true)
    public TurnoCaja obtenerTurnoAbiertoEntidad() {
        return turnoCajaRepository.findFirstByEstadoOrderByFechaHoraAperturaDesc(EstadoTurnoCaja.ABIERTO)
                .orElseThrow(() -> new BusinessRuleException(
                        "No hay ningún turno de caja ABIERTO. Debe abrir el turno (Mañana o Tarde) antes de registrar cobros."
                ));
    }

    @Transactional(readOnly = true)
    public TurnoCajaResponseDto obtenerTurnoAbiertoDto() {
        return mapearTurnoADto(obtenerTurnoAbiertoEntidad());
    }

    /**
     * Registra un pago completo anticipado en el turno abierto y acumula el valor en el canal correspondiente.
     */
    @Transactional
    public Pago registrarPagoDeMembresia(
            MembresiaCliente membresia,
            Cliente cliente,
            UsuarioSistema vendedor,
            BigDecimal montoCop,
            CanalRecaudo canalRecaudo,
            String referenciaComprobante
    ) {
        if (canalRecaudo == null) {
            throw new BusinessRuleException(
                    "Debe especificar el canal de recaudo (EFECTIVO, NEQUI, DAVIPLATA, BANCOLOMBIA, LLAVE_BRE_B)."
            );
        }

        TurnoCaja turnoAbierto = obtenerTurnoAbiertoEntidad();

        Pago pago = Pago.builder()
                .turnoCaja(turnoAbierto)
                .membresia(membresia)
                .cliente(cliente)
                .recibidoPorUsuario(vendedor)
                .fechaHoraPago(LocalDateTime.now())
                .montoCop(montoCop)
                .canalRecaudo(canalRecaudo)
                .referenciaComprobante(referenciaComprobante)
                .estado(EstadoPago.ASENTADO)
                .build();

        Pago pagoGuardado = pagoRepository.save(pago);
        recalcularTotalesTurno(turnoAbierto);

        return pagoGuardado;
    }

    /**
     * Cierra el turno activo generando el Acta de Cuadre (comparativo entre efectivo esperado y efectivo físico declarado).
     */
    @Transactional
    public TurnoCajaResponseDto cerrarTurnoActual(CerrarTurnoCajaRequestDto request) {
        matrizPermisosService.obtenerUsuarioActivo(request.usuarioId());

        if (request.efectivoFisicoDeclarado() == null || request.efectivoFisicoDeclarado().compareTo(BigDecimal.ZERO) < 0) {
            throw new BusinessRuleException("Debe ingresar el monto de efectivo físico contado al cierre del turno.");
        }

        TurnoCaja turno = obtenerTurnoAbiertoEntidad();
        recalcularTotalesTurno(turno);

        BigDecimal efectivoEsperado = turno.getBaseInicialEfectivo().add(turno.getTotalEfectivo());
        BigDecimal diferencia = request.efectivoFisicoDeclarado().subtract(efectivoEsperado);

        turno.setEfectivoFisicoDeclarado(request.efectivoFisicoDeclarado());
        turno.setDiferenciaEfectivo(diferencia);
        turno.setFechaHoraCierre(LocalDateTime.now());
        turno.setEstado(EstadoTurnoCaja.CERRADO);
        turno.setObservacionesCierre(request.observacionesCierre());

        TurnoCaja cerrado = turnoCajaRepository.save(turno);
        log.info("Turno de caja CERRADO: jornada={} totalGeneral=${} diferenciaEfectivo=${}",
                cerrado.getJornada(), cerrado.getTotalGeneralRecaudo(), diferencia);

        return mapearTurnoADto(cerrado);
    }

    /**
     * Sección 3.5: El recepcionista tiene prohibido eliminar o editar pagos ya asentados.
     * Solo se puede anular un pago ingresando la clave de un ADMINISTRADOR y dejando rastro en auditoría.
     */
    @Transactional
    public PagoResponseDto anularPagoConClaveAdmin(UUID pagoId, AnularPagoRequestDto request) {
        Pago pago = pagoRepository.findById(pagoId)
                .orElseThrow(() -> new ResourceNotFoundException("No existe el pago con ID: " + pagoId));

        if (pago.getEstado() == EstadoPago.ANULADO_POR_ADMIN) {
            throw new BusinessRuleException("Este pago ya fue anulado previamente.");
        }

        AuditoriaAutorizacionResponseDto auditoria = autorizacionAdminService.validarClaveYRegistrarAuditoria(
                new ValidarClaveAdminRequestDto(
                        request.claveAdmin(),
                        request.recepcionistaEnTurnoId(),
                        TipoOperacionAuditoria.ANULACION_PAGO,
                        "PAGOS",
                        pago.getId(),
                        "estado=ASENTADO, monto=" + pago.getMontoCop() + ", canal=" + pago.getCanalRecaudo(),
                        "estado=ANULADO_POR_ADMIN",
                        request.motivoAnulacion()
                )
        );

        UsuarioSistema adminAutorizador = usuarioSistemaRepository.findById(auditoria.adminUsuarioId())
                .orElseThrow(() -> new ResourceNotFoundException("Administrador no encontrado."));

        pago.setEstado(EstadoPago.ANULADO_POR_ADMIN);
        pago.setAnuladoPorAdmin(adminAutorizador);
        pago.setMotivoAnulacion(request.motivoAnulacion());
        Pago guardado = pagoRepository.save(pago);

        recalcularTotalesTurno(pago.getTurnoCaja());

        return mapearPagoADto(guardado);
    }

    @Transactional(readOnly = true)
    public List<PagoResponseDto> listarPagosDeTurno(UUID turnoCajaId) {
        return pagoRepository.findByTurnoCajaIdOrderByFechaHoraPagoDesc(turnoCajaId)
                .stream()
                .map(this::mapearPagoADto)
                .toList();
    }

    /**
     * Sección 3.5: Prohibir al perfil RECEPCIONISTA la visualización de reportes globales de rentabilidad.
     * Exclusivo para el rol ADMIN (Jhorman).
     */
    @Transactional(readOnly = true)
    public ReporteRentabilidadGlobalDto generarReporteRentabilidadGlobal(
            UUID adminSolicitanteId,
            LocalDate fechaInicio,
            LocalDate fechaFin
    ) {
        matrizPermisosService.exigirRolAdmin(
                adminSolicitanteId,
                "visualizar reportes globales de rentabilidad del gimnasio"
        );

        LocalDate inicio = fechaInicio != null ? fechaInicio : LocalDate.now().withDayOfMonth(1);
        LocalDate fin = fechaFin != null ? fechaFin : LocalDate.now();

        List<TurnoCaja> turnos = turnoCajaRepository
                .findByFechaOperacionBetweenOrderByFechaHoraAperturaDesc(inicio, fin);

        BigDecimal totEfectivo = BigDecimal.ZERO;
        BigDecimal totNequi = BigDecimal.ZERO;
        BigDecimal totDaviplata = BigDecimal.ZERO;
        BigDecimal totBancolombia = BigDecimal.ZERO;
        BigDecimal totLlaveBreB = BigDecimal.ZERO;
        BigDecimal totGeneral = BigDecimal.ZERO;

        for (TurnoCaja t : turnos) {
            totEfectivo = totEfectivo.add(t.getTotalEfectivo());
            totNequi = totNequi.add(t.getTotalNequi());
            totDaviplata = totDaviplata.add(t.getTotalDaviplata());
            totBancolombia = totBancolombia.add(t.getTotalBancolombia());
            totLlaveBreB = totLlaveBreB.add(t.getTotalLlaveBreB());
            totGeneral = totGeneral.add(t.getTotalGeneralRecaudo());
        }

        List<TurnoCajaResponseDto> turnosDto = turnos.stream()
                .map(this::mapearTurnoADto)
                .toList();

        return new ReporteRentabilidadGlobalDto(
                inicio,
                fin,
                turnos.size(),
                totEfectivo,
                totNequi,
                totDaviplata,
                totBancolombia,
                totLlaveBreB,
                totGeneral,
                turnosDto
        );
    }

    @Transactional
    public void recalcularTotalesTurno(TurnoCaja turno) {
        List<Pago> pagosAsentados = pagoRepository
                .findByTurnoCajaIdAndEstadoOrderByFechaHoraPagoDesc(turno.getId(), EstadoPago.ASENTADO);

        BigDecimal efectivo = BigDecimal.ZERO;
        BigDecimal nequi = BigDecimal.ZERO;
        BigDecimal daviplata = BigDecimal.ZERO;
        BigDecimal bancolombia = BigDecimal.ZERO;
        BigDecimal llaveBreB = BigDecimal.ZERO;

        for (Pago p : pagosAsentados) {
            switch (p.getCanalRecaudo()) {
                case EFECTIVO -> efectivo = efectivo.add(p.getMontoCop());
                case NEQUI -> nequi = nequi.add(p.getMontoCop());
                case DAVIPLATA -> daviplata = daviplata.add(p.getMontoCop());
                case BANCOLOMBIA -> bancolombia = bancolombia.add(p.getMontoCop());
                case LLAVE_BRE_B -> llaveBreB = llaveBreB.add(p.getMontoCop());
            }
        }

        BigDecimal totalGeneral = efectivo
                .add(nequi)
                .add(daviplata)
                .add(bancolombia)
                .add(llaveBreB);

        turno.setTotalEfectivo(efectivo);
        turno.setTotalNequi(nequi);
        turno.setTotalDaviplata(daviplata);
        turno.setTotalBancolombia(bancolombia);
        turno.setTotalLlaveBreB(llaveBreB);
        turno.setTotalGeneralRecaudo(totalGeneral);

        turnoCajaRepository.save(turno);
    }

    public TurnoCajaResponseDto mapearTurnoADto(TurnoCaja t) {
        BigDecimal efectivoEsperado = t.getBaseInicialEfectivo().add(t.getTotalEfectivo());
        return new TurnoCajaResponseDto(
                t.getId(),
                t.getUsuario().getId(),
                t.getUsuario().getNombreCompleto(),
                t.getFechaOperacion(),
                t.getJornada(),
                t.getFechaHoraApertura(),
                t.getFechaHoraCierre(),
                t.getBaseInicialEfectivo(),
                t.getTotalEfectivo(),
                t.getTotalNequi(),
                t.getTotalDaviplata(),
                t.getTotalBancolombia(),
                t.getTotalLlaveBreB(),
                t.getTotalGeneralRecaudo(),
                efectivoEsperado,
                t.getEfectivoFisicoDeclarado(),
                t.getDiferenciaEfectivo(),
                t.getEstado(),
                t.getObservacionesCierre()
        );
    }

    public PagoResponseDto mapearPagoADto(Pago p) {
        return new PagoResponseDto(
                p.getId(),
                p.getTurnoCaja().getId(),
                p.getMembresia().getId(),
                p.getMembresia().getPlan().getNombre(),
                p.getCliente().getId(),
                p.getCliente().getNombres() + " " + p.getCliente().getApellidos(),
                p.getCliente().getNumeroDocumento(),
                p.getRecibidoPorUsuario().getId(),
                p.getRecibidoPorUsuario().getNombreCompleto(),
                p.getFechaHoraPago(),
                p.getMontoCop(),
                p.getCanalRecaudo(),
                p.getReferenciaComprobante(),
                p.getEstado(),
                p.getAnuladoPorAdmin() != null ? p.getAnuladoPorAdmin().getNombreCompleto() : null,
                p.getMotivoAnulacion()
        );
    }
}

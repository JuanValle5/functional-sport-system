package com.innoverzion.functionalsportsystem.service;

import com.innoverzion.functionalsportsystem.domain.entity.AuditoriaAutorizacion;
import com.innoverzion.functionalsportsystem.domain.entity.UsuarioSistema;
import com.innoverzion.functionalsportsystem.domain.enums.RolUsuario;
import com.innoverzion.functionalsportsystem.dto.auth.AuditoriaAutorizacionResponseDto;
import com.innoverzion.functionalsportsystem.dto.auth.ValidarClaveAdminRequestDto;
import com.innoverzion.functionalsportsystem.exception.BusinessRuleException;
import com.innoverzion.functionalsportsystem.exception.UnauthorizedOperationException;
import com.innoverzion.functionalsportsystem.repository.AuditoriaAutorizacionRepository;
import com.innoverzion.functionalsportsystem.repository.UsuarioSistemaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AutorizacionAdminService {

    private final UsuarioSistemaRepository usuarioSistemaRepository;
    private final AuditoriaAutorizacionRepository auditoriaAutorizacionRepository;
    private final MatrizPermisosService matrizPermisosService;
    private final PasswordEncoder passwordEncoder;

    /**
     * Valida la clave de un Administrador (ej. Jhorman) ingresada en mostrador para desbloquear
     * una acción restringida (alterar fecha de vigencia, congelar por salud, anular pago/membresía)
     * y registra el rastro inmutable en AUDITORIA_AUTORIZACIONES.
     */
    @Transactional
    public AuditoriaAutorizacionResponseDto validarClaveYRegistrarAuditoria(ValidarClaveAdminRequestDto request) {
        if (request.claveAdmin() == null || request.claveAdmin().isBlank()) {
            throw new UnauthorizedOperationException("Debe ingresar la clave de Administrador para autorizar esta operación.");
        }
        if (request.justificacion() == null || request.justificacion().isBlank()) {
            throw new BusinessRuleException("Debe indicar una justificación obligatoria para la auditoría.");
        }
        if (request.tipoOperacion() == null || request.entidadAfectada() == null || request.entidadId() == null) {
            throw new BusinessRuleException("Los datos de la operación y entidad afectada son obligatorios.");
        }

        List<UsuarioSistema> administradoresActivos = usuarioSistemaRepository.findByRolAndActivoTrue(RolUsuario.ADMIN);

        UsuarioSistema adminAutorizador = administradoresActivos.stream()
                .filter(admin -> passwordEncoder.matches(request.claveAdmin(), admin.getPasswordHash()))
                .findFirst()
                .orElseThrow(() -> new UnauthorizedOperationException(
                        "Clave de Administrador inválida. La operación no fue autorizada."
                ));

        UsuarioSistema recepcionista = null;
        if (request.recepcionistaEnTurnoId() != null) {
            recepcionista = matrizPermisosService.obtenerUsuarioActivo(request.recepcionistaEnTurnoId());
        }

        AuditoriaAutorizacion auditoria = AuditoriaAutorizacion.builder()
                .adminUsuario(adminAutorizador)
                .recepcionistaEnTurno(recepcionista)
                .tipoOperacion(request.tipoOperacion())
                .entidadAfectada(request.entidadAfectada())
                .entidadId(request.entidadId())
                .valorAnterior(request.valorAnterior())
                .valorNuevo(request.valorNuevo())
                .justificacion(request.justificacion().trim())
                .fechaHora(LocalDateTime.now())
                .build();

        AuditoriaAutorizacion guardada = auditoriaAutorizacionRepository.save(auditoria);
        log.info("Autorización ADMIN registrada: operación={} sobre {}:{} autorizada por {}",
                guardada.getTipoOperacion(), guardada.getEntidadAfectada(),
                guardada.getEntidadId(), adminAutorizador.getUsername());

        return mapearADto(guardada);
    }

    /**
     * Consulta las últimas 100 autorizaciones administrativas. Exclusivo para rol ADMIN.
     */
    @Transactional(readOnly = true)
    public List<AuditoriaAutorizacionResponseDto> listarHistorialAuditorias(UUID usuarioSolicitanteId) {
        matrizPermisosService.exigirRolAdmin(
                usuarioSolicitanteId,
                "consultar la bitácora global de auditoría de autorizaciones"
        );

        return auditoriaAutorizacionRepository.findTop100ByOrderByFechaHoraDesc()
                .stream()
                .map(this::mapearADto)
                .toList();
    }

    private AuditoriaAutorizacionResponseDto mapearADto(AuditoriaAutorizacion a) {
        return new AuditoriaAutorizacionResponseDto(
                a.getId(),
                a.getAdminUsuario().getId(),
                a.getAdminUsuario().getNombreCompleto(),
                a.getRecepcionistaEnTurno() != null ? a.getRecepcionistaEnTurno().getId() : null,
                a.getRecepcionistaEnTurno() != null ? a.getRecepcionistaEnTurno().getNombreCompleto() : null,
                a.getTipoOperacion(),
                a.getEntidadAfectada(),
                a.getEntidadId(),
                a.getValorAnterior(),
                a.getValorNuevo(),
                a.getJustificacion(),
                a.getFechaHora()
        );
    }
}

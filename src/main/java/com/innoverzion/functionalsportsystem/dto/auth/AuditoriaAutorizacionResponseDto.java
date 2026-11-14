package com.innoverzion.functionalsportsystem.dto.auth;

import com.innoverzion.functionalsportsystem.domain.enums.TipoOperacionAuditoria;

import java.time.LocalDateTime;
import java.util.UUID;

public record AuditoriaAutorizacionResponseDto(
        UUID id,
        UUID adminUsuarioId,
        String adminNombreCompleto,
        UUID recepcionistaEnTurnoId,
        String recepcionistaNombreCompleto,
        TipoOperacionAuditoria tipoOperacion,
        String entidadAfectada,
        UUID entidadId,
        String valorAnterior,
        String valorNuevo,
        String justificacion,
        LocalDateTime fechaHora
) {
}

package com.innoverzion.functionalsportsystem.dto.auth;

import com.innoverzion.functionalsportsystem.domain.enums.TipoOperacionAuditoria;

import java.util.UUID;

public record ValidarClaveAdminRequestDto(
        String claveAdmin,
        UUID recepcionistaEnTurnoId,
        TipoOperacionAuditoria tipoOperacion,
        String entidadAfectada,
        UUID entidadId,
        String valorAnterior,
        String valorNuevo,
        String justificacion
) {
}

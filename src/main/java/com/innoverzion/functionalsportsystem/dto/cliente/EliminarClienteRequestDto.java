package com.innoverzion.functionalsportsystem.dto.cliente;

import java.util.UUID;

public record EliminarClienteRequestDto(
        UUID recepcionistaEnTurnoId,
        String claveAdmin,
        String motivoEliminacion
) {
}

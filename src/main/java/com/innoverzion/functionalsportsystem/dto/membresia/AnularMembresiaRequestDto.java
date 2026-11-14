package com.innoverzion.functionalsportsystem.dto.membresia;

import java.util.UUID;

public record AnularMembresiaRequestDto(
        UUID recepcionistaEnTurnoId,
        String claveAdmin,
        String motivoAnulacion
) {
}

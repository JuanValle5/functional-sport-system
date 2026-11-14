package com.innoverzion.functionalsportsystem.dto.caja;

import java.util.UUID;

public record AnularPagoRequestDto(
        UUID recepcionistaEnTurnoId,
        String claveAdmin,
        String motivoAnulacion
) {
}

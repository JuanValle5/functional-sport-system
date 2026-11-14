package com.innoverzion.functionalsportsystem.dto.membresia;

import java.time.LocalDate;
import java.util.UUID;

public record AlterarVigenciaMembresiaRequestDto(
        UUID recepcionistaEnTurnoId,
        String claveAdmin,
        LocalDate nuevaFechaVencimiento,
        String justificacion
) {
}

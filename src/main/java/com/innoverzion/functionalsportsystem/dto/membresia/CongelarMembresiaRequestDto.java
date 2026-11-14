package com.innoverzion.functionalsportsystem.dto.membresia;

import java.time.LocalDate;
import java.util.UUID;

public record CongelarMembresiaRequestDto(
        UUID recepcionistaEnTurnoId,
        String claveAdmin,
        LocalDate fechaFinEstimada,
        Boolean certificadoMedicoVerificado,
        String referenciaCertificadoMedico,
        String observaciones
) {
}

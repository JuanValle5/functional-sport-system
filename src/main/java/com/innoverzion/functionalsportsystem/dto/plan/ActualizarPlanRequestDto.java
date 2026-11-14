package com.innoverzion.functionalsportsystem.dto.plan;

import java.math.BigDecimal;
import java.util.UUID;

public record ActualizarPlanRequestDto(
        UUID adminEjecutorId,
        String nombre,
        BigDecimal precioCop,
        Integer diasAlertaAmarilla,
        Boolean activo
) {
}

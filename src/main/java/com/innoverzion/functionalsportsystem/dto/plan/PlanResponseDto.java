package com.innoverzion.functionalsportsystem.dto.plan;

import java.math.BigDecimal;
import java.util.UUID;

public record PlanResponseDto(
        UUID id,
        String codigo,
        String nombre,
        BigDecimal precioCop,
        Integer duracionDias,
        Integer maxIngresosPorDia,
        Integer maxIngresosPorSemana,
        Integer sesionesTotalesTiquetera,
        Boolean descuentaPorMarcacion,
        Integer diasAlertaAmarilla,
        Boolean permiteCongelamiento,
        Boolean activo
) {
}

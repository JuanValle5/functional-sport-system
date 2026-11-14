package com.innoverzion.functionalsportsystem.dto.caja;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record ReporteRentabilidadGlobalDto(
        LocalDate fechaInicio,
        LocalDate fechaFin,
        int cantidadTurnosAnalizados,
        BigDecimal totalEfectivo,
        BigDecimal totalNequi,
        BigDecimal totalDaviplata,
        BigDecimal totalBancolombia,
        BigDecimal totalLlaveBreB,
        BigDecimal totalGeneralFacturado,
        List<TurnoCajaResponseDto> turnos
) {
}

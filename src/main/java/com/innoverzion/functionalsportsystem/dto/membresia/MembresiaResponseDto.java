package com.innoverzion.functionalsportsystem.dto.membresia;

import com.innoverzion.functionalsportsystem.domain.enums.CanalRecaudo;
import com.innoverzion.functionalsportsystem.domain.enums.EstadoMembresia;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

public record MembresiaResponseDto(
        UUID id,
        UUID clienteId,
        String clienteNombreCompleto,
        String clienteDocumento,
        UUID planId,
        String planCodigo,
        String planNombre,
        String vendidoPorNombre,
        LocalDate fechaInicio,
        LocalDate fechaVencimientoOriginal,
        LocalDate fechaVencimientoActual,
        long diasRestantes,
        Integer sesionesTotales,
        Integer sesionesConsumidas,
        Integer sesionesRestantes,
        BigDecimal valorPagado,
        BigDecimal saldoPendiente,
        EstadoMembresia estado,
        UUID pagoId,
        CanalRecaudo canalRecaudo,
        LocalDateTime createdAt
) {
}

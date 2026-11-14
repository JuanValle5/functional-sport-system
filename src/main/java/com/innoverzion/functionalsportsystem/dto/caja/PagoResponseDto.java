package com.innoverzion.functionalsportsystem.dto.caja;

import com.innoverzion.functionalsportsystem.domain.enums.CanalRecaudo;
import com.innoverzion.functionalsportsystem.domain.enums.EstadoPago;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public record PagoResponseDto(
        UUID id,
        UUID turnoCajaId,
        UUID membresiaId,
        String planNombre,
        UUID clienteId,
        String clienteNombreCompleto,
        String clienteDocumento,
        UUID recibidoPorUsuarioId,
        String recibidoPorNombre,
        LocalDateTime fechaHoraPago,
        BigDecimal montoCop,
        CanalRecaudo canalRecaudo,
        String referenciaComprobante,
        EstadoPago estado,
        String anuladoPorAdminNombre,
        String motivoAnulacion
) {
}

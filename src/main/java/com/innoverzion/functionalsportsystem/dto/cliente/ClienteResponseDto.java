package com.innoverzion.functionalsportsystem.dto.cliente;

import com.innoverzion.functionalsportsystem.domain.enums.EstadoCliente;
import com.innoverzion.functionalsportsystem.domain.enums.TipoDocumento;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public record ClienteResponseDto(
        UUID id,
        TipoDocumento tipoDocumento,
        String numeroDocumento,
        String nombres,
        String apellidos,
        String nombreCompleto,
        String telefonoWhatsapp,
        BigDecimal saldoPendienteCaja,
        EstadoCliente estado,
        String observaciones,
        int cantidadHuellasActivas,
        LocalDateTime createdAt
) {
}

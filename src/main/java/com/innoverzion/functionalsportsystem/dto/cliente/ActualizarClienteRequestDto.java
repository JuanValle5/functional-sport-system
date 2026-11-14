package com.innoverzion.functionalsportsystem.dto.cliente;

import com.innoverzion.functionalsportsystem.domain.enums.EstadoCliente;
import com.innoverzion.functionalsportsystem.domain.enums.TipoDocumento;

public record ActualizarClienteRequestDto(
        TipoDocumento tipoDocumento,
        String nombres,
        String apellidos,
        String telefonoWhatsapp,
        EstadoCliente estado,
        String observaciones
) {
}

package com.innoverzion.functionalsportsystem.dto.cliente;

import com.innoverzion.functionalsportsystem.domain.enums.TipoDocumento;

public record RegistrarClienteRequestDto(
        TipoDocumento tipoDocumento,
        String numeroDocumento,
        String nombres,
        String apellidos,
        String telefonoWhatsapp,
        String observaciones
) {
}

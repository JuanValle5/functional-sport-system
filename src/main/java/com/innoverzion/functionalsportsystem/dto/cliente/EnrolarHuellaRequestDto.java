package com.innoverzion.functionalsportsystem.dto.cliente;

import com.innoverzion.functionalsportsystem.domain.enums.PosicionDedo;

public record EnrolarHuellaRequestDto(
        PosicionDedo posicionDedo,
        String templateBiometricoBase64,
        Integer calidadCaptura
) {
}

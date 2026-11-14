package com.innoverzion.functionalsportsystem.dto.cliente;

import com.innoverzion.functionalsportsystem.domain.enums.PosicionDedo;

import java.time.LocalDateTime;
import java.util.UUID;

public record HuellaBiometricaResponseDto(
        UUID id,
        UUID clienteId,
        PosicionDedo posicionDedo,
        Integer calidadCaptura,
        Boolean activo,
        LocalDateTime createdAt
) {
}

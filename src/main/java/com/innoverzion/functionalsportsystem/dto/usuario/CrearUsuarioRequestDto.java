package com.innoverzion.functionalsportsystem.dto.usuario;

import com.innoverzion.functionalsportsystem.domain.enums.RolUsuario;

import java.util.UUID;

public record CrearUsuarioRequestDto(
        UUID adminEjecutorId,
        String username,
        String password,
        String nombreCompleto,
        String numeroDocumento,
        RolUsuario rol
) {
}

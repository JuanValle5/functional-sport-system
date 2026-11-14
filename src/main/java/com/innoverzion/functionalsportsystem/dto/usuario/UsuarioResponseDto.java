package com.innoverzion.functionalsportsystem.dto.usuario;

import com.innoverzion.functionalsportsystem.domain.enums.RolUsuario;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

public record UsuarioResponseDto(
        UUID id,
        String username,
        String nombreCompleto,
        String numeroDocumento,
        RolUsuario rol,
        Boolean activo,
        Map<String, Boolean> matrizPermisos,
        LocalDateTime createdAt
) {
}

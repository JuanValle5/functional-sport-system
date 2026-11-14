package com.innoverzion.functionalsportsystem.dto.usuario;

import java.util.UUID;

public record CambiarEstadoUsuarioRequestDto(
        UUID adminEjecutorId,
        Boolean activo
) {
}

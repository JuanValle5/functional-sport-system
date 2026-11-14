package com.innoverzion.functionalsportsystem.dto.membresia;

import java.util.UUID;

public record ReactivarMembresiaRequestDto(
        UUID usuarioOperadorId,
        String observaciones
) {
}

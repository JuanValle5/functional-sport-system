package com.innoverzion.functionalsportsystem.dto.caja;

import java.math.BigDecimal;
import java.util.UUID;

public record CerrarTurnoCajaRequestDto(
        UUID usuarioId,
        BigDecimal efectivoFisicoDeclarado,
        String observacionesCierre
) {
}

package com.innoverzion.functionalsportsystem.dto.caja;

import com.innoverzion.functionalsportsystem.domain.enums.JornadaTurno;

import java.math.BigDecimal;
import java.util.UUID;

public record AbrirTurnoCajaRequestDto(
        UUID usuarioId,
        JornadaTurno jornada,
        BigDecimal baseInicialEfectivo
) {
}

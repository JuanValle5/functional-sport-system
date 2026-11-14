package com.innoverzion.functionalsportsystem.dto.caja;

import com.innoverzion.functionalsportsystem.domain.enums.EstadoTurnoCaja;
import com.innoverzion.functionalsportsystem.domain.enums.JornadaTurno;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

public record TurnoCajaResponseDto(
        UUID id,
        UUID usuarioId,
        String usuarioNombreCompleto,
        LocalDate fechaOperacion,
        JornadaTurno jornada,
        LocalDateTime fechaHoraApertura,
        LocalDateTime fechaHoraCierre,
        BigDecimal baseInicialEfectivo,
        BigDecimal totalEfectivo,
        BigDecimal totalNequi,
        BigDecimal totalDaviplata,
        BigDecimal totalBancolombia,
        BigDecimal totalLlaveBreB,
        BigDecimal totalGeneralRecaudo,
        BigDecimal efectivoEsperadoEnCaja,
        BigDecimal efectivoFisicoDeclarado,
        BigDecimal diferenciaEfectivo,
        EstadoTurnoCaja estado,
        String observacionesCierre
) {
}

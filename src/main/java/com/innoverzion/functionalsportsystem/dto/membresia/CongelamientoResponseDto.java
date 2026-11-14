package com.innoverzion.functionalsportsystem.dto.membresia;

import com.innoverzion.functionalsportsystem.domain.enums.EstadoCongelamiento;
import com.innoverzion.functionalsportsystem.domain.enums.MotivoCongelamiento;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

public record CongelamientoResponseDto(
        UUID id,
        UUID membresiaId,
        String registradoPorNombre,
        String autorizadoPorAdminNombre,
        LocalDate fechaInicio,
        LocalDate fechaFinEstimada,
        LocalDate fechaReanudacionReal,
        Integer diasReconocidos,
        MotivoCongelamiento motivo,
        Boolean certificadoMedicoVerificado,
        String referenciaCertificadoMedico,
        String observaciones,
        EstadoCongelamiento estado,
        LocalDateTime createdAt
) {
}

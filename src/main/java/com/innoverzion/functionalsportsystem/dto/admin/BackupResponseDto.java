package com.innoverzion.functionalsportsystem.dto.admin;

import com.innoverzion.functionalsportsystem.domain.enums.EstadoBackup;

import java.time.LocalDateTime;
import java.util.UUID;

public record BackupResponseDto(
        UUID id,
        LocalDateTime fechaHoraEjecucion,
        EstadoBackup estado,
        String nombreArchivo,
        Long tamanoBytes,
        String detalleResultado
) {
}

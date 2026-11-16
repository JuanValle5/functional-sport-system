package com.innoverzion.functionalsportsystem.controller;

import com.innoverzion.functionalsportsystem.dto.admin.BackupResponseDto;
import com.innoverzion.functionalsportsystem.dto.admin.DashboardMovilResponseDto;
import com.innoverzion.functionalsportsystem.service.BackupYDashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
public class AdminDashboardController {

    private final BackupYDashboardService backupYDashboardService;

    /**
     * Sección 6.2: Dashboard Móvil en tiempo real para el propietario (Jhorman).
     * Consolida facturación diaria por los 5 canales, turno abierto, flujo de asistencias y alertas.
     */
    @GetMapping("/dashboard-movil")
    public ResponseEntity<DashboardMovilResponseDto> obtenerDashboardMovil(
            @RequestParam UUID adminSolicitanteId
    ) {
        return ResponseEntity.ok(backupYDashboardService.obtenerDashboardMovilGerencia(adminSolicitanteId));
    }

    /**
     * Dispara una copia de seguridad cifrada (AES) bajo demanda y la registra en el historial.
     */
    @PostMapping("/backups/ejecutar")
    public ResponseEntity<BackupResponseDto> ejecutarBackupManual(
            @RequestParam UUID adminSolicitanteId
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(backupYDashboardService.ejecutarBackupManual(adminSolicitanteId));
    }

    /**
     * Consulta los últimos 20 respaldos ejecutados.
     */
    @GetMapping("/backups")
    public ResponseEntity<List<BackupResponseDto>> listarHistorialBackups(
            @RequestParam UUID adminSolicitanteId
    ) {
        return ResponseEntity.ok(backupYDashboardService.listarHistorialBackups(adminSolicitanteId));
    }
}

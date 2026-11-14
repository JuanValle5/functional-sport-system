package com.innoverzion.functionalsportsystem.controller;

import com.innoverzion.functionalsportsystem.dto.caja.*;
import com.innoverzion.functionalsportsystem.service.TurnoCajaService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/caja")
@RequiredArgsConstructor
public class TurnoCajaController {

    private final TurnoCajaService turnoCajaService;

    @PostMapping("/turnos/abrir")
    public ResponseEntity<TurnoCajaResponseDto> abrirTurno(@RequestBody AbrirTurnoCajaRequestDto request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(turnoCajaService.abrirTurno(request));
    }

    @GetMapping("/turnos/abierto")
    public ResponseEntity<TurnoCajaResponseDto> obtenerTurnoAbierto() {
        return ResponseEntity.ok(turnoCajaService.obtenerTurnoAbiertoDto());
    }

    @PostMapping("/turnos/cerrar")
    public ResponseEntity<TurnoCajaResponseDto> cerrarTurno(@RequestBody CerrarTurnoCajaRequestDto request) {
        return ResponseEntity.ok(turnoCajaService.cerrarTurnoActual(request));
    }

    @GetMapping("/turnos/{turnoId}/pagos")
    public ResponseEntity<List<PagoResponseDto>> listarPagosDeTurno(@PathVariable UUID turnoId) {
        return ResponseEntity.ok(turnoCajaService.listarPagosDeTurno(turnoId));
    }

    @PostMapping("/pagos/{pagoId}/anular")
    public ResponseEntity<PagoResponseDto> anularPagoConClaveAdmin(
            @PathVariable UUID pagoId,
            @RequestBody AnularPagoRequestDto request
    ) {
        return ResponseEntity.ok(turnoCajaService.anularPagoConClaveAdmin(pagoId, request));
    }

    /**
     * Reporte global de rentabilidad discriminado por los 5 canales de pago.
     * Exclusivo para el perfil ADMIN (Sección 3.5).
     */
    @GetMapping("/reportes/rentabilidad")
    public ResponseEntity<ReporteRentabilidadGlobalDto> generarReporteRentabilidad(
            @RequestParam UUID adminSolicitanteId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaInicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaFin
    ) {
        return ResponseEntity.ok(
                turnoCajaService.generarReporteRentabilidadGlobal(adminSolicitanteId, fechaInicio, fechaFin)
        );
    }
}

package com.innoverzion.functionalsportsystem.controller;

import com.innoverzion.functionalsportsystem.dto.acceso.*;
import com.innoverzion.functionalsportsystem.service.BiometricCacheService;
import com.innoverzion.functionalsportsystem.service.ControlAccesoService;
import com.innoverzion.functionalsportsystem.service.MonitorAccesoSseService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/acceso")
@RequiredArgsConstructor
public class ControlAccesoController {

    private final ControlAccesoService controlAccesoService;
    private final MonitorAccesoSseService monitorAccesoSseService;
    private final BiometricCacheService biometricCacheService;

    /**
     * Endpoint principal invocado al colocar el dedo en el lector USB ZKTeco ZK-9500.
     * Evalúa en milisegundos el semáforo (VERDE, AMARILLO, ROJO) y notifica a las pantallas.
     */
    @PostMapping("/validar-huella")
    public ResponseEntity<ResultadoValidacionAccesoDto> validarPorHuella(
            @RequestBody ValidarHuellaRequestDto request
    ) {
        return ResponseEntity.ok(controlAccesoService.validarAccesoPorHuella(request));
    }

    /**
     * Validación por número de documento en mostrador.
     */
    @PostMapping("/validar-documento")
    public ResponseEntity<ResultadoValidacionAccesoDto> validarPorDocumento(
            @RequestBody ValidarDocumentoRequestDto request
    ) {
        return ResponseEntity.ok(controlAccesoService.validarAccesoPorDocumento(request));
    }

    /**
     * Stream en tiempo real (Server-Sent Events) al que se suscriben la pantalla del recepcionista
     * y la pantalla de visualización para el cliente (Sección 5.3 Fase 1).
     */
    @GetMapping(value = "/monitor/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter conectarPantallaMonitorEnVivo() {
        return monitorAccesoSseService.suscribirPantallaMonitor();
    }

    /**
     * Últimas 50 marcaciones registradas para alimentar la bitácora del monitor de recepción.
     */
    @GetMapping("/historial-reciente")
    public ResponseEntity<List<ResultadoValidacionAccesoDto>> listarHistorialReciente() {
        return ResponseEntity.ok(controlAccesoService.listarUltimosAccesosMonitor());
    }

    /**
     * Métricas operativas del día actual (ingresos autorizados, alertas amarillas, bloqueos rojos).
     */
    @GetMapping("/resumen-dia")
    public ResponseEntity<ResumenAsistenciaDiaDto> obtenerResumenDia() {
        return ResponseEntity.ok(controlAccesoService.obtenerResumenAsistenciaHoy());
    }

    /**
     * Fuerza la recarga en memoria RAM de todas las plantillas biométricas activas desde PostgreSQL.
     */
    @PostMapping("/cache-biometrica/sincronizar")
    public ResponseEntity<Map<String, Object>> sincronizarCacheBiometrica() {
        biometricCacheService.sincronizarCacheDesdeBaseDeDatos();
        return ResponseEntity.ok(Map.of(
                "mensaje", "Caché biométrica sincronizada en memoria RAM.",
                "plantillasEnMemoria", biometricCacheService.obtenerCantidadPlantillasEnMemoria()
        ));
    }
}

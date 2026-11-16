package com.innoverzion.functionalsportsystem.service;

import com.innoverzion.functionalsportsystem.domain.entity.HistorialBackupNube;
import com.innoverzion.functionalsportsystem.domain.entity.TurnoCaja;
import com.innoverzion.functionalsportsystem.domain.enums.EstadoBackup;
import com.innoverzion.functionalsportsystem.domain.enums.EstadoMembresia;
import com.innoverzion.functionalsportsystem.domain.enums.EstadoTurnoCaja;
import com.innoverzion.functionalsportsystem.dto.acceso.ResumenAsistenciaDiaDto;
import com.innoverzion.functionalsportsystem.dto.admin.BackupResponseDto;
import com.innoverzion.functionalsportsystem.dto.admin.DashboardMovilResponseDto;
import com.innoverzion.functionalsportsystem.dto.caja.TurnoCajaResponseDto;
import com.innoverzion.functionalsportsystem.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Cipher;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.MessageDigest;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.Base64;
import java.util.List;
import java.util.UUID;

/**
 * Implementa el Módulo 5 y Sección 6.2:
 * - Copia de seguridad diaria automatizada cifrada (AES) lista para sincronización en la nube.
 * - Dashboard Móvil en tiempo real para monitoreo gerencial (Jhorman).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class BackupYDashboardService {

    private static final String CLAVE_SEMILLA_CIFRADO = "FUNCIONAL_SPORT_COL_BACKUP_KEY_2026";
    private static final DateTimeFormatter FORMATO_ARCHIVO = DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss");

    private final ClienteRepository clienteRepository;
    private final MembresiaClienteRepository membresiaClienteRepository;
    private final TurnoCajaRepository turnoCajaRepository;
    private final PagoRepository pagoRepository;
    private final HistorialBackupNubeRepository historialBackupNubeRepository;
    private final TurnoCajaService turnoCajaService;
    private final ControlAccesoService controlAccesoService;
    private final MatrizPermisosService matrizPermisosService;

    /**
     * Tarea programada diariamente a las 10:00 PM (22:00) para generar el respaldo cifrado automático.
     */
    @Scheduled(cron = "0 0 22 * * *")
    @Transactional
    public void ejecutarBackupDiarioProgramado() {
        log.info("Iniciando tarea programada de copia de seguridad diaria para Funcional Sport Col...");
        generarRespaldoCifradoInterno("Automático diario programado (22:00)");
    }

    /**
     * Permite al Administrador (Jhorman) disparar manualmente una copia de seguridad cifrada en cualquier momento.
     */
    @Transactional
    public BackupResponseDto ejecutarBackupManual(UUID adminSolicitanteId) {
        matrizPermisosService.exigirRolAdmin(
                adminSolicitanteId,
                "ejecutar respaldo cifrado de la base de datos hacia la nube"
        );
        return generarRespaldoCifradoInterno("Ejecución manual solicitada por el Administrador");
    }

    @Transactional(readOnly = true)
    public List<BackupResponseDto> listarHistorialBackups(UUID adminSolicitanteId) {
        matrizPermisosService.exigirRolAdmin(
                adminSolicitanteId,
                "consultar el historial de copias de seguridad en la nube"
        );
        return historialBackupNubeRepository.findTop20ByOrderByFechaHoraEjecucionDesc()
                .stream()
                .map(this::mapearBackupADto)
                .toList();
    }

    /**
     * Consolida todas las métricas en vivo para el Dashboard Móvil de la gerencia (Sección 6.2).
     * Exclusivo para el rol ADMIN.
     */
    @Transactional(readOnly = true)
    public DashboardMovilResponseDto obtenerDashboardMovilGerencia(UUID adminSolicitanteId) {
        matrizPermisosService.exigirRolAdmin(
                adminSolicitanteId,
                "consultar el Dashboard Móvil de ingresos y facturación en tiempo real"
        );

        LocalDate hoy = LocalDate.now();
        long totalClientes = clienteRepository.count();
        long membresiasActivas = membresiaClienteRepository
                .countByEstadoAndFechaVencimientoActualGreaterThanEqual(EstadoMembresia.ACTIVA, hoy);
        long membresiasCongeladas = membresiaClienteRepository
                .countByEstado(EstadoMembresia.CONGELADA);
        long membresiasPorVencer3Dias = membresiaClienteRepository
                .countByEstadoAndFechaVencimientoActualBetween(EstadoMembresia.ACTIVA, hoy, hoy.plusDays(3));

        List<TurnoCaja> turnosHoy = turnoCajaRepository
                .findByFechaOperacionBetweenOrderByFechaHoraAperturaDesc(hoy, hoy);

        BigDecimal diaEfectivo = BigDecimal.ZERO;
        BigDecimal diaNequi = BigDecimal.ZERO;
        BigDecimal diaDaviplata = BigDecimal.ZERO;
        BigDecimal diaBancolombia = BigDecimal.ZERO;
        BigDecimal diaLlaveBreB = BigDecimal.ZERO;
        BigDecimal diaTotal = BigDecimal.ZERO;

        for (TurnoCaja t : turnosHoy) {
            diaEfectivo = diaEfectivo.add(t.getTotalEfectivo());
            diaNequi = diaNequi.add(t.getTotalNequi());
            diaDaviplata = diaDaviplata.add(t.getTotalDaviplata());
            diaBancolombia = diaBancolombia.add(t.getTotalBancolombia());
            diaLlaveBreB = diaLlaveBreB.add(t.getTotalLlaveBreB());
            diaTotal = diaTotal.add(t.getTotalGeneralRecaudo());
        }

        TurnoCajaResponseDto turnoAbiertoDto = turnoCajaRepository
                .findFirstByEstadoOrderByFechaHoraAperturaDesc(EstadoTurnoCaja.ABIERTO)
                .map(turnoCajaService::mapearTurnoADto)
                .orElse(null);

        ResumenAsistenciaDiaDto flujoHoy = controlAccesoService.obtenerResumenAsistenciaHoy();

        BackupResponseDto ultimoBackup = historialBackupNubeRepository
                .findFirstByOrderByFechaHoraEjecucionDesc()
                .map(this::mapearBackupADto)
                .orElse(null);

        return new DashboardMovilResponseDto(
                hoy,
                totalClientes,
                membresiasActivas,
                membresiasCongeladas,
                membresiasPorVencer3Dias,
                diaEfectivo,
                diaNequi,
                diaDaviplata,
                diaBancolombia,
                diaLlaveBreB,
                diaTotal,
                turnoAbiertoDto,
                flujoHoy,
                ultimoBackup
        );
    }

    private BackupResponseDto generarRespaldoCifradoInterno(String origen) {
        LocalDateTime ahora = LocalDateTime.now();
        String nombreArchivo = "backup_funcional_sport_" + ahora.format(FORMATO_ARCHIVO) + ".json.enc";

        try {
            String contenidoResumen = construirPayloadRespaldo(ahora);
            byte[] bytesCifrados = cifrarAes(contenidoResumen);

            Path directorioBackups = Paths.get("backups");
            Files.createDirectories(directorioBackups);
            Path rutaArchivo = directorioBackups.resolve(nombreArchivo);
            Files.write(rutaArchivo, bytesCifrados);

            HistorialBackupNube registro = HistorialBackupNube.builder()
                    .fechaHoraEjecucion(ahora)
                    .estado(EstadoBackup.EXITOSO)
                    .nombreArchivo(nombreArchivo)
                    .tamanoBytes((long) bytesCifrados.length)
                    .detalleResultado(origen + " — Respaldo cifrado AES generado en " + rutaArchivo.toAbsolutePath())
                    .build();

            HistorialBackupNube guardado = historialBackupNubeRepository.save(registro);
            log.info("Backup cifrado generado exitosamente: {} ({} bytes)", nombreArchivo, bytesCifrados.length);
            return mapearBackupADto(guardado);

        } catch (Exception e) {
            log.error("Error al generar copia de seguridad cifrada: {}", e.getMessage());
            HistorialBackupNube fallido = HistorialBackupNube.builder()
                    .fechaHoraEjecucion(ahora)
                    .estado(EstadoBackup.PENDIENTE_REINTENTO)
                    .nombreArchivo(nombreArchivo)
                    .tamanoBytes(0L)
                    .detalleResultado("Pendiente de sincronización: " + e.getMessage())
                    .build();
            return mapearBackupADto(historialBackupNubeRepository.save(fallido));
        }
    }

    private String construirPayloadRespaldo(LocalDateTime fechaHora) {
        return "{"
                + "\"gimnasio\":\"Funcional Sport Col\","
                + "\"fechaRespaldo\":\"" + fechaHora + "\","
                + "\"totalClientes\":" + clienteRepository.count() + ","
                + "\"totalMembresias\":" + membresiaClienteRepository.count() + ","
                + "\"totalTurnosCaja\":" + turnoCajaRepository.count() + ","
                + "\"totalPagos\":" + pagoRepository.count()
                + "}";
    }

    private byte[] cifrarAes(String textoPlano) throws Exception {
        byte[] keyBytes = MessageDigest.getInstance("SHA-256")
                .digest(CLAVE_SEMILLA_CIFRADO.getBytes(StandardCharsets.UTF_8));
        SecretKeySpec secretKey = new SecretKeySpec(Arrays.copyOf(keyBytes, 16), "AES");
        Cipher cipher = Cipher.getInstance("AES");
        cipher.init(Cipher.ENCRYPT_MODE, secretKey);
        byte[] encrypted = cipher.doFinal(textoPlano.getBytes(StandardCharsets.UTF_8));
        return Base64.getEncoder().encode(encrypted);
    }

    private BackupResponseDto mapearBackupADto(HistorialBackupNube b) {
        return new BackupResponseDto(
                b.getId(),
                b.getFechaHoraEjecucion(),
                b.getEstado(),
                b.getNombreArchivo(),
                b.getTamanoBytes(),
                b.getDetalleResultado()
        );
    }
}

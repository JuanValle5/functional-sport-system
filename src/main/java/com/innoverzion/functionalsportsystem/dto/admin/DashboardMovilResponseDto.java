package com.innoverzion.functionalsportsystem.dto.admin;

import com.innoverzion.functionalsportsystem.dto.acceso.ResumenAsistenciaDiaDto;
import com.innoverzion.functionalsportsystem.dto.caja.TurnoCajaResponseDto;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Sección 6.2: Módulo Dashboard Móvil para monitoreo en tiempo real de ingresos,
 * facturación diaria y estado de socios desde el celular del propietario (Jhorman).
 */
public record DashboardMovilResponseDto(
        LocalDate fechaConsulta,
        long totalClientesRegistrados,
        long totalMembresiasActivasVigentes,
        long totalMembresiasCongeladas,
        long totalMembresiasPorVencerEn3Dias,
        BigDecimal facturacionDiaEfectivo,
        BigDecimal facturacionDiaNequi,
        BigDecimal facturacionDiaDaviplata,
        BigDecimal facturacionDiaBancolombia,
        BigDecimal facturacionDiaLlaveBreB,
        BigDecimal facturacionDiaTotalCop,
        TurnoCajaResponseDto turnoActualAbierto,
        ResumenAsistenciaDiaDto flujoAsistenciasHoy,
        BackupResponseDto ultimoBackupNube
) {
}

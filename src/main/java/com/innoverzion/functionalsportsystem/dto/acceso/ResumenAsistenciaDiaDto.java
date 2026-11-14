package com.innoverzion.functionalsportsystem.dto.acceso;

import java.time.LocalDate;

public record ResumenAsistenciaDiaDto(
        LocalDate fecha,
        long totalIngresosAutorizadosHoy,
        long totalVerdesHoy,
        long totalAlertasAmarillasHoy,
        long totalBloqueosRojosHoy,
        int plantillasBiometricasEnMemoria
) {
}

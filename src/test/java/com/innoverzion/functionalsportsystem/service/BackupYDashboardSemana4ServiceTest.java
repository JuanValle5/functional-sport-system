package com.innoverzion.functionalsportsystem.service;

import com.innoverzion.functionalsportsystem.domain.entity.HistorialBackupNube;
import com.innoverzion.functionalsportsystem.domain.entity.TurnoCaja;
import com.innoverzion.functionalsportsystem.domain.entity.UsuarioSistema;
import com.innoverzion.functionalsportsystem.domain.enums.*;
import com.innoverzion.functionalsportsystem.dto.acceso.ResumenAsistenciaDiaDto;
import com.innoverzion.functionalsportsystem.dto.admin.BackupResponseDto;
import com.innoverzion.functionalsportsystem.dto.admin.DashboardMovilResponseDto;
import com.innoverzion.functionalsportsystem.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BackupYDashboardSemana4ServiceTest {

    @Mock
    private ClienteRepository clienteRepository;
    @Mock
    private MembresiaClienteRepository membresiaClienteRepository;
    @Mock
    private TurnoCajaRepository turnoCajaRepository;
    @Mock
    private PagoRepository pagoRepository;
    @Mock
    private HistorialBackupNubeRepository historialBackupNubeRepository;
    @Mock
    private TurnoCajaService turnoCajaService;
    @Mock
    private ControlAccesoService controlAccesoService;
    @Mock
    private MatrizPermisosService matrizPermisosService;

    private BackupYDashboardService backupYDashboardService;

    @BeforeEach
    void setUp() {
        backupYDashboardService = new BackupYDashboardService(
                clienteRepository,
                membresiaClienteRepository,
                turnoCajaRepository,
                pagoRepository,
                historialBackupNubeRepository,
                turnoCajaService,
                controlAccesoService,
                matrizPermisosService
        );
    }

    @Test
    void dashboardMovilConsolidaMetricasDiariasParaElAdministrador() {
        UUID adminId = UUID.randomUUID();
        UsuarioSistema admin = UsuarioSistema.builder()
                .id(adminId)
                .username("jhorman")
                .rol(RolUsuario.ADMIN)
                .activo(true)
                .build();

        TurnoCaja turnoManana = TurnoCaja.builder()
                .jornada(JornadaTurno.MANANA)
                .totalEfectivo(new BigDecimal("160000.00"))
                .totalNequi(new BigDecimal("80000.00"))
                .totalDaviplata(new BigDecimal("50000.00"))
                .totalBancolombia(new BigDecimal("70000.00"))
                .totalLlaveBreB(new BigDecimal("80000.00"))
                .totalGeneralRecaudo(new BigDecimal("440000.00"))
                .build();

        when(matrizPermisosService.exigirRolAdmin(any(), any())).thenReturn(admin);
        when(clienteRepository.count()).thenReturn(80L);
        when(membresiaClienteRepository.countByEstadoAndFechaVencimientoActualGreaterThanEqual(
                any(), any()
        )).thenReturn(72L);
        when(membresiaClienteRepository.countByEstado(EstadoMembresia.CONGELADA)).thenReturn(2L);
        when(membresiaClienteRepository.countByEstadoAndFechaVencimientoActualBetween(
                any(), any(), any()
        )).thenReturn(6L);
        when(turnoCajaRepository.findByFechaOperacionBetweenOrderByFechaHoraAperturaDesc(
                any(), any()
        )).thenReturn(List.of(turnoManana));
        when(turnoCajaRepository.findFirstByEstadoOrderByFechaHoraAperturaDesc(EstadoTurnoCaja.ABIERTO))
                .thenReturn(Optional.empty());
        when(controlAccesoService.obtenerResumenAsistenciaHoy()).thenReturn(
                new ResumenAsistenciaDiaDto(LocalDate.now(), 45L, 40L, 5L, 3L, 80)
        );
        when(historialBackupNubeRepository.findFirstByOrderByFechaHoraEjecucionDesc())
                .thenReturn(Optional.empty());

        DashboardMovilResponseDto dash = backupYDashboardService.obtenerDashboardMovilGerencia(adminId);

        assertEquals(80L, dash.totalClientesRegistrados());
        assertEquals(72L, dash.totalMembresiasActivasVigentes());
        assertEquals(6L, dash.totalMembresiasPorVencerEn3Dias());
        assertEquals(new BigDecimal("440000.00"), dash.facturacionDiaTotalCop());
        assertEquals(new BigDecimal("80000.00"), dash.facturacionDiaLlaveBreB());
        assertEquals(45L, dash.flujoAsistenciasHoy().totalIngresosAutorizadosHoy());
    }

    @Test
    void ejecutarBackupManualGeneraArchivoCifradoAesYRegistraEstadoExitoso() {
        UUID adminId = UUID.randomUUID();
        UsuarioSistema admin = UsuarioSistema.builder()
                .id(adminId)
                .username("jhorman")
                .rol(RolUsuario.ADMIN)
                .activo(true)
                .build();

        when(matrizPermisosService.exigirRolAdmin(any(), any())).thenReturn(admin);
        when(clienteRepository.count()).thenReturn(80L);
        when(membresiaClienteRepository.count()).thenReturn(85L);
        when(turnoCajaRepository.count()).thenReturn(14L);
        when(pagoRepository.count()).thenReturn(85L);
        when(historialBackupNubeRepository.save(any(HistorialBackupNube.class))).thenAnswer(inv -> {
            HistorialBackupNube b = inv.getArgument(0);
            b.setId(UUID.randomUUID());
            return b;
        });

        BackupResponseDto backup = backupYDashboardService.ejecutarBackupManual(adminId);

        assertNotNull(backup.id());
        assertEquals(EstadoBackup.EXITOSO, backup.estado());
        assertTrue(backup.nombreArchivo().endsWith(".json.enc"));
        assertTrue(backup.tamanoBytes() > 0);
    }
}

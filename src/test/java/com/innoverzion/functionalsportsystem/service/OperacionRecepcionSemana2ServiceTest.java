package com.innoverzion.functionalsportsystem.service;

import com.innoverzion.functionalsportsystem.domain.entity.*;
import com.innoverzion.functionalsportsystem.domain.enums.*;
import com.innoverzion.functionalsportsystem.dto.auth.AuditoriaAutorizacionResponseDto;
import com.innoverzion.functionalsportsystem.dto.caja.CerrarTurnoCajaRequestDto;
import com.innoverzion.functionalsportsystem.dto.caja.TurnoCajaResponseDto;
import com.innoverzion.functionalsportsystem.dto.membresia.CongelamientoResponseDto;
import com.innoverzion.functionalsportsystem.dto.membresia.CongelarMembresiaRequestDto;
import com.innoverzion.functionalsportsystem.dto.membresia.MembresiaResponseDto;
import com.innoverzion.functionalsportsystem.dto.membresia.VenderMembresiaRequestDto;
import com.innoverzion.functionalsportsystem.exception.BusinessRuleException;
import com.innoverzion.functionalsportsystem.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OperacionRecepcionSemana2ServiceTest {

    @Mock
    private MembresiaClienteRepository membresiaClienteRepository;
    @Mock
    private CongelamientoMembresiaRepository congelamientoMembresiaRepository;
    @Mock
    private PagoRepository pagoRepository;
    @Mock
    private TurnoCajaRepository turnoCajaRepository;
    @Mock
    private UsuarioSistemaRepository usuarioSistemaRepository;
    @Mock
    private ClienteService clienteService;
    @Mock
    private PlanService planService;
    @Mock
    private MatrizPermisosService matrizPermisosService;
    @Mock
    private AutorizacionAdminService autorizacionAdminService;

    private TurnoCajaService turnoCajaService;
    private MembresiaService membresiaService;

    @BeforeEach
    void setUp() {
        turnoCajaService = new TurnoCajaService(
                turnoCajaRepository,
                pagoRepository,
                usuarioSistemaRepository,
                matrizPermisosService,
                autorizacionAdminService
        );
        membresiaService = new MembresiaService(
                membresiaClienteRepository,
                congelamientoMembresiaRepository,
                pagoRepository,
                usuarioSistemaRepository,
                clienteService,
                planService,
                turnoCajaService,
                matrizPermisosService,
                autorizacionAdminService
        );
    }

    @Test
    void renovacionConCorteDinamicoIniciaElDiaDePagoEfectivoCuandoEstabaVencida() {
        UUID clienteId = UUID.randomUUID();
        UUID vendedorId = UUID.randomUUID();
        UUID turnoId = UUID.randomUUID();

        UsuarioSistema recepcionista = UsuarioSistema.builder()
                .id(vendedorId)
                .username("recepcion_manana")
                .nombreCompleto("Recepcionista Mañana")
                .rol(RolUsuario.RECEPCIONISTA)
                .activo(true)
                .build();

        Cliente cliente = Cliente.builder()
                .id(clienteId)
                .tipoDocumento(TipoDocumento.CC)
                .numeroDocumento("1088001122")
                .nombres("Carlos")
                .apellidos("Ramírez")
                .telefonoWhatsapp("3001234567")
                .estado(EstadoCliente.ACTIVO)
                .build();

        Plan planMes3xSem = Plan.builder()
                .id(UUID.randomUUID())
                .codigo("MES_3XSEM")
                .nombre("Mensualidad - 3 días por semana")
                .precioCop(new BigDecimal("70000.00"))
                .duracionDias(30)
                .maxIngresosPorDia(1)
                .maxIngresosPorSemana(3)
                .sesionesTotalesTiquetera(12)
                .descuentaPorMarcacion(true)
                .permiteCongelamiento(true)
                .activo(true)
                .build();

        // Membresía anterior que venció hace 5 días (ej. venció el día 10 y hoy es día 15)
        MembresiaCliente membresiaVencida = MembresiaCliente.builder()
                .id(UUID.randomUUID())
                .cliente(cliente)
                .plan(planMes3xSem)
                .vendidoPorUsuario(recepcionista)
                .fechaInicio(LocalDate.now().minusDays(35))
                .fechaVencimientoOriginal(LocalDate.now().minusDays(5))
                .fechaVencimientoActual(LocalDate.now().minusDays(5))
                .estado(EstadoMembresia.ACTIVA)
                .build();

        TurnoCaja turnoAbierto = TurnoCaja.builder()
                .id(turnoId)
                .usuario(recepcionista)
                .fechaOperacion(LocalDate.now())
                .jornada(JornadaTurno.MANANA)
                .baseInicialEfectivo(new BigDecimal("50000.00"))
                .estado(EstadoTurnoCaja.ABIERTO)
                .build();

        when(matrizPermisosService.obtenerUsuarioActivo(vendedorId)).thenReturn(recepcionista);
        when(clienteService.obtenerEntidadPorId(clienteId)).thenReturn(cliente);
        when(planService.obtenerPlanActivoPorCodigo("MES_3XSEM")).thenReturn(planMes3xSem);
        when(membresiaClienteRepository.findFirstByClienteIdAndEstadoOrderByFechaVencimientoActualDesc(
                clienteId, EstadoMembresia.ACTIVA
        )).thenReturn(Optional.of(membresiaVencida));

        when(membresiaClienteRepository.save(any(MembresiaCliente.class))).thenAnswer(inv -> {
            MembresiaCliente m = inv.getArgument(0);
            if (m.getId() == null) {
                m.setId(UUID.randomUUID());
            }
            return m;
        });

        when(turnoCajaRepository.findFirstByEstadoOrderByFechaHoraAperturaDesc(EstadoTurnoCaja.ABIERTO))
                .thenReturn(Optional.of(turnoAbierto));
        when(pagoRepository.save(any(Pago.class))).thenAnswer(inv -> {
            Pago p = inv.getArgument(0);
            p.setId(UUID.randomUUID());
            return p;
        });
        when(pagoRepository.findByTurnoCajaIdAndEstadoOrderByFechaHoraPagoDesc(turnoId, EstadoPago.ASENTADO))
                .thenReturn(List.of());

        VenderMembresiaRequestDto request = new VenderMembresiaRequestDto(
                clienteId,
                "MES_3XSEM",
                vendedorId,
                CanalRecaudo.LLAVE_BRE_B,
                "BREB-998877",
                "Renovación mensual 3xSemana"
        );

        MembresiaResponseDto resultado = membresiaService.venderORenovarMembresia(request);

        assertEquals(EstadoMembresia.VENCIDA, membresiaVencida.getEstado());
        assertEquals(LocalDate.now(), resultado.fechaInicio());
        assertEquals(LocalDate.now().plusDays(30), resultado.fechaVencimientoActual());
        assertEquals(12, resultado.sesionesRestantes());
        assertEquals(new BigDecimal("70000.00"), resultado.valorPagado());
        assertEquals(CanalRecaudo.LLAVE_BRE_B, resultado.canalRecaudo());
    }

    @Test
    void congelamientoExigeObligatoriamenteCertificadoMedico() {
        UUID membresiaId = UUID.randomUUID();
        Plan planFull = Plan.builder()
                .nombre("Mensualidad - Todos los días")
                .permiteCongelamiento(true)
                .build();

        MembresiaCliente membresia = MembresiaCliente.builder()
                .id(membresiaId)
                .plan(planFull)
                .estado(EstadoMembresia.ACTIVA)
                .fechaVencimientoActual(LocalDate.now().plusDays(20))
                .build();

        when(membresiaClienteRepository.findById(membresiaId)).thenReturn(Optional.of(membresia));

        CongelarMembresiaRequestDto requestSinCertificado = new CongelarMembresiaRequestDto(
                UUID.randomUUID(),
                "ADMIN_JHORMAN_2026",
                LocalDate.now().plusDays(10),
                false,
                "",
                "Viaje personal"
        );

        assertThrows(BusinessRuleException.class, () ->
                membresiaService.congelarMembresiaPorSalud(membresiaId, requestSinCertificado)
        );
    }

    @Test
    void congelamientoConCertificadoMedicoYClaveAdminPausaLaMembresia() {
        UUID membresiaId = UUID.randomUUID();
        UUID recepcionistaId = UUID.randomUUID();
        UUID adminId = UUID.randomUUID();

        Plan planFull = Plan.builder()
                .nombre("Mensualidad - Todos los días")
                .permiteCongelamiento(true)
                .build();

        MembresiaCliente membresia = MembresiaCliente.builder()
                .id(membresiaId)
                .plan(planFull)
                .estado(EstadoMembresia.ACTIVA)
                .fechaVencimientoActual(LocalDate.now().plusDays(20))
                .build();

        UsuarioSistema recepcionista = UsuarioSistema.builder()
                .id(recepcionistaId)
                .nombreCompleto("Recepcionista Mañana")
                .rol(RolUsuario.RECEPCIONISTA)
                .activo(true)
                .build();

        UsuarioSistema admin = UsuarioSistema.builder()
                .id(adminId)
                .nombreCompleto("Jhorman Admin")
                .rol(RolUsuario.ADMIN)
                .activo(true)
                .build();

        when(membresiaClienteRepository.findById(membresiaId)).thenReturn(Optional.of(membresia));
        when(matrizPermisosService.obtenerUsuarioActivo(recepcionistaId)).thenReturn(recepcionista);
        when(autorizacionAdminService.validarClaveYRegistrarAuditoria(any())).thenReturn(
                new AuditoriaAutorizacionResponseDto(
                        UUID.randomUUID(), adminId, "Jhorman Admin", recepcionistaId,
                        "Recepcionista Mañana", TipoOperacionAuditoria.CONGELAMIENTO_MEDICO,
                        "MEMBRESIAS_CLIENTE", membresiaId, "ACTIVA", "CONGELADA",
                        "Certificado EPS Sura", LocalDateTime.now()
                )
        );
        when(usuarioSistemaRepository.findById(adminId)).thenReturn(Optional.of(admin));
        when(congelamientoMembresiaRepository.save(any(CongelamientoMembresia.class))).thenAnswer(inv -> {
            CongelamientoMembresia c = inv.getArgument(0);
            c.setId(UUID.randomUUID());
            return c;
        });

        CongelarMembresiaRequestDto requestValido = new CongelarMembresiaRequestDto(
                recepcionistaId,
                "ADMIN_JHORMAN_2026",
                LocalDate.now().plusDays(8),
                true,
                "EPS-SURA-INC-2026-445",
                "Incapacidad médica por esguince"
        );

        CongelamientoResponseDto respuesta = membresiaService.congelarMembresiaPorSalud(membresiaId, requestValido);

        assertEquals(EstadoMembresia.CONGELADA, membresia.getEstado());
        assertEquals(MotivoCongelamiento.SALUD_ENFERMEDAD, respuesta.motivo());
        assertTrue(respuesta.certificadoMedicoVerificado());
        assertEquals("EPS-SURA-INC-2026-445", respuesta.referenciaCertificadoMedico());
    }

    @Test
    void cierreDeTurnoConsolidaLosCincoCanalesYCalculaCuadreDeEfectivo() {
        UUID turnoId = UUID.randomUUID();
        UUID recepcionistaId = UUID.randomUUID();

        UsuarioSistema recepcionista = UsuarioSistema.builder()
                .id(recepcionistaId)
                .nombreCompleto("Recepcionista Tarde")
                .rol(RolUsuario.RECEPCIONISTA)
                .activo(true)
                .build();

        TurnoCaja turno = TurnoCaja.builder()
                .id(turnoId)
                .usuario(recepcionista)
                .fechaOperacion(LocalDate.now())
                .jornada(JornadaTurno.TARDE)
                .baseInicialEfectivo(new BigDecimal("100000.00"))
                .estado(EstadoTurnoCaja.ABIERTO)
                .build();

        List<Pago> pagosDelTurno = List.of(
                Pago.builder().montoCop(new BigDecimal("80000.00")).canalRecaudo(CanalRecaudo.EFECTIVO).estado(EstadoPago.ASENTADO).build(),
                Pago.builder().montoCop(new BigDecimal("10000.00")).canalRecaudo(CanalRecaudo.NEQUI).estado(EstadoPago.ASENTADO).build(),
                Pago.builder().montoCop(new BigDecimal("50000.00")).canalRecaudo(CanalRecaudo.DAVIPLATA).estado(EstadoPago.ASENTADO).build(),
                Pago.builder().montoCop(new BigDecimal("80000.00")).canalRecaudo(CanalRecaudo.BANCOLOMBIA).estado(EstadoPago.ASENTADO).build(),
                Pago.builder().montoCop(new BigDecimal("70000.00")).canalRecaudo(CanalRecaudo.LLAVE_BRE_B).estado(EstadoPago.ASENTADO).build()
        );

        when(matrizPermisosService.obtenerUsuarioActivo(recepcionistaId)).thenReturn(recepcionista);
        when(turnoCajaRepository.findFirstByEstadoOrderByFechaHoraAperturaDesc(EstadoTurnoCaja.ABIERTO))
                .thenReturn(Optional.of(turno));
        when(pagoRepository.findByTurnoCajaIdAndEstadoOrderByFechaHoraPagoDesc(turnoId, EstadoPago.ASENTADO))
                .thenReturn(pagosDelTurno);
        when(turnoCajaRepository.save(any(TurnoCaja.class))).thenAnswer(inv -> inv.getArgument(0));

        // Base ($100.000) + Efectivo ($80.000) = $180.000 esperado en caja física
        CerrarTurnoCajaRequestDto cierreRequest = new CerrarTurnoCajaRequestDto(
                recepcionistaId,
                new BigDecimal("180000.00"),
                "Cierre de turno tarde cuadrado sin novedades"
        );

        TurnoCajaResponseDto acta = turnoCajaService.cerrarTurnoActual(cierreRequest);

        assertEquals(EstadoTurnoCaja.CERRADO, acta.estado());
        assertEquals(new BigDecimal("80000.00"), acta.totalEfectivo());
        assertEquals(new BigDecimal("10000.00"), acta.totalNequi());
        assertEquals(new BigDecimal("50000.00"), acta.totalDaviplata());
        assertEquals(new BigDecimal("80000.00"), acta.totalBancolombia());
        assertEquals(new BigDecimal("70000.00"), acta.totalLlaveBreB());
        assertEquals(new BigDecimal("290000.00"), acta.totalGeneralRecaudo());
        assertEquals(new BigDecimal("180000.00"), acta.efectivoEsperadoEnCaja());
        assertEquals(0, acta.diferenciaEfectivo().compareTo(BigDecimal.ZERO));
    }
}

package com.innoverzion.functionalsportsystem.service;

import com.innoverzion.functionalsportsystem.domain.entity.*;
import com.innoverzion.functionalsportsystem.domain.enums.*;
import com.innoverzion.functionalsportsystem.dto.acceso.ResultadoValidacionAccesoDto;
import com.innoverzion.functionalsportsystem.dto.acceso.ValidarHuellaRequestDto;
import com.innoverzion.functionalsportsystem.repository.ClienteRepository;
import com.innoverzion.functionalsportsystem.repository.MembresiaClienteRepository;
import com.innoverzion.functionalsportsystem.repository.RegistroAccesoRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.Base64;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ControlAccesoBiometricoSemana3ServiceTest {

    @Mock
    private BiometricCacheService biometricCacheService;
    @Mock
    private ClienteRepository clienteRepository;
    @Mock
    private MembresiaClienteRepository membresiaClienteRepository;
    @Mock
    private RegistroAccesoRepository registroAccesoRepository;
    @Mock
    private MonitorAccesoSseService monitorAccesoSseService;

    private ControlAccesoService controlAccesoService;

    @BeforeEach
    void setUp() {
        controlAccesoService = new ControlAccesoService(
                biometricCacheService,
                clienteRepository,
                membresiaClienteRepository,
                registroAccesoRepository,
                monitorAccesoSseService
        );

        when(registroAccesoRepository.save(any(RegistroAcceso.class))).thenAnswer(inv -> {
            RegistroAcceso r = inv.getArgument(0);
            r.setId(UUID.randomUUID());
            return r;
        });
    }

    @Test
    void accesoVerdeDescuentaSesionUnitariaYOperaEnModoSilencioso() {
        UUID clienteId = UUID.randomUUID();
        String plantillaBase64 = Base64.getEncoder()
                .encodeToString("ZKTECO_TEMPLATE_CLIENTE_1".getBytes(StandardCharsets.UTF_8));

        Cliente cliente = crearClienteActivo(clienteId, "Valentina", "Gómez", "1090112233");
        HuellaBiometrica huella = HuellaBiometrica.builder()
                .id(UUID.randomUUID())
                .cliente(cliente)
                .posicionDedo(PosicionDedo.INDICE_DER)
                .templateBiometrico(Base64.getDecoder().decode(plantillaBase64))
                .activo(true)
                .build();

        Plan plan3xSem = Plan.builder()
                .codigo("MES_3XSEM")
                .nombre("Mensualidad - 3 días por semana")
                .duracionDias(30)
                .maxIngresosPorDia(1)
                .maxIngresosPorSemana(3)
                .sesionesTotalesTiquetera(12)
                .descuentaPorMarcacion(true)
                .diasAlertaAmarilla(3)
                .build();

        MembresiaCliente membresia = MembresiaCliente.builder()
                .id(UUID.randomUUID())
                .cliente(cliente)
                .plan(plan3xSem)
                .fechaInicio(LocalDate.now().minusDays(5))
                .fechaVencimientoActual(LocalDate.now().plusDays(25))
                .sesionesTotales(12)
                .sesionesConsumidas(2)
                .sesionesRestantes(10)
                .saldoPendiente(BigDecimal.ZERO)
                .estado(EstadoMembresia.ACTIVA)
                .build();

        when(biometricCacheService.identificarHuella(plantillaBase64)).thenReturn(Optional.of(huella));
        when(membresiaClienteRepository.findFirstByClienteIdAndEstadoOrderByFechaVencimientoActualDesc(
                clienteId, EstadoMembresia.CONGELADA
        )).thenReturn(Optional.empty());
        when(membresiaClienteRepository.findFirstByClienteIdAndEstadoOrderByFechaVencimientoActualDesc(
                clienteId, EstadoMembresia.ACTIVA
        )).thenReturn(Optional.of(membresia));
        when(registroAccesoRepository.existsByClienteIdAndFechaAccesoAndAccesoAutorizadoTrue(
                eq(clienteId), any(LocalDate.class)
        )).thenReturn(false);
        when(registroAccesoRepository.countByClienteIdAndAccesoAutorizadoTrueAndFechaAccesoBetween(
                eq(clienteId), any(LocalDate.class), any(LocalDate.class)
        )).thenReturn(1L);

        ResultadoValidacionAccesoDto resultado = controlAccesoService.validarAccesoPorHuella(
                new ValidarHuellaRequestDto(plantillaBase64)
        );

        assertTrue(resultado.accesoAutorizado());
        assertEquals(ColorSemaforo.VERDE, resultado.colorSemaforo());
        assertEquals(MotivoResultadoAcceso.OK, resultado.motivoResultado());
        assertEquals("Valentina Gómez", resultado.clienteNombreCompleto());
        assertEquals(9, resultado.sesionesRestantes());
        assertEquals(2, resultado.ingresosEstaSemana());
        assertTrue(resultado.operacionSilenciosa());
        assertTrue(resultado.pulsoElectroimanEnviado());
        assertTrue(resultado.tiempoRespuestaMs() < 1000);
    }

    @Test
    void antiPassbackBloqueaEnRojoLaSegundaMarcacionDelMismoDiaSinDescontarSesion() {
        UUID clienteId = UUID.randomUUID();
        String plantillaBase64 = "PLANTILLA_DUPLICADA_HOY";

        Cliente cliente = crearClienteActivo(clienteId, "Andrés", "Mejía", "1088990011");
        HuellaBiometrica huella = HuellaBiometrica.builder()
                .id(UUID.randomUUID())
                .cliente(cliente)
                .posicionDedo(PosicionDedo.PULGAR_DER)
                .activo(true)
                .build();

        Plan plan3xSem = Plan.builder()
                .codigo("MES_3XSEM")
                .nombre("Mensualidad - 3 días por semana")
                .maxIngresosPorDia(1)
                .maxIngresosPorSemana(3)
                .descuentaPorMarcacion(true)
                .diasAlertaAmarilla(3)
                .build();

        MembresiaCliente membresia = MembresiaCliente.builder()
                .id(UUID.randomUUID())
                .cliente(cliente)
                .plan(plan3xSem)
                .fechaVencimientoActual(LocalDate.now().plusDays(15))
                .sesionesTotales(12)
                .sesionesConsumidas(4)
                .sesionesRestantes(8)
                .estado(EstadoMembresia.ACTIVA)
                .build();

        when(biometricCacheService.identificarHuella(plantillaBase64)).thenReturn(Optional.of(huella));
        when(membresiaClienteRepository.findFirstByClienteIdAndEstadoOrderByFechaVencimientoActualDesc(
                clienteId, EstadoMembresia.CONGELADA
        )).thenReturn(Optional.empty());
        when(membresiaClienteRepository.findFirstByClienteIdAndEstadoOrderByFechaVencimientoActualDesc(
                clienteId, EstadoMembresia.ACTIVA
        )).thenReturn(Optional.of(membresia));
        // Simula que ya ingresó hoy
        when(registroAccesoRepository.existsByClienteIdAndFechaAccesoAndAccesoAutorizadoTrue(
                eq(clienteId), any(LocalDate.class)
        )).thenReturn(true);

        ResultadoValidacionAccesoDto resultado = controlAccesoService.validarAccesoPorHuella(
                new ValidarHuellaRequestDto(plantillaBase64)
        );

        assertFalse(resultado.accesoAutorizado());
        assertEquals(ColorSemaforo.ROJO, resultado.colorSemaforo());
        assertEquals(MotivoResultadoAcceso.YA_INGRESO_HOY, resultado.motivoResultado());
        assertEquals(8, resultado.sesionesRestantes()); // No descontó sesión adicional
        assertFalse(resultado.pulsoElectroimanEnviado());
    }

    @Test
    void planTresDiasPorSemanaBloqueaEnRojoElCuartoIntentoEnLaMismaSemana() {
        UUID clienteId = UUID.randomUUID();
        String plantillaBase64 = "PLANTILLA_CUPO_SEMANAL";

        Cliente cliente = crearClienteActivo(clienteId, "Laura", "Restrepo", "1055443322");
        HuellaBiometrica huella = HuellaBiometrica.builder()
                .id(UUID.randomUUID())
                .cliente(cliente)
                .posicionDedo(PosicionDedo.INDICE_IZQ)
                .activo(true)
                .build();

        Plan plan3xSem = Plan.builder()
                .codigo("MES_3XSEM")
                .nombre("Mensualidad - 3 días por semana")
                .maxIngresosPorDia(1)
                .maxIngresosPorSemana(3)
                .descuentaPorMarcacion(true)
                .diasAlertaAmarilla(3)
                .build();

        MembresiaCliente membresia = MembresiaCliente.builder()
                .id(UUID.randomUUID())
                .cliente(cliente)
                .plan(plan3xSem)
                .fechaVencimientoActual(LocalDate.now().plusDays(12))
                .sesionesRestantes(6)
                .estado(EstadoMembresia.ACTIVA)
                .build();

        when(biometricCacheService.identificarHuella(plantillaBase64)).thenReturn(Optional.of(huella));
        when(membresiaClienteRepository.findFirstByClienteIdAndEstadoOrderByFechaVencimientoActualDesc(
                clienteId, EstadoMembresia.CONGELADA
        )).thenReturn(Optional.empty());
        when(membresiaClienteRepository.findFirstByClienteIdAndEstadoOrderByFechaVencimientoActualDesc(
                clienteId, EstadoMembresia.ACTIVA
        )).thenReturn(Optional.of(membresia));
        when(registroAccesoRepository.existsByClienteIdAndFechaAccesoAndAccesoAutorizadoTrue(
                eq(clienteId), any(LocalDate.class)
        )).thenReturn(false);
        // Ya completó los 3 ingresos en la semana actual
        when(registroAccesoRepository.countByClienteIdAndAccesoAutorizadoTrueAndFechaAccesoBetween(
                eq(clienteId), any(LocalDate.class), any(LocalDate.class)
        )).thenReturn(3L);

        ResultadoValidacionAccesoDto resultado = controlAccesoService.validarAccesoPorHuella(
                new ValidarHuellaRequestDto(plantillaBase64)
        );

        assertFalse(resultado.accesoAutorizado());
        assertEquals(ColorSemaforo.ROJO, resultado.colorSemaforo());
        assertEquals(MotivoResultadoAcceso.CUPO_SEMANAL_AGOTADO, resultado.motivoResultado());
        assertEquals(6, resultado.sesionesRestantes());
    }

    @Test
    void alertaPreventivaAmarillaSeActivaCuandoFaltanTresDiasOMenosParaVencer() {
        UUID clienteId = UUID.randomUUID();
        String plantillaBase64 = "PLANTILLA_ALERTA_3_DIAS";

        Cliente cliente = crearClienteActivo(clienteId, "Santiago", "Pérez", "1099887766");
        HuellaBiometrica huella = HuellaBiometrica.builder()
                .id(UUID.randomUUID())
                .cliente(cliente)
                .activo(true)
                .build();

        Plan planFull = Plan.builder()
                .codigo("MES_FULL")
                .nombre("Mensualidad - Todos los días")
                .maxIngresosPorDia(1)
                .descuentaPorMarcacion(false)
                .diasAlertaAmarilla(3)
                .build();

        MembresiaCliente membresia = MembresiaCliente.builder()
                .id(UUID.randomUUID())
                .cliente(cliente)
                .plan(planFull)
                .fechaVencimientoActual(LocalDate.now().plusDays(2))
                .estado(EstadoMembresia.ACTIVA)
                .build();

        when(biometricCacheService.identificarHuella(plantillaBase64)).thenReturn(Optional.of(huella));
        when(membresiaClienteRepository.findFirstByClienteIdAndEstadoOrderByFechaVencimientoActualDesc(
                clienteId, EstadoMembresia.CONGELADA
        )).thenReturn(Optional.empty());
        when(membresiaClienteRepository.findFirstByClienteIdAndEstadoOrderByFechaVencimientoActualDesc(
                clienteId, EstadoMembresia.ACTIVA
        )).thenReturn(Optional.of(membresia));
        when(registroAccesoRepository.existsByClienteIdAndFechaAccesoAndAccesoAutorizadoTrue(
                eq(clienteId), any(LocalDate.class)
        )).thenReturn(false);

        ResultadoValidacionAccesoDto resultado = controlAccesoService.validarAccesoPorHuella(
                new ValidarHuellaRequestDto(plantillaBase64)
        );

        assertTrue(resultado.accesoAutorizado());
        assertEquals(ColorSemaforo.AMARILLO, resultado.colorSemaforo());
        assertEquals(MotivoResultadoAcceso.ALERTA_3_DIAS, resultado.motivoResultado());
        assertEquals(2, resultado.diasRestantes());
    }

    private Cliente crearClienteActivo(UUID id, String nombres, String apellidos, String documento) {
        return Cliente.builder()
                .id(id)
                .tipoDocumento(TipoDocumento.CC)
                .numeroDocumento(documento)
                .nombres(nombres)
                .apellidos(apellidos)
                .telefonoWhatsapp("3100001122")
                .saldoPendienteCaja(BigDecimal.ZERO)
                .estado(EstadoCliente.ACTIVO)
                .build();
    }
}

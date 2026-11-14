package com.innoverzion.functionalsportsystem.service;

import com.innoverzion.functionalsportsystem.domain.entity.AuditoriaAutorizacion;
import com.innoverzion.functionalsportsystem.domain.entity.UsuarioSistema;
import com.innoverzion.functionalsportsystem.domain.enums.RolUsuario;
import com.innoverzion.functionalsportsystem.domain.enums.TipoOperacionAuditoria;
import com.innoverzion.functionalsportsystem.dto.auth.AuditoriaAutorizacionResponseDto;
import com.innoverzion.functionalsportsystem.dto.auth.ValidarClaveAdminRequestDto;
import com.innoverzion.functionalsportsystem.exception.UnauthorizedOperationException;
import com.innoverzion.functionalsportsystem.repository.AuditoriaAutorizacionRepository;
import com.innoverzion.functionalsportsystem.repository.UsuarioSistemaRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MatrizPermisosYAutorizacionServiceTest {

    @Mock
    private UsuarioSistemaRepository usuarioSistemaRepository;

    @Mock
    private AuditoriaAutorizacionRepository auditoriaAutorizacionRepository;

    private PasswordEncoder passwordEncoder;
    private MatrizPermisosService matrizPermisosService;
    private AutorizacionAdminService autorizacionAdminService;

    @BeforeEach
    void setUp() {
        passwordEncoder = new BCryptPasswordEncoder();
        matrizPermisosService = new MatrizPermisosService(usuarioSistemaRepository);
        autorizacionAdminService = new AutorizacionAdminService(
                usuarioSistemaRepository,
                auditoriaAutorizacionRepository,
                matrizPermisosService,
                passwordEncoder
        );
    }

    @Test
    void recepcionistaTieneProhibidasAccionesDeAdministrador() {
        UUID recepcionistaId = UUID.randomUUID();
        UsuarioSistema recepcionista = UsuarioSistema.builder()
                .id(recepcionistaId)
                .username("recepcion_manana")
                .nombreCompleto("Recepcionista Mañana")
                .rol(RolUsuario.RECEPCIONISTA)
                .activo(true)
                .build();

        when(usuarioSistemaRepository.findById(recepcionistaId)).thenReturn(Optional.of(recepcionista));

        assertThrows(UnauthorizedOperationException.class, () ->
                matrizPermisosService.exigirRolAdmin(recepcionistaId, "anular membresía activa")
        );
    }

    @Test
    void validarClaveAdminRegistraAuditoriaCuandoLaClaveEsCorrecta() {
        UUID adminId = UUID.randomUUID();
        UUID recepcionistaId = UUID.randomUUID();
        UUID membresiaId = UUID.randomUUID();

        UsuarioSistema admin = UsuarioSistema.builder()
                .id(adminId)
                .username("jhorman")
                .nombreCompleto("Jhorman Admin")
                .passwordHash(passwordEncoder.encode("ADMIN_JHORMAN_2026"))
                .rol(RolUsuario.ADMIN)
                .activo(true)
                .build();

        UsuarioSistema recepcionista = UsuarioSistema.builder()
                .id(recepcionistaId)
                .username("recepcion_tarde")
                .nombreCompleto("Recepcionista Tarde")
                .rol(RolUsuario.RECEPCIONISTA)
                .activo(true)
                .build();

        when(usuarioSistemaRepository.findByRolAndActivoTrue(RolUsuario.ADMIN)).thenReturn(List.of(admin));
        when(usuarioSistemaRepository.findById(recepcionistaId)).thenReturn(Optional.of(recepcionista));
        when(auditoriaAutorizacionRepository.save(any(AuditoriaAutorizacion.class))).thenAnswer(inv -> {
            AuditoriaAutorizacion a = inv.getArgument(0);
            a.setId(UUID.randomUUID());
            return a;
        });

        ValidarClaveAdminRequestDto request = new ValidarClaveAdminRequestDto(
                "ADMIN_JHORMAN_2026",
                recepcionistaId,
                TipoOperacionAuditoria.ALTERACION_FECHA_VIGENCIA,
                "MEMBRESIAS_CLIENTE",
                membresiaId,
                "2026-11-30",
                "2026-12-05",
                "Ajuste autorizado por incapacidad médica verificada"
        );

        AuditoriaAutorizacionResponseDto response = autorizacionAdminService.validarClaveYRegistrarAuditoria(request);

        assertNotNull(response.id());
        assertEquals(adminId, response.adminUsuarioId());
        assertEquals(recepcionistaId, response.recepcionistaEnTurnoId());
        assertEquals(TipoOperacionAuditoria.ALTERACION_FECHA_VIGENCIA, response.tipoOperacion());
    }

    @Test
    void validarClaveAdminLanzaExcepcionCuandoLaClaveEsIncorrecta() {
        UsuarioSistema admin = UsuarioSistema.builder()
                .id(UUID.randomUUID())
                .username("jhorman")
                .nombreCompleto("Jhorman Admin")
                .passwordHash(passwordEncoder.encode("ADMIN_JHORMAN_2026"))
                .rol(RolUsuario.ADMIN)
                .activo(true)
                .build();

        when(usuarioSistemaRepository.findByRolAndActivoTrue(RolUsuario.ADMIN)).thenReturn(List.of(admin));

        ValidarClaveAdminRequestDto request = new ValidarClaveAdminRequestDto(
                "CLAVE_INCORRECTA",
                null,
                TipoOperacionAuditoria.ANULACION_PAGO,
                "PAGOS",
                UUID.randomUUID(),
                "ASENTADO",
                "ANULADO_POR_ADMIN",
                "Error de digitación"
        );

        assertThrows(UnauthorizedOperationException.class, () ->
                autorizacionAdminService.validarClaveYRegistrarAuditoria(request)
        );
    }
}

package com.innoverzion.functionalsportsystem.controller;

import com.innoverzion.functionalsportsystem.dto.auth.AuditoriaAutorizacionResponseDto;
import com.innoverzion.functionalsportsystem.dto.auth.LoginRequestDto;
import com.innoverzion.functionalsportsystem.dto.auth.ValidarClaveAdminRequestDto;
import com.innoverzion.functionalsportsystem.dto.usuario.UsuarioResponseDto;
import com.innoverzion.functionalsportsystem.service.AutorizacionAdminService;
import com.innoverzion.functionalsportsystem.service.UsuarioSistemaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UsuarioSistemaService usuarioSistemaService;
    private final AutorizacionAdminService autorizacionAdminService;

    /**
     * Login de Administrador (Jhorman) o Recepcionistas (turnos mañana/tarde).
     * Retorna el perfil del usuario junto con su Matriz de Permisos (Sección 3.5).
     */
    @PostMapping("/login")
    public ResponseEntity<UsuarioResponseDto> login(@RequestBody LoginRequestDto request) {
        return ResponseEntity.ok(usuarioSistemaService.autenticar(request));
    }

    /**
     * Valida la clave de un Administrador en recepción para autorizar operaciones restringidas
     * (alterar fecha de vigencia, congelamiento médico, anulación de pago o membresía)
     * y registra el evento en AUDITORIA_AUTORIZACIONES.
     */
    @PostMapping("/validar-clave-admin")
    public ResponseEntity<AuditoriaAutorizacionResponseDto> validarClaveAdmin(
            @RequestBody ValidarClaveAdminRequestDto request
    ) {
        return ResponseEntity.ok(autorizacionAdminService.validarClaveYRegistrarAuditoria(request));
    }

    /**
     * Consulta la bitácora de autorizaciones realizadas con clave de Administrador.
     * Exclusivo para el rol ADMIN.
     */
    @GetMapping("/auditoria-autorizaciones")
    public ResponseEntity<List<AuditoriaAutorizacionResponseDto>> listarAuditorias(
            @RequestParam UUID adminSolicitanteId
    ) {
        return ResponseEntity.ok(autorizacionAdminService.listarHistorialAuditorias(adminSolicitanteId));
    }
}

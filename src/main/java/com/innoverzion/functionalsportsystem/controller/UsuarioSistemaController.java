package com.innoverzion.functionalsportsystem.controller;

import com.innoverzion.functionalsportsystem.dto.usuario.CambiarEstadoUsuarioRequestDto;
import com.innoverzion.functionalsportsystem.dto.usuario.CrearUsuarioRequestDto;
import com.innoverzion.functionalsportsystem.dto.usuario.UsuarioResponseDto;
import com.innoverzion.functionalsportsystem.service.UsuarioSistemaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/usuarios")
@RequiredArgsConstructor
public class UsuarioSistemaController {

    private final UsuarioSistemaService usuarioSistemaService;

    /**
     * Crea un nuevo usuario del sistema (ej. recepcionista de mañana o tarde).
     * Operación restringida al perfil ADMIN.
     */
    @PostMapping
    public ResponseEntity<UsuarioResponseDto> crearUsuario(@RequestBody CrearUsuarioRequestDto request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(usuarioSistemaService.crearUsuario(request));
    }

    /**
     * Lista todos los usuarios registrados en el sistema.
     */
    @GetMapping
    public ResponseEntity<List<UsuarioResponseDto>> listarUsuarios() {
        return ResponseEntity.ok(usuarioSistemaService.listarUsuarios());
    }

    /**
     * Activa o desactiva un usuario del sistema (impidiendo desactivar al único ADMIN activo).
     */
    @PatchMapping("/{id}/estado")
    public ResponseEntity<UsuarioResponseDto> cambiarEstadoUsuario(
            @PathVariable UUID id,
            @RequestBody CambiarEstadoUsuarioRequestDto request
    ) {
        return ResponseEntity.ok(usuarioSistemaService.cambiarEstadoUsuario(id, request));
    }
}

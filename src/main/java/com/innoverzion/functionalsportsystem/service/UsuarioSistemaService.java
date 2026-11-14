package com.innoverzion.functionalsportsystem.service;

import com.innoverzion.functionalsportsystem.domain.entity.UsuarioSistema;
import com.innoverzion.functionalsportsystem.domain.enums.RolUsuario;
import com.innoverzion.functionalsportsystem.dto.auth.LoginRequestDto;
import com.innoverzion.functionalsportsystem.dto.usuario.CambiarEstadoUsuarioRequestDto;
import com.innoverzion.functionalsportsystem.dto.usuario.CrearUsuarioRequestDto;
import com.innoverzion.functionalsportsystem.dto.usuario.UsuarioResponseDto;
import com.innoverzion.functionalsportsystem.exception.BusinessRuleException;
import com.innoverzion.functionalsportsystem.exception.ResourceNotFoundException;
import com.innoverzion.functionalsportsystem.exception.UnauthorizedOperationException;
import com.innoverzion.functionalsportsystem.repository.UsuarioSistemaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UsuarioSistemaService {

    private final UsuarioSistemaRepository usuarioSistemaRepository;
    private final MatrizPermisosService matrizPermisosService;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public UsuarioResponseDto autenticar(LoginRequestDto request) {
        if (request.username() == null || request.username().isBlank()
                || request.password() == null || request.password().isBlank()) {
            throw new BusinessRuleException("Debe ingresar usuario y contraseña.");
        }

        UsuarioSistema usuario = usuarioSistemaRepository.findByUsername(request.username().trim())
                .orElseThrow(() -> new UnauthorizedOperationException("Credenciales inválidas."));

        if (!Boolean.TRUE.equals(usuario.getActivo())) {
            throw new UnauthorizedOperationException("El usuario se encuentra inactivo. Contacte al Administrador.");
        }

        if (!passwordEncoder.matches(request.password(), usuario.getPasswordHash())) {
            throw new UnauthorizedOperationException("Credenciales inválidas.");
        }

        return mapearADto(usuario);
    }

    @Transactional
    public UsuarioResponseDto crearUsuario(CrearUsuarioRequestDto request) {
        matrizPermisosService.exigirRolAdmin(
                request.adminEjecutorId(),
                "crear nuevos usuarios del sistema (recepcionistas o administradores)"
        );

        if (request.username() == null || request.username().isBlank()) {
            throw new BusinessRuleException("El nombre de usuario (username) es obligatorio.");
        }
        if (request.password() == null || request.password().length() < 6) {
            throw new BusinessRuleException("La contraseña debe tener al menos 6 caracteres.");
        }
        if (request.nombreCompleto() == null || request.nombreCompleto().isBlank()) {
            throw new BusinessRuleException("El nombre completo es obligatorio.");
        }
        if (request.numeroDocumento() == null || request.numeroDocumento().isBlank()) {
            throw new BusinessRuleException("El número de documento es obligatorio.");
        }
        if (request.rol() == null) {
            throw new BusinessRuleException("Debe especificar el rol (ADMIN o RECEPCIONISTA).");
        }

        String cleanUsername = request.username().trim().toLowerCase();
        if (usuarioSistemaRepository.existsByUsername(cleanUsername)) {
            throw new BusinessRuleException("Ya existe un usuario con el username: " + cleanUsername);
        }

        UsuarioSistema nuevo = UsuarioSistema.builder()
                .username(cleanUsername)
                .passwordHash(passwordEncoder.encode(request.password()))
                .nombreCompleto(request.nombreCompleto().trim())
                .numeroDocumento(request.numeroDocumento().trim())
                .rol(request.rol())
                .activo(true)
                .build();

        return mapearADto(usuarioSistemaRepository.save(nuevo));
    }

    @Transactional(readOnly = true)
    public List<UsuarioResponseDto> listarUsuarios() {
        return usuarioSistemaRepository.findAll()
                .stream()
                .map(this::mapearADto)
                .toList();
    }

    @Transactional
    public UsuarioResponseDto cambiarEstadoUsuario(UUID usuarioObjetivoId, CambiarEstadoUsuarioRequestDto request) {
        matrizPermisosService.exigirRolAdmin(
                request.adminEjecutorId(),
                "activar o desactivar cuentas de usuarios del sistema"
        );

        UsuarioSistema objetivo = usuarioSistemaRepository.findById(usuarioObjetivoId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado con ID: " + usuarioObjetivoId));

        if (Boolean.FALSE.equals(request.activo()) && objetivo.getRol() == RolUsuario.ADMIN) {
            long adminsActivos = usuarioSistemaRepository.findByRolAndActivoTrue(RolUsuario.ADMIN).size();
            if (adminsActivos <= 1) {
                throw new BusinessRuleException("No se puede desactivar al único Administrador activo del gimnasio.");
            }
        }

        objetivo.setActivo(request.activo());
        return mapearADto(usuarioSistemaRepository.save(objetivo));
    }

    private UsuarioResponseDto mapearADto(UsuarioSistema u) {
        return new UsuarioResponseDto(
                u.getId(),
                u.getUsername(),
                u.getNombreCompleto(),
                u.getNumeroDocumento(),
                u.getRol(),
                u.getActivo(),
                matrizPermisosService.construirMapaPermisos(u.getRol()),
                u.getCreatedAt()
        );
    }
}

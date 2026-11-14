package com.innoverzion.functionalsportsystem.service;

import com.innoverzion.functionalsportsystem.domain.entity.UsuarioSistema;
import com.innoverzion.functionalsportsystem.domain.enums.RolUsuario;
import com.innoverzion.functionalsportsystem.exception.ResourceNotFoundException;
import com.innoverzion.functionalsportsystem.exception.UnauthorizedOperationException;
import com.innoverzion.functionalsportsystem.repository.UsuarioSistemaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Implementa la sección 3.5 (Matriz de Permisos y Perfiles de Seguridad) de Funcional Sport Col:
 * - Prohibir al RECEPCIONISTA eliminar o editar pagos ya asentados.
 * - Prohibir alteración manual de fechas de vigencia sin clave de administrador.
 * - Prohibir anulación de membresías activas.
 * - Prohibir visualización de reportes globales de rentabilidad.
 */
@Service
@RequiredArgsConstructor
public class MatrizPermisosService {

    private final UsuarioSistemaRepository usuarioSistemaRepository;

    public UsuarioSistema obtenerUsuarioActivo(UUID usuarioId) {
        if (usuarioId == null) {
            throw new UnauthorizedOperationException("Se requiere identificar al usuario operador de la sesión.");
        }
        UsuarioSistema usuario = usuarioSistemaRepository.findById(usuarioId)
                .orElseThrow(() -> new ResourceNotFoundException("No existe el usuario del sistema con ID: " + usuarioId));

        if (!Boolean.TRUE.equals(usuario.getActivo())) {
            throw new UnauthorizedOperationException(
                    "La cuenta del usuario '" + usuario.getUsername() + "' se encuentra inactiva."
            );
        }
        return usuario;
    }

    public UsuarioSistema exigirRolAdmin(UUID usuarioId, String descripcionAccionRestringida) {
        UsuarioSistema usuario = obtenerUsuarioActivo(usuarioId);
        if (usuario.getRol() != RolUsuario.ADMIN) {
            throw new UnauthorizedOperationException(
                    "Acceso denegado para el perfil RECEPCIONISTA: " + descripcionAccionRestringida
                            + ". Esta operación requiere perfil o clave de ADMINISTRADOR."
            );
        }
        return usuario;
    }

    public Map<String, Boolean> construirMapaPermisos(RolUsuario rol) {
        boolean esAdmin = (rol == RolUsuario.ADMIN);
        Map<String, Boolean> permisos = new LinkedHashMap<>();
        permisos.put("registrarClientesYHuellas", true);
        permisos.put("venderYRenovarMembresias", true);
        permisos.put("abrirYCerrarTurnoCaja", true);
        permisos.put("editarOAnularPagosAsentados", esAdmin);
        permisos.put("alterarFechasVigenciaSinClaveAdmin", esAdmin);
        permisos.put("anularMembresiasActivas", esAdmin);
        permisos.put("verReportesGlobalesRentabilidad", esAdmin);
        permisos.put("gestionarUsuariosYPlanes", esAdmin);
        return permisos;
    }
}

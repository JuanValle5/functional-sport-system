package com.innoverzion.functionalsportsystem.repository;

import com.innoverzion.functionalsportsystem.domain.entity.UsuarioSistema;
import com.innoverzion.functionalsportsystem.domain.enums.RolUsuario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UsuarioSistemaRepository extends JpaRepository<UsuarioSistema, UUID> {

    Optional<UsuarioSistema> findByUsername(String username);

    boolean existsByUsername(String username);

    List<UsuarioSistema> findByRolAndActivoTrue(RolUsuario rol);
}

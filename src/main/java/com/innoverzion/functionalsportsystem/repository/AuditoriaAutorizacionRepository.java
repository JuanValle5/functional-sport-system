package com.innoverzion.functionalsportsystem.repository;

import com.innoverzion.functionalsportsystem.domain.entity.AuditoriaAutorizacion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface AuditoriaAutorizacionRepository extends JpaRepository<AuditoriaAutorizacion, UUID> {

    List<AuditoriaAutorizacion> findTop100ByOrderByFechaHoraDesc();
}

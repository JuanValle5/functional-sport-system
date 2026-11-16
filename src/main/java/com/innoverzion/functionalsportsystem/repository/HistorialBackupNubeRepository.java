package com.innoverzion.functionalsportsystem.repository;

import com.innoverzion.functionalsportsystem.domain.entity.HistorialBackupNube;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface HistorialBackupNubeRepository extends JpaRepository<HistorialBackupNube, UUID> {

    List<HistorialBackupNube> findTop20ByOrderByFechaHoraEjecucionDesc();

    Optional<HistorialBackupNube> findFirstByOrderByFechaHoraEjecucionDesc();
}

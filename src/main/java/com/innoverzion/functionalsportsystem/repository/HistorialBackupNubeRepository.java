package com.innoverzion.functionalsportsystem.repository;

import com.innoverzion.functionalsportsystem.domain.entity.HistorialBackupNube;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface HistorialBackupNubeRepository extends JpaRepository<HistorialBackupNube, UUID> {
}

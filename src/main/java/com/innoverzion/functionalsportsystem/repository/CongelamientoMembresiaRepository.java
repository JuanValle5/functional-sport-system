package com.innoverzion.functionalsportsystem.repository;

import com.innoverzion.functionalsportsystem.domain.entity.CongelamientoMembresia;
import com.innoverzion.functionalsportsystem.domain.enums.EstadoCongelamiento;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CongelamientoMembresiaRepository extends JpaRepository<CongelamientoMembresia, UUID> {

    Optional<CongelamientoMembresia> findByMembresiaIdAndEstado(UUID membresiaId, EstadoCongelamiento estado);

    List<CongelamientoMembresia> findByMembresiaIdOrderByCreatedAtDesc(UUID membresiaId);
}

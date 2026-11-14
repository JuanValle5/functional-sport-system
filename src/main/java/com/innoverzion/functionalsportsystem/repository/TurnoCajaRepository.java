package com.innoverzion.functionalsportsystem.repository;

import com.innoverzion.functionalsportsystem.domain.entity.TurnoCaja;
import com.innoverzion.functionalsportsystem.domain.enums.EstadoTurnoCaja;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface TurnoCajaRepository extends JpaRepository<TurnoCaja, UUID> {

    Optional<TurnoCaja> findFirstByEstadoOrderByFechaHoraAperturaDesc(EstadoTurnoCaja estado);

    boolean existsByEstado(EstadoTurnoCaja estado);
}

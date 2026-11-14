package com.innoverzion.functionalsportsystem.repository;

import com.innoverzion.functionalsportsystem.domain.entity.Pago;
import com.innoverzion.functionalsportsystem.domain.enums.EstadoPago;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface PagoRepository extends JpaRepository<Pago, UUID> {

    List<Pago> findByTurnoCajaIdAndEstadoOrderByFechaHoraPagoDesc(UUID turnoCajaId, EstadoPago estado);
}

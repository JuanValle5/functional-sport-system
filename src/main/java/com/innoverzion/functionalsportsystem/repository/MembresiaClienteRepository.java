package com.innoverzion.functionalsportsystem.repository;

import com.innoverzion.functionalsportsystem.domain.entity.MembresiaCliente;
import com.innoverzion.functionalsportsystem.domain.enums.EstadoMembresia;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface MembresiaClienteRepository extends JpaRepository<MembresiaCliente, UUID> {

    Optional<MembresiaCliente> findFirstByClienteIdAndEstadoOrderByFechaVencimientoActualDesc(
            UUID clienteId,
            EstadoMembresia estado
    );

    List<MembresiaCliente> findByClienteIdOrderByCreatedAtDesc(UUID clienteId);

    long countByEstadoAndFechaVencimientoActualGreaterThanEqual(EstadoMembresia estado, LocalDate fechaActual);

    long countByEstado(EstadoMembresia estado);

    long countByEstadoAndFechaVencimientoActualBetween(
            EstadoMembresia estado,
            LocalDate fechaInicio,
            LocalDate fechaFin
    );
}

package com.innoverzion.functionalsportsystem.repository;

import com.innoverzion.functionalsportsystem.domain.entity.RegistroAcceso;
import com.innoverzion.functionalsportsystem.domain.enums.ColorSemaforo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface RegistroAccesoRepository extends JpaRepository<RegistroAcceso, UUID> {

    /**
     * Regla 2.3 (Anti-Passback): Verifica si el cliente ya tuvo un ingreso autorizado en la fecha actual.
     */
    boolean existsByClienteIdAndFechaAccesoAndAccesoAutorizadoTrue(UUID clienteId, LocalDate fechaAcceso);

    /**
     * Regla 1.1 (Plan 3 días por semana): Cuenta los ingresos autorizados en un rango de fechas (lunes a domingo).
     */
    long countByClienteIdAndAccesoAutorizadoTrueAndFechaAccesoBetween(
            UUID clienteId,
            LocalDate fechaInicioSemana,
            LocalDate fechaFinSemana
    );

    long countByFechaAccesoAndAccesoAutorizadoTrue(LocalDate fechaAcceso);

    long countByFechaAccesoAndColorSemaforo(LocalDate fechaAcceso, ColorSemaforo colorSemaforo);

    List<RegistroAcceso> findByFechaAccesoOrderByFechaHoraExactaDesc(LocalDate fechaAcceso);

    List<RegistroAcceso> findTop50ByOrderByFechaHoraExactaDesc();

    void deleteByClienteId(UUID clienteId);
}

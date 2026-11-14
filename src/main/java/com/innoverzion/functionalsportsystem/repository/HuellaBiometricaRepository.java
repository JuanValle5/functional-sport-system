package com.innoverzion.functionalsportsystem.repository;

import com.innoverzion.functionalsportsystem.domain.entity.HuellaBiometrica;
import com.innoverzion.functionalsportsystem.domain.enums.PosicionDedo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface HuellaBiometricaRepository extends JpaRepository<HuellaBiometrica, UUID> {

    List<HuellaBiometrica> findByClienteIdAndActivoTrue(UUID clienteId);

    Optional<HuellaBiometrica> findByClienteIdAndPosicionDedo(UUID clienteId, PosicionDedo posicionDedo);

    @Query("SELECT h FROM HuellaBiometrica h JOIN FETCH h.cliente WHERE h.activo = true")
    List<HuellaBiometrica> findAllActivasConCliente();
}

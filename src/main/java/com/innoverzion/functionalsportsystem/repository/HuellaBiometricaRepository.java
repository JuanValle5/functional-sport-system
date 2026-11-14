package com.innoverzion.functionalsportsystem.repository;

import com.innoverzion.functionalsportsystem.domain.entity.HuellaBiometrica;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface HuellaBiometricaRepository extends JpaRepository<HuellaBiometrica, UUID> {

    List<HuellaBiometrica> findByClienteIdAndActivoTrue(UUID clienteId);

    List<HuellaBiometrica> findByActivoTrue();
}

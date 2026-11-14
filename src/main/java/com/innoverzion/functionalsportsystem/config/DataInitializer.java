package com.innoverzion.functionalsportsystem.config;

import com.innoverzion.functionalsportsystem.domain.entity.Plan;
import com.innoverzion.functionalsportsystem.domain.entity.UsuarioSistema;
import com.innoverzion.functionalsportsystem.domain.enums.RolUsuario;
import com.innoverzion.functionalsportsystem.repository.PlanRepository;
import com.innoverzion.functionalsportsystem.repository.UsuarioSistemaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final PlanRepository planRepository;
    private final UsuarioSistemaRepository usuarioSistemaRepository;

    @Override
    @Transactional
    public void run(String... args) {
        inicializarPlanesOficiales();
        inicializarUsuarioAdmin();
    }

    private void inicializarPlanesOficiales() {
        List<Plan> planesSemilla = List.of(
                Plan.builder()
                        .codigo("DIA")
                        .nombre("Día (Pase Diario / Clase)")
                        .precioCop(new BigDecimal("10000.00"))
                        .duracionDias(1)
                        .maxIngresosPorDia(1)
                        .maxIngresosPorSemana(null)
                        .sesionesTotalesTiquetera(1)
                        .descuentaPorMarcacion(true)
                        .diasAlertaAmarilla(0)
                        .permiteCongelamiento(false)
                        .activo(true)
                        .build(),
                Plan.builder()
                        .codigo("QUINCENA")
                        .nombre("Quincena")
                        .precioCop(new BigDecimal("50000.00"))
                        .duracionDias(15)
                        .maxIngresosPorDia(1)
                        .maxIngresosPorSemana(null)
                        .sesionesTotalesTiquetera(null)
                        .descuentaPorMarcacion(false)
                        .diasAlertaAmarilla(3)
                        .permiteCongelamiento(true)
                        .activo(true)
                        .build(),
                Plan.builder()
                        .codigo("MES_FULL")
                        .nombre("Mensualidad - Todos los días")
                        .precioCop(new BigDecimal("80000.00"))
                        .duracionDias(30)
                        .maxIngresosPorDia(1)
                        .maxIngresosPorSemana(null)
                        .sesionesTotalesTiquetera(null)
                        .descuentaPorMarcacion(false)
                        .diasAlertaAmarilla(3)
                        .permiteCongelamiento(true)
                        .activo(true)
                        .build(),
                Plan.builder()
                        .codigo("MES_3XSEM")
                        .nombre("Mensualidad - 3 días por semana")
                        .precioCop(new BigDecimal("70000.00"))
                        .duracionDias(30)
                        .maxIngresosPorDia(1)
                        .maxIngresosPorSemana(3)
                        .sesionesTotalesTiquetera(12)
                        .descuentaPorMarcacion(true)
                        .diasAlertaAmarilla(3)
                        .permiteCongelamiento(true)
                        .activo(true)
                        .build()
        );

        for (Plan plan : planesSemilla) {
            if (!planRepository.existsByCodigo(plan.getCodigo())) {
                planRepository.save(plan);
                log.info("Plan semilla creado: {} - ${} COP", plan.getNombre(), plan.getPrecioCop());
            }
        }
    }

    private void inicializarUsuarioAdmin() {
        if (!usuarioSistemaRepository.existsByUsername("jhorman")) {
            UsuarioSistema admin = UsuarioSistema.builder()
                    .username("jhorman")
                    .passwordHash("ADMIN_JHORMAN_2026")
                    .nombreCompleto("Jhorman - Administrador Funcional Sport Col")
                    .numeroDocumento("ADMIN-001")
                    .rol(RolUsuario.ADMIN)
                    .activo(true)
                    .build();
            usuarioSistemaRepository.save(admin);
            log.info("Usuario ADMIN inicial creado para Funcional Sport Col (username: jhorman)");
        }
    }
}

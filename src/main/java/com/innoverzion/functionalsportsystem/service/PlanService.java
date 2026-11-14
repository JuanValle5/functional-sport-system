package com.innoverzion.functionalsportsystem.service;

import com.innoverzion.functionalsportsystem.domain.entity.Plan;
import com.innoverzion.functionalsportsystem.dto.plan.ActualizarPlanRequestDto;
import com.innoverzion.functionalsportsystem.dto.plan.PlanResponseDto;
import com.innoverzion.functionalsportsystem.exception.BusinessRuleException;
import com.innoverzion.functionalsportsystem.exception.ResourceNotFoundException;
import com.innoverzion.functionalsportsystem.repository.PlanRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PlanService {

    private final PlanRepository planRepository;
    private final MatrizPermisosService matrizPermisosService;

    @Transactional(readOnly = true)
    public List<PlanResponseDto> listarPlanesActivos() {
        return planRepository.findByActivoTrueOrderByPrecioCopAsc()
                .stream()
                .map(this::mapearADto)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<PlanResponseDto> listarTodosLosPlanes() {
        return planRepository.findAll()
                .stream()
                .map(this::mapearADto)
                .toList();
    }

    @Transactional(readOnly = true)
    public Plan obtenerPlanActivoPorCodigo(String codigo) {
        if (codigo == null || codigo.isBlank()) {
            throw new BusinessRuleException("Debe indicar el código del plan (DIA, QUINCENA, MES_FULL, MES_3XSEM).");
        }
        Plan plan = planRepository.findByCodigo(codigo.trim().toUpperCase())
                .orElseThrow(() -> new ResourceNotFoundException("No existe un plan con el código: " + codigo));

        if (!Boolean.TRUE.equals(plan.getActivo())) {
            throw new BusinessRuleException("El plan '" + plan.getNombre() + "' no se encuentra activo para la venta.");
        }
        return plan;
    }

    @Transactional
    public PlanResponseDto actualizarPlan(UUID planId, ActualizarPlanRequestDto request) {
        matrizPermisosService.exigirRolAdmin(
                request.adminEjecutorId(),
                "modificar tarifas o condiciones del catálogo de planes"
        );

        Plan plan = planRepository.findById(planId)
                .orElseThrow(() -> new ResourceNotFoundException("No se encontró el plan con ID: " + planId));

        if (request.nombre() != null && !request.nombre().isBlank()) {
            plan.setNombre(request.nombre().trim());
        }
        if (request.precioCop() != null) {
            if (request.precioCop().compareTo(BigDecimal.ZERO) <= 0) {
                throw new BusinessRuleException("El precio del plan debe ser mayor a $0 COP.");
            }
            plan.setPrecioCop(request.precioCop());
        }
        if (request.diasAlertaAmarilla() != null && request.diasAlertaAmarilla() >= 0) {
            plan.setDiasAlertaAmarilla(request.diasAlertaAmarilla());
        }
        if (request.activo() != null) {
            plan.setActivo(request.activo());
        }

        return mapearADto(planRepository.save(plan));
    }

    public PlanResponseDto mapearADto(Plan p) {
        return new PlanResponseDto(
                p.getId(),
                p.getCodigo(),
                p.getNombre(),
                p.getPrecioCop(),
                p.getDuracionDias(),
                p.getMaxIngresosPorDia(),
                p.getMaxIngresosPorSemana(),
                p.getSesionesTotalesTiquetera(),
                p.getDescuentaPorMarcacion(),
                p.getDiasAlertaAmarilla(),
                p.getPermiteCongelamiento(),
                p.getActivo()
        );
    }
}

package com.innoverzion.functionalsportsystem.controller;

import com.innoverzion.functionalsportsystem.dto.plan.ActualizarPlanRequestDto;
import com.innoverzion.functionalsportsystem.dto.plan.PlanResponseDto;
import com.innoverzion.functionalsportsystem.service.PlanService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/planes")
@RequiredArgsConstructor
public class PlanController {

    private final PlanService planService;

    @GetMapping
    public ResponseEntity<List<PlanResponseDto>> listarPlanesActivos() {
        return ResponseEntity.ok(planService.listarPlanesActivos());
    }

    @GetMapping("/todos")
    public ResponseEntity<List<PlanResponseDto>> listarTodosLosPlanes() {
        return ResponseEntity.ok(planService.listarTodosLosPlanes());
    }

    @PatchMapping("/{id}")
    public ResponseEntity<PlanResponseDto> actualizarPlan(
            @PathVariable UUID id,
            @RequestBody ActualizarPlanRequestDto request
    ) {
        return ResponseEntity.ok(planService.actualizarPlan(id, request));
    }
}

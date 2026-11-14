package com.innoverzion.functionalsportsystem.controller;

import com.innoverzion.functionalsportsystem.dto.membresia.*;
import com.innoverzion.functionalsportsystem.service.MembresiaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/membresias")
@RequiredArgsConstructor
public class MembresiaController {

    private final MembresiaService membresiaService;

    @PostMapping("/vender")
    public ResponseEntity<MembresiaResponseDto> venderORenovar(@RequestBody VenderMembresiaRequestDto request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(membresiaService.venderORenovarMembresia(request));
    }

    @GetMapping("/cliente/{clienteId}")
    public ResponseEntity<List<MembresiaResponseDto>> listarPorCliente(@PathVariable UUID clienteId) {
        return ResponseEntity.ok(membresiaService.listarHistorialPorCliente(clienteId));
    }

    @PostMapping("/{membresiaId}/congelar")
    public ResponseEntity<CongelamientoResponseDto> congelarPorSalud(
            @PathVariable UUID membresiaId,
            @RequestBody CongelarMembresiaRequestDto request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(membresiaService.congelarMembresiaPorSalud(membresiaId, request));
    }

    @PostMapping("/{membresiaId}/reactivar")
    public ResponseEntity<MembresiaResponseDto> reactivarMembresiaCongelada(
            @PathVariable UUID membresiaId,
            @RequestBody ReactivarMembresiaRequestDto request
    ) {
        return ResponseEntity.ok(membresiaService.reactivarMembresiaCongelada(membresiaId, request));
    }

    @GetMapping("/{membresiaId}/congelamientos")
    public ResponseEntity<List<CongelamientoResponseDto>> listarCongelamientos(@PathVariable UUID membresiaId) {
        return ResponseEntity.ok(membresiaService.listarCongelamientosDeMembresia(membresiaId));
    }

    @PatchMapping("/{membresiaId}/vigencia")
    public ResponseEntity<MembresiaResponseDto> alterarVigenciaConClaveAdmin(
            @PathVariable UUID membresiaId,
            @RequestBody AlterarVigenciaMembresiaRequestDto request
    ) {
        return ResponseEntity.ok(membresiaService.alterarFechaVigenciaConClaveAdmin(membresiaId, request));
    }

    @PostMapping("/{membresiaId}/anular")
    public ResponseEntity<MembresiaResponseDto> anularMembresiaConClaveAdmin(
            @PathVariable UUID membresiaId,
            @RequestBody AnularMembresiaRequestDto request
    ) {
        return ResponseEntity.ok(membresiaService.anularMembresiaConClaveAdmin(membresiaId, request));
    }
}

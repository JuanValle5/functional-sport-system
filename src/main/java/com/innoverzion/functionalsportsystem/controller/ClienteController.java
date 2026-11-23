package com.innoverzion.functionalsportsystem.controller;

import com.innoverzion.functionalsportsystem.dto.cliente.*;
import com.innoverzion.functionalsportsystem.service.ClienteService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/clientes")
@RequiredArgsConstructor
public class ClienteController {

    private final ClienteService clienteService;

    @PostMapping
    public ResponseEntity<ClienteResponseDto> registrarCliente(@RequestBody RegistrarClienteRequestDto request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(clienteService.registrarCliente(request));
    }

    @GetMapping
    public ResponseEntity<List<ClienteResponseDto>> listarClientes() {
        return ResponseEntity.ok(clienteService.listarClientes());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ClienteResponseDto> obtenerPorId(@PathVariable UUID id) {
        return ResponseEntity.ok(clienteService.obtenerPorId(id));
    }

    @GetMapping("/documento/{numeroDocumento}")
    public ResponseEntity<ClienteResponseDto> buscarPorDocumento(@PathVariable String numeroDocumento) {
        return ResponseEntity.ok(clienteService.buscarPorNumeroDocumento(numeroDocumento));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ClienteResponseDto> actualizarCliente(
            @PathVariable UUID id,
            @RequestBody ActualizarClienteRequestDto request
    ) {
        return ResponseEntity.ok(clienteService.actualizarCliente(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> eliminarCliente(
            @PathVariable UUID id,
            @RequestBody EliminarClienteRequestDto request
    ) {
        clienteService.eliminarCliente(id, request);
        return ResponseEntity.ok(Map.of("mensaje", "Cliente eliminado exitosamente con autorización de Administrador."));
    }

    @PostMapping("/{id}/huellas")
    public ResponseEntity<HuellaBiometricaResponseDto> enrolarHuella(
            @PathVariable UUID id,
            @RequestBody EnrolarHuellaRequestDto request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(clienteService.enrolarHuella(id, request));
    }

    @GetMapping("/{id}/huellas")
    public ResponseEntity<List<HuellaBiometricaResponseDto>> listarHuellas(@PathVariable UUID id) {
        return ResponseEntity.ok(clienteService.listarHuellasCliente(id));
    }
}

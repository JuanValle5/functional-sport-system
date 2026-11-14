package com.innoverzion.functionalsportsystem.dto.membresia;

import com.innoverzion.functionalsportsystem.domain.enums.CanalRecaudo;

import java.util.UUID;

public record VenderMembresiaRequestDto(
        UUID clienteId,
        String planCodigo,
        UUID vendedorUsuarioId,
        CanalRecaudo canalRecaudo,
        String referenciaComprobante,
        String observaciones
) {
}

package com.innoverzion.functionalsportsystem.domain.entity;

import com.innoverzion.functionalsportsystem.domain.enums.CanalRecaudo;
import com.innoverzion.functionalsportsystem.domain.enums.EstadoPago;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(
    name = "pagos",
    indexes = {
        @Index(name = "idx_pagos_turno_canal", columnList = "turno_caja_id, canal_recaudo, estado")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Pago {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "turno_caja_id", nullable = false)
    private TurnoCaja turnoCaja;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "membresia_id", nullable = false)
    private MembresiaCliente membresia;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "cliente_id", nullable = false)
    private Cliente cliente;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "recibido_por_usuario_id", nullable = false)
    private UsuarioSistema recibidoPorUsuario;

    @Column(name = "fecha_hora_pago", nullable = false)
    @Builder.Default
    private LocalDateTime fechaHoraPago = LocalDateTime.now();

    @Column(name = "monto_cop", nullable = false, precision = 12, scale = 2)
    private BigDecimal montoCop;

    @Enumerated(EnumType.STRING)
    @Column(name = "canal_recaudo", nullable = false, length = 25)
    private CanalRecaudo canalRecaudo;

    @Column(name = "referencia_comprobante", length = 100)
    private String referenciaComprobante;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 25)
    @Builder.Default
    private EstadoPago estado = EstadoPago.ASENTADO;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "anulado_por_admin_id")
    private UsuarioSistema anuladoPorAdmin;

    @Column(name = "motivo_anulacion", columnDefinition = "TEXT")
    private String motivoAnulacion;
}

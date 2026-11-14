package com.innoverzion.functionalsportsystem.domain.entity;

import com.innoverzion.functionalsportsystem.domain.enums.EstadoMembresia;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(
    name = "membresias_cliente",
    indexes = {
        @Index(name = "idx_membresias_cliente_estado", columnList = "cliente_id, estado, fecha_vencimiento_actual")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MembresiaCliente {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "cliente_id", nullable = false)
    private Cliente cliente;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "plan_id", nullable = false)
    private Plan plan;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "vendido_por_usuario_id", nullable = false)
    private UsuarioSistema vendidoPorUsuario;

    @Column(name = "fecha_inicio", nullable = false)
    private LocalDate fechaInicio;

    @Column(name = "fecha_vencimiento_original", nullable = false)
    private LocalDate fechaVencimientoOriginal;

    @Column(name = "fecha_vencimiento_actual", nullable = false)
    private LocalDate fechaVencimientoActual;

    @Column(name = "sesiones_totales")
    private Integer sesionesTotales;

    @Column(name = "sesiones_consumidas", nullable = false)
    @Builder.Default
    private Integer sesionesConsumidas = 0;

    @Column(name = "sesiones_restantes")
    private Integer sesionesRestantes;

    @Column(name = "valor_pagado", nullable = false, precision = 12, scale = 2)
    private BigDecimal valorPagado;

    @Column(name = "saldo_pendiente", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal saldoPendiente = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private EstadoMembresia estado;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "anulada_por_admin_id")
    private UsuarioSistema anuladaPorAdmin;

    @Column(name = "motivo_anulacion", columnDefinition = "TEXT")
    private String motivoAnulacion;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}

package com.innoverzion.functionalsportsystem.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "planes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Plan {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true, length = 30)
    private String codigo;

    @Column(nullable = false, length = 120)
    private String nombre;

    @Column(name = "precio_cop", nullable = false, precision = 12, scale = 2)
    private BigDecimal precioCop;

    @Column(name = "duracion_dias", nullable = false)
    private Integer duracionDias;

    @Column(name = "max_ingresos_por_dia", nullable = false)
    @Builder.Default
    private Integer maxIngresosPorDia = 1;

    @Column(name = "max_ingresos_por_semana")
    private Integer maxIngresosPorSemana;

    @Column(name = "sesiones_totales_tiquetera")
    private Integer sesionesTotalesTiquetera;

    @Column(name = "descuenta_por_marcacion", nullable = false)
    @Builder.Default
    private Boolean descuentaPorMarcacion = false;

    @Column(name = "dias_alerta_amarilla", nullable = false)
    @Builder.Default
    private Integer diasAlertaAmarilla = 3;

    @Column(name = "permite_congelamiento", nullable = false)
    @Builder.Default
    private Boolean permiteCongelamiento = true;

    @Column(nullable = false)
    @Builder.Default
    private Boolean activo = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}

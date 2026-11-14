package com.innoverzion.functionalsportsystem.domain.entity;

import com.innoverzion.functionalsportsystem.domain.enums.EstadoTurnoCaja;
import com.innoverzion.functionalsportsystem.domain.enums.JornadaTurno;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(
    name = "turnos_caja",
    indexes = {
        @Index(name = "idx_turnos_fecha_estado", columnList = "fecha_operacion, estado")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TurnoCaja {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_id", nullable = false)
    private UsuarioSistema usuario;

    @Column(name = "fecha_operacion", nullable = false)
    private LocalDate fechaOperacion;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 15)
    private JornadaTurno jornada;

    @Column(name = "fecha_hora_apertura", nullable = false)
    @Builder.Default
    private LocalDateTime fechaHoraApertura = LocalDateTime.now();

    @Column(name = "fecha_hora_cierre")
    private LocalDateTime fechaHoraCierre;

    @Column(name = "base_inicial_efectivo", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal baseInicialEfectivo = BigDecimal.ZERO;

    @Column(name = "total_efectivo", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal totalEfectivo = BigDecimal.ZERO;

    @Column(name = "total_nequi", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal totalNequi = BigDecimal.ZERO;

    @Column(name = "total_daviplata", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal totalDaviplata = BigDecimal.ZERO;

    @Column(name = "total_bancolombia", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal totalBancolombia = BigDecimal.ZERO;

    @Column(name = "total_llave_bre_b", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal totalLlaveBreB = BigDecimal.ZERO;

    @Column(name = "total_general_recaudo", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal totalGeneralRecaudo = BigDecimal.ZERO;

    @Column(name = "efectivo_fisico_declarado", precision = 12, scale = 2)
    private BigDecimal efectivoFisicoDeclarado;

    @Column(name = "diferencia_efectivo", precision = 12, scale = 2)
    private BigDecimal diferenciaEfectivo;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 15)
    @Builder.Default
    private EstadoTurnoCaja estado = EstadoTurnoCaja.ABIERTO;

    @Column(name = "observaciones_cierre", columnDefinition = "TEXT")
    private String observacionesCierre;
}

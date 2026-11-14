package com.innoverzion.functionalsportsystem.domain.entity;

import com.innoverzion.functionalsportsystem.domain.enums.ColorSemaforo;
import com.innoverzion.functionalsportsystem.domain.enums.MotivoResultadoAcceso;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(
    name = "registros_acceso",
    indexes = {
        @Index(name = "idx_accesos_cliente_fecha", columnList = "cliente_id, fecha_acceso, acceso_autorizado"),
        @Index(name = "idx_accesos_fecha_hora", columnList = "fecha_hora_exacta DESC")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RegistroAcceso {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cliente_id")
    private Cliente cliente;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "membresia_id")
    private MembresiaCliente membresia;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "huella_id")
    private HuellaBiometrica huella;

    @Column(name = "fecha_acceso", nullable = false)
    private LocalDate fechaAcceso;

    @Column(name = "fecha_hora_exacta", nullable = false)
    @Builder.Default
    private LocalDateTime fechaHoraExacta = LocalDateTime.now();

    @Enumerated(EnumType.STRING)
    @Column(name = "color_semaforo", nullable = false, length = 15)
    private ColorSemaforo colorSemaforo;

    @Column(name = "acceso_autorizado", nullable = false)
    private Boolean accesoAutorizado;

    @Enumerated(EnumType.STRING)
    @Column(name = "motivo_resultado", nullable = false, length = 40)
    private MotivoResultadoAcceso motivoResultado;

    @Column(name = "dias_restantes_mostrar")
    private Integer diasRestantesMostrar;

    @Column(name = "sesiones_restantes_mostrar")
    private Integer sesionesRestantesMostrar;

    @Column(name = "pulso_electroiman_enviado", nullable = false)
    @Builder.Default
    private Boolean pulsoElectroimanEnviado = false;

    @Column(name = "tiempo_respuesta_ms")
    private Integer tiempoRespuestaMs;
}

package com.innoverzion.functionalsportsystem.domain.entity;

import com.innoverzion.functionalsportsystem.domain.enums.EstadoCongelamiento;
import com.innoverzion.functionalsportsystem.domain.enums.MotivoCongelamiento;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "congelamientos_membresia")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CongelamientoMembresia {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "membresia_id", nullable = false)
    private MembresiaCliente membresia;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "registrado_por_usuario_id", nullable = false)
    private UsuarioSistema registradoPorUsuario;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "autorizado_por_admin_id", nullable = false)
    private UsuarioSistema autorizadoPorAdmin;

    @Column(name = "fecha_inicio", nullable = false)
    private LocalDate fechaInicio;

    @Column(name = "fecha_fin_estimada")
    private LocalDate fechaFinEstimada;

    @Column(name = "fecha_reanudacion_real")
    private LocalDate fechaReanudacionReal;

    @Column(name = "dias_reconocidos")
    @Builder.Default
    private Integer diasReconocidos = 0;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private MotivoCongelamiento motivo = MotivoCongelamiento.SALUD_ENFERMEDAD;

    @Column(name = "certificado_medico_verificado", nullable = false)
    @Builder.Default
    private Boolean certificadoMedicoVerificado = true;

    @Column(name = "referencia_certificado_medico", nullable = false)
    private String referenciaCertificadoMedico;

    @Column(columnDefinition = "TEXT")
    private String observaciones;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private EstadoCongelamiento estado;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}

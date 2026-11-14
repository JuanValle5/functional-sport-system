package com.innoverzion.functionalsportsystem.domain.entity;

import com.innoverzion.functionalsportsystem.domain.enums.PosicionDedo;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(
    name = "huellas_biometricas",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_cliente_dedo", columnNames = {"cliente_id", "posicion_dedo"})
    },
    indexes = {
        @Index(name = "idx_huellas_cliente_activo", columnList = "cliente_id, activo")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HuellaBiometrica {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "cliente_id", nullable = false)
    private Cliente cliente;

    @Enumerated(EnumType.STRING)
    @Column(name = "posicion_dedo", nullable = false, length = 25)
    private PosicionDedo posicionDedo;

    @Column(name = "template_biometrico", nullable = false)
    private byte[] templateBiometrico;

    @Column(name = "calidad_captura")
    private Integer calidadCaptura;

    @Column(nullable = false)
    @Builder.Default
    private Boolean activo = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}

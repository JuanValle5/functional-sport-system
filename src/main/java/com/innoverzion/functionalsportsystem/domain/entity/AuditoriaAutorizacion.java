package com.innoverzion.functionalsportsystem.domain.entity;

import com.innoverzion.functionalsportsystem.domain.enums.TipoOperacionAuditoria;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "auditoria_autorizaciones")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditoriaAutorizacion {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "admin_usuario_id", nullable = false)
    private UsuarioSistema adminUsuario;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recepcionista_en_turno_id")
    private UsuarioSistema recepcionistaEnTurno;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_operacion", nullable = false, length = 40)
    private TipoOperacionAuditoria tipoOperacion;

    @Column(name = "entidad_afectada", nullable = false, length = 40)
    private String entidadAfectada;

    @Column(name = "entidad_id", nullable = false)
    private UUID entidadId;

    @Column(name = "valor_anterior", columnDefinition = "TEXT")
    private String valorAnterior;

    @Column(name = "valor_nuevo", columnDefinition = "TEXT")
    private String valorNuevo;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String justificacion;

    @Column(name = "fecha_hora", nullable = false)
    @Builder.Default
    private LocalDateTime fechaHora = LocalDateTime.now();
}

package com.innoverzion.functionalsportsystem.domain.entity;

import com.innoverzion.functionalsportsystem.domain.enums.EstadoBackup;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "historial_backups_nube")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HistorialBackupNube {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "fecha_hora_ejecucion", nullable = false)
    @Builder.Default
    private LocalDateTime fechaHoraEjecucion = LocalDateTime.now();

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 25)
    private EstadoBackup estado;

    @Column(name = "nombre_archivo", nullable = false)
    private String nombreArchivo;

    @Column(name = "tamano_bytes")
    private Long tamanoBytes;

    @Column(name = "detalle_resultado", columnDefinition = "TEXT")
    private String detalleResultado;
}

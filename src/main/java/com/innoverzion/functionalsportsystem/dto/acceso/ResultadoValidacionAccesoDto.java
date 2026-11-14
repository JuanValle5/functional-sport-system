package com.innoverzion.functionalsportsystem.dto.acceso;

import com.innoverzion.functionalsportsystem.domain.enums.ColorSemaforo;
import com.innoverzion.functionalsportsystem.domain.enums.MotivoResultadoAcceso;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Representa la respuesta visual para el Monitor de Recepción y Pantalla del Cliente (Sección 2.4 y 2.5):
 * - Nombre y apellidos completos
 * - Nombre del plan activo
 * - Fecha exacta de vencimiento y contador de días restantes
 * - Saldo pendiente / deudas en caja
 * - Operación 100% silenciosa basada en interfaz visual (VERDE, AMARILLO, ROJO)
 */
public record ResultadoValidacionAccesoDto(
        UUID registroAccesoId,
        LocalDateTime fechaHoraExacta,
        boolean accesoAutorizado,
        ColorSemaforo colorSemaforo,
        MotivoResultadoAcceso motivoResultado,
        String mensajePantalla,
        UUID clienteId,
        String clienteNombreCompleto,
        String clienteDocumento,
        String planNombre,
        LocalDate fechaExactaVencimiento,
        Integer diasRestantes,
        Integer sesionesRestantes,
        Integer ingresosEstaSemana,
        Integer maxIngresosPorSemana,
        BigDecimal saldoPendienteCaja,
        boolean operacionSilenciosa,
        boolean pulsoElectroimanEnviado,
        int tiempoRespuestaMs
) {
}

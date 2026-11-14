package com.innoverzion.functionalsportsystem.service;

import com.innoverzion.functionalsportsystem.dto.acceso.ResultadoValidacionAccesoDto;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * Canal de eventos en tiempo real (Server-Sent Events) para actualizar instantáneamente
 * el Monitor de Recepción y la pantalla secundaria para el cliente (Sección 5.3 Fase 1).
 */
@Service
@Slf4j
public class MonitorAccesoSseService {

    private static final long TIMEOUT_INFINITO_LOCAL = 0L;
    private final List<SseEmitter> emisoresConectados = new CopyOnWriteArrayList<>();

    public SseEmitter suscribirPantallaMonitor() {
        SseEmitter emitter = new SseEmitter(TIMEOUT_INFINITO_LOCAL);
        emisoresConectados.add(emitter);

        emitter.onCompletion(() -> emisoresConectados.remove(emitter));
        emitter.onTimeout(() -> emisoresConectados.remove(emitter));
        emitter.onError(ex -> emisoresConectados.remove(emitter));

        return emitter;
    }

    public void notificarPantallasEnTiempoReal(ResultadoValidacionAccesoDto resultado) {
        for (SseEmitter emitter : emisoresConectados) {
            try {
                emitter.send(
                        SseEmitter.event()
                                .name("validacion-acceso")
                                .data(resultado, MediaType.APPLICATION_JSON)
                );
            } catch (IOException e) {
                emisoresConectados.remove(emitter);
            }
        }
    }
}

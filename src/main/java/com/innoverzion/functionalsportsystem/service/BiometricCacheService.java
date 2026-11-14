package com.innoverzion.functionalsportsystem.service;

import com.innoverzion.functionalsportsystem.domain.entity.HuellaBiometrica;
import com.innoverzion.functionalsportsystem.repository.HuellaBiometricaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.Base64;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * Mantiene en memoria RAM local las plantillas biométricas activas capturadas con el lector USB ZKTeco ZK-9500.
 * Permite realizar la identificación 1:N en pocos milisegundos (< 1 segundo requerido en el Módulo 3).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class BiometricCacheService {

    private final HuellaBiometricaRepository huellaBiometricaRepository;

    private final ConcurrentHashMap<UUID, HuellaBiometrica> cacheHuellas = new ConcurrentHashMap<>();
    private final AtomicBoolean inicializado = new AtomicBoolean(false);

    @Transactional(readOnly = true)
    public void sincronizarCacheDesdeBaseDeDatos() {
        List<HuellaBiometrica> activas = huellaBiometricaRepository.findAllActivasConCliente();
        cacheHuellas.clear();
        for (HuellaBiometrica h : activas) {
            cacheHuellas.put(h.getId(), h);
        }
        inicializado.set(true);
        log.info("Caché biométrica ZKTeco sincronizada en RAM: {} plantillas activas cargadas.", cacheHuellas.size());
    }

    public void actualizarHuellaEnCache(HuellaBiometrica huella) {
        if (huella != null && huella.getId() != null) {
            if (Boolean.TRUE.equals(huella.getActivo())) {
                cacheHuellas.put(huella.getId(), huella);
            } else {
                cacheHuellas.remove(huella.getId());
            }
        }
    }

    /**
     * Identifica 1:N en memoria RAM a qué huella y cliente corresponde la plantilla leída por el sensor USB.
     */
    @Transactional(readOnly = true)
    public Optional<HuellaBiometrica> identificarHuella(String templateBiometricoBase64) {
        if (templateBiometricoBase64 == null || templateBiometricoBase64.isBlank()) {
            return Optional.empty();
        }
        if (!inicializado.get()) {
            sincronizarCacheDesdeBaseDeDatos();
        }

        byte[] bytesCapturados = decodificarPlantilla(templateBiometricoBase64);

        for (HuellaBiometrica huellaEnCache : cacheHuellas.values()) {
            if (Arrays.equals(huellaEnCache.getTemplateBiometrico(), bytesCapturados)) {
                return Optional.of(huellaEnCache);
            }
        }
        return Optional.empty();
    }

    public int obtenerCantidadPlantillasEnMemoria() {
        if (!inicializado.get()) {
            sincronizarCacheDesdeBaseDeDatos();
        }
        return cacheHuellas.size();
    }

    public byte[] decodificarPlantilla(String input) {
        try {
            return Base64.getDecoder().decode(input.trim());
        } catch (IllegalArgumentException e) {
            return input.trim().getBytes(StandardCharsets.UTF_8);
        }
    }
}

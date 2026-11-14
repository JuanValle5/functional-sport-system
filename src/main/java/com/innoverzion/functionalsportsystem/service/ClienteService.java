package com.innoverzion.functionalsportsystem.service;

import com.innoverzion.functionalsportsystem.domain.entity.Cliente;
import com.innoverzion.functionalsportsystem.domain.entity.HuellaBiometrica;
import com.innoverzion.functionalsportsystem.domain.enums.EstadoCliente;
import com.innoverzion.functionalsportsystem.dto.cliente.*;
import com.innoverzion.functionalsportsystem.exception.BusinessRuleException;
import com.innoverzion.functionalsportsystem.exception.ResourceNotFoundException;
import com.innoverzion.functionalsportsystem.repository.ClienteRepository;
import com.innoverzion.functionalsportsystem.repository.HuellaBiometricaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ClienteService {

    private final ClienteRepository clienteRepository;
    private final HuellaBiometricaRepository huellaBiometricaRepository;
    private final BiometricCacheService biometricCacheService;

    /**
     * Sección 4.1 y 4.3: Registro de cliente en frío con los campos obligatorios:
     * Documento de identidad (Cédula/TI/Pasaporte), Nombres, Apellidos y Teléfono celular / WhatsApp.
     */
    @Transactional
    public ClienteResponseDto registrarCliente(RegistrarClienteRequestDto request) {
        if (request.tipoDocumento() == null) {
            throw new BusinessRuleException("El tipo de documento (CC, TI, PASAPORTE, CE) es obligatorio.");
        }
        if (request.numeroDocumento() == null || request.numeroDocumento().isBlank()) {
            throw new BusinessRuleException("El número de documento es obligatorio.");
        }
        if (request.nombres() == null || request.nombres().isBlank()) {
            throw new BusinessRuleException("Los nombres del cliente son obligatorios.");
        }
        if (request.apellidos() == null || request.apellidos().isBlank()) {
            throw new BusinessRuleException("Los apellidos del cliente son obligatorios.");
        }
        if (request.telefonoWhatsapp() == null || request.telefonoWhatsapp().isBlank()) {
            throw new BusinessRuleException("El teléfono celular / WhatsApp es obligatorio para notificaciones.");
        }

        String docLimpio = request.numeroDocumento().trim();
        if (clienteRepository.existsByNumeroDocumento(docLimpio)) {
            throw new BusinessRuleException("Ya existe un cliente registrado con el documento: " + docLimpio);
        }

        Cliente nuevo = Cliente.builder()
                .tipoDocumento(request.tipoDocumento())
                .numeroDocumento(docLimpio)
                .nombres(request.nombres().trim())
                .apellidos(request.apellidos().trim())
                .telefonoWhatsapp(request.telefonoWhatsapp().trim())
                .saldoPendienteCaja(BigDecimal.ZERO)
                .estado(EstadoCliente.ACTIVO)
                .observaciones(request.observaciones())
                .build();

        Cliente guardado = clienteRepository.save(nuevo);
        log.info("Cliente registrado: {} {} ({})", guardado.getNombres(), guardado.getApellidos(), guardado.getNumeroDocumento());
        return mapearADto(guardado);
    }

    @Transactional(readOnly = true)
    public ClienteResponseDto buscarPorNumeroDocumento(String numeroDocumento) {
        Cliente cliente = clienteRepository.findByNumeroDocumento(numeroDocumento.trim())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No se encontró ningún cliente con el documento: " + numeroDocumento
                ));
        return mapearADto(cliente);
    }

    @Transactional(readOnly = true)
    public Cliente obtenerEntidadPorId(UUID clienteId) {
        return clienteRepository.findById(clienteId)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente no encontrado con ID: " + clienteId));
    }

    @Transactional(readOnly = true)
    public ClienteResponseDto obtenerPorId(UUID clienteId) {
        return mapearADto(obtenerEntidadPorId(clienteId));
    }

    @Transactional(readOnly = true)
    public List<ClienteResponseDto> listarClientes() {
        return clienteRepository.findAll()
                .stream()
                .map(this::mapearADto)
                .toList();
    }

    @Transactional
    public ClienteResponseDto actualizarCliente(UUID clienteId, ActualizarClienteRequestDto request) {
        Cliente cliente = obtenerEntidadPorId(clienteId);

        if (request.tipoDocumento() != null) {
            cliente.setTipoDocumento(request.tipoDocumento());
        }
        if (request.nombres() != null && !request.nombres().isBlank()) {
            cliente.setNombres(request.nombres().trim());
        }
        if (request.apellidos() != null && !request.apellidos().isBlank()) {
            cliente.setApellidos(request.apellidos().trim());
        }
        if (request.telefonoWhatsapp() != null && !request.telefonoWhatsapp().isBlank()) {
            cliente.setTelefonoWhatsapp(request.telefonoWhatsapp().trim());
        }
        if (request.estado() != null) {
            cliente.setEstado(request.estado());
        }
        if (request.observaciones() != null) {
            cliente.setObservaciones(request.observaciones());
        }

        return mapearADto(clienteRepository.save(cliente));
    }

    /**
     * Enrola o actualiza una huella biométrica capturada por el lector USB ZKTeco para un cliente.
     */
    @Transactional
    public HuellaBiometricaResponseDto enrolarHuella(UUID clienteId, EnrolarHuellaRequestDto request) {
        Cliente cliente = obtenerEntidadPorId(clienteId);

        if (request.posicionDedo() == null) {
            throw new BusinessRuleException("Debe indicar la posición del dedo a enrolar.");
        }
        if (request.templateBiometricoBase64() == null || request.templateBiometricoBase64().isBlank()) {
            throw new BusinessRuleException("La plantilla biométrica capturada por el lector no puede estar vacía.");
        }

        byte[] templateBytes = decodificarPlantilla(request.templateBiometricoBase64());

        HuellaBiometrica huella = huellaBiometricaRepository
                .findByClienteIdAndPosicionDedo(clienteId, request.posicionDedo())
                .map(existente -> {
                    existente.setTemplateBiometrico(templateBytes);
                    existente.setCalidadCaptura(request.calidadCaptura());
                    existente.setActivo(true);
                    return existente;
                })
                .orElseGet(() -> HuellaBiometrica.builder()
                        .cliente(cliente)
                        .posicionDedo(request.posicionDedo())
                        .templateBiometrico(templateBytes)
                        .calidadCaptura(request.calidadCaptura())
                        .activo(true)
                        .build());

        HuellaBiometrica guardada = huellaBiometricaRepository.save(huella);
        biometricCacheService.actualizarHuellaEnCache(guardada);
        log.info("Huella enrolada para cliente {} en dedo {}", cliente.getNumeroDocumento(), guardada.getPosicionDedo());

        return mapearHuellaADto(guardada);
    }

    @Transactional(readOnly = true)
    public List<HuellaBiometricaResponseDto> listarHuellasCliente(UUID clienteId) {
        obtenerEntidadPorId(clienteId);
        return huellaBiometricaRepository.findByClienteIdAndActivoTrue(clienteId)
                .stream()
                .map(this::mapearHuellaADto)
                .toList();
    }

    private byte[] decodificarPlantilla(String input) {
        try {
            return Base64.getDecoder().decode(input.trim());
        } catch (IllegalArgumentException e) {
            return input.trim().getBytes(StandardCharsets.UTF_8);
        }
    }

    public ClienteResponseDto mapearADto(Cliente c) {
        int huellasActivas = huellaBiometricaRepository.findByClienteIdAndActivoTrue(c.getId()).size();
        return new ClienteResponseDto(
                c.getId(),
                c.getTipoDocumento(),
                c.getNumeroDocumento(),
                c.getNombres(),
                c.getApellidos(),
                c.getNombres() + " " + c.getApellidos(),
                c.getTelefonoWhatsapp(),
                c.getSaldoPendienteCaja(),
                c.getEstado(),
                c.getObservaciones(),
                huellasActivas,
                c.getCreatedAt()
        );
    }

    private HuellaBiometricaResponseDto mapearHuellaADto(HuellaBiometrica h) {
        return new HuellaBiometricaResponseDto(
                h.getId(),
                h.getCliente().getId(),
                h.getPosicionDedo(),
                h.getCalidadCaptura(),
                h.getActivo(),
                h.getCreatedAt()
        );
    }
}

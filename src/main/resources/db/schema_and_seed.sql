-- =============================================================================
-- SISTEMA DE CONTROL DE ACCESO BIOMÉTRICO Y GESTIÓN DE MEMBRESÍAS
-- Cliente: Funcional Sport Col (Admin: Jhorman)
-- Motor: PostgreSQL
-- =============================================================================

-- 1. USUARIOS DEL SISTEMA (ADMIN Y RECEPCIONISTA)
CREATE TABLE IF NOT EXISTS usuarios_sistema (
    id UUID PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    nombre_completo VARCHAR(150) NOT NULL,
    numero_documento VARCHAR(30) NOT NULL UNIQUE,
    rol VARCHAR(20) NOT NULL CHECK (rol IN ('ADMIN', 'RECEPCIONISTA')),
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. CLIENTES / DEPORTISTAS
CREATE TABLE IF NOT EXISTS clientes (
    id UUID PRIMARY KEY,
    tipo_documento VARCHAR(20) NOT NULL CHECK (tipo_documento IN ('CC', 'TI', 'PASAPORTE', 'CE')),
    numero_documento VARCHAR(30) NOT NULL UNIQUE,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    telefono_whatsapp VARCHAR(25) NOT NULL,
    saldo_pendiente_caja NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    estado VARCHAR(20) NOT NULL DEFAULT 'ACTIVO' CHECK (estado IN ('ACTIVO', 'INACTIVO', 'SUSPENDIDO')),
    observaciones TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_clientes_numero_documento ON clientes(numero_documento);

-- 3. HUELLAS BIOMÉTRICAS (ZKTECO USB)
CREATE TABLE IF NOT EXISTS huellas_biometricas (
    id UUID PRIMARY KEY,
    cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    posicion_dedo VARCHAR(25) NOT NULL,
    template_biometrico BYTEA NOT NULL,
    calidad_captura INTEGER,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_cliente_dedo UNIQUE (cliente_id, posicion_dedo)
);

CREATE INDEX IF NOT EXISTS idx_huellas_cliente_activo ON huellas_biometricas(cliente_id, activo);

-- 4. CATÁLOGO DE PLANES VIGENTES
CREATE TABLE IF NOT EXISTS planes (
    id UUID PRIMARY KEY,
    codigo VARCHAR(30) NOT NULL UNIQUE,
    nombre VARCHAR(120) NOT NULL,
    precio_cop NUMERIC(12, 2) NOT NULL,
    duracion_dias INTEGER NOT NULL,
    max_ingresos_por_dia INTEGER NOT NULL DEFAULT 1,
    max_ingresos_por_semana INTEGER,
    sesiones_totales_tiquetera INTEGER,
    descuenta_por_marcacion BOOLEAN NOT NULL DEFAULT FALSE,
    dias_alerta_amarilla INTEGER NOT NULL DEFAULT 3,
    permite_congelamiento BOOLEAN NOT NULL DEFAULT TRUE,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 5. MEMBRESÍAS ADQUIRIDAS POR CLIENTE
CREATE TABLE IF NOT EXISTS membresias_cliente (
    id UUID PRIMARY KEY,
    cliente_id UUID NOT NULL REFERENCES clientes(id),
    plan_id UUID NOT NULL REFERENCES planes(id),
    vendido_por_usuario_id UUID NOT NULL REFERENCES usuarios_sistema(id),
    fecha_inicio DATE NOT NULL,
    fecha_vencimiento_original DATE NOT NULL,
    fecha_vencimiento_actual DATE NOT NULL,
    sesiones_totales INTEGER,
    sesiones_consumidas INTEGER NOT NULL DEFAULT 0,
    sesiones_restantes INTEGER,
    valor_pagado NUMERIC(12, 2) NOT NULL,
    saldo_pendiente NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    estado VARCHAR(20) NOT NULL CHECK (estado IN ('ACTIVA', 'CONGELADA', 'VENCIDA', 'AGOTADA', 'ANULADA')),
    anulada_por_admin_id UUID REFERENCES usuarios_sistema(id),
    motivo_anulacion TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_membresias_cliente_estado ON membresias_cliente(cliente_id, estado, fecha_vencimiento_actual);

-- 6. CONGELAMIENTOS DE MEMBRESÍA (EXCLUSIVO SALUD CON CERTIFICADO MÉDICO)
CREATE TABLE IF NOT EXISTS congelamientos_membresia (
    id UUID PRIMARY KEY,
    membresia_id UUID NOT NULL REFERENCES membresias_cliente(id),
    registrado_por_usuario_id UUID NOT NULL REFERENCES usuarios_sistema(id),
    autorizado_por_admin_id UUID NOT NULL REFERENCES usuarios_sistema(id),
    fecha_inicio DATE NOT NULL,
    fecha_fin_estimada DATE,
    fecha_reanudacion_real DATE,
    dias_reconocidos INTEGER DEFAULT 0,
    motivo VARCHAR(30) NOT NULL DEFAULT 'SALUD_ENFERMEDAD' CHECK (motivo = 'SALUD_ENFERMEDAD'),
    certificado_medico_verificado BOOLEAN NOT NULL DEFAULT TRUE CHECK (certificado_medico_verificado = TRUE),
    referencia_certificado_medico VARCHAR(255) NOT NULL,
    observaciones TEXT,
    estado VARCHAR(20) NOT NULL CHECK (estado IN ('ACTIVO', 'FINALIZADO', 'ANULADO')),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 7. REGISTROS DE ACCESO Y VALIDACIÓN EN PANTALLA (ANTI-PASSBACK 1/DÍA)
CREATE TABLE IF NOT EXISTS registros_acceso (
    id UUID PRIMARY KEY,
    cliente_id UUID REFERENCES clientes(id),
    membresia_id UUID REFERENCES membresias_cliente(id),
    huella_id UUID REFERENCES huellas_biometricas(id),
    fecha_acceso DATE NOT NULL,
    fecha_hora_exacta TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    color_semaforo VARCHAR(15) NOT NULL CHECK (color_semaforo IN ('VERDE', 'AMARILLO', 'ROJO')),
    acceso_autorizado BOOLEAN NOT NULL,
    motivo_resultado VARCHAR(40) NOT NULL,
    dias_restantes_mostrar INTEGER,
    sesiones_restantes_mostrar INTEGER,
    pulso_electroiman_enviado BOOLEAN NOT NULL DEFAULT FALSE,
    tiempo_respuesta_ms INTEGER
);

CREATE INDEX IF NOT EXISTS idx_accesos_cliente_fecha ON registros_acceso(cliente_id, fecha_acceso, acceso_autorizado);
CREATE INDEX IF NOT EXISTS idx_accesos_fecha_hora ON registros_acceso(fecha_hora_exacta DESC);

-- 8. TURNOS DE CAJA (MAÑANA Y TARDE)
CREATE TABLE IF NOT EXISTS turnos_caja (
    id UUID PRIMARY KEY,
    usuario_id UUID NOT NULL REFERENCES usuarios_sistema(id),
    fecha_operacion DATE NOT NULL,
    jornada VARCHAR(15) NOT NULL CHECK (jornada IN ('MANANA', 'TARDE')),
    fecha_hora_apertura TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_hora_cierre TIMESTAMP,
    base_inicial_efectivo NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    total_efectivo NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    total_nequi NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    total_daviplata NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    total_bancolombia NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    total_llave_bre_b NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    total_general_recaudo NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    efectivo_fisico_declarado NUMERIC(12, 2),
    diferencia_efectivo NUMERIC(12, 2),
    estado VARCHAR(15) NOT NULL CHECK (estado IN ('ABIERTO', 'CERRADO')),
    observaciones_cierre TEXT
);

CREATE INDEX IF NOT EXISTS idx_turnos_fecha_estado ON turnos_caja(fecha_operacion, estado);

-- 9. PAGOS (PAGO COMPLETO ANTICIPADO OBLIGATORIO - 5 CANALES)
CREATE TABLE IF NOT EXISTS pagos (
    id UUID PRIMARY KEY,
    turno_caja_id UUID NOT NULL REFERENCES turnos_caja(id),
    membresia_id UUID NOT NULL REFERENCES membresias_cliente(id),
    cliente_id UUID NOT NULL REFERENCES clientes(id),
    recibido_por_usuario_id UUID NOT NULL REFERENCES usuarios_sistema(id),
    fecha_hora_pago TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    monto_cop NUMERIC(12, 2) NOT NULL,
    canal_recaudo VARCHAR(25) NOT NULL CHECK (canal_recaudo IN ('EFECTIVO', 'NEQUI', 'DAVIPLATA', 'BANCOLOMBIA', 'LLAVE_BRE_B')),
    referencia_comprobante VARCHAR(100),
    estado VARCHAR(25) NOT NULL DEFAULT 'ASENTADO' CHECK (estado IN ('ASENTADO', 'ANULADO_POR_ADMIN')),
    anulado_por_admin_id UUID REFERENCES usuarios_sistema(id),
    motivo_anulacion TEXT
);

CREATE INDEX IF NOT EXISTS idx_pagos_turno_canal ON pagos(turno_caja_id, canal_recaudo, estado);

-- 10. AUDITORÍA DE AUTORIZACIONES CON CLAVE DE ADMINISTRADOR
CREATE TABLE IF NOT EXISTS auditoria_autorizaciones (
    id UUID PRIMARY KEY,
    admin_usuario_id UUID NOT NULL REFERENCES usuarios_sistema(id),
    recepcionista_en_turno_id UUID REFERENCES usuarios_sistema(id),
    tipo_operacion VARCHAR(40) NOT NULL CHECK (tipo_operacion IN ('ALTERACION_FECHA_VIGENCIA', 'ANULACION_MEMBRESIA', 'ANULACION_PAGO', 'CONGELAMIENTO_MEDICO')),
    entidad_afectada VARCHAR(40) NOT NULL,
    entidad_id UUID NOT NULL,
    valor_anterior TEXT,
    valor_nuevo TEXT,
    justificacion TEXT NOT NULL,
    fecha_hora TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 11. HISTORIAL DE BACKUPS EN LA NUBE
CREATE TABLE IF NOT EXISTS historial_backups_nube (
    id UUID PRIMARY KEY,
    fecha_hora_ejecucion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    estado VARCHAR(25) NOT NULL CHECK (estado IN ('EXITOSO', 'FALLIDO', 'PENDIENTE_REINTENTO')),
    nombre_archivo VARCHAR(255) NOT NULL,
    tamano_bytes BIGINT,
    detalle_resultado TEXT
);

# Funcional Sport Col — Sistema de Control de Acceso Biométrico y Gestión de Membresías

Plataforma Web Local de alta velocidad y cero latencia para validación biométrica con lector **ZKTeco ZK-9500 (USB)**, control de membresías, turnos de caja (Mañana y Tarde) y monitoreo gerencial.

- **Cliente:** Funcional Sport Col (Administrador: Jhorman)
- **Responsable Técnico:** Juan José Valencia Jimenez
- **Stack Tecnológico:** Java 21 + Spring Boot 4 + PostgreSQL Local + Interfaz Web Local 100% Offline (SSE en Tiempo Real)

---

## 1. Requisitos de Despliegue Local en el PC de Recepción

1. **Java 21 JRE/JDK** instalado.
2. **PostgreSQL** ejecutándose localmente en el puerto `5432` con la base de datos `fs_db` creada:
   ```sql
   CREATE DATABASE fs_db;
   ```
3. **Lector Biométrico USB ZKTeco ZK-9500** conectado al puerto USB del computador de recepción.

---

## 2. Ejecución del Sistema

```bash
./mvnw spring-boot:run
```

Al iniciar por primera vez, el sistema ejecuta automáticamente:
- Creación/actualización de las **11 tablas e índices** en PostgreSQL.
- Carga de los **4 planes oficiales de Funcional Sport Col**:
  - `DIA`: Día / Clase (`$10.000 COP` — 1 día, 1 ingreso)
  - `QUINCENA`: Quincena (`$50.000 COP` — 15 días, alerta amarilla a 3 días)
  - `MES_FULL`: Mensualidad Todos los días (`$80.000 COP` — 30 días, alerta amarilla a 3 días)
  - `MES_3XSEM`: Mensualidad 3 días por semana (`$70.000 COP` — 30 días, 12 sesiones, tope de 3 ingresos/semana)
- Creación del usuario Administrador inicial:
  - **Usuario:** `jhorman`
  - **Contraseña inicial:** `ADMIN_JHORMAN_2026`

---

## 3. Pantallas del Sistema Web Local

1. **Consola de Recepción y Administración:**
   - URL: `http://localhost:8080/`
2. **Pantalla Secundaria para el Deportista (Semáforo Silencioso en Tiempo Real):**
   - URL: `http://localhost:8080/monitor-cliente.html`
   - Conectada mediante **Server-Sent Events (`/api/v1/acceso/monitor/stream`)** para reflejar al instante cada lectura de huella en modo 100% silencioso.

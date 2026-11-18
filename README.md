# Funcional Sport Col — Sistema de Control de Acceso Biométrico y Gestión de Membresías

Plataforma Web Local de alta velocidad y cero latencia para validación biométrica con lector **ZKTeco ZK-9500 (USB)**, control de membresías, turnos de caja (Mañana y Tarde) y monitoreo gerencial.

- **Cliente:** Funcional Sport Col (Administrador: Jhorman)
- **Responsable Técnico:** Juan José Valencia Jimenez
- **Arquitectura Local Desacoplada:**
  - **Backend API REST:** Java 21 + Spring Boot 4 + PostgreSQL Local (`http://localhost:8080/api/v1`)
  - **Frontend SPA:** React 18 + Vite en `/frontend` (`http://localhost:5173`)

---

## 1. Requisitos de Despliegue Local en el PC de Recepción

1. **Java 21 JRE/JDK** y **Node.js 20+**.
2. **PostgreSQL** ejecutándose localmente en el puerto `5432` con la base de datos `fs_db` creada:
   ```sql
   CREATE DATABASE fs_db;
   ```
3. **Lector Biométrico USB ZKTeco ZK-9500** conectado al puerto USB del computador de recepción.

---

## 2. Ejecución del Sistema en Local

### 2.1 Iniciar Backend (Spring Boot API REST)
En la raíz del proyecto:
```bash
./mvnw spring-boot:run
```

### 2.2 Iniciar Frontend (React + Vite)
En una segunda terminal dentro de la carpeta `frontend/`:
```bash
cd frontend
npm install
npm run dev
```

---

## 3. Pantallas del Sistema React Local

1. **Consola de Recepción y Administración:**
   - URL: `http://localhost:5173/`
   - **Usuario inicial Admin:** `jhorman` / **Clave:** `ADMIN_JHORMAN_2026`
2. **Pantalla Secundaria para el Deportista (Semáforo Silencioso en Tiempo Real):**
   - URL: `http://localhost:5173/?vista=monitor-cliente`
   - Conectada mediante **Server-Sent Events (`/api/v1/acceso/monitor/stream`)** para reflejar al instante cada lectura de huella en modo 100% silencioso.

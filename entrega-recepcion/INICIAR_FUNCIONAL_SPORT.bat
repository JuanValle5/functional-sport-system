@echo off
title FUNCIONAL SPORT COL - Servidor Local de Recepcion
color 0A

REM ============================================================================
REM CONFIGURACION DE CONEXION A POSTGRESQL LOCAL (Editar si cambia la clave)
REM ============================================================================
set DB_HOST=localhost
set DB_PORT=5432
set DB_NAME=fs_db
set DB_USER=postgres
set DB_PASS=1287985dbc
set APP_PORT=8080

echo ============================================================================
echo   FUNCIONAL SPORT COL - SISTEMA DE CONTROL BIOMETRICO Y MEMBRESIAS
echo   Optimizado para Portatil de Recepcion (AMD E1-6015 / 8GB RAM)
echo ============================================================================
echo.
echo [1/3] Verificando Java 21...
java -version >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo [ERROR] No se encontro Java instalado en este computador.
    echo Por favor instale Java 21 (Adoptium Temurin 21 x64 MSI) antes de iniciar.
    pause
    exit /b 1
)

echo [2/3] Abriendo el navegador automaticamente en 7 segundos...
start "" cmd /c "timeout /t 7 /nobreak >nul && start http://localhost:%APP_PORT%"

echo [3/3] Iniciando servidor local en http://localhost:%APP_PORT% ...
echo (NO CIERRE ESTA VENTANA MIENTRAS EL GIMNASIO ESTE EN OPERACION)
echo.

java -Xms128m -Xmx512m -XX:+UseSerialGC ^
  -jar "%~dp0functional-sport-system.jar" ^
  --server.port=%APP_PORT% ^
  --spring.datasource.url=jdbc:postgresql://%DB_HOST%:%DB_PORT%/%DB_NAME% ^
  --spring.datasource.username=%DB_USER% ^
  --spring.datasource.password=%DB_PASS% ^
  --spring.jpa.show-sql=false

pause

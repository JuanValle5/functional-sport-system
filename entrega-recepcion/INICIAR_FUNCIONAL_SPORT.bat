@echo off
title FUNCIONAL SPORT COL - Servidor Local de Recepcion
color 0A
cd /d "%~dp0"
start "" cmd /c "timeout /t 8 >nul && start http://localhost:8080"
java -Xmx512m -jar functional-sport-system.jar --spring.datasource.password=191016
pause

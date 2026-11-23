#!/usr/bin/env bash
set -e

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT_DIR"

echo "======================================================================"
echo " 1/4 Compilando Frontend React + Vite (producción)..."
echo "======================================================================"
npm --prefix "$ROOT_DIR/frontend" run build

echo "======================================================================"
echo " 2/4 Integrando assets de React optimizados dentro del recurso estático..."
echo "======================================================================"
rm -rf "$ROOT_DIR/src/main/resources/static"
mkdir -p "$ROOT_DIR/src/main/resources/static/logos"

cp "$ROOT_DIR/frontend/dist/index.html" "$ROOT_DIR/src/main/resources/static/"
cp -r "$ROOT_DIR/frontend/dist/assets" "$ROOT_DIR/src/main/resources/static/"
cp "$ROOT_DIR/frontend/dist/logos/favicon.png" "$ROOT_DIR/src/main/resources/static/logos/"
cp "$ROOT_DIR/frontend/dist/logos/web-"*.png "$ROOT_DIR/src/main/resources/static/logos/"

echo "======================================================================"
echo " 3/4 Empaquetando ejecutable único functional-sport-system.jar..."
echo "======================================================================"
./mvnw clean package -DskipTests

mkdir -p "$ROOT_DIR/entrega-recepcion"
cp "$ROOT_DIR/target/functional-sport-system-0.0.1-SNAPSHOT.jar" "$ROOT_DIR/entrega-recepcion/functional-sport-system.jar"

echo "======================================================================"
echo " 4/4 Limpiando recursos temporales de desarrollo..."
echo "======================================================================"
rm -rf "$ROOT_DIR/src/main/resources/static"

echo ""
echo "✓ LISTO: Paquete de entrega generado en:"
ls -lh "$ROOT_DIR/entrega-recepcion/"

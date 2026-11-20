#!/usr/bin/env bash
set -euo pipefail

# Instala las dependencias y ejecuta las pruebas locales.
npm install
npm test

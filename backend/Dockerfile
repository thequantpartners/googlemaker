# Usa una imagen oficial de Python ligera
FROM python:3.11-slim

# Evitar que Python escriba archivos .pyc y forzar que la salida estándar y de error se envíen directamente al terminal (útil para logs)
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Establecer el directorio de trabajo dentro del contenedor
WORKDIR /app

# Instalar dependencias del sistema necesarias para construir algunos paquetes (por ejemplo, asyncpg)
RUN apt-get update \
    && apt-get install -y --no-install-recommends gcc build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copiar el archivo de dependencias
COPY requirements.txt .

# Instalar las dependencias
RUN pip install --no-cache-dir -r requirements.txt

# Copiar el resto del código de la aplicación
COPY . .

# Comando para ejecutar la aplicación (Railway por defecto inyecta la variable PORT, si no existe usa 8000)
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}

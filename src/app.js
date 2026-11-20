'use strict';

const express = require('express');

function validId(rawId) {
  if (!/^\d+$/.test(String(rawId))) return null;
  const id = Number(rawId);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function validateBook(body) {
  const errors = [];
  const titulo = typeof body?.titulo === 'string' ? body.titulo.trim() : '';
  const autor = typeof body?.autor === 'string' ? body.autor.trim() : '';
  const anio = body?.anio_publicacion;
  const currentYear = new Date().getFullYear();

  if (!titulo) errors.push('titulo es obligatorio y no puede estar vacío.');
  if (!autor) errors.push('autor es obligatorio y no puede estar vacío.');
  if (!Number.isInteger(anio) || anio < 0 || anio > currentYear) {
    errors.push(`anio_publicacion debe ser un entero entre 0 y ${currentYear}.`);
  }

  return {
    valid: errors.length === 0,
    errors,
    value: { titulo, autor, anio_publicacion: anio }
  };
}

function createApp({ booksRepository } = {}) {
  if (!booksRepository) throw new Error('Se requiere booksRepository.');

  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '32kb' }));

  app.get('/health', (_req, res) => {
    res.status(200).json({
      status: 'ok',
      service: 'api-libros',
      version: process.env.APP_VERSION || 'local'
    });
  });

  app.get('/libros', async (_req, res) => {
    const libros = await booksRepository.findAll();
    res.status(200).json(libros);
  });

  app.get('/libros/:id', async (req, res) => {
    const id = validId(req.params.id);
    if (!id) return res.status(400).json({ error: 'El id debe ser un entero positivo.' });

    const libro = await booksRepository.findById(id);
    if (!libro) return res.status(404).json({ error: 'Libro no encontrado.' });
    return res.status(200).json(libro);
  });

  app.post('/libros', async (req, res) => {
    const validation = validateBook(req.body);
    if (!validation.valid) return res.status(400).json({ error: 'Datos inválidos.', detalles: validation.errors });

    const libro = await booksRepository.create(validation.value);
    return res.status(201).json(libro);
  });

  app.put('/libros/:id', async (req, res) => {
    const id = validId(req.params.id);
    if (!id) return res.status(400).json({ error: 'El id debe ser un entero positivo.' });

    const validation = validateBook(req.body);
    if (!validation.valid) return res.status(400).json({ error: 'Datos inválidos.', detalles: validation.errors });

    const libro = await booksRepository.update(id, validation.value);
    if (!libro) return res.status(404).json({ error: 'Libro no encontrado.' });
    return res.status(200).json(libro);
  });

  app.delete('/libros/:id', async (req, res) => {
    const id = validId(req.params.id);
    if (!id) return res.status(400).json({ error: 'El id debe ser un entero positivo.' });

    const deleted = await booksRepository.remove(id);
    if (!deleted) return res.status(404).json({ error: 'Libro no encontrado.' });
    return res.status(200).json({ mensaje: 'Libro eliminado correctamente.', id });
  });

  app.use((err, _req, res, _next) => {
    // No se envían detalles internos, SQL ni credenciales al cliente.
    if (err?.type === 'entity.parse.failed') {
      return res.status(400).json({ error: 'El cuerpo debe contener JSON válido.' });
    }
    console.error('Error de la API:', err.message);
    return res.status(500).json({ error: 'Error interno del servidor.' });
  });

  return app;
}

module.exports = { createApp, validateBook, validId };

'use strict';

const request = require('supertest');
const { createApp } = require('../src/app');

function createFakeRepository() {
  const books = new Map();
  let nextId = 1;
  return {
    findAll: jest.fn(async () => [...books.values()]),
    findById: jest.fn(async (id) => books.get(id) || null),
    create: jest.fn(async (book) => {
      const created = { id: nextId++, ...book };
      books.set(created.id, created);
      return created;
    }),
    update: jest.fn(async (id, book) => {
      if (!books.has(id)) return null;
      const updated = { id, ...book };
      books.set(id, updated);
      return updated;
    }),
    remove: jest.fn(async (id) => books.delete(id))
  };
}

describe('API REST de libros', () => {
  let repository;
  let app;

  beforeEach(() => {
    repository = createFakeRepository();
    app = createApp({ booksRepository: repository });
  });

  test('GET /health devuelve 200 y estado activo', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ status: 'ok', service: 'api-libros' });
    expect(response.body.version).toBeDefined();
  });

  test('POST /libros crea un libro válido y devuelve 201', async () => {
    const response = await request(app).post('/libros').send({
      titulo: 'Cien años de soledad',
      autor: 'Gabriel García Márquez',
      anio_publicacion: 1967
    });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      id: 1,
      titulo: 'Cien años de soledad',
      autor: 'Gabriel García Márquez',
      anio_publicacion: 1967
    });
    expect(repository.create).toHaveBeenCalledTimes(1);
  });

  test('POST /libros rechaza datos inválidos con 400', async () => {
    const response = await request(app).post('/libros').send({
      titulo: '   ',
      autor: '',
      anio_publicacion: 'no-es-un-entero'
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Datos inválidos.');
    expect(repository.create).not.toHaveBeenCalled();
  });

  test('GET /libros/:id devuelve 404 si el libro no existe', async () => {
    const response = await request(app).get('/libros/987654');
    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Libro no encontrado.');
  });

  test('permite consultar, actualizar y eliminar un libro', async () => {
    const created = await request(app).post('/libros').send({
      titulo: 'El principito', autor: 'Antoine de Saint-Exupéry', anio_publicacion: 1943
    });
    const id = created.body.id;

    const read = await request(app).get(`/libros/${id}`);
    expect(read.status).toBe(200);

    const updated = await request(app).put(`/libros/${id}`).send({
      titulo: 'El principito (edición revisada)', autor: 'Antoine de Saint-Exupéry', anio_publicacion: 1943
    });
    expect(updated.status).toBe(200);
    expect(updated.body.titulo).toContain('revisada');

    const removed = await request(app).delete(`/libros/${id}`);
    expect(removed.status).toBe(200);

    const missing = await request(app).get(`/libros/${id}`);
    expect(missing.status).toBe(404);
  });
});

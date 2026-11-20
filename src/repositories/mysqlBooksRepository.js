'use strict';

const mysql = require('mysql2/promise');

function createPoolFromEnv(env = process.env) {
  const required = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
  const missing = required.filter((key) => !env[key]);
  if (missing.length) throw new Error(`Faltan variables de entorno: ${missing.join(', ')}`);

  return mysql.createPool({
    host: env.DB_HOST,
    port: Number(env.DB_PORT || 3306),
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    waitForConnections: true,
    connectionLimit: Number(env.DB_CONNECTION_LIMIT || 10),
    queueLimit: 0,
    charset: 'utf8mb4',
    enableKeepAlive: true
  });
}

function createMysqlBooksRepository(pool) {
  return {
    async findAll() {
      const [rows] = await pool.execute(
        'SELECT id, titulo, autor, anio_publicacion FROM libros ORDER BY id ASC'
      );
      return rows;
    },

    async findById(id) {
      const [rows] = await pool.execute(
        'SELECT id, titulo, autor, anio_publicacion FROM libros WHERE id = ?',
        [id]
      );
      return rows[0] || null;
    },

    async create(book) {
      const [result] = await pool.execute(
        'INSERT INTO libros (titulo, autor, anio_publicacion) VALUES (?, ?, ?)',
        [book.titulo, book.autor, book.anio_publicacion]
      );
      return { id: result.insertId, ...book };
    },

    async update(id, book) {
      const [result] = await pool.execute(
        'UPDATE libros SET titulo = ?, autor = ?, anio_publicacion = ? WHERE id = ?',
        [book.titulo, book.autor, book.anio_publicacion, id]
      );
      if (result.affectedRows === 0) {
        // MySQL puede reportar 0 filas modificadas cuando el registro ya tenía esos valores.
        const [rows] = await pool.execute('SELECT id FROM libros WHERE id = ?', [id]);
        if (rows.length === 0) return null;
      }
      return { id, ...book };
    },

    async remove(id) {
      const [result] = await pool.execute('DELETE FROM libros WHERE id = ?', [id]);
      return result.affectedRows > 0;
    }
  };
}

module.exports = { createPoolFromEnv, createMysqlBooksRepository };

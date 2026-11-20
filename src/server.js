'use strict';

require('dotenv').config();

const { createApp } = require('./app');
const { createPoolFromEnv, createMysqlBooksRepository } = require('./repositories/mysqlBooksRepository');

async function main() {
  const pool = createPoolFromEnv();
  const repository = createMysqlBooksRepository(pool);
  const app = createApp({ booksRepository: repository });
  const port = Number(process.env.PORT || 3000);

  const server = app.listen(port, '0.0.0.0', () => {
    console.log(`API de libros escuchando en el puerto ${port}`);
  });

  const shutdown = async (signal) => {
    console.log(`${signal}: cerrando API...`);
    server.close(async () => {
      await pool.end();
      process.exit(0);
    });
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((error) => {
  console.error('No se pudo iniciar la API:', error.message);
  process.exit(1);
});

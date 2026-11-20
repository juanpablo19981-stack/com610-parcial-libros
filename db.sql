CREATE TABLE IF NOT EXISTS libros (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    titulo VARCHAR(255) NOT NULL,
    autor VARCHAR(255) NOT NULL,
    anio_publicacion SMALLINT UNSIGNED NOT NULL,
    PRIMARY KEY (id),
    INDEX idx_libros_autor (autor),
    CONSTRAINT chk_libros_titulo CHECK (CHAR_LENGTH(TRIM(titulo)) > 0),
    CONSTRAINT chk_libros_autor CHECK (CHAR_LENGTH(TRIM(autor)) > 0)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

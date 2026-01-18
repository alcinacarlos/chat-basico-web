
# Chat en tiempo real (Socket.IO + Express + SQLite)

Ejemplo simple de chat web en tiempo real usando **Socket.IO** y **Express**, con persistencia en **SQLite**.

Incluye:

- Mensajes en tiempo real (WebSocket + fallback)
- Persistencia de mensajes en `chat.db`
- Recuperación de mensajes al reconectar (Connection State Recovery)
- Usuario “anónimo” por defecto (se guarda en `localStorage`)
- Detección de bloques PGP (PUBLIC KEY / MESSAGE) con acciones de **Copiar** y **Guardar .asc**

## Requisitos

- Node.js **18+** (usa ESM y `await` a nivel superior)
- npm

## Instalación

```bash
npm install
```

## Ejecutar

```bash
npm start
```

Luego abre:

- http://localhost:3000

## Configuración

- `PORT`: puerto del servidor (por defecto `3000`)

Ejemplo:

```bash
PORT=4000 npm start
```

## Cómo funciona (resumen)

- Servidor: [index.js](index.js)
	- Levanta Express y Socket.IO.
	- Crea/actualiza la tabla `messages` en SQLite:
		- `id` (autoincrement)
		- `client_offset` (único, para evitar duplicados cuando el cliente reintenta)
		- `content` (mensaje)
		- `username` (nombre asociado al socket)
	- Emite a todos los clientes los mensajes guardados.
	- Si el socket se reconecta y no fue “recovered”, reenvía mensajes desde el último `serverOffset`.

- Cliente: [index.html](index.html)
	- Genera un nombre tipo `Anonimo123` y lo persiste en `localStorage`.
	- Envía mensajes con un `clientOffset` incremental para poder reintentar sin duplicar.
	- Renderiza el chat y detecta bloques ASCII-armored PGP:
		- `-----BEGIN PGP PUBLIC KEY BLOCK----- ... -----END PGP PUBLIC KEY BLOCK-----`
		- `-----BEGIN PGP MESSAGE----- ... -----END PGP MESSAGE-----`

## Archivos

- [index.js](index.js): servidor (Express + Socket.IO + SQLite)
- [index.html](index.html): cliente (UI + lógica Socket.IO)
- [package.json](package.json): dependencias y script `start`

## Notas

- La base de datos `chat.db` se crea en el directorio del proyecto.
- Si quieres “resetear” el historial, borra `chat.db` y reinicia el servidor.

## Licencia

MIT


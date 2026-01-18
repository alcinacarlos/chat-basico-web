import express from 'express';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { Server } from 'socket.io';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
const db = await open({
  filename: 'chat.db',
  driver: sqlite3.Database
});

await db.exec(`
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_offset TEXT UNIQUE,
    content TEXT,
    username TEXT
  );
`);

const columns = await db.all("PRAGMA table_info(messages)");
const hasUsernameColumn = columns.some((c) => c.name === 'username');
if (!hasUsernameColumn) {
  await db.exec('ALTER TABLE messages ADD COLUMN username TEXT');
}

const app = express();
const server = createServer(app);
const io = new Server(server, {
  connectionStateRecovery: {},
});

const __dirname = dirname(fileURLToPath(import.meta.url));

app.get('/', (req, res) => {
  res.sendFile(join(__dirname, 'index.html'));
});

function sanitizeUsername(raw) {
  const value = String(raw ?? '').trim();
  const cleaned = value.replace(/[^a-zA-Z0-9_\-]/g, '').slice(0, 24);
  return cleaned;
}

function generateAnonymousUsername() {
  const random = Math.floor(100 + Math.random() * 900);
  return `Anonimo${random}`;
}

io.on('connection', async (socket) => {
  const requested = sanitizeUsername(socket.handshake.auth?.username);
  socket.data.username = requested || generateAnonymousUsername();

  socket.on('chat message', async (msg, clientOffset, callback) => {
    let result;
    try {
      result = await db.run(
        'INSERT INTO messages (content, client_offset, username) VALUES (?, ?, ?)',
        msg,
        clientOffset,
        socket.data.username
      );
    } catch (e) {
      if (e.errno === 19 /* SQLITE_CONSTRAINT */) {
        callback();
      } else {
        // nothing to do, just let the client retry
      }
      return;
    }
    io.emit('chat message', { content: msg, username: socket.data.username }, result.lastID);
    callback();
  });

  if (!socket.recovered) {
    try {
      await db.each(
        'SELECT id, content, username FROM messages WHERE id > ?',
        [socket.handshake.auth.serverOffset || 0],
        (_err, row) => {
          socket.emit('chat message', { content: row.content, username: row.username }, row.id);
        }
      );
    } catch (e) {
      // something went wrong
    }
  }
});

const port = Number.parseInt(process.env.PORT ?? '', 10) || 80;

server.listen(port, () => {
  console.log(`server running at http://localhost:${port}`);
});

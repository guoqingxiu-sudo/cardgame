const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { URL } = require("url");

const PORT = Number(process.env.PORT || 8080);
const ROOT = process.cwd();

const rooms = new Map();
const playerToRoom = new Map();
const socketsByPlayer = new Map();

function randCode(n = 6) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < n; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

function randId() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

function getRoom(code) {
  return rooms.get((code || "").toUpperCase());
}

function makeRoom(hostId) {
  let code = randCode();
  while (rooms.has(code)) code = randCode();
  const room = {
    code,
    hostId,
    seq: 0,
    events: [],
    players: new Set([hostId]),
    createdAt: Date.now()
  };
  rooms.set(code, room);
  playerToRoom.set(hostId, code);
  return room;
}

function emitEvent(room, from, type, payload = {}) {
  room.seq += 1;
  const evt = { seq: room.seq, from, type, payload, t: Date.now() };
  room.events.push(evt);
  if (room.events.length > 500) room.events.splice(0, room.events.length - 350);
  broadcastRoom(room, evt, from);
  return evt;
}

function sendJson(res, code, data) {
  res.writeHead(code, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": "*"
  });
  res.end(JSON.stringify(data));
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let buf = "";
    req.on("data", (d) => {
      buf += d.toString("utf8");
      if (buf.length > 1_000_000) req.destroy();
    });
    req.on("end", () => {
      if (!buf) return resolve({});
      try {
        resolve(JSON.parse(buf));
      } catch (e) {
        reject(e);
      }
    });
    req.on("error", reject);
  });
}

function contentType(file) {
  const ext = path.extname(file).toLowerCase();
  if (ext === ".html") return "text/html; charset=utf-8";
  if (ext === ".css") return "text/css; charset=utf-8";
  if (ext === ".js") return "application/javascript; charset=utf-8";
  if (ext === ".json") return "application/json; charset=utf-8";
  if (ext === ".svg") return "image/svg+xml";
  if (ext === ".png") return "image/png";
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".docx") return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  return "application/octet-stream";
}

function serveStatic(req, res, pathname) {
  let rel = pathname === "/" ? "/index.html" : pathname;
  rel = path.normalize(rel).replace(/^(\.\.[\\/])+/, "");
  const file = path.join(ROOT, rel);
  if (!file.startsWith(ROOT)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }
  fs.readFile(file, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
    res.writeHead(200, { "Content-Type": contentType(file), "Cache-Control": "no-store" });
    res.end(data);
  });
}

function wsAccept(key) {
  return crypto
    .createHash("sha1")
    .update(`${key}258EAFA5-E914-47DA-95CA-C5AB0DC85B11`)
    .digest("base64");
}

function wsSend(socket, obj) {
  if (!socket || socket.destroyed) return;
  const payload = Buffer.from(JSON.stringify(obj), "utf8");
  const len = payload.length;
  let header;
  if (len < 126) {
    header = Buffer.from([0x81, len]);
  } else if (len < 65536) {
    header = Buffer.alloc(4);
    header[0] = 0x81;
    header[1] = 126;
    header.writeUInt16BE(len, 2);
  } else {
    header = Buffer.alloc(10);
    header[0] = 0x81;
    header[1] = 127;
    header.writeBigUInt64BE(BigInt(len), 2);
  }
  socket.write(Buffer.concat([header, payload]));
}

function wsClose(socket) {
  if (!socket || socket.destroyed) return;
  try {
    socket.end(Buffer.from([0x88, 0x00]));
  } catch (_) {}
}

function decodeFrames(buffer) {
  const messages = [];
  let offset = 0;
  while (offset + 2 <= buffer.length) {
    const b0 = buffer[offset];
    const b1 = buffer[offset + 1];
    const fin = (b0 & 0x80) !== 0;
    const opcode = b0 & 0x0f;
    const masked = (b1 & 0x80) !== 0;
    let len = b1 & 0x7f;
    let pos = offset + 2;
    if (len === 126) {
      if (pos + 2 > buffer.length) break;
      len = buffer.readUInt16BE(pos);
      pos += 2;
    } else if (len === 127) {
      if (pos + 8 > buffer.length) break;
      const n = Number(buffer.readBigUInt64BE(pos));
      len = n;
      pos += 8;
    }
    let mask;
    if (masked) {
      if (pos + 4 > buffer.length) break;
      mask = buffer.subarray(pos, pos + 4);
      pos += 4;
    }
    if (pos + len > buffer.length) break;
    const data = Buffer.from(buffer.subarray(pos, pos + len));
    if (masked) {
      for (let i = 0; i < data.length; i++) data[i] ^= mask[i % 4];
    }
    offset = pos + len;
    if (!fin) continue;
    messages.push({ opcode, data });
  }
  return { messages, rest: buffer.subarray(offset) };
}

function getPeerCount(room) {
  return room.players.size;
}

function broadcastRoom(room, evt, excludePlayerId = "") {
  room.players.forEach((pid) => {
    if (pid === excludePlayerId) return;
    const sock = socketsByPlayer.get(pid);
    if (sock) wsSend(sock, { ok: true, event: evt, nowSeq: room.seq, peers: getPeerCount(room) });
  });
}

function onSocketClose(socket) {
  if (!socket.playerId) return;
  const roomCode = playerToRoom.get(socket.playerId);
  socketsByPlayer.delete(socket.playerId);
  if (!roomCode) return;
  const room = getRoom(roomCode);
  if (!room) return;
  emitEvent(room, "system", "peer_disconnected", { playerId: socket.playerId });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    });
    return res.end();
  }

  if (pathname === "/api/create" && req.method === "POST") {
    const playerId = randId();
    const room = makeRoom(playerId);
    emitEvent(room, "system", "room_created", { code: room.code });
    return sendJson(res, 200, { ok: true, roomCode: room.code, playerId, role: "host" });
  }

  if (pathname === "/api/join" && req.method === "POST") {
    try {
      const body = await parseBody(req);
      const room = getRoom(body.roomCode);
      if (!room) return sendJson(res, 404, { ok: false, error: "房间不存在" });
      if (room.players.size >= 2) return sendJson(res, 409, { ok: false, error: "房间已满" });
      const playerId = randId();
      room.players.add(playerId);
      playerToRoom.set(playerId, room.code);
      emitEvent(room, "system", "peer_joined", { playerId });
      return sendJson(res, 200, { ok: true, roomCode: room.code, playerId, role: "guest" });
    } catch (_) {
      return sendJson(res, 400, { ok: false, error: "请求格式错误" });
    }
  }

  if (pathname === "/api/send" && req.method === "POST") {
    try {
      const body = await parseBody(req);
      const room = getRoom(body.roomCode);
      if (!room) return sendJson(res, 404, { ok: false, error: "房间不存在" });
      if (!room.players.has(body.playerId)) return sendJson(res, 403, { ok: false, error: "玩家无效" });
      const evt = emitEvent(room, body.playerId, body.type || "msg", body.payload || {});
      return sendJson(res, 200, { ok: true, seq: evt.seq });
    } catch (_) {
      return sendJson(res, 400, { ok: false, error: "请求格式错误" });
    }
  }

  if (pathname === "/api/poll" && req.method === "GET") {
    const roomCode = (url.searchParams.get("roomCode") || "").toUpperCase();
    const playerId = url.searchParams.get("playerId") || "";
    const since = Number(url.searchParams.get("since") || 0);
    const room = getRoom(roomCode);
    if (!room) return sendJson(res, 404, { ok: false, error: "房间不存在" });
    if (!room.players.has(playerId)) return sendJson(res, 403, { ok: false, error: "玩家无效" });
    const events = room.events.filter((e) => e.seq > since && e.from !== playerId);
    return sendJson(res, 200, { ok: true, events, nowSeq: room.seq, peers: getPeerCount(room) });
  }

  return serveStatic(req, res, pathname);
});

server.on("upgrade", (req, socket) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    if (url.pathname !== "/ws") {
      socket.destroy();
      return;
    }
    const roomCode = (url.searchParams.get("roomCode") || "").toUpperCase();
    const playerId = url.searchParams.get("playerId") || "";
    const room = getRoom(roomCode);
    if (!room || !room.players.has(playerId)) {
      socket.destroy();
      return;
    }
    const key = req.headers["sec-websocket-key"];
    if (!key) {
      socket.destroy();
      return;
    }
    const accept = wsAccept(key);
    socket.write(
      "HTTP/1.1 101 Switching Protocols\r\n" +
      "Upgrade: websocket\r\n" +
      "Connection: Upgrade\r\n" +
      `Sec-WebSocket-Accept: ${accept}\r\n` +
      "\r\n"
    );
    socket.playerId = playerId;
    socket.roomCode = roomCode;
    socket.wsBuf = Buffer.alloc(0);
    socketsByPlayer.set(playerId, socket);
    emitEvent(room, "system", "peer_connected", { playerId });
    wsSend(socket, { ok: true, type: "hello", roomCode, playerId, peers: getPeerCount(room), nowSeq: room.seq });

    socket.on("data", (chunk) => {
      socket.wsBuf = Buffer.concat([socket.wsBuf, chunk]);
      const out = decodeFrames(socket.wsBuf);
      socket.wsBuf = out.rest;
      out.messages.forEach((m) => {
        if (m.opcode === 0x8) {
          wsClose(socket);
          socket.destroy();
          return;
        }
        if (m.opcode === 0x9) {
          socket.write(Buffer.from([0x8a, 0x00]));
          return;
        }
        if (m.opcode !== 0x1) return;
        let parsed;
        try {
          parsed = JSON.parse(m.data.toString("utf8"));
        } catch (_) {
          return;
        }
        if (!parsed || parsed.type === "ping") {
          wsSend(socket, { ok: true, type: "pong", t: Date.now() });
          return;
        }
        const r = getRoom(socket.roomCode);
        if (!r || !r.players.has(socket.playerId)) return;
        emitEvent(r, socket.playerId, parsed.type || "msg", parsed.payload || {});
      });
    });
    socket.on("close", () => onSocketClose(socket));
    socket.on("error", () => onSocketClose(socket));
    socket.on("end", () => onSocketClose(socket));
  } catch (_) {
    socket.destroy();
  }
});

setInterval(() => {
  const now = Date.now();
  rooms.forEach((room, code) => {
    if (now - room.createdAt > 1000 * 60 * 180 && room.players.size === 0) {
      rooms.delete(code);
    }
  });
}, 60_000);

server.listen(PORT, () => {
  console.log(`Server running: http://localhost:${PORT}`);
});


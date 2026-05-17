import express from "express";
import path from "path";
import { createServer as createHttpServer } from "http";
import { Server as SocketServer } from "socket.io";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const httpServer = createHttpServer(app);
  const io = new SocketServer(httpServer, {
    cors: {
      origin: "*",
    },
  });

  const PORT = 3000;

  // Game state for the web demo
  const gameState = {
    players: {} as Record<string, any>,
    monster: {
      position: [0, 0, 0],
      state: "CALM", // CALM, AGGRESSIVE, PACIFIED
      target: null as string | null,
    },
    burnedDollsCount: 0,
    items: [] as any[],
  };

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);
    
    gameState.players[socket.id] = {
      id: socket.id,
      position: [Math.random() * 5, 0, Math.random() * 5],
      rotation: [0, 0, 0],
      isDoll: false,
      inventory: null,
    };

    socket.emit("init", { id: socket.id, gameState });
    socket.broadcast.emit("player:joined", gameState.players[socket.id]);

    socket.on("player:move", (data) => {
      if (gameState.players[socket.id]) {
        gameState.players[socket.id].position = data.position;
        gameState.players[socket.id].rotation = data.rotation;
        socket.broadcast.emit("player:moved", { id: socket.id, ...data });
      }
    });

    socket.on("disconnect", () => {
      delete gameState.players[socket.id];
      io.emit("player:left", socket.id);
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

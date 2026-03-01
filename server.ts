import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import db from "./src/db.ts";
import dotenv from "dotenv";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "quantiva_secret_key_123";

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
    },
  });

  app.use(express.json());

  // --- Auth Routes ---
  app.post("/api/auth/signup", async (req, res) => {
    const { email, password } = req.body;
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const stmt = db.prepare("INSERT INTO users (email, password) VALUES (?, ?)");
      const info = stmt.run(email, hashedPassword);
      const token = jwt.sign({ userId: info.lastInsertRowid }, JWT_SECRET);
      res.json({ token, user: { id: info.lastInsertRowid, email } });
    } catch (e) {
      res.status(400).json({ error: "User already exists or invalid data" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as any;
    if (user && (await bcrypt.compare(password, user.password))) {
      const token = jwt.sign({ userId: user.id }, JWT_SECRET);
      res.json({ token, user: { id: user.id, email: user.email } });
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  });

  // --- Protected Routes Middleware ---
  const authenticate = (req: any, res: any, next: any) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      req.userId = decoded.userId;
      next();
    } catch (e) {
      res.status(401).json({ error: "Invalid token" });
    }
  };

  // --- Trading Routes ---
  app.get("/api/assets", (req, res) => {
    const assets = db.prepare("SELECT * FROM assets").all();
    res.json(assets);
  });

  app.get("/api/signals", authenticate, (req: any, res) => {
    const signals = db.prepare(`
      SELECT s.*, a.symbol, a.name 
      FROM signals s 
      JOIN assets a ON s.asset_id = a.id 
      WHERE s.user_id = ? OR s.user_id IS NULL
      ORDER BY s.created_at DESC
    `).all(req.userId);
    res.json(signals);
  });

  // --- Broker & Account Routes ---
  app.get("/api/broker/accounts", authenticate, (req: any, res) => {
    const accounts = db.prepare("SELECT * FROM broker_accounts WHERE user_id = ?").all(req.userId);
    res.json(accounts);
  });

  app.post("/api/broker/connect", authenticate, (req: any, res) => {
    const { brokerName, accountType, apiKey, apiSecret } = req.body;
    const balance = accountType === 'Demo' ? 10000.0 : 0.0;
    
    // Deactivate others
    db.prepare("UPDATE broker_accounts SET is_selected = 0 WHERE user_id = ?").run(req.userId);
    
    const stmt = db.prepare(`
      INSERT INTO broker_accounts (user_id, broker_name, account_type, balance, api_key, api_secret, active, is_selected)
      VALUES (?, ?, ?, ?, ?, ?, 1, 1)
    `);
    stmt.run(req.userId, brokerName, accountType, balance, apiKey, apiSecret);
    res.json({ success: true });
  });

  app.post("/api/broker/select", authenticate, (req: any, res) => {
    const { accountId } = req.body;
    db.prepare("UPDATE broker_accounts SET is_selected = 0 WHERE user_id = ?").run(req.userId);
    db.prepare("UPDATE broker_accounts SET is_selected = 1 WHERE id = ? AND user_id = ?").run(accountId, req.userId);
    res.json({ success: true });
  });

  app.get("/api/broker/active", authenticate, (req: any, res) => {
    const account = db.prepare("SELECT * FROM broker_accounts WHERE user_id = ? AND is_selected = 1").get(req.userId);
    res.json(account || { broker_name: 'None', account_type: 'Demo', balance: 0, is_selected: 0 });
  });

  app.get("/api/market/heatmap", (req, res) => {
    // Mock heatmap data based on the formula in the request
    const assets = db.prepare("SELECT * FROM assets").all() as any[];
    const heatmap = assets.map(asset => {
      const score = Math.floor(Math.random() * 70) + 30; // 30-100
      let trend = "Neutral";
      if (score >= 80) trend = "Strong Bullish";
      else if (score >= 65) trend = "Bullish";
      else if (score <= 30) trend = "Strong Bearish";
      else if (score <= 45) trend = "Bearish";

      return {
        asset: asset.symbol,
        score,
        trend,
        volume_strength: score > 75 ? "High" : "Normal",
        volatility: "Moderate",
        timeframe: "M15"
      };
    });
    res.json(heatmap);
  });

  // --- Real-time Simulation ---
  const ohlcData: Record<string, any> = {
    XAUUSD: { open: 2035.20, high: 2036.50, low: 2034.80, close: 2035.40, time: Math.floor(Date.now() / 1000) },
    EURUSD: { open: 1.0840, high: 1.0855, low: 1.0835, close: 1.0845, time: Math.floor(Date.now() / 1000) },
    BTCUSD: { open: 64200, high: 64500, low: 64100, close: 64350, time: Math.floor(Date.now() / 1000) },
    ETHUSD: { open: 3450, high: 3480, low: 3440, close: 3465, time: Math.floor(Date.now() / 1000) },
  };

  setInterval(() => {
    Object.keys(ohlcData).forEach(symbol => {
      const last = ohlcData[symbol];
      const change = (Math.random() - 0.5) * (symbol.includes("BTC") ? 50 : 0.5);
      const newClose = parseFloat((last.close + change).toFixed(symbol.includes("BTC") ? 2 : 4));
      
      ohlcData[symbol] = {
        open: last.close,
        high: Math.max(last.close, newClose) + Math.random() * 0.2,
        low: Math.min(last.close, newClose) - Math.random() * 0.2,
        close: newClose,
        time: Math.floor(Date.now() / 1000)
      };
    });
    io.emit("price_update", ohlcData);
  }, 2000);

  // --- Vite Middleware ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
  }

  const PORT = 3000;
  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

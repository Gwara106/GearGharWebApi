import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import { handleDemo } from "./routes/demo";
import { authRouter } from "./routes/auth";
import { adminUsersRouter } from "./routes/admin-users";
import { analyticsRouter } from "./routes/analytics";
import { productsMockRouter } from "./routes/products-mock";
import { reviewsMockRouter } from "./routes/reviews-mock";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
      ? process.env.FRONTEND_URL 
      : ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:8080'],
    credentials: true,
  }));
  app.use(cookieParser());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Serve static files from public directory
  app.use('/uploads', express.static(path.join(process.cwd(), 'public/uploads')));
  app.use('/uploads/profiles', express.static(path.join(process.cwd(), 'public/uploads/users')));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Authentication routes
  app.use("/api/auth", authRouter);

  // Admin user management routes
  app.use("/api/admin/users", adminUsersRouter);

  // Admin analytics routes
  app.use("/api/admin/analytics", analyticsRouter);

  // Products routes
  app.use("/api/products", productsMockRouter);

  // Reviews routes
  app.use("/api/reviews", reviewsMockRouter);

  return app;
}

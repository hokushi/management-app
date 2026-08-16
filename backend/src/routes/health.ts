import type { FastifyInstance } from "fastify";
import { healthController } from "../controllers/health.js";

export async function healthRoutes(app: FastifyInstance) {
  app.get("/health", healthController.liveness);
  app.get("/health/db", healthController.readiness);
}

import "dotenv/config";
import app from "./app";
import { env, isEmailConfigured } from "./config/env";
import { prisma } from "./lib/prisma";
import { inventoryService } from "./services/inventory.service";

const server = app.listen(env.port, () => {
  console.log(`Bergen Car API running on port ${env.port}`);
  console.log(
    isEmailConfigured()
      ? `Email SMTP configured (${env.email.host}) → ${env.email.adminRecipients.join(", ")}`
      : "Email SMTP not configured — lead and newsletter mail will be logged, not sent"
  );
  inventoryService.start();
});

async function shutdown(signal: string) {
  console.log(`${signal} received. Shutting down gracefully...`);
  inventoryService.stop();
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

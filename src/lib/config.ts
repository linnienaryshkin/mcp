import "dotenv/config";
import * as z from "zod/v4";

/**
 * Environment variables schema with validation
 */
const envSchema = z.object({
  // Teams configuration
  TEAMS_WEBHOOK_URL: z
    .url("TEAMS_WEBHOOK_URL must be a valid URL")
    .describe("MS Teams incoming webhook URL for sending messages"),

  // HTTP server configuration (for streamable-http-server)
  PORT: z
    .string()
    .transform((val) => Number(val))
    .pipe(z.number().int().min(1).max(65535))
    .optional()
    .describe("HTTP server port"),

  HOST: z
    .string()
    .optional()
    .describe("HTTP server host"),
});

/**
 * Parse and validate environment variables
 */
function loadConfig() {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const errorMessages = result.error.issues
      .map((err: z.core.$ZodIssue) => `  - ${err.path.join(".")}: ${err.message}`)
      .join("\n");

    console.error("❌ Environment validation failed:\n" + errorMessages);
    console.error("\nCreate a .env file with required variables. See .env.example for template.");
    process.exit(1);
  }

  return result.data;
}

/**
 * Validated environment configuration
 */
const env = loadConfig() as z.infer<typeof envSchema>;

/**
 * Export individual accessors for convenience
 */
export const config = {
  teams: {
    webhookUrl: env.TEAMS_WEBHOOK_URL,
  },
  server: {
    port: env.PORT,
    host: env.HOST,
  },
};

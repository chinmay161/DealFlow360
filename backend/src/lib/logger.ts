import pino from "pino";

const isDevEnv = process.env.NODE_ENV === "development";

export const logger = pino({
  level: process.env.LOG_LEVEL || (isDevEnv ? "debug" : "info"),
  transport: isDevEnv
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:standard",
          ignore: "pid,hostname",
        },
      }
    : undefined,
  base: { service: "dealflow360" },
});

/**
 * Create a child logger scoped to a specific module.
 *
 * @example
 * const log = createModuleLogger("rule-engine");
 * log.info({ quotationId }, "Evaluating quotation");
 */
export function createModuleLogger(module: string) {
  return logger.child({ module });
}

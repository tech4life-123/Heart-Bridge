type Level = "debug" | "info" | "warn" | "error";

/** Never log passwords, tokens, emails, or message content. */
function serialize(value: unknown): unknown {
  if (value instanceof Error) {
    return { name: value.name, message: value.message };
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) out[k] = serialize(v);
    return out;
  }
  return value;
}

function log(level: Level, event: string, meta?: Record<string, unknown>) {
  const line = JSON.stringify({
    t: new Date().toISOString(),
    level,
    event,
    ...(meta ? (serialize(meta) as Record<string, unknown>) : {}),
  });
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const logger = {
  debug: (event: string, meta?: Record<string, unknown>) =>
    log("debug", event, meta),
  info: (event: string, meta?: Record<string, unknown>) =>
    log("info", event, meta),
  warn: (event: string, meta?: Record<string, unknown>) =>
    log("warn", event, meta),
  error: (event: string, meta?: Record<string, unknown>) =>
    log("error", event, meta),
};

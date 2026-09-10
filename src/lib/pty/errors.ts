function devLog(message: string, error: unknown) {
  if (import.meta.env.DEV) console.error(message, error);
}

export function logPtyError(context: string, error: unknown) {
  devLog(`[terminal][frontend] ${context}`, error);
}

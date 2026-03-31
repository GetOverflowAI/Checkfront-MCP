function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const config = {
  host: requireEnv("CHECKFRONT_HOST"),
  token: requireEnv("CHECKFRONT_TOKEN"),
  key: requireEnv("CHECKFRONT_KEY"),
};

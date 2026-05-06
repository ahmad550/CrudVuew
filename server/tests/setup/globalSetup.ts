export default async function globalSetup() {
  // MongoDB connection is handled per-suite via dbHelper.ts
  // MONGO_URI is set via tests/setup/env.ts (loaded by jest setupFiles)
}

// ponytail: Next.js 15 instrumentation hook. Runs once on server start.
// Sentry initializes both Node + Edge here.
export async function register() {
  const { initSentry } = await import("@/lib/sentry");
  initSentry();
}

// Vercel serverless entrypoint. All requests are rewritten here (see
// ../vercel.json) so Express's own router still sees the original path
// (e.g. /auth/login, /checkin/verify) exactly as it does when run locally
// via src/server.ts.
import { app } from "../src/app";

export default app;

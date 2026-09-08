import serverless from 'serverless-http';
import type { Express } from 'express';

// Dynamic import for ESM compatibility
const handler = async (req: any, res: any) => {
  const { default: app } = await import('../server.ts');
  return serverless(app as Express)(req, res);
};

export default handler;
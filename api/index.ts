// @ts-ignore
import app from '../server';

export default function handler(req: any, res: any) {
  if (typeof app === 'function') {
    return app(req, res);
  }
  return (app as any).emit('request', req, res);
}
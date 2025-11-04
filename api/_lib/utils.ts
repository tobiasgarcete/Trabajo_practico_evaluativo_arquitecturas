import { VercelRequest, VercelResponse } from '@vercel/node';

export function send(res: VercelResponse, status: number, data: any) {
  return res.status(status).json(data);
}

export function notFound(res: VercelResponse) {
  return res.status(404).json({ error: 'Not found' });
}

export function corsHeaders(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  return res;
}

export function handleCors(req: VercelRequest, res: VercelResponse): boolean {
  corsHeaders(res);
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return true;
  }
  return false;
}

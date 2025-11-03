import { IncomingMessage, ServerResponse } from 'http';
import { parse } from 'url';

export function send(res: ServerResponse, status: number, data: any, headers: Record<string,string> = {}) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    ...headers
  });
  res.end(body);
}
export function notFound(res: ServerResponse) { send(res, 404, { error: 'Not found' }); }
export function parseUrl(req: IncomingMessage) {
  const parsed = parse(req.url || '', true);
  return { pathname: parsed.pathname || '', query: parsed.query };
}
export async function readBody<T=any>(req: IncomingMessage): Promise<T> {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (c) => data += c);
    req.on('end', () => {
      try { resolve(data ? JSON.parse(data) : {}); } catch (e) { reject(e); }
    });
    req.on('error', reject);
  });
}
export function handleCors(req: IncomingMessage, res: ServerResponse) {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
    });
    res.end();
    return true;
  }
  return false;
}

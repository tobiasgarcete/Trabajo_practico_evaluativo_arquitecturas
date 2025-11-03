import { createServer } from 'http';
import { existsSync, createReadStream } from 'fs';
import { extname, join } from 'path';
import { getDb, asId } from './db';
import { Product, StockMovement, Order } from './types';
import { send, notFound, parseUrl, readBody, handleCors } from './utils';

const port = Number(process.env.PORT || 3001);
const WEB_DIR = join(__dirname, '../../web');
const SRC_WEB_DIR = join(__dirname, '../web');

function fileExists(p: string) { return existsSync(p); }

function serveStatic(pathname: string, res: any) {
  const base = fileExists(join(SRC_WEB_DIR, 'index.html')) ? SRC_WEB_DIR : WEB_DIR;
  let filePath = join(base, pathname === '/' ? 'index.html' : pathname);
  if (!fileExists(filePath)) return false;
  const map: any = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8'
  };
  const type = map[extname(filePath)] || 'application/octet-stream';
  res.writeHead(200, { 'Content-Type': type, 'Access-Control-Allow-Origin': '*' });
  createReadStream(filePath).pipe(res);
  return true;
}

async function router(req: any, res: any) {
  if (handleCors(req, res)) return;

  const { pathname, query } = parseUrl(req);
  if (req.method === 'GET' && (pathname === '/' || pathname.startsWith('/app.js') || pathname.startsWith('/styles.css'))) {
    if (serveStatic(pathname, res)) return;
  }

  if (pathname === '/api/health' && req.method === 'GET') return send(res, 200, { ok: true });

  const db = await getDb();
  const productsCol = db.collection('products');
  const movesCol = db.collection('stock_movements');
  const ordersCol = db.collection('orders');

  // Products
  if (pathname === '/api/products' && req.method === 'GET') {
    const search = (query.search as string) || '';
    const category = (query.category as string) || '';
    const filter: any = {};
    if (search) filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { sku: { $regex: search, $options: 'i' } }
    ];
    if (category) filter.category = category;
    const items = await productsCol.find(filter).sort({ createdAt: -1 }).toArray();
    return send(res, 200, items.map(x => ({ ...x, _id: x._id.toString() })));
  }

  if (pathname === '/api/products' && req.method === 'POST') {
    const body = await readBody<Product>(req);
    if (!body.sku || !body.name) return send(res, 400, { error: 'sku y name son requeridos' });
    const now = new Date();
    const doc: any = { sku: body.sku, name: body.name, category: body.category || '', price: Number(body.price||0), stock: Number(body.stock||0), createdAt: now, updatedAt: now };
    const exists = await productsCol.findOne({ sku: doc.sku });
    if (exists) return send(res, 409, { error: 'SKU ya existe' });
    const r = await productsCol.insertOne(doc);
    return send(res, 201, { ...doc, _id: r.insertedId.toString() });
  }

  if (pathname?.startsWith('/api/products/') && req.method === 'PUT') {
    const id = pathname.split('/').pop() as string;
    const body = await readBody<Partial<Product>>(req);
    body.updatedAt = new Date();
    await productsCol.updateOne({ _id: asId(id) }, { $set: body });
    const updated = await productsCol.findOne({ _id: asId(id) });
    if (!updated) return notFound(res);
    return send(res, 200, { ...updated, _id: updated._id.toString() });
  }

  if (pathname?.startsWith('/api/products/') && req.method === 'DELETE') {
    const id = pathname.split('/').pop() as string;
    await productsCol.deleteOne({ _id: asId(id) });
    return send(res, 204, {});
  }

  // Stock movements
  if (pathname === '/api/stock-movements' && req.method === 'POST') {
    const body = await readBody<StockMovement>(req);
    if (!body.productId || !body.type || !body.qty) return send(res, 400, { error: 'productId, type y qty son requeridos' });
    const prod = await productsCol.findOne({ _id: asId(body.productId) });
    if (!prod) return send(res, 404, { error: 'Producto no encontrado' });
    const delta = body.type === 'IN' ? +Math.abs(body.qty) : -Math.abs(body.qty);
    const newStock = (prod.stock || 0) + delta;
    if (newStock < 0) return send(res, 400, { error: 'Stock insuficiente' });
    const mov = { productId: asId(body.productId), type: body.type, qty: Math.abs(body.qty), reason: body.reason || '', at: new Date() };
    await productsCol.updateOne({ _id: prod._id }, { $set: { stock: newStock, updatedAt: new Date() } });
    const r = await movesCol.insertOne(mov);
    return send(res, 201, { ...mov, _id: r.insertedId.toString(), productId: body.productId, stockAfter: newStock });
  }

  if (pathname === '/api/stock-movements' && req.method === 'GET') {
    const from = query.from ? new Date(String(query.from)) : null;
    const to = query.to ? new Date(String(query.to)) : null;
    const filter: any = {};
    if (from || to) filter.at = {};
    if (from) filter.at.$gte = from;
    if (to) filter.at.$lte = to;
    const items = await movesCol.find(filter).sort({ at: -1 }).toArray();
    return send(res, 200, items.map(x => ({ ...x, _id: x._id.toString(), productId: x.productId.toString() })));
  }

  // Orders
  if (pathname === '/api/orders' && req.method === 'POST') {
    const body = await readBody<Order>(req);
    if (!Array.isArray(body.items) || body.items.length === 0) return send(res, 400, { error: 'items requeridos' });
    let total = 0;
    const items = [];
    for (const it of body.items as any[]) {
      const prod = await productsCol.findOne({ _id: asId(it.productId) });
      if (!prod) return send(res, 404, { error: `Producto no encontrado: ${it.productId}` });
      const qty = Number(it.qty || 0);
      if (qty <= 0) return send(res, 400, { error: 'qty inválida' });
      if ((prod.stock || 0) < qty) return send(res, 400, { error: `Stock insuficiente para ${prod.name}` });
      const price = Number(it.price ?? prod.price ?? 0);
      const subtotal = +(price * qty).toFixed(2);
      total += subtotal;
      items.push({ productId: prod._id, sku: prod.sku, name: prod.name, qty, price, subtotal });
    }
    const number = 'S' + Date.now();
    const orderDoc: any = { number, at: new Date(), items, total: +total.toFixed(2) };
    for (const it of items) {
      await productsCol.updateOne({ _id: it.productId }, { $inc: { stock: -it.qty }, $set: { updatedAt: new Date() } });
      await movesCol.insertOne({ productId: it.productId, type: 'OUT', qty: it.qty, reason: `Venta ${number}`, at: new Date() });
    }
    const r = await ordersCol.insertOne(orderDoc);
    return send(res, 201, { ...orderDoc, _id: r.insertedId.toString(), items: items.map(x => ({ ...x, productId: x.productId.toString() })) });
  }

  if (pathname === '/api/orders' && req.method === 'GET') {
    const from = query.from ? new Date(String(query.from)) : null;
    const to = query.to ? new Date(String(query.to)) : null;
    const filter: any = {};
    if (from || to) filter.at = {};
    if (from) filter.at.$gte = from;
    if (to) filter.at.$lte = to;
    const items = await ordersCol.find(filter).sort({ at: -1 }).toArray();
    return send(res, 200, items.map(x => ({
      ...x, _id: x._id.toString(),
      items: x.items.map((i: any) => ({ ...i, productId: i.productId.toString() }))
    })));
  }

  if (pathname?.startsWith('/api/orders/') && pathname.endsWith('/print') && req.method === 'GET') {
    const id = pathname.split('/')[3];
    const ord = await ordersCol.findOne({ _id: asId(id) });
    if (!ord) return notFound(res);
    const html = renderInvoiceHtml(ord);
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Access-Control-Allow-Origin': '*' });
    return res.end(html);
  }

  return notFound(res);
}

function renderInvoiceHtml(order: any) {
  const rows = order.items.map((i: any) => `<tr><td>${i.sku}</td><td>${i.name}</td><td>${i.qty}</td><td>${i.price.toFixed(2)}</td><td>${i.subtotal.toFixed(2)}</td></tr>`).join('');
  return `<!doctype html>
<html><head><meta charset="utf-8"><title>${order.number}</title>
<style>body{font-family:Arial;margin:32px}table{width:100%;border-collapse:collapse}td,th{border:1px solid #ddd;padding:8px}th{background:#f5f5f5;text-align:left}</style>
</head><body>
<h2>Supermarket — Comprobante ${order.number}</h2>
<p><b>Fecha:</b> ${new Date(order.at).toLocaleString()}</p>
<table><thead><tr><th>SKU</th><th>Producto</th><th>Cant.</th><th>Precio</th><th>Subtotal</th></tr></thead>
<tbody>${rows}</tbody>
<tfoot><tr><th colspan="4" style="text-align:right">Total</th><th>${order.total.toFixed(2)}</th></tr></tfoot>
</table>
<script>window.print()</script>
</body></html>`;
}

createServer(router).listen(port, () => {
  console.log('API listening on http://localhost:' + port);
});

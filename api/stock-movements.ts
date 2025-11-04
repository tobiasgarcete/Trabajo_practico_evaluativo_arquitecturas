import { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb, asId } from './_lib/db';
import { StockMovement } from './_lib/types';
import { send, handleCors } from './_lib/utils';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;

  const db = await getDb();
  const productsCol = db.collection('products');
  const movesCol = db.collection('stock_movements');

  // POST /api/stock-movements
  if (req.method === 'POST') {
    const body = req.body as StockMovement;
    
    if (!body.productId || !body.type || !body.qty) {
      return send(res, 400, { error: 'productId, type y qty son requeridos' });
    }

    const prod = await productsCol.findOne({ _id: asId(body.productId) });
    if (!prod) {
      return send(res, 404, { error: 'Producto no encontrado' });
    }

    const delta = body.type === 'IN' ? +Math.abs(body.qty) : -Math.abs(body.qty);
    const newStock = (prod.stock || 0) + delta;
    
    if (newStock < 0) {
      return send(res, 400, { error: 'Stock insuficiente' });
    }

    const mov = {
      productId: asId(body.productId),
      type: body.type,
      qty: Math.abs(body.qty),
      reason: body.reason || '',
      at: new Date()
    };

    await productsCol.updateOne(
      { _id: prod._id },
      { $set: { stock: newStock, updatedAt: new Date() } }
    );
    
    const r = await movesCol.insertOne(mov);
    
    return send(res, 201, {
      ...mov,
      _id: r.insertedId.toString(),
      productId: body.productId,
      stockAfter: newStock
    });
  }

  // GET /api/stock-movements?from=&to=
  if (req.method === 'GET') {
    const from = req.query.from ? new Date(String(req.query.from)) : null;
    const to = req.query.to ? new Date(String(req.query.to)) : null;
    
    const filter: any = {};
    if (from || to) filter.at = {};
    if (from) filter.at.$gte = from;
    if (to) filter.at.$lte = to;

    const items = await movesCol.find(filter).sort({ at: -1 }).toArray();
    
    return send(res, 200, items.map(x => ({
      ...x,
      _id: x._id.toString(),
      productId: x.productId.toString()
    })));
  }

  return send(res, 405, { error: 'Method not allowed' });
}

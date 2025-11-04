import { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb, asId } from '../_lib/db';
import { Order } from '../_lib/types';
import { send, handleCors } from '../_lib/utils';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;

  const db = await getDb();
  const productsCol = db.collection('products');
  const movesCol = db.collection('stock_movements');
  const ordersCol = db.collection('orders');

  // POST /api/orders
  if (req.method === 'POST') {
    const body = req.body as Order;
    
    if (!Array.isArray(body.items) || body.items.length === 0) {
      return send(res, 400, { error: 'items requeridos' });
    }

    let total = 0;
    const items = [];

    for (const it of body.items as any[]) {
      const prod = await productsCol.findOne({ _id: asId(it.productId) });
      if (!prod) {
        return send(res, 404, { error: `Producto no encontrado: ${it.productId}` });
      }

      const qty = Number(it.qty || 0);
      if (qty <= 0) {
        return send(res, 400, { error: 'qty inválida' });
      }

      if ((prod.stock || 0) < qty) {
        return send(res, 400, { error: `Stock insuficiente para ${prod.name}` });
      }

      const price = Number(it.price ?? prod.price ?? 0);
      const subtotal = +(price * qty).toFixed(2);
      total += subtotal;

      items.push({
        productId: prod._id,
        sku: prod.sku,
        name: prod.name,
        qty,
        price,
        subtotal
      });
    }

    const number = 'S' + Date.now();
    const orderDoc: any = {
      number,
      at: new Date(),
      items,
      total: +total.toFixed(2)
    };

    // Actualizar stock y crear movimientos
    for (const it of items) {
      await productsCol.updateOne(
        { _id: it.productId },
        { $inc: { stock: -it.qty }, $set: { updatedAt: new Date() } }
      );
      
      await movesCol.insertOne({
        productId: it.productId,
        type: 'OUT',
        qty: it.qty,
        reason: `Venta ${number}`,
        at: new Date()
      });
    }

    const r = await ordersCol.insertOne(orderDoc);
    
    return send(res, 201, {
      ...orderDoc,
      _id: r.insertedId.toString(),
      items: items.map(x => ({ ...x, productId: x.productId.toString() }))
    });
  }

  // GET /api/orders?from=&to=
  if (req.method === 'GET') {
    const from = req.query.from ? new Date(String(req.query.from)) : null;
    const to = req.query.to ? new Date(String(req.query.to)) : null;
    
    const filter: any = {};
    if (from || to) filter.at = {};
    if (from) filter.at.$gte = from;
    if (to) filter.at.$lte = to;

    const items = await ordersCol.find(filter).sort({ at: -1 }).toArray();
    
    return send(res, 200, items.map(x => ({
      ...x,
      _id: x._id.toString(),
      items: x.items.map((i: any) => ({ ...i, productId: i.productId.toString() }))
    })));
  }

  return send(res, 405, { error: 'Method not allowed' });
}

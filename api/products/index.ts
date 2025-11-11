import { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb, asId } from '../_lib/db';
import { Product } from '../_lib/types';
import { send, handleCors } from '../_lib/utils';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;

  const db = await getDb();
  const productsCol = db.collection('products');

  // Extraer ID si viene en la URL: /api/products?id=xxx
  const id = req.query.id as string | undefined;

  // PUT /api/products?id=xxx (Actualizar)
  if (req.method === 'PUT' && id) {
    const body = req.body as Partial<Product>;
    body.updatedAt = new Date();
    
    await productsCol.updateOne({ _id: asId(id) }, { $set: body });
    const updated = await productsCol.findOne({ _id: asId(id) });
    
    if (!updated) return send(res, 404, { error: 'Not found' });
    return send(res, 200, { ...updated, _id: updated._id.toString() });
  }

  // DELETE /api/products?id=xxx (Borrar)
  if (req.method === 'DELETE' && id) {
    await productsCol.deleteOne({ _id: asId(id) });
    return send(res, 200, { ok: true });
  }

  // GET /api/products?search=&category=
  if (req.method === 'GET') {
    const search = (req.query.search as string) || '';
    const category = (req.query.category as string) || '';
    
    const filter: any = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } }
      ];
    }
    if (category) filter.category = category;

    const items = await productsCol.find(filter).sort({ createdAt: -1 }).toArray();
    return send(res, 200, items.map(x => ({ ...x, _id: x._id.toString() })));
  }

  // POST /api/products
  if (req.method === 'POST') {
    const body = req.body as Product;
    if (!body.sku || !body.name) {
      return send(res, 400, { error: 'sku y name son requeridos' });
    }

    const now = new Date();
    const doc: any = {
      sku: body.sku,
      name: body.name,
      category: body.category || '',
      price: Number(body.price || 0),
      stock: Number(body.stock || 0),
      createdAt: now,
      updatedAt: now
    };

    const exists = await productsCol.findOne({ sku: doc.sku });
    if (exists) {
      return send(res, 409, { error: 'SKU ya existe' });
    }

    const r = await productsCol.insertOne(doc);
    return send(res, 201, { ...doc, _id: r.insertedId.toString() });
  }

  return send(res, 405, { error: 'Method not allowed' });
}

import { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb, asId } from '../_lib/db';
import { Product } from '../_lib/types';
import { send, notFound, handleCors } from '../_lib/utils';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;

  const { id } = req.query;
  if (!id || typeof id !== 'string') {
    return send(res, 400, { error: 'ID requerido' });
  }

  const db = await getDb();
  const productsCol = db.collection('products');

  // PUT /api/products/:id
  if (req.method === 'PUT') {
    const body = req.body as Partial<Product>;
    body.updatedAt = new Date();
    
    await productsCol.updateOne({ _id: asId(id) }, { $set: body });
    const updated = await productsCol.findOne({ _id: asId(id) });
    
    if (!updated) return notFound(res);
    return send(res, 200, { ...updated, _id: updated._id.toString() });
  }

  // DELETE /api/products/:id
  if (req.method === 'DELETE') {
    await productsCol.deleteOne({ _id: asId(id) });
    return send(res, 204, {});
  }

  return send(res, 405, { error: 'Method not allowed' });
}

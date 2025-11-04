import { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb, asId } from '../../_lib/db';
import { handleCors } from '../../_lib/utils';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;

  const { id } = req.query;
  if (!id || typeof id !== 'string') {
    res.status(400).json({ error: 'ID requerido' });
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const db = await getDb();
  const ordersCol = db.collection('orders');

  const ord = await ordersCol.findOne({ _id: asId(id) });
  if (!ord) {
    res.status(404).json({ error: 'Orden no encontrada' });
    return;
  }

  const html = renderInvoiceHtml(ord);
  
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).send(html);
}

function renderInvoiceHtml(order: any) {
  const rows = order.items
    .map((i: any) => 
      `<tr><td>${i.sku}</td><td>${i.name}</td><td>${i.qty}</td><td>${i.price.toFixed(2)}</td><td>${i.subtotal.toFixed(2)}</td></tr>`
    )
    .join('');
  
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

# Supermarket — Node + TypeScript + Mongo (sin frameworks)

## Estructura
apps/
  api/   # servidor HTTP nativo + Mongo driver
  web/   # HTML/CSS/JS vanilla

## Correr
npm install
cp apps/api/.env.example apps/api/.env
# .env -> MONGODB_URI=mongodb://127.0.0.1:27017  |  MONGODB_DB=supermarket  | PORT=3001
npm run dev
# Abre http://localhost:3001  (sirve estático)  |  Salud: http://localhost:3001/api/health

## Endpoints clave
GET  /api/products?search=&category=
POST /api/products  { sku, name, category, price, stock }
PUT  /api/products/:id
DELETE /api/products/:id
POST /api/stock-movements { productId, type:'IN'|'OUT', qty, reason? }
GET  /api/stock-movements?from=YYYY-MM-DD&to=YYYY-MM-DD
POST /api/orders { items:[{ productId, qty, price? }] }
GET  /api/orders?from=&to=
GET  /api/orders/:id/print  (comprobante A4 imprimible)

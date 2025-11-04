# 📝 Guía Completa: Migración a Serverless

## ✅ MIGRACIÓN COMPLETADA

Tu proyecto ha sido transformado exitosamente de una arquitectura **monolítica tradicional** a una **arquitectura serverless**.

---

## 📊 Comparación: Antes vs Después

### **ANTES** (Arquitectura Monolítica)
```
❌ Servidor HTTP siempre corriendo (Node.js)
❌ Un solo archivo server.ts con todas las rutas
❌ Conexión MongoDB persistente en memoria
❌ Requiere gestionar infraestructura
❌ Escalado manual
❌ Costos fijos (servidor 24/7)
```

### **AHORA** (Arquitectura Serverless)
```
✅ Funciones independientes bajo demanda
✅ Cada endpoint es un archivo separado
✅ Conexión MongoDB optimizada con caché
✅ Zero gestión de servidores
✅ Escalado automático infinito
✅ Pago solo por uso real
```

---

## 🏗️ Estructura Nueva

```
supermarket-mongo-vanilla/
│
├── api/                          # ← FUNCIONES SERVERLESS
│   ├── _lib/                     # Código compartido
│   │   ├── db.ts                # Conexión MongoDB (con caché)
│   │   ├── types.ts             # Tipos TypeScript
│   │   └── utils.ts             # Helpers HTTP
│   │
│   ├── health.ts                # Función: GET /api/health
│   │
│   ├── products/
│   │   ├── index.ts            # Función: GET/POST /api/products
│   │   └── [id].ts             # Función: PUT/DELETE /api/products/:id
│   │
│   ├── stock-movements.ts       # Función: GET/POST /api/stock-movements
│   │
│   └── orders/
│       ├── index.ts            # Función: GET/POST /api/orders
│       └── [id]/
│           └── print.ts        # Función: GET /api/orders/:id/print
│
├── public/                       # ← ARCHIVOS ESTÁTICOS (CDN)
│   ├── index.html
│   ├── app.js
│   └── styles.css
│
├── vercel.json                   # ← CONFIGURACIÓN SERVERLESS
├── tsconfig.json                 # Configuración TypeScript
├── package.json                  # Dependencias actualizadas
├── .env.example                  # Template de variables
└── README.md                     # Documentación completa
```

---

## 🚀 Paso a Paso: Deploy

### **PASO 1: Configurar Variables de Entorno**

Crea un archivo `.env` en la raíz:
```bash
MONGODB_URI=mongodb+srv://usuario:password@cluster.mongodb.net/
MONGODB_DB=supermarket
```

💡 **Recomendación**: Usa MongoDB Atlas (gratis) → https://www.mongodb.com/cloud/atlas

---

### **PASO 2: Probar Localmente**

```bash
# Ya instalaste las dependencias ✅
npm install

# Ejecutar en modo desarrollo
npm run dev
```

Abre: **http://localhost:3000**

---

### **PASO 3: Deploy a Producción**

#### **Opción A: Vercel CLI** (Recomendado)

```bash
# 1. Instalar Vercel CLI globalmente
npm install -g vercel

# 2. Login
vercel login

# 3. Configurar secretos (solo primera vez)
vercel env add MONGODB_URI
# Pega tu URI de MongoDB Atlas

vercel env add MONGODB_DB
# Escribe: supermarket

# 4. Deploy
npm run deploy
```

#### **Opción B: GitHub + Vercel** (Automático)

1. **Sube el código a GitHub**
   ```bash
   git add .
   git commit -m "Migración a serverless"
   git push origin main
   ```

2. **Conecta en Vercel**
   - Ve a https://vercel.com
   - Click en "Import Project"
   - Selecciona tu repositorio
   - Agrega las variables de entorno en Settings:
     - `MONGODB_URI`
     - `MONGODB_DB`

3. **Deploy automático** en cada push 🎉

---

## 🔑 Cambios Clave en el Código

### 1️⃣ **Conexión MongoDB**
```typescript
// ANTES (apps/api/src/db.ts)
let _db: Db;
export async function getDb(): Promise<Db> {
  if (_db) return _db;
  client = new MongoClient(uri);
  _db = client.db(dbName);
  return _db;
}

// AHORA (api/_lib/db.ts)
let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function getDb(): Promise<Db> {
  if (cachedDb) return cachedDb;
  if (!cachedClient) {
    cachedClient = new MongoClient(uri, {
      maxPoolSize: 1,  // ← Optimización serverless
    });
    await cachedClient.connect();
  }
  cachedDb = cachedClient.db(dbName);
  return cachedDb;
}
```

### 2️⃣ **Handler de Funciones**
```typescript
// ANTES (monolítico)
async function router(req: any, res: any) {
  if (pathname === '/api/products' && req.method === 'GET') {
    // lógica...
  }
}
createServer(router).listen(port);

// AHORA (serverless - api/products/index.ts)
import { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb } from '../_lib/db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    const db = await getDb();
    const products = await db.collection('products').find().toArray();
    return res.status(200).json(products);
  }
}
```

### 3️⃣ **Archivos Estáticos**
```
ANTES: Servidos por Node.js (createReadStream)
AHORA: Servidos por Vercel CDN (ultra rápido)
```

---

## 📡 Endpoints (Sin cambios para el cliente)

| Método | Ruta | Función |
|--------|------|---------|
| GET | `/api/health` | `api/health.ts` |
| GET | `/api/products` | `api/products/index.ts` |
| POST | `/api/products` | `api/products/index.ts` |
| PUT | `/api/products/:id` | `api/products/[id].ts` |
| DELETE | `/api/products/:id` | `api/products/[id].ts` |
| GET | `/api/stock-movements` | `api/stock-movements.ts` |
| POST | `/api/stock-movements` | `api/stock-movements.ts` |
| GET | `/api/orders` | `api/orders/index.ts` |
| POST | `/api/orders` | `api/orders/index.ts` |
| GET | `/api/orders/:id/print` | `api/orders/[id]/print.ts` |

---

## ✨ Beneficios de Serverless

### **Escalabilidad**
- ♾️ Escala automáticamente de 0 a millones de peticiones
- 🌍 Distribuido globalmente en edge locations
- ⚡ Sin configuración ni límites

### **Costos**
- 💰 Pago por uso (no por servidor)
- 🆓 Vercel ofrece 100GB-horas/mes gratis
- 📉 Sin costos fijos mensuales

### **Desarrollo**
- 🚀 Deploy en segundos (no minutos)
- 🔄 Rollback instantáneo
- 🔍 Logs y monitoring integrados

### **Mantenimiento**
- ✅ Zero gestión de servidores
- 🔒 Seguridad automática (HTTPS, DDoS)
- 🛠️ Actualizaciones automáticas de runtime

---

## 🐛 Troubleshooting

### **Error: Module '@vercel/node' not found**
```bash
npm install
```

### **Error: MongoDB connection timeout**
- Verifica que `MONGODB_URI` esté configurada
- En MongoDB Atlas, permite todas las IPs: `0.0.0.0/0`

### **Funciones lentas (cold start)**
- Normal después de 5-10 min de inactividad
- Primera invocación: ~1-2 segundos
- Invocaciones subsecuentes: <100ms

### **Error 404 en rutas**
- Verifica que `vercel.json` existe
- Revisa que los archivos en `/api` tengan extensión `.ts`

---

## 📚 Recursos Adicionales

- 📘 [Vercel Functions Documentation](https://vercel.com/docs/functions)
- 🍃 [MongoDB Atlas Setup](https://www.mongodb.com/cloud/atlas)
- 🎓 [Serverless Best Practices](https://vercel.com/docs/concepts/functions/serverless-functions)
- 🔧 [Vercel CLI Reference](https://vercel.com/docs/cli)

---

## ✅ Checklist Post-Migración

- [x] ✅ Estructura serverless creada (`/api`, `/public`)
- [x] ✅ Funciones individuales implementadas
- [x] ✅ Conexión MongoDB optimizada con caché
- [x] ✅ `vercel.json` configurado
- [x] ✅ `package.json` actualizado
- [x] ✅ Documentación README actualizada
- [x] ✅ `.env.example` creado
- [x] ✅ Dependencias instaladas
- [ ] 🔲 Configurar MongoDB Atlas
- [ ] 🔲 Crear `.env` local
- [ ] 🔲 Probar localmente con `npm run dev`
- [ ] 🔲 Deploy a Vercel
- [ ] 🔲 Configurar variables de entorno en Vercel
- [ ] 🔲 Verificar funcionamiento en producción

---

## 🎉 ¡Listo!

Tu proyecto ahora usa **arquitectura serverless moderna**. 

**Próximos pasos:**
1. Configura MongoDB Atlas
2. Ejecuta `npm run dev` para probar
3. Haz `vercel login` y `npm run deploy`
4. ¡Disfruta de tu app serverless! 🚀

---

**¿Preguntas?** Consulta el `README.md` actualizado con toda la documentación.

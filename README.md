# Supermarket — Serverless (Vercel + MongoDB)

## 🚀 Arquitectura Serverless

Este proyecto ha sido migrado a una **arquitectura serverless** usando:
- **Vercel Functions**: Cada endpoint es una función independiente
- **MongoDB Atlas**: Base de datos en la nube (recomendado)
- **Edge Computing**: Despliegue automático y escalado

## 📁 Estructura

```
/
├── api/                      # Funciones serverless
│   ├── _lib/                 # Código compartido
│   │   ├── db.ts            # Conexión MongoDB optimizada
│   │   ├── types.ts         # Tipos TypeScript
│   │   └── utils.ts         # Utilidades HTTP
│   ├── health.ts            # GET /api/health
│   ├── products/
│   │   ├── index.ts         # GET/POST /api/products
│   │   └── [id].ts          # PUT/DELETE /api/products/:id
│   ├── stock-movements.ts   # GET/POST /api/stock-movements
│   └── orders/
│       ├── index.ts         # GET/POST /api/orders
│       └── [id]/
│           └── print.ts     # GET /api/orders/:id/print
├── public/                  # Archivos estáticos (HTML, CSS, JS)
│   ├── index.html
│   ├── app.js
│   └── styles.css
├── vercel.json              # Configuración de Vercel
├── package.json
└── tsconfig.json
```

## 🔧 Setup Local

### 1. Instalar dependencias
```bash
npm install
```

### 2. Configurar MongoDB
Crea un archivo `.env` en la raíz:
```env
MONGODB_URI=mongodb+srv://usuario:password@cluster.mongodb.net/
MONGODB_DB=supermarket
```

**Recomendación**: Usa [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (gratis)

### 3. Ejecutar en desarrollo
```bash
npm run dev
```

Abre http://localhost:3000

## 🌐 Deploy a Producción

### Opción 1: Deploy automático con Vercel CLI

1. Instala Vercel CLI globalmente:
```bash
npm install -g vercel
```

2. Login en Vercel:
```bash
vercel login
```

3. Configurar variables de entorno:
```bash
vercel env add MONGODB_URI
vercel env add MONGODB_DB
```

4. Deploy:
```bash
npm run deploy
```

### Opción 2: Deploy desde GitHub

1. Sube el código a GitHub
2. Conecta el repositorio en [vercel.com](https://vercel.com)
3. Configura las variables de entorno:
   - `MONGODB_URI`
   - `MONGODB_DB`
4. Vercel hará deploy automáticamente en cada push

## 📡 Endpoints API

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/health` | Estado de la API |
| GET | `/api/products?search=&category=` | Lista productos |
| POST | `/api/products` | Crear producto |
| PUT | `/api/products/:id` | Actualizar producto |
| DELETE | `/api/products/:id` | Eliminar producto |
| GET | `/api/stock-movements?from=&to=` | Lista movimientos |
| POST | `/api/stock-movements` | Crear movimiento |
| GET | `/api/orders?from=&to=` | Lista órdenes |
| POST | `/api/orders` | Crear orden |
| GET | `/api/orders/:id/print` | Imprimir comprobante |

## ✨ Ventajas de Serverless

✅ **Escalado automático**: Maneja millones de peticiones sin configuración  
✅ **Pago por uso**: Solo pagas por las invocaciones reales  
✅ **Zero mantenimiento**: No hay servidores que gestionar  
✅ **Deploy instantáneo**: Cambios en producción en segundos  
✅ **Alta disponibilidad**: Distribuido globalmente  
✅ **Cold start optimizado**: Conexión MongoDB con caché  

## 🔄 Migración desde servidor tradicional

### Cambios principales:

1. **Servidor HTTP → Funciones individuales**
   - Cada ruta es ahora un archivo `.ts` en `/api`
   - Usa `VercelRequest` y `VercelResponse`

2. **Conexión DB persistente → Caché de conexión**
   - MongoDB reutiliza conexiones entre invocaciones
   - `maxPoolSize: 1` para serverless

3. **Archivos estáticos en `/public`**
   - Servidos automáticamente por Vercel CDN
   - Ultra rápido globalmente

4. **Variables de entorno en Vercel**
   - Configuradas en el dashboard o CLI
   - No se necesita archivo `.env` en producción

## 🐛 Troubleshooting

**Error: "Cannot find module '@vercel/node'"**
```bash
npm install
```

**Error conexión MongoDB**
- Verifica que `MONGODB_URI` esté configurada
- Permite IPs de Vercel en MongoDB Atlas (0.0.0.0/0)

**Funciones lentas (cold start)**
- Normal en primera invocación después de inactividad
- Se mantiene caliente con tráfico constante

## 📚 Recursos

- [Vercel Functions Docs](https://vercel.com/docs/functions)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- [Serverless Best Practices](https://vercel.com/docs/concepts/functions/serverless-functions)

---

**Antes**: Servidor Node.js tradicional monolítico  
**Ahora**: Arquitectura serverless distribuida y escalable 🎉

# Supermarket Serverless — Resumen Simple

Este proyecto es una aplicación para gestionar productos, ventas y movimientos de stock de un supermercado, usando una arquitectura serverless en Vercel y una base de datos MongoDB Atlas.

## ¿Qué hace?
- Permite agregar, editar y borrar productos.
- Permite registrar ventas rápidas y movimientos de stock.
- Guarda toda la información en MongoDB Atlas.
- El frontend es una página web simple (HTML, CSS, JS).
- El backend son funciones independientes (serverless) que responden a cada endpoint.

## ¿Cómo se ejecuta?

1. Instala las dependencias:
   ```bash
   npm install
   ```
2. Crea el archivo `.env` en la raíz con tus datos de MongoDB:
   ```env
   MONGODB_URI=mongodb+srv://<usuario>:<password>@<cluster>.mongodb.net/
   MONGODB_DB=supermarket
   ```
3. Ejecuta en modo desarrollo:
   ```bash
   npm run dev
   ```
4. Abre en tu navegador:
   ```
   http://localhost:3000
   ```
5. Para desplegar en Vercel:
   ```bash
   npm install -g vercel
   vercel login
   vercel env add MONGODB_URI
   vercel env add MONGODB_DB
   npm run deploy
   ```

## Estructura
- `/api/` — Funciones serverless (endpoints)
- `/public/` — Archivos estáticos (web)
- `vercel.json` — Configuración de Vercel

## Requisitos
- Node.js
- Cuenta en MongoDB Atlas
- Cuenta en Vercel (opcional para deploy)

---
¡Listo! Así puedes probar y desplegar el proyecto de forma sencilla.
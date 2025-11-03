const API = '';

// --- SKU auto ---
function makeSKU({ cat, brand, name, size, variant }) {
  const clean = s => (s||'')
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'') // sin tildes
    .toUpperCase().replace(/[^A-Z0-9]/g,'');         // solo A-Z0-9
  return [
    clean(cat).slice(0,3),
    clean(brand).slice(0,5),
    clean(name).slice(0,6),
    clean(size),
    clean(variant).slice(0,5)
  ].filter(Boolean).join('-');
}

const skuEl = document.querySelector('#sku');
const brandEl = document.querySelector('#brand');
const nameEl = document.querySelector('#name');
const sizeEl = document.querySelector('#size');
const variantEl = document.querySelector('#variant');
const catEl = document.querySelector('#category');

// Si el usuario escribe manualmente en SKU, no volver a pisarlo
function markManual() { skuEl.dataset.manual = '1'; }
skuEl.addEventListener('focus', markManual);
skuEl.addEventListener('input', markManual);

// Autogenerar mientras se tipea
function autoSKU() {
  if (skuEl.dataset.manual === '1') return; // respeta edición manual
  const sku = makeSKU({
    cat: catEl?.value, brand: brandEl?.value, name: nameEl?.value,
    size: sizeEl?.value, variant: variantEl?.value
  });
  skuEl.value = sku;
}
[brandEl, nameEl, sizeEl, variantEl, catEl].forEach(el => el?.addEventListener('input', autoSKU));




async function api(path, opts={}) {
  const res = await fetch(API + path, { headers: { 'Content-Type': 'application/json' }, ...opts });
  if (!res.ok) throw new Error(await res.text());
  return res.headers.get('content-type')?.includes('application/json') ? res.json() : res.text();
}

async function loadProducts() {
  const search = document.querySelector('#search').value.trim();
  const qs = search ? `?search=${encodeURIComponent(search)}` : '';
  const items = await api(`/api/products${qs}`);
  const tbody = document.querySelector('#tbl-products tbody');
  tbody.innerHTML='';
  for (const p of items) {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${p.sku}</td><td>${p.name}</td><td>${p.category||''}</td><td>${p.price?.toFixed?.(2) ?? p.price}</td><td>${p.stock}</td>
    <td>
      <span class="action" data-edit="${p._id}">Editar</span> | 
      <span class="action" data-del="${p._id}">Borrar</span>
    </td>`;
    tbody.appendChild(tr);
  }
}

async function onAddProduct(e){
  e.preventDefault();
  const sku = document.querySelector('#sku').value.trim() ||
              makeSKU({
                cat: document.querySelector('#category').value,
                brand: document.querySelector('#brand').value,
                name: document.querySelector('#name').value,
                size: document.querySelector('#size').value,
                variant: document.querySelector('#variant').value
              });

  const name = document.querySelector('#name').value.trim();
  const category = document.querySelector('#category').value.trim();
  const price = parseFloat(document.querySelector('#price').value);
  const stock = parseInt(document.querySelector('#stock').value);

  await api('/api/products', {
    method:'POST',
    body: JSON.stringify({ sku, name, category, price, stock })
  });

  e.target.reset();
  // permitir que se regenere SKU después de limpiar el form
  const skuEl = document.querySelector('#sku');
  if (skuEl) delete skuEl.dataset.manual;
  await loadProducts();
}
 

document.querySelector('#form-product').addEventListener('submit', onAddProduct);
document.querySelector('#btn-search').addEventListener('click', loadProducts);
document.addEventListener('click', async (e) => {
  const del = e.target.closest('[data-del]');
  const edit = e.target.closest('[data-edit]');
  if (del) {
    if (confirm('¿Borrar producto?')) {
      await api('/api/products/' + del.dataset.del, { method:'DELETE' });
      await loadProducts();
    }
  }
  if (edit) {
    const id = edit.dataset.edit;
    const price = prompt('Nuevo precio:');
    if (price) {
      await api('/api/products/' + id, { method:'PUT', body: JSON.stringify({ price: parseFloat(price) }) });
      await loadProducts();
    }
  }
});

// Venta rápida
document.querySelector('#form-sale').addEventListener('submit', async (e) => {
  e.preventDefault();
  const productIdOrSku = document.querySelector('#sale-product-id').value.trim();
  const qty = parseInt(document.querySelector('#sale-qty').value);
  const list = await api('/api/products?search=' + encodeURIComponent(productIdOrSku));
  let prod = list.find(p => p._id === productIdOrSku || p.sku === productIdOrSku);
  if (!prod) { alert('Producto no encontrado'); return; }
  const order = await api('/api/orders', { method:'POST', body: JSON.stringify({ items: [{ productId: prod._id, qty, price: prod.price }] }) });
  const link = document.querySelector('#sale-print');
  link.href = '/api/orders/' + order._id + '/print';
  link.style.display = 'inline-block';
  await loadProducts();
});

// Movimientos manuales
document.querySelector('#form-move').addEventListener('submit', async (e) => {
  e.preventDefault();
  const productId = document.querySelector('#move-product-id').value.trim();
  const type = document.querySelector('#move-type').value;
  const qty = parseInt(document.querySelector('#move-qty').value);
  const reason = document.querySelector('#move-reason').value.trim();
  await api('/api/stock-movements', { method:'POST', body: JSON.stringify({ productId, type, qty, reason }) });
  await loadProducts();
  await loadMoves();
});

async function loadMoves() {
  const rows = await api('/api/stock-movements');
  const tbody = document.querySelector('#tbl-moves tbody');
  tbody.innerHTML = '';
  for (const m of rows) {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${new Date(m.at).toLocaleString()}</td><td>${m.productId}</td><td>${m.type}</td><td>${m.qty}</td><td>${m.reason||''}</td>`;
    tbody.appendChild(tr);
  }
}

loadProducts();
loadMoves();

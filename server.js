const express = require('express');
const fs = require('node:fs');
const path = require('node:path');

const app = express();
const port = process.env.PORT || 3000;
const dataFile = path.join(__dirname, 'data', 'store.json');

const seedData = {
  nextOrderNumber: 1001,
  products: [
    { id: 'latte', name: 'Latte', price: 18, stock: 6 },
    { id: 'americano', name: 'Americano', price: 12, stock: 8 },
    { id: 'cappuccino', name: 'Cappuccino', price: 20, stock: 7 },
    { id: 'mocha', name: 'Mocha', price: 22, stock: 5 },
    { id: 'chai', name: 'Té chai', price: 14, stock: 9 },
    { id: 'blueberry-muffin', name: 'Muffin de arándanos', price: 16, stock: 6 },
    { id: 'croissant', name: 'Croissant', price: 15, stock: 0 }
  ],
  orders: []
};

function cloneSeed() {
  return JSON.parse(JSON.stringify(seedData));
}

function saveStore(store) {
  fs.mkdirSync(path.dirname(dataFile), { recursive: true });
  fs.writeFileSync(dataFile, JSON.stringify(store, null, 2));
}

function loadStore() {
  if (!fs.existsSync(dataFile)) saveStore(cloneSeed());
  const store = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
  const knownProductIds = new Set(store.products.map((product) => product.id));
  const newProducts = seedData.products.filter((product) => !knownProductIds.has(product.id));

  if (newProducts.length > 0) {
    store.products.push(...newProducts.map((product) => ({ ...product })));
    saveStore(store);
  }

  return store;
}

function money(value) {
  return Math.round(value * 100) / 100;
}

app.use(express.json());

app.get('/api/products', (_request, response) => {
  const store = loadStore();
  response.json({
    products: store.products.map((product) => ({
      ...product,
      available: product.stock > 0
    }))
  });
});

app.post('/api/orders', (request, response) => {
  const items = request.body?.items;
  if (!Array.isArray(items) || items.length === 0) {
    return response.status(400).json({ error: 'El pedido no puede estar vacío.' });
  }

  const store = loadStore();
  const preparedItems = [];

  for (const item of items) {
    if (!item || typeof item.productId !== 'string' || !Number.isInteger(item.quantity) || item.quantity < 1) {
      return response.status(400).json({ error: 'Las cantidades deben ser números enteros mayores que cero.' });
    }

    const product = store.products.find((candidate) => candidate.id === item.productId);
    if (!product) return response.status(400).json({ error: 'El producto seleccionado no existe.' });
    if (product.stock < item.quantity) {
      return response.status(409).json({ error: `No hay existencias suficientes de ${product.name}.` });
    }

    preparedItems.push({ product, quantity: item.quantity });
  }

  const order = {
    id: `ORD-${store.nextOrderNumber++}`,
    items: preparedItems.map(({ product, quantity }) => ({
      productId: product.id,
      name: product.name,
      quantity,
      unitPrice: product.price,
      subtotal: money(product.price * quantity)
    })),
    total: money(preparedItems.reduce((total, { product, quantity }) => total + product.price * quantity, 0)),
    createdAt: new Date().toISOString()
  };

  preparedItems.forEach(({ product, quantity }) => {
    product.stock -= quantity;
  });
  store.orders.push(order);
  saveStore(store);
  return response.status(201).json({ order });
});

app.post('/api/test/reset', (_request, response) => {
  saveStore(cloneSeed());
  response.status(204).end();
});

app.use(express.static(path.join(__dirname, 'public')));
app.get('*splat', (_request, response) => response.sendFile(path.join(__dirname, 'public', 'index.html')));

app.listen(port, () => {
  console.log(`Mi Café disponible en http://127.0.0.1:${port}`);
});

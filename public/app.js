const productsElement = document.querySelector('#products');
const cartItemsElement = document.querySelector('#cart-items');
const emptyCartElement = document.querySelector('#empty-cart');
const totalElement = document.querySelector('#cart-total');
const errorElement = document.querySelector('#order-error');
const successElement = document.querySelector('#order-success');
const confirmButton = document.querySelector('#confirm-order');
const cartElement = document.querySelector('.cart');
const cartHeadingElement = document.querySelector('#cart-heading');
const cartEyebrowElement = document.querySelector('#cart-eyebrow');
const totalRowElement = document.querySelector('.total-row');

let products = [];
const cart = new Map();
let confirmedOrder = null;

const formatMoney = (value) => `Q ${value.toFixed(2)}`;

function clearMessages() {
  errorElement.textContent = '';
  successElement.textContent = '';
}

function cartTotal() {
  return [...cart.entries()].reduce((total, [productId, quantity]) => {
    const product = products.find((candidate) => candidate.id === productId);
    return total + (product ? product.price * quantity : 0);
  }, 0);
}

function renderProducts() {
  productsElement.innerHTML = products.map((product) => `
    <article class="product-card">
      <div>
        <h3>${product.name}</h3>
        <p class="price">${formatMoney(product.price)}</p>
        <p class="availability">${product.available ? `${product.stock} disponibles` : 'Agotado'}</p>
      </div>
      <button data-cy="add-${product.id}" class="secondary" type="button" ${product.available ? '' : 'disabled'}>
        ${product.available ? 'Agregar' : 'Sin existencias'}
      </button>
    </article>`).join('');

  products.forEach((product) => {
    const button = document.querySelector(`[data-cy="add-${product.id}"]`);
    if (button) button.addEventListener('click', () => changeQuantity(product.id, 1));
  });
}

function changeQuantity(productId, change) {
  if (confirmedOrder) startNewOrder();
  const product = products.find((candidate) => candidate.id === productId);
  const current = cart.get(productId) || 0;
  const next = Math.max(0, Math.min(current + change, product.stock));
  if (next === 0) cart.delete(productId);
  else cart.set(productId, next);
  clearMessages();
  renderCart();
}

function renderCart() {
  const entries = [...cart.entries()];
  const isConfirmed = Boolean(confirmedOrder);
  cartElement.classList.toggle('is-confirmed', isConfirmed);
  cartEyebrowElement.textContent = isConfirmed ? 'Orden lista' : 'Pedido actual';
  cartHeadingElement.textContent = isConfirmed ? '¡Pedido confirmado!' : 'Tu carrito';
  totalRowElement.hidden = isConfirmed;
  confirmButton.textContent = isConfirmed ? 'Crear nuevo pedido' : 'Confirmar pedido';

  if (isConfirmed) {
    emptyCartElement.hidden = true;
    cartItemsElement.innerHTML = '';
    successElement.innerHTML = `
      <span class="confirmation-icon" aria-hidden="true">✓</span>
      <div class="confirmation-copy">
        <strong>¡Pedido confirmado!</strong>
        <span>Número de orden</span>
        <b>${confirmedOrder.id}</b>
      </div>
      <div class="confirmation-total">
        <span>Total pagado</span>
        <strong>${formatMoney(confirmedOrder.total)}</strong>
      </div>`;
    return;
  }

  emptyCartElement.hidden = entries.length > 0;
  cartItemsElement.innerHTML = entries.map(([productId, quantity]) => {
    const product = products.find((candidate) => candidate.id === productId);
    return `<li data-cy="cart-item-${productId}" class="cart-item">
      <div><strong>${product.name}</strong><span>${formatMoney(product.price)} c/u</span></div>
      <div class="quantity-control" aria-label="Cantidad de ${product.name}">
        <button data-cy="decrease-${productId}" aria-label="Reducir ${product.name}" type="button">−</button>
        <span>${quantity}</span>
        <button data-cy="increase-${productId}" aria-label="Aumentar ${product.name}" type="button">+</button>
      </div>
    </li>`;
  }).join('');
  totalElement.textContent = formatMoney(cartTotal());

  entries.forEach(([productId]) => {
    document.querySelector(`[data-cy="decrease-${productId}"]`).addEventListener('click', () => changeQuantity(productId, -1));
    document.querySelector(`[data-cy="increase-${productId}"]`).addEventListener('click', () => changeQuantity(productId, 1));
  });
}

function startNewOrder() {
  confirmedOrder = null;
  clearMessages();
  renderCart();
}

async function loadProducts() {
  try {
    const response = await fetch('/api/products');
    if (!response.ok) throw new Error();
    ({ products } = await response.json());
    renderProducts();
    renderCart();
  } catch {
    errorElement.textContent = 'No se pudo cargar el menú. Intenta recargar la página.';
  }
}

async function confirmOrder() {
  clearMessages();
  if (cart.size === 0) {
    errorElement.textContent = 'Agrega al menos un producto antes de confirmar.';
    return;
  }

  confirmButton.disabled = true;
  try {
    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: [...cart.entries()].map(([productId, quantity]) => ({ productId, quantity })) })
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || 'No fue posible confirmar el pedido.');

    confirmedOrder = payload.order;
    cart.clear();
    products = products.map((product) => {
      const ordered = payload.order.items.find((item) => item.productId === product.id);
      return ordered ? { ...product, stock: product.stock - ordered.quantity, available: product.stock - ordered.quantity > 0 } : product;
    });
    renderProducts();
    renderCart();
  } catch (error) {
    errorElement.textContent = error.message;
  } finally {
    confirmButton.disabled = false;
  }
}

confirmButton.addEventListener('click', () => {
  if (confirmedOrder) startNewOrder();
  else confirmOrder();
});
loadProducts();

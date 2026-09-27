describe('Validación del pedido', () => {
  beforeEach(() => {
    cy.request('POST', '/api/test/reset');
    cy.visit('/');
  });

  it('no envía una orden cuando el carrito está vacío', () => {
    cy.intercept('POST', '/api/orders').as('createOrder');

    cy.get('[data-cy="confirm-order"]').click();

    cy.get('[data-cy="order-error"]').should('have.text', 'Agrega al menos un producto antes de confirmar.');
    cy.get('@createOrder.all').should('have.length', 0);
  });
});

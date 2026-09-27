describe('Fallo controlado por existencias', () => {
  beforeEach(() => {
    cy.request('POST', '/api/test/reset');
    cy.visit('/');
  });

  it('muestra el error de stock y permite recuperar el pedido', () => {
    cy.get('[data-cy="add-latte"]').click();
    cy.intercept('POST', '/api/orders', {
      statusCode: 409,
      body: { error: 'No hay existencias suficientes de Latte.' }
    }).as('stockFailure');

    cy.get('[data-cy="confirm-order"]').click();
    cy.wait('@stockFailure').its('response.statusCode').should('eq', 409);
    cy.get('[data-cy="order-error"]').should('have.text', 'No hay existencias suficientes de Latte.');
    cy.get('[data-cy="confirm-order"]').should('be.enabled');
    cy.get('[data-cy="cart-item-latte"]').should('contain.text', 'Latte');
  });
});

describe('Pedido exitoso', () => {
  beforeEach(() => {
    cy.request('POST', '/api/test/reset');
    cy.intercept('GET', '/api/products').as('getProducts');
    cy.visit('/');
    cy.wait('@getProducts');
  });

  it('crea una orden y muestra el identificador con el total persistido', () => {
    cy.get('[data-cy="add-latte"]').click();
    cy.contains('[data-cy="cart-total"]', 'Q 18.00').should('be.visible');
    cy.intercept('POST', '/api/orders').as('createOrder');

    cy.get('[data-cy="confirm-order"]').click();

    cy.wait('@createOrder').then(({ request, response }) => {
      expect(request.body.items).to.deep.equal([{ productId: 'latte', quantity: 1 }
      ]);
      expect(response?.statusCode).to.equal(201);
      expect(response?.body.order.total).to.equal(18);
      expect(response?.body.order.id).to.match(/^ORD-\d+$/);
    });
    cy.get('[data-cy="order-success"]')
      .should('contain.text', '¡Pedido confirmado!')
      .and('contain.text', 'ORD-')
      .and('contain.text', 'Q 18.00');
  });
});

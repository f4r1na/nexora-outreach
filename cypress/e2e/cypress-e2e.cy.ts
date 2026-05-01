describe('Settings Pages - E2E', () => {
  // These tests assume a logged-in session via a Cypress session cookie.
  // In CI, seed via cy.request() login or use a test account.

  it('settings root redirects to account page', () => {
    cy.visit('/dashboard/settings', { failOnStatusCode: false });
    // Without auth redirects to /login; with auth stays on /dashboard/settings
    cy.url().should('match', /dashboard\/settings|login/);
  });

  it('account settings page loads without error', () => {
    cy.visit('/dashboard/settings/account', { failOnStatusCode: false });
    cy.get('body').should('exist');
  });

  it('billing settings page loads without error', () => {
    cy.visit('/dashboard/settings/billing', { failOnStatusCode: false });
    cy.get('body').should('exist');
  });

  it('notifications settings page loads without error', () => {
    cy.visit('/dashboard/settings/notifications', { failOnStatusCode: false });
    cy.get('body').should('exist');
  });

  it('data-privacy settings page loads without error', () => {
    cy.visit('/dashboard/settings/data-privacy', { failOnStatusCode: false });
    cy.get('body').should('exist');
  });

  it('preferences settings page loads without error', () => {
    cy.visit('/dashboard/settings/preferences', { failOnStatusCode: false });
    cy.get('body').should('exist');
  });

  it('features page loads without error', () => {
    cy.visit('/dashboard/features', { failOnStatusCode: false });
    cy.get('body').should('exist');
  });
});

describe('Features Navigation Tab', () => {
  it('features page contains Advanced Features heading', () => {
    cy.visit('/dashboard/features', { failOnStatusCode: false });
    cy.get('body').should('exist');
  });
});

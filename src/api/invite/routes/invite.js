'use strict';

/**
 * invite router.
 * Différentes routes de manipulation des invitations
 */
module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/crd/inscription',
      handler: 'invite.create',
    },
    {
      method: 'GET',
      path: '/crd/inscription',
      handler: 'invite.get',
    },
    {
      method: 'GET',
      path: '/crd/inscriptions',
      handler: 'invite.get',
    },
    {
      method: 'GET',
      path: '/crd/inscriptions/accompagnants',
      handler: 'invite.getAccompagnants',
    },
    {
      method: 'GET',
      path: '/crd/inscriptions/accompagnants/csv',
      handler: 'invite.getAccompagnantsCSV',
    },
    {
      method: 'GET',
      path: '/crd/',
      handler: 'invite.getStats',
    },
    /* DEBUG */
    {
      method: 'GET',
      path: '/crd/debug/email/save',
      handler: 'invite.testEmailSave',
    },
    {
      method: 'GET',
      path: '/crd/debug/email/save/:email',
      handler: 'invite.testEmailSave',
    },

    {
      method: 'GET',
      path: '/crd/debug/email/inscription',
      handler: 'invite.testEmailInscription',
    },
    {
      method: 'GET',
      path: '/crd/debug/email/inscription/:email',
      handler: 'invite.testEmailInscription',
    },
    {
      method: 'GET',
      path: '/crd/debug/email/confirmation',
      handler: 'invite.testEmailConfirmationInscription',
    },
    {
      method: 'GET',
      path: '/crd/debug/email/confirmation/:email',
      handler: 'invite.testEmailConfirmationInscription',
    },
  ]
}

'use strict';

const { tool } = require('../lib/formgong');

const perform = async (z, bundle) => {
  const result = await tool(z, 'create_form', { name: bundle.inputData.name, notify_email: bundle.inputData.notify_email !== false });
  return { ...result.form, dashboard: result.dashboard };
};

module.exports = {
  key: 'form',
  noun: 'Form',
  display: { label: 'Create Form', description: 'Creates a Formgong form and returns its public access key.' },
  operation: {
    inputFields: [
      { key: 'name', label: 'Name', required: true, helpText: 'Shown in the dashboard and in the email subject.' },
      { key: 'notify_email', label: 'Email notifications', type: 'boolean', default: 'true' },
    ],
    perform,
    sample: { id: '6f1c2a9e-4b7d-4e0a-9c3f-2d8b5e7a1f40', name: 'Contact', access_key: 'fk_example', endpoint: 'https://formgong.com/submit' },
  },
};

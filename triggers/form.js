'use strict';

const { tool } = require('../lib/formgong');

// Hidden trigger behind the Form dropdowns.
const perform = async (z) => {
  const result = await tool(z, 'list_forms');
  return (result.forms || []).map((form) => ({ id: form.id, name: form.name, access_key: form.access_key }));
};

module.exports = {
  key: 'form',
  noun: 'Form',
  display: { label: 'Form', description: 'Lists your Formgong forms.', hidden: true },
  operation: { perform, sample: { id: '6f1c2a9e-4b7d-4e0a-9c3f-2d8b5e7a1f40', name: 'Contact', access_key: 'fk_example' } },
};

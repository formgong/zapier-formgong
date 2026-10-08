'use strict';

const { tool } = require('./lib/formgong');

// A valid token lists the account's forms; an invalid one gets HTTP 401.
const test = async (z) => {
  const result = await tool(z, 'list_forms');
  return { forms: (result.forms || []).length };
};

module.exports = {
  type: 'custom',
  fields: [
    {
      key: 'apiKey',
      label: 'API Token',
      required: true,
      type: 'password',
      helpText:
        'A Formgong personal API token (starts with `fgp_`). Create it in the [Formgong dashboard](https://formgong.com/dashboard/account#api-tokens) under Account → API tokens, with forms:write and submissions:read.',
    },
  ],
  test,
  connectionLabel: 'Formgong ({{forms}} forms)',
};

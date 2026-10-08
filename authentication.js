'use strict';

const { baseUrl, tool } = require('./lib/formgong');

// Formgong's built-in public OAuth client for this Zapier app (PKCE, no client secret).
const CLIENT_ID = 'zapier';
const SCOPES = 'forms:read forms:write submissions:read';

const tokenRequest = async (z, fields) => {
  const response = await z.request({
    url: `${baseUrl()}/oauth/token`,
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded', accept: 'application/json' },
    body: new URLSearchParams({ client_id: CLIENT_ID, resource: `${baseUrl()}/mcp`, ...fields }).toString(),
    skipThrowForStatus: true,
  });
  if (response.status !== 200 || !response.data || !response.data.access_token) {
    const reason = (response.data && (response.data.error_description || response.data.error)) || `HTTP ${response.status}`;
    throw new z.errors.Error(`Formgong sign-in failed: ${reason}`, 'AuthenticationError', response.status);
  }
  return { access_token: response.data.access_token, refresh_token: response.data.refresh_token };
};

const getAccessToken = (z, bundle) =>
  tokenRequest(z, {
    grant_type: 'authorization_code',
    code: bundle.inputData.code,
    redirect_uri: bundle.inputData.redirect_uri,
    code_verifier: bundle.inputData.code_verifier,
  });

const refreshAccessToken = (z, bundle) =>
  tokenRequest(z, { grant_type: 'refresh_token', refresh_token: bundle.authData.refresh_token });

// A valid connection lists the account's forms.
const test = async (z) => {
  const result = await tool(z, 'list_forms');
  return { forms: (result.forms || []).length };
};

module.exports = {
  type: 'oauth2',
  oauth2Config: {
    authorizeUrl: {
      url: `${baseUrl()}/oauth/authorize`,
      params: {
        client_id: CLIENT_ID,
        state: '{{bundle.inputData.state}}',
        redirect_uri: '{{bundle.inputData.redirect_uri}}',
        response_type: 'code',
        scope: SCOPES,
        resource: `${baseUrl()}/mcp`,
      },
    },
    getAccessToken,
    refreshAccessToken,
    autoRefresh: true,
    enablePkce: true,
    scope: SCOPES,
  },
  test,
  connectionLabel: 'Formgong ({{forms}} forms)',
};

'use strict';

const includeToken = (request, z, bundle) => {
  if (bundle.authData.apiKey) {
    request.headers = request.headers || {};
    request.headers.Authorization = `Bearer ${bundle.authData.apiKey}`;
  }
  return request;
};

const handleBadResponses = (response, z) => {
  if (response.status === 401) {
    throw new z.errors.Error('The Formgong API token is invalid, expired or revoked.', 'AuthenticationError', response.status);
  }
  return response;
};

module.exports = { befores: [includeToken], afters: [handleBadResponses] };

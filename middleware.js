'use strict';

const includeToken = (request, z, bundle) => {
  const token = bundle.authData.access_token;
  if (token && !request.headers.Authorization && !/\/oauth\/token$/.test(request.url)) {
    request.headers.Authorization = `Bearer ${token}`;
  }
  return request;
};

// An expired access token is refreshed once; a revoked connection asks the user to reconnect.
const handleBadResponses = (response, z, bundle) => {
  if (response.status === 401 && !/\/oauth\/token$/.test(response.request.url)) {
    if (bundle.authData.refresh_token) throw new z.errors.RefreshAuthError('Formgong access token expired.');
    throw new z.errors.Error('The Formgong connection is invalid or was revoked. Reconnect Formgong.', 'AuthenticationError', response.status);
  }
  return response;
};

module.exports = { befores: [includeToken], afters: [handleBadResponses] };

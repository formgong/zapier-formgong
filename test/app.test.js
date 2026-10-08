'use strict';
// Runs the integration against a Formgong instance: FORMGONG_BASE_URL=http://localhost:8788 FORMGONG_TOKEN=fgp_… npm test
// Creates one form, one submission and one webhook (removed again).
const crypto = require('crypto');
const zapier = require('zapier-platform-core');
const App = require('../index');
const { validSignature } = require('../lib/formgong');

const appTester = zapier.createAppTester(App);
zapier.tools.env.inject();
const base = (process.env.FORMGONG_BASE_URL || 'https://formgong.com').replace(/\/+$/, '');
const authData = { access_token: process.env.FORMGONG_TOKEN };
const live = Boolean(process.env.FORMGONG_TOKEN);

describe('signature', () => {
  const body = '{"event":"submission.created"}';
  const sign = (key, text = body) => `sha256=${crypto.createHmac('sha256', key).update(text).digest('hex')}`;
  it('accepts only the right key over the exact body', () => {
    expect(validSignature(body, sign('k1'), 'k1')).toBe(true);
    expect(validSignature(body, sign('k2'), 'k1')).toBe(false);
    expect(validSignature(body + ' ', sign('k1'), 'k1')).toBe(false);
    expect(validSignature(body, undefined, 'k1')).toBe(false);
    expect(validSignature(body, sign('k1'), '')).toBe(false);
  });
});

(live ? describe : describe.skip)('against Formgong', () => {
  let form;
  let subscribeData;

  it('connects with a valid token and refuses a bad one', async () => {
    const ok = await appTester(App.authentication.test, { authData });
    expect(ok.forms).toBeGreaterThan(0);
    // Zapier answers a 401 by refreshing the token; a bad refresh token ends the connection.
    await expect(appTester(App.authentication.test, { authData: { access_token: 'fgp_' + '0'.repeat(64) } })).rejects.toMatchObject({ name: 'RefreshAuthError' });
    await expect(appTester(App.authentication.oauth2Config.refreshAccessToken, { authData: { refresh_token: 'fgr_' + '0'.repeat(64) } })).rejects.toThrow(/Formgong sign-in failed/);
  });

  it('creates a form and lists it in the dropdown', async () => {
    form = await appTester(App.creates.form.operation.perform, { authData, inputData: { name: `zapier e2e ${Date.now()}`, notify_email: false } });
    expect(form.access_key).toMatch(/^fk_/);
    const options = await appTester(App.triggers.form.operation.perform, { authData });
    expect(options.map((o) => o.id)).toContain(form.id);
  });

  it('reads recent submissions as sample data', async () => {
    const res = await fetch(`${base}/submit`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json', origin: 'https://example.com' },
      body: JSON.stringify({ access_key: form.access_key, name: 'Ada', email: 'ada@example.com', message: 'zapier e2e' }),
    });
    expect((await res.json()).success).toBe(true);
    const items = await appTester(App.triggers.new_submission.operation.performList, { authData, inputData: { form_id: form.id } });
    expect(items[0].fields.message).toBe('zapier e2e');
    expect(items[0].id).toBeTruthy();
  });

  it('subscribes, accepts only signed deliveries, then unsubscribes', async () => {
    const targetUrl = 'https://hooks.zapier.com/hooks/standard/1/formgong-e2e/';
    subscribeData = await appTester(App.triggers.new_submission.operation.performSubscribe, { authData, targetUrl, inputData: { form_id: form.id } });
    expect(subscribeData.signing_secret).toMatch(/^[a-f0-9]{48}$/);
    const raw = JSON.stringify({ event: 'submission.created', form: { id: form.id, name: 'x' }, submission: { id: 's1', fields: { message: 'hi' } } });
    const deliver = (signature, content = raw) => appTester(App.triggers.new_submission.operation.perform, {
      authData, subscribeData, inputData: { form_id: form.id },
      rawRequest: { content, headers: { 'Http-X-Signature': signature } }, cleanedRequest: JSON.parse(content),
    });
    const sign = (key, text = raw) => `sha256=${crypto.createHmac('sha256', key).update(text).digest('hex')}`;
    expect((await deliver(sign(subscribeData.signing_secret)))[0].fields.message).toBe('hi');
    expect(await deliver(sign('wrong'))).toEqual([]);
    expect(await deliver(sign(subscribeData.signing_secret), raw.replace('hi', 'hx'))).toEqual([]);
    const removed = await appTester(App.triggers.new_submission.operation.performUnsubscribe, { authData, subscribeData });
    expect(removed.deleted).toBe(true);
  });
});

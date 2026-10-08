'use strict';

const { tool, validSignature } = require('../lib/formgong');

const toItem = (body) => {
  const submission = body.submission || {};
  return {
    id: submission.id,
    event: body.event,
    form_id: body.form && body.form.id,
    form_name: body.form && body.form.name,
    created_at: submission.created_at,
    page_url: submission.page_url,
    is_spam: submission.is_spam,
    fields: submission.fields || {},
  };
};

// Formgong stores the Zapier hook URL as a webhook of the chosen form.
const performSubscribe = async (z, bundle) => {
  const result = await tool(z, 'create_webhook', { form_id: bundle.inputData.form_id, url: bundle.targetUrl });
  return { id: result.webhook.id, form_id: bundle.inputData.form_id, signing_secret: result.signing_secret };
};

const performUnsubscribe = async (z, bundle) => {
  const data = bundle.subscribeData || {};
  return tool(z, 'delete_webhook', { form_id: data.form_id, webhook_id: data.id });
};

// Requests without a valid signature are dropped: only Formgong knows the form's signing key.
const perform = (z, bundle) => {
  const secret = (bundle.subscribeData || {}).signing_secret;
  const raw = bundle.rawRequest || {};
  const headers = raw.headers || {};
  const signature = headers['Http-X-Signature'] || headers['X-Signature'] || headers['x-signature'];
  if (!validSignature(raw.content, signature, secret)) return [];
  const body = bundle.cleanedRequest || {};
  if (body.event === 'webhook.test' && !bundle.inputData.include_test) return [];
  return [toItem(body)];
};

const performList = async (z, bundle) => {
  const result = await tool(z, 'list_recent_submissions', { form_id: bundle.inputData.form_id, limit: 3 });
  return (result.submissions || []).map((submission) =>
    toItem({ event: 'submission.created', form: { id: bundle.inputData.form_id }, submission }),
  );
};

module.exports = {
  key: 'new_submission',
  noun: 'Submission',
  display: { label: 'New Submission', description: 'Triggers when a Formgong form receives a submission.' },
  operation: {
    type: 'hook',
    inputFields: [
      { key: 'form_id', label: 'Form', required: true, dynamic: 'form.id.name' },
      { key: 'include_test', label: 'Include test deliveries', type: 'boolean', default: 'false', helpText: 'Also trigger for the Send test button in Formgong.' },
    ],
    performSubscribe,
    performUnsubscribe,
    perform,
    performList,
    sample: {
      id: 'b3e04c51-8a2f-4d6e-9f17-0c5a3b8d2e96',
      event: 'submission.created',
      form_id: '6f1c2a9e-4b7d-4e0a-9c3f-2d8b5e7a1f40',
      form_name: 'Contact',
      created_at: '2026-10-03T09:15:00.000Z',
      page_url: 'https://example.com/contact',
      is_spam: false,
      fields: { name: 'Ada', email: 'ada@example.com', message: 'Hi' },
    },
  },
};

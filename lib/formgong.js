'use strict';

const crypto = require('crypto');

// FORMGONG_BASE_URL is only for tests against a local Formgong; users always talk to formgong.com.
const baseUrl = () => (process.env.FORMGONG_BASE_URL || 'https://formgong.com').replace(/\/+$/, '');

/** Calls one Formgong API tool (JSON-RPC over HTTPS on /mcp) and returns its structured result. */
const tool = async (z, name, args = {}) => {
  const response = await z.request({
    url: `${baseUrl()}/mcp`,
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json' },
    body: { jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name, arguments: args } },
  });
  const data = response.data || {};
  if (data.error) throw new z.errors.Error(`Formgong: ${data.error.message}`, 'FormgongError', response.status);
  const result = data.result || {};
  if (result.isError || !result.structuredContent) {
    const text = (result.content || []).map((part) => part.text).filter(Boolean).join(' ') || 'Unknown error';
    throw new z.errors.Error(`Formgong: ${text}`, 'FormgongError', response.status);
  }
  return result.structuredContent;
};

/** Formgong signs each webhook body: X-Signature: sha256=<hex HMAC-SHA256 of the raw body>. */
const validSignature = (rawBody, header, secret) => {
  const match = /^sha256=([a-f0-9]{64})$/i.exec(String(header || '').trim());
  if (!match || !secret) return false;
  const expected = crypto.createHmac('sha256', secret).update(rawBody || '').digest();
  const given = Buffer.from(match[1], 'hex');
  return given.length === expected.length && crypto.timingSafeEqual(given, expected);
};

module.exports = { baseUrl, tool, validSignature };

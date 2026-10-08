# Formgong for Zapier

Zapier integration for [Formgong](https://formgong.com), a form backend.

- **New Submission** (trigger, REST hook): pick a form; the Zap registers its own webhook in Formgong and drops any request without a valid `X-Signature` (HMAC-SHA256 of the raw body, keyed with the form's signing key). Removing the Zap removes the webhook.
- **Create Form** (action): creates a form and returns its public access key.

Authentication is a Formgong personal API token (`fgp_…`) from Dashboard → Account → API tokens.

## Develop

```bash
npm install
npx jest                        # offline signature tests
FORMGONG_BASE_URL=http://localhost:8788 FORMGONG_TOKEN=fgp_… npx jest   # end to end against a Formgong instance
npx zapier-platform-cli validate
```

The end-to-end tests create one form, one submission and one webhook (removed again).

## License

MIT

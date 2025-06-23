## In General

### Prerequisites

Use `npm i` or `npm ci` to install all dependencies.

### Testing

Use `npm run verify` to verify that your changes pass TypeScript's checks.

### Formatting

Use `npm run prettier` to ensure your formatting matches the expected format. Failing to do so will cause CI failure.

## WebUI Specific

The translation system is designed around additions being made to `static/webui/translations/en.js`. They are copied over for translation via `npm run update-translations`. DO NOT produce non-English strings; we want them to be translated by humans who can understand the full context.

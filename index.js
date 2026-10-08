const authentication = require('./authentication');
const formTrigger = require('./triggers/form');
const newSubmission = require('./triggers/newSubmission');
const createForm = require('./creates/form');
const { befores = [], afters = [] } = require('./middleware');

module.exports = {
  // This is just shorthand to reference the installed dependencies you have.
  // Zapier will need to know these before we can upload.
  version: require('./package.json').version,
  platformVersion: require('zapier-platform-core').version,

  authentication,

  beforeRequest: [...befores],

  afterResponse: [...afters],

  // If you want your trigger to show up, you better include it here!
  triggers: { [formTrigger.key]: formTrigger, [newSubmission.key]: newSubmission },

  // If you want your searches to show up, you better include it here!
  searches: {},

  // If you want your creates to show up, you better include it here!
  creates: { [createForm.key]: createForm },

  resources: {},
};

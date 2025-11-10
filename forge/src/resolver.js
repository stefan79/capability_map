import Resolver from '@forge/resolver';

const resolver = new Resolver();

resolver.define('getMacroContext', (request) => {
  const { content, extension } = request.context || {};

  return {
    macroKey: extension?.entryPoint || 'volvo-map-macro',
    contentId: content?.id,
    environment: process.env.NODE_ENV || 'production',
  };
});

export const handler = resolver.getDefinitions();

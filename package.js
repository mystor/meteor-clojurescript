Package.describe({
  name: 'mystor:clojurescript',
  summary: 'Clojure to Javascript compiler',
  version: '0.1.1',
  git: 'https://github.com/mystor/meteor-clojurescript.git'
});

Package._transitional_registerBuildPlugin({
  name: 'compileClojurescript',
  use: [],
  sources: [
    'plugin/compile-cljs.js'
  ],
  npmDependencies: {}
});

Package.onUse(function(api) {
  api.versionsFrom('METEOR@0.9.0');
});


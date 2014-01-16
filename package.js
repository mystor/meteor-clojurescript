Package.describe({
  summary: 'Clojurescript for Meteor JS'
});

Package._transitional_registerBuildPlugin({
  name: 'compileClojurescript',
  use: [],
  sources: [
    'plugin/compile-cljs.js'
  ],
  npmDependencies: {}
});


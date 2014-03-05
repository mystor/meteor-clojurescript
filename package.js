Package.describe({
  summary: 'Clojure to Javascript compiler'
});

Package._transitional_registerBuildPlugin({
  name: 'compileClojurescript',
  use: [],
  sources: [
    'plugin/compile-cljs.js'
  ],
  npmDependencies: {}
});


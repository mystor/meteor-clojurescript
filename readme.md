# Clojurescript for Meteor

    Clojurescript is a Clojure to JS compiler

## Installation

Meteor-Clojurescript is not on atmosphere yet, as it is still missing important features.  Thus, you need to install it from github.

```bash
mkdir packages
git clone https://github.com/mystor/meteor-clojurescript packages/clojurescript
meteor add clojurescript
```

Meteor clojurescript will not run correctly unless you have leiningen installed and on your path.

## Usage

To use Meteor-Clojurescript, add a project.clj file at the root of your project (project.clj will be ignored in other locations for various reasons).

This project.clj should look something like this:

```clojure
(defproject my-meteor-cljs-project "0.0.1"
  :plugins [[lein-cljsbuild "1.0.1"]]
  :cljsbuild {
        :builds {
          :client
          {:source-paths ["src/cljs/client", "src/cljs/shared"]
           :compiler {:output-to "client.cjs"  ;; Must be in project, contain 'client', extension 'cjs'
                      :output-dir ".cljsbuild/target-client"  ;; Must be ignored by Meteor
                      :optimizations :simple  ;; Currently only :whitespace and :simple are supported
                      :pretty-print true}}
          :server
          {:source-paths ["src/cljs/server", "src/cljs/shared"]
           :compiler {:output-to "server.cjs"  ;; Must be in project, contain 'server', extension 'cjs'
                      :output-dir ".cljsbuild/target-server;; Must be ignored by Meteor
                      :target :nodejs
                      :optimizations :simple  ;; Currently, on the server, only :simple is supported
                      :pretty-print true}}}})
```

When meteor is run, it will start the leiningen process (`lein cljsbuild auto`), and will register a file listener for `.cjs` files.
Whenever a `.cjs` file is detected, it will check if it is for the client or server (by checking if the text is in the relative path),
and then will add it like normal.

## Limitations

### Closure Compiler

Clojurescript has been designed to take advantage of Google's Closure compiler.  This compiler enables dead-code elimination and munging of
javascript variables.  Clojurescript code is safe to run through Closure's advanced compilation, however, calls out to Meteor will be munged, and will
not work as expected.

At some point, I or someone else will probably write an externs file for Meteor core, which will allow for the use of advanced optimizations, but for now,
we have to stick with simple or whitespace.

Clojurescript on the server does not support any optimization level less than simple right now, so use simple on the server.

Meteor-Clojurescript assumes that concatination has already been done when it reads the output file. Thus, a non-none level of optimizations is required.

### Source Maps

I have tried using source maps, but for some reason, they cause the javascript added to the process to be mangled.  Once I isolate the problem I will probably
either get source maps working, or submit a bug report to Meteor.

### Meteor Packages

This package will completely ignore meteor packages (it requires the relative path for project.clj to be `"project.clj"`).  It doesn't make too much sense to use this compilation step within a package, as it will then not interop very well with other clojurescript code (2x closure libraries and clojure core? eww).

If you want to make packages for use with this plugin, I recommend using the standard clojurescript packaging routes, and taking advantage of leiningen, rather than going through the meteor packages system.


## TODO

[ ] Source Map Support
[ ] Meteor Core externs file
[ ] Less hacky way to add code than `.cjs` files
[ ] Clojurescript-style bindings for meteor features

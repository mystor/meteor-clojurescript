# Meteor Clojurescript

> Clojurescript is a Clojure to JS compiler

Meteor-Clojurescript is a Meteor package which allows you to use [clojurescript](https://github.com/clojure/clojurescript) in your Meteor projects.

## Installation

Meteor-Clojurescript requires [leiningen](http://leiningen.org/) to be installed and on your path.

### From Atmosphere
```bash
mrt add clojurescript
```

### From Github
```bash
mkdir packages
git clone https://github.com/mystor/meteor-clojurescript packages/clojurescript
meteor add clojurescript
```

## Usage

Place a project.clj at the root of your project. It should look something like this:
```clojure
(defproject my-project-name "0.0.1"
  :dependencies [[org.clojure/clojurescript "0.0-2173"]]
  :plugins [[lein-cljsbuild "1.0.1"]]
  :cljsbuild {
    :builds {
      :client
      {:source-paths ["client"] ; The directories to include on the client
       :compiler {:output-to "bin/client.cjs" ; Path must contain 'client' and have extension 'cjs'
                  :output-dir "bin/.build/client" ; Must be a folder ignored by Meteor
                  :source-map "bin/client.cjs.map" ; Must be the :output-to path, with an added '.map'
                  :optimizations :simple ; Use :whitespace, :simple, or :advanced
                  :pretty-print true}}
      :server
      {:source-paths ["server"] ; The directories to include on ths server
       :compiler {:output-to "bin/server.cjs" ; Path must contain 'server' and have extension 'cjs'
                  :output-dir "bin/.build/server" ; Must be a folder ignored by Meteor
                  :source-map "bin/server.cjs.map" ; Must be the :output-to path, with an added '.map'
                  :optimizations :simple ; Use :simple, or :advanced
                  :target :nodejs ; Necessary
                  :pretty-print true}}}})
```

Meteor Clojurescript runs the equivalent of `lein cljsbuild auto` when you run Meteor, and then transforms the `.cjs` files, adding them to the Meteor asset pipeline.

If you change your project.clj file, it may not register your changes immediately. You can call `lein cljsbuild clean` to clean leiningen's output files, forcing a full recompile.

## Limitations

### Advanced Compilation

Advanced compilation is supported by Clojurescript, through the use of Google's Closure compiler. Unfortunately, nobody (as far as I know) has written an externs file for Meteor, which means that all calls to the core libraries will be munged. Because of this, `:advanced` compilation is not currently recommended.

### Minimum Compilation levels

Meteor-Clojurescript will not concatinate output files for you, so the compiler has to have already done it. Thus, the `:none` optimization level is not supported.

In addition, the `:nodejs` target does not currently work correctly with `:whitespace` or `:none`, so `:simple` is recommended on the server. 

### Meteor Packages

Clojurescript is non-ideal for Meteor package development, and thus no effort has been made to make such development easy, or even possible, with Meteor Clojurescript.

Clojurescript produces a large amount of boilerplate, and it would be inefficient to duplicate it across multiple packages. In addition, pre-compiled clojurescript code doesn't interop as well with other clojurescript code.

For clojurescript package development, I recommend using the standard clojurescript packaging system, with leiningen, rather than using Meteor's packages.

# Clojurescript for Meteor

## What?
Meteor-Clojurescript is a meteor package which allows you to use Clojurescript on the client and the server in your projects. 

## How?

### To install the package
```bash
mkdir packages
git clone https://github.com/mystor/meteor-clojurescript packages/clojurescript
meteor add clojurescript
```

### To make the build work
Install leiningen (and put it on your path)

```bash
mkdir .cljs-build
```

Create a `project.clj` file and add the following:
```clojure
(defproject meteor-clojurescript-project "0.0.1"
  :plugins [[lein-cljsbuild "1.0.1"]]
  :cljsbuild {
	:builds {
	  :client
	  {:source-paths {CLIENT:SOURCE-PATHS}
	   :compiler {:output-to {CLIENT:OUTJS}
				  :optimizations :whitespace
				  :pretty-print true}}
	  :server
	  {:source-paths {SERVER:SOURCE-PATHS}
	   :compiler {:output-to {SERVER:OUTJS}
				  :target :nodejs
				  :optimizations :simple
				  :pretty-print true}}}})
```

### Now just add your code!
Note: You can only add code in the `client/` and `server/` folders right now. Support for other folders will come later on.

## No, but really, How?

meteor-clojurescript takes advantage of how build plugins are executed in the `meteor` process (rather than the server process) to invoke a subprocess (`lein cljsbuild auto`) when the program starts.  This process is invoked in the `.cljs-build` folder, where a compiled copy of project.clj is created.  Once compilation is complete, `a.cljsbuild` is changed, causing meteor to read in the compiled code again and restart.

So yes, its a hack. But it works (kinda).

## I want to use this in a package

It will probably (certainly) break.  Don't do that.  I'm working on package support (eventually).

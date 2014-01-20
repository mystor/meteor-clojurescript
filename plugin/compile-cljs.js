var fs = Npm.require('fs');
var path = Npm.require('path');
var cp = Npm.require('child_process');
var crypto = Npm.require('crypto');
var Future = Npm.require('fibers/future');

var execFuture = Future.wrap(cp.exec);

var cljsc = (global.cljsc = global.cljsc || {
  lein: {
    running: false,
    process: null
  },

  /*********
   * PATHS *
   *********/
  is_app_dir: function(filepath) {
    // From meteor/tools/file.js commit #3177d9ad416ae97a98a2b8c4b2b40a9fc03f6b9c
    try {
      return fs.statSync(path.join(filepath, '.meteor', 'packages')).isFile();
    } catch (e) {
      return false;
    }
  },

  root: function() {
    // Get the meteor root directory
    if (cljsc._root)
      return cljsc._root;

    var test_dir = process.cwd();
    while (test_dir) {
      if (cljsc.is_app_dir(test_dir))
        break;

      var new_dir = path.dirname(test_dir);
      if (new_dir === test_dir)
        return null;

      test_dir = new_dir;
    }

    cljsc._root = test_dir;
    return cljsc._root;
  },

  buildroot: function() {
    return path.join(cljsc.root(), '.cljs-build');
  },

  /********************************************
   * Launch the longrunning leiningen process *
   ********************************************/
  start_lein: function() {
    // Don't start lein multiple times
    if (cljsc.lein.running)
      return;

    // Start leiningen
    var lein = cljsc.lein.process = cp.spawn('lein', ['cljsbuild', 'auto'],{
      cwd: cljsc.root()
    });
    cljsc.lein.running = true;

    // Listen to the program output
    lein.stdout.on('data', function(data) {
      if ((''+data).indexOf('Successfully compiled') !== -1)
        fs.writeFileSync(path.join(cljsc.root(), 'a.cljsbuild'), Math.random());

      process.stdout.write('(lein): ' + data);
    });

    lein.stderr.on('data', function(data) {
      process.stderr.write('ERROR (lein): ' + data);
    });

    // Report when leiningen closes
    lein.on('close', function(code) {
      process.stdout.write('Leiningen exited (status=' + code + ')');
      cljsc.lein.running = false;
    });
  },

  /******************************************
   * Stop the longrunning leiningen process *
   ******************************************/
  stop_lein: function() {
    // Send a SIGTERM to the leiningen process
    if (cljsc.lein.running)
      cljsc.lein.process.kill();
  },

  /***************************************************************
   * Inject compiled clojurescript into the meteor server/client *
   * Should be called during a compile step                      *
   ***************************************************************/
  inject: function(compileStep) {
    var target = compileStep.archMatches('browser') ? 'client' : 'server';

    try {
      var js = fs.readFileSync(
          path.join(cljsc.buildroot(), target + '.js'), { encoding: 'utf-8' });

      // Remove the shebang on the server
      // We also need to redefine require, as clojurescript wants it
      if (target === 'server') {
        js = js.substring(js.indexOf('\n'));
        js = 'var require = Npm.require;\n' + js;
      }

      compileStep.addJavaScript({
        path: compileStep.inputPath + '.js',
        sourcePath: compileStep.inputPath,
        data: js,
        bare: target === 'client'
      });
    } catch (e) {
      console.log('Compiled code for target: ' + target + ' could not be found');
      console.log('Maybe it is compiling right now?');
    }
  },

  /******************************************
   * Recompile project.clj and restart lein *
   *****************************************/
  compile_projectclj: function(compileStep) {
    // Only process project.clj
    if (!path.basename(compileStep._fullInputPath) === 'project.clj')
      return;

    var src = compileStep.read().toString('utf8');

    // Check if project.clj has really changed
    var hasher = crypto.createHash('sha1');
    hasher.update(src);
    var srcsha1 = hasher.digest('hex');

    try {
      var destsha1 = fs.readFileSync(
          path.join(cljsc.buildroot(), 'project.clj.sha1'),
          { encoding: 'utf-8' });

      if (''+srcsha1 === ''+destsha1)
        return; // No change, abort
    } catch (e) {}

    // Shut down the current lein process
    if (cljsc.lein.running) {
      cljsc.lein.process.kill();
      cljsc.lein.running = false;
    }

    // Clean the directory
    var f = new Future;
    cp.exec('lein cljsbuild clean', { cwd: cljsc.root() }, function() { f.return(); });
    f.wait();

    // Write out the new file
    fs.writeFileSync(path.join(cljsc.buildroot(), 'project.clj.sha1'), ''+srcsha1);

    // Resume the lein process
    cljsc.start_lein();
  }
});

// Register the source handlers
Plugin.registerSourceHandler('clj', cljsc.compile_projectclj);
Plugin.registerSourceHandler('cljsbuild', cljsc.inject);

cljsc.start_lein();

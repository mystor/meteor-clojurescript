var fs = Npm.require('fs');
var path = Npm.require('path');
var cp = Npm.require('child_process');

global.running = global.running || false;

/**
 * Returns true if the dir passed in with filepath
 * is the Meteor application directory
 */
function is_app_dir(filepath) {
  try {
    return fs.statSync(path.join(filepath, '.meteor', 'packages')).isFile();
  } catch (e) {
    return false;
  }
}

/**
 * Returns the root directory for the project
 */
var _root = null;
function root() {
  if (_root)
    return _root;

  var test_dir = process.cwd();
  while (test_dir) {
    if (is_app_dir(test_dir))
      break;

    var new_dir = path.dirname(test_dir);
    if (new_dir === test_dir)
      return null;

    test_dir = new_dir;
  }

  _root = test_dir;
  return _root;
}

/**
 * Start the background leiningen process.
 * Does nothing if the process is already running
 */
function lein_start() {
  if (global.running)
    return;

  // Create the leiningen child process
  var proc = cp.spawn('lein', ['cljsbuild', 'auto'], { cwd: root() });
  global.running = true;

  // ---------------------------------------
  // Listen to events from the child process
  // ---------------------------------------
  proc.stdout.on('data', function(data) {
    process.stdout.write('(LEIN): ' + data);
  });

  proc.stderr.on('data', function(data) {
    process.stdout.write('(LEIN-ERR): ' + data);
  });

  proc.on('close', function(code) {
    process.stdout.write('(LEIN) - Exited with code=' + code + '\n');
    process.stdout.write('(LEIN) - Clojurescript will not be compiled until meteor is restarted\n');
  });
}

/**
 * Inject compiled clojurescript code into the meteor process
 * Leiningen will generate files with the cjs extension
 *
 * Files will be ignored unless they contain either 'client' or 'server' in their relative path
 */
Plugin.registerSourceHandler('cjs', function (compileStep) {
  // Check the current target
  var target = compileStep.archMatches('web') ? 'client' : 'server';

  var re = RegExp(target);

  // Make sure we're looking at the right file
  if (!compileStep.inputPath.match(re))
    return;

  var src = compileStep.read().toString('utf8');

  // Perform some modifications
  if (target === 'server') {
    // Remove the shebang
    src = src.substring(src.indexOf('\n'));

    // Nodejs targets require `require` to be defined
    src = 'var require = Npm.require;' + src;
  }

  // Strip the source map line (if it exists)
  src = src.replace(/^\/\/# sourceMappingURL.*$/m, '');

  try {
    var srcmap = fs.readFileSync(compileStep._fullInputPath + '.map',
                                 { encoding: 'utf8' });
    var parsedMap = JSON.parse(srcmap);

    // Clojurescript doesn't inline the source code for its source maps,
    // which Meteor expects source maps to do.  Meteor will not serve the source
    // files to the client, so if the source files are not embedded, the client
    // will simply ignore the source maps.  Therefore, we manually inline the
    // source maps here.
    parsedMap.sourcesContent = parsedMap.sources.map(function(pth) {
      return fs.readFileSync(path.join(path.dirname(compileStep._fullInputPath), pth),
                             { encoding: 'utf8' });
    });

    srcmap = JSON.stringify(parsedMap);
  } catch (e) {
    console.warn('No source map found for file: ' + compileStep.inputPath);
  }

  compileStep.addJavaScript({
    path: compileStep.inputPath + '.js',
    sourcePath: compileStep.inputPath,
    sourceMap: srcmap,
    data: src,
    bare: false
  });
});

lein_start();

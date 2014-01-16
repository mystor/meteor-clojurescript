var fs = Npm.require('fs');
var path = Npm.require('path');
var cp = Npm.require('child_process');
var crypto = Npm.require('crypto');
var Future = Npm.require('fibers/future');

/********************************
 * Start ClojureScript Compiler *
 ********************************/
function start_lein() {
  if (global.lein_running)
    return;

  try {
    fs.statSync(path.join(process.cwd(), '.cljs-build'));
  } catch (e) {
    fs.mkdirSync(path.join(process.cwd(), '.cljs-build'));
  }

  global.lein_path = path.join(process.cwd(), '.cljs-build');
  
  var lein = global.lein = cp.spawn('lein', ['cljsbuild', 'auto'], {
    cwd: path.join(process.cwd(), '.cljs-build')
  });

  global.lein_running = true;

  lein.stdout.on('data', function(data) {
    if ((''+data).indexOf('Successfully compiled') !== -1) {
      // We have compiled a file!
      fs.writeFileSync(path.join(process.cwd(), 'a.cljsbuild'), ''+Math.random());
    }
    process.stdout.write('(lein): ' + data);
  });

  lein.stderr.on('data', function(data) {
    process.stderr.write('ERROR (lein): ' + data);
  });

  lein.on('close', function(code) {
    console.log('leiningen exited with status=' + code);
    global.lein_running = false;
  });
}
start_lein();

/************************************
 * Inject Compiled CLJS Into Meteor *
 ************************************/
Plugin.registerSourceHandler('cljsbuild', function(compileStep) {
  var target = compileStep.archMatches('browser') ? 'client' : 'server';

  var js = fs.readFileSync(path.join(global.lein_path, target + '.js'), 
    { encoding: 'utf-8' });

  // Remove the shebang on the server
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
});



/*****************************************
 * Restart lein when project.clj changed *
 *****************************************/
Plugin.registerSourceHandler('clj', function(compileStep) {
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
        path.join(global.lein_path, 'project.clj.sha1'),
        { encoding: 'utf-8' });

    if (''+srcsha1 === ''+destsha1)
      return;
  } catch (e) {}

  // Perform replacements
  src = src.replace('{CLIENT:SOURCE-PATHS}', JSON.stringify(['../client']));
  src = src.replace('{CLIENT:OUTJS}', JSON.stringify('client.js'));
  src = src.replace('{SERVER:SOURCE-PATHS}', JSON.stringify(['../server']));
  src = src.replace('{SERVER:OUTJS}', JSON.stringify('server.js'));

  // Shut down the current lein process
  global.lein.kill();
  global.lein_running = false;

  // Clean the directory
  var f = new Future;
  cp.exec('lein cljsbuild clean', { cwd: global.lein_path }, function(e,so,se) {
    f.return();
  });
  f.wait();

  // Write out the new file
  fs.writeFileSync(path.join(global.lein_path, 'project.clj'), src);
  fs.writeFileSync(path.join(global.lein_path, 'project.clj.sha1'), ''+srcsha1);

  // Resume the lein process
  start_lein();
});


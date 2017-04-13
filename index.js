#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');

const config = require('yargs')
  .options({
    'base' : {
      type: 'string',
      describe: 'base / input folder. the others files and folders should be relative to this',
      default: path.dirname(path.dirname(__dirname))
    },
    'dest' : {
      type: 'string',
      describe: 'output folder. e.g. dist',
      default: 'dist'
    },
    'js' : {
      type: 'string',
      describe: 'js to compile. e.g. js/index.js',
    },
    'js-babelify-presets' : {
      type: 'array',
      default: ['latest'],
    },
    'scss' : {
      type: 'string',
      describe: 'scss to compile.  e.g. css/index.scss',
    },
    'static' : {
      type: 'string',
      describe: 'static files to copy over. e.g. static',
    },
    'command' : {
      type: 'string',
      describe: 'watch|build|release',
    },
  }).argv;

function scss(config, release, watch)
{
  const input = path.join(config.base, config.scss);
  const output = path.join(config.base, config.dist, path.basename(config.scss).replace(/scss$/g, 'css'));
  if (watch)
  {
    const chokidar = require('chokidar');
    chokidar.watch(path.dirname(input)).on('change', scss.bind(null, config, release, false));
  }
  console.log("SCSS", input, "=>" ,output);  
  let start = Date.now();
  const sass = require('node-sass');
  sass.render({
    file: input,
    outputStyle: release? 'compressed' : 'expanded'
  }, function(err, result) {
    if (err)
    {
      console.log(err);
    }
    else
    {
      fs.writeFileSync(output, result.css);
      console.log("SCSS", output, 'took', (Date.now() - start) + 'ms' );
    }
  });
}

function watchSCSS(config)
{
  if (config.scss)
  {
    scss(config, false, true);
  }
}

function buildSCSS(config)
{
  if (config.scss)
  {
    scss(config, false, false);
  }
}

function releaseSCSS(config)
{
  if (config.scss)
  {
    scss(config, true, false);
  }
}

function error(err)
{
  delete err.stream;
  delete err._babel;
  delete err.codeFrame;
  console.log(err);
}

function js(config, uglify=false, watchify=false)
{
  const browserify = require("browserify");
  const input = path.join(config.base, config.js);
  const output = path.join(config.base, config.dist, path.basename(config.js));
  
  let options = {
    paths: [ path.dirname(input) ],
    cache: {},
    packageCache: {}
  };
  
  if (watchify)
  {
    options.plugin = [require('watchify')];
  }
  
  let b = browserify(input, options).on('error', error)
    .transform("babelify", { presets: config.jsBabelifyPresets }).on('error', error);

  if (uglify)
  {
    b = b.transform("uglifyify", { global: true, sourcemap: false }).on('error', error);
  }

  function bundle(ids=[])
  {
    console.log("JS", input, "=>" ,output);
    ids => ids.forEach(id => console.log(id, 'changed'));
    b.bundle().on('error', error)
      .pipe(fs.createWriteStream(output));
  }
  if (watchify)
  {
    b.on('update', bundle);
    b.on('time', time => console.log("JS", output, 'took', time + 'ms'));
  }
  
  bundle();
}

function watchJS(config)
{
  if (config.js)
  {
    js(config, false, true);
  }
}

function buildJS(config)
{
  if (config.js)
  {
    js(config, false, false);
  }
}

function releaseJS(config)
{
  if (config.js)
  {
    js(config, true, false);
  }
}

function static(config, watch)
{
  const input = path.join(config.base, config.static);
  const output = path.join(config.base, config.dist);
  //console.log(input, "=>" ,output);
  function copy(fn)
  {
    console.log("STATIC", path.join(input, fn), "=>" ,path.join(output, fn));
    fs.copy(path.join(input, fn), path.join(output, fn));
  }
  if (watch)
  {
    const chokidar = require('chokidar');
    chokidar.watch(input).on('change', function(fn)
    {
      fn = path.relative(input, fn)
      if (fn.indexOf('.') !== 0)
      {
        copy(fn);
      }
    });
  }
  fs.readdirSync(input).map(copy);
}

function watchStatic(config)
{
  if (config.static)
  {
    static(config, true);
  }
}

function buildStatic(config)
{
  if (config.static)
  {
    static(config, false);
  }
}

function releaseStatic(config)
{
  if (config.static)
  {
    static(config, false);
  }
}

function watch(config)
{
  watchSCSS(config);
  watchJS(config);
  watchStatic(config);
}

function build(config)
{
  buildSCSS(config);
  buildJS(config);
  buildStatic(config);
}

function release(config)
{
  releaseSCSS(config);
  releaseJS(config);
  releaseStatic(config);
}


function mkdirall(dir)
{
  if (!fs.existsSync(dir))
  {
    mkdirall(path.dirname(dir));
    fs.mkdirSync(dir);
  }
}

mkdirall(path.join(config.base, config.dest));

switch(config.command)
{
  case 'watch':
    watch(config);
    break;
  case 'build':
    build(config);
    break;
  case 'release':
    release(config);
    break;
  default:
    require('yargs').showHelp();
    process.exit(1);
}

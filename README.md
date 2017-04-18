# Basic JS (Browserify/Babelify/D3)/CSS(SCSS) Web Client Boilerplate Builder

Meant for quickly setting up UI codebases for simple projects. Assumes nodejs > 7.0.

<pre>
"scripts": {
  "builder": "node ./node_modules/js-client-boilderplate-nahid/index.js --base $PWD --dist dist --js js/index.js --scss scss/index.scss --static static --command",
  "build": "npm run builder -- build",
  "watch": "npm run builder -- watch",
  "release": "npm run builder -- release"
},
</pre>

Hope to never spend another second screwing around with these tools for new projects.

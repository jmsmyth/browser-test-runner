#!/usr/bin/env node
if (process.argv[2] === 'watch') {
  var server = require('../server.js')
  server.start()
}

if (process.argv[2] === 'run') {
  var runner = require('../index.js')
  runner.run({htmlFilename: process.argv[3]})
}

"use strict"

#!/usr/bin/env node
if (process.argv[2] === 'watch') {
  const server = require('../server')
  server.start()
} else if (process.argv[2] === 'saucelabs') {
  const runner = require('../saucelabs')
  runner({ urlPath: process.argv[3] })
} else if (process.argv[2] === 'phantomjs') {
  const runner = require('../phantom')
  runner({ urlPath: process.argv[3] })
} else {
  const runner = require('../browser')
  runner({ browserName: process.argv[2], urlPath: process.argv[3] })
}

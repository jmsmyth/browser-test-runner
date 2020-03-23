'use strict'

const server = require('./server')
const launcher = require('@james-proxy/james-browser-launcher')
const chalk = require('chalk')
const uuid = require('uuid')

function logError(err) {
  console.log(chalk.red(err))
}

module.exports = function (options = {}) {
  const port = options.port || 10001
  const urlPath = options.urlPath || 'test/index.html'
  const browserName = options.browserName || 'phantomjs'
  const responseLimit = options.responseLimit || '100mb'

  // launcher.detect(function logBrowsers(available) {
  //   console.log('Available browsers:')
  //   console.dir(available)
  // })

  console.log('Starting web server on port ' + port)
  server
    .start({ port: port, responseLimit: responseLimit })
    .then((s) => {
      launcher((err, launch) => {
        if (err) return logError(err)

        const id = uuid.v4()
        const url = 'http://localhost:' + port + '/' + urlPath + '?id=' + id

        console.log('launching ' + url + ' on ' + browserName)

        launch(url, browserName, (err, instance) => {
          if (err) logError(err)

          instance.stdout.pipe(process.stdout)
          instance.stderr.pipe(process.stdout)

          s.events.on('result', function (obj) {
            if (obj.id === id) {
              instance.stop(function (err) {
                s.server.close()
                process.exit(obj.counts.passed === obj.counts.count ? 0 : 2)
              })
            }
          })

          s.events.on('page-error', function (r) {
            if (r.id === id) {
              instance.stop(function (err) {
                s.server.close()
                process.exit(1)
              })
            }
          })
        })
      })
    })
    .catch(logError)
}

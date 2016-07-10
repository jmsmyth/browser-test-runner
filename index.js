var server = require('./server')
var launcher = require('browser-launcher2')
var chalk = require('chalk')
var uuid = require('uuid')

function logTests (tests, indent) {
  tests.forEach(function (test) {
    if (test.state === 'passed') {
      console.log(chalk.green(indent + '+ ' + test.title))
    } else {
      console.log(chalk.red(indent + '- ' + test.title))
      console.log(chalk.gray(test.err.stack.split('\n').map(function (line) {
        return indent + '  ' + line
      }).join('\n')))
    }
  })
}

function logSuites (suites, indent) {
  suites.forEach(function (suite) {
    console.log(indent + suite.title)
    logSuites(suite.suites, indent + '  ')
    logTests(suite.tests, indent + '  ')
  })
}

function countResults (suites) {
  var count = 0
  var passed = 0
  suites.forEach(function (suite) {
    var res = countResults(suite.suites)
    count += res.count
    passed += res.passed
    suite.tests.forEach(function (test) {
      count++
      if (test.state === 'passed') {
        passed++
      }
    })
  })
  return {count: count, passed: passed}
}

function logResults (results) {
  logSuites(results, '')
  var res = countResults(results)
  var failureCount = res.count - res.passed

  if (failureCount > 0) {
    console.log(chalk.red('\n' + failureCount + '/' + res.count + ' tests failed'))
  } else {
    console.log(chalk.green('\n' + res.passed + '/' + res.count + ' tests passed'))
  }

  return res
}

function logError (err) {
  console.log(chalk.red(err))
}

exports.run = function (options) {
  options = options || {}
  var port = options.port || 10001
  var htmlFilename = options.htmlFilename
  var browserName = options.browserName || 'phantomjs'
  var responseLimit = options.responseLimit || '100mb'

  console.log('Starting web server on port ' + port)
  server.start({ids: [0], port: port, responseLimit: responseLimit}).then(function (s) {
    launcher(function (err, launch) {
      if (err) return logError(err)
      var id = uuid.v4()

      console.log('launching ' + browserName)

      launch('http://localhost:' + port + '/' + htmlFilename + '?id=' + id, browserName, function (err, instance) {
        if (err) logError(err)

        s.events.on('result', function (obj) {
          var res = logResults(obj.results)
          if (obj.id === id) {
            instance.stop(function (err) {
              s.server.close()
              process.exit(res.passed === res.count ? 0 : 2)
            })
          }
        })

        s.events.on('error', function (r) {
          logError(r.error)
          if (r.id === id) {
            instance.stop(function (err) {
              s.server.close()
              process.exit(1)
            })
          }
        })
      })
    })
  }).catch(logError)

}

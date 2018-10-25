"use strict"

const path = require('path')
const chalk = require('chalk')
const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const istanbul = require('istanbul')
const EventEmitter = require('events')

const app = express()

function logTests (tests, indent) {
  tests.forEach(test => {
    if (test.state === 'passed') {
      console.log(chalk.green(indent + '+ ' + test.title))
    } else if (test.state === 'failed') {
      console.log(chalk.red(indent + '- ' + test.title))
      if (test.err) {
        console.log(chalk.red(test.err))
        console.log(chalk.gray(test.err.stack.split('\n').map(line => {
          return indent + '  ' + line
        }).join('\n')))
      }
    } else {
      console.log(chalk.yellow(indent + '+ ' + test.title))
    }
  })
}

function logSuites (suites, indent) {
  suites.forEach(suite => {
    if(suite.err) {
      console.log(chalk.red(indent + '- ' + suite.title))
      if (suite.err) {
        console.log(chalk.gray(suite.err.stack.split('\n').map(line => {
          return indent + '  ' + line
        }).join('\n')))
      }
    } else {
      console.log(indent + suite.title)
    }
    logSuites(suite.suites, indent + '  ')
    logTests(suite.tests, indent + '  ')
  })
}

function countResults (suites) {
  let count = 0
  let passed = 0
  suites.forEach(suite => {
    const res = countResults(suite.suites)
    count += res.count
    passed += res.passed
    suite.tests.forEach(test => {
      if (test.state === 'passed' || test.state === 'failed') {
        count++
      }
      if (test.state === 'passed') {
        passed++
      }
    })
  })
  return {count: count, passed: passed}
}

function logResults (results) {
  logSuites(results, '')
  const res = countResults(results)
  const failureCount = res.count - res.passed

  if (failureCount > 0) {
    console.log(chalk.red('\n' + failureCount + '/' + res.count + ' tests failed'))
  } else {
    console.log(chalk.green('\n' + res.passed + '/' + res.count + ' tests passed'))
  }

  return res
}

exports.start = function (options) {
  options = options || {}
  const sourceDir = options.sourceDir || '.'
  const port = options.port || 10001
  const responseLimit = options.responseLimit || '100mb'
  const outputDir = options.outputDir || 'test-report'

  const events = new EventEmitter

  function resultHandler (req, res) {
    console.log('Building coverage reports')
    const collector = new istanbul.Collector()

    req.body.coverage.forEach(c => {
      collector.add(c)
    })

    const reporter = new istanbul.Reporter(undefined, options.outputDir)
    reporter.add('html')
    reporter.add('lcov')
    reporter.write(collector, false, () => {
      console.log('All reports generated')

      res.status(200).end()

      const results = req.body.results
      logResults(results)
      const counts = countResults(results)

      events.emit('result', {
        id: req.body.id,
        results: req.body.results,
        counts
      })
    })
  }

  function logError (obj) {
    console.log(chalk.red(obj.url + ' ' + obj.lineNumber + ' ' + obj.error))
  }

  function errorHandler (req, res) {
    const errorObj = req.body
    logError(errorObj)
    events.emit('page-error', errorObj)
    res.status(200).end()
  }

  return new Promise((resolve, reject) => {
    const server = app
      .use(express.static(sourceDir))
      .use(bodyParser.json({limit: responseLimit}))
      .use(cors())
      .post('/results', resultHandler)
      .post('/error', errorHandler)
      .listen(port, function (err) {
        err ? reject(err) : resolve({
          server: server,
          events: events
        })
      })
  })
}

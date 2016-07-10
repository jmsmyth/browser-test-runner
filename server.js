var path = require('path')
var express = require('express')
var bodyParser = require('body-parser')
var cors = require('cors')
var istanbul = require('istanbul')
var EventEmitter = require('events')
var Promise = require('bluebird')

var app = express()

exports.start = function (options) {
  options = options || {}
  var sourceDir = options.sourceDir || '.'
  var port = options.port || 10001
  var responseLimit = options.responseLimit || '100mb'
  var outputDir = options.outputDir || 'test-report'

  var events = new EventEmitter

  function resultHandler (req, res) {
    var collector = new istanbul.Collector()

    req.body.coverage.forEach(function (c) {
      collector.add(c)
    })

    var reporter = new istanbul.Reporter(undefined, options.outputDir)
    reporter.add('html')
    reporter.add('lcov')
    reporter.write(collector, false, function () {
      console.log('All reports generated')

      res.status(200).end()

      events.emit('result', {
        id: req.body.id,
        results: req.body.results
      })
    })

  }

  function errorHandler (req, res) {
    events.emit('error', req.body)
  }

  return new Promise(function (resolve, reject) {
    var server = app
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

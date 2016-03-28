const path = require('path')
const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const istanbul = require('istanbul')
const EventEmitter = require('events')

const app = express()

exports.start = (options) => {
  options = options || {}
  const sourceDir = options.sourceDir || '.'
  const port = options.port || 10001
  const outputDir = options.outputDir || 'test-report'

  const events = new EventEmitter

  function resultHandler (req, res) {
    const collector = new istanbul.Collector()
    const reporter = new istanbul.Reporter(undefined, options.outputDir)

    events.emit('result', {
      id: req.body.id,
      results: req.body.results
    })

    req.body.coverage.forEach((c) => {
      collector.add(c)
    })

    reporter.add('html')
    reporter.write(collector, false, () => {
      console.log('All reports generated')
      res.status(200).end()
    })
  }

  function errorHandler (req, res) {
    console.log('error', req.body)
  }

  return new Promise((resolve, reject) => {
    var server = app
      .use(express.static(sourceDir))
      .use(bodyParser({limit: '100mb'}))
      .use(cors())
      .post('/results', resultHandler)
      .post('/results', errorHandler)
      .listen(port, (err) => {
        err ? reject(err) : resolve({
          server: server,
          events: events
        })
      })
  })

}

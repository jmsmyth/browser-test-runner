const wd = require('wd')
const uuid = require('uuid')
const server = require('./server')
const SauceLabs = require('saucelabs')

function updateJobStatus(jobId, details) {
  const sauceApi = new SauceLabs({
    username: process.env.SAUCE_USERNAME,
    password: process.env.SAUCE_ACCESS_KEY
  })

  return new Promise((resolve, reject) => {
    sauceApi.updateJob(jobId, details, function (err) {
      err ? reject(err) : resolve()
    })
  })
}

module.exports = function (options = {}) {
  const port = options.port || 10001
  const sourceDir = options.sourceDir
  const urlPath = options.urlPath || 'test/index.html'
  const responseLimit = options.responseLimit || '100mb'

  console.log('Starting web server on port ' + port)
  server.start({
    ids: [0],
    port,
    responseLimit,
    sourceDir
  }).then(s => {
    const id = uuid.v4()

    const browser = wd.promiseRemote('localhost', 4445)

    //XXX: expose as options
    const browserConfig = {
      username: process.env.SAUCE_USERNAME,
      accessKey: process.env.SAUCE_ACCESS_KEY,
      tags: [],
      name: process.env.TRAVIS_COMMIT_MESSAGE || "Local run",
      browserName: 'chrome',
      version: '55.0',
      platform: 'Windows 10'
    }

    return browser.init(browserConfig).then(res => {
      const jobId = res[0]

      s.events.on('result', (obj) => {
        if (obj.id === id) {
          browser.quit()
            .then(() => updateJobStatus(jobId, {passed: true}))
            .then(() => {
              s.server.close()
              process.exit(obj.counts.passed === obj.counts.count ? 0 : 2)
            }).catch(err => {
              console.error(err)
              process.exit(obj.counts.passed === obj.counts.count ? 0 : 2)
            })
        }
      })

      s.events.on('page-error', (obj) => {
        if (obj.id === id) {
          browser.quit()
            .then(() => updateJobStatus(jobId, {passed: false}))
            .catch(err => console.error(err))
            .then(() => {
              s.server.close()
              process.exit(1)
            })
        }
      })

      const url = 'http://localhost:' + port + '/' + urlPath + '?id=' + id
      console.log('Launching ' + url)
      return browser.get(url)
    })
  }).catch((err) => console.error(err))
}

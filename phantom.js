const phantom = require('phantom')
const uuid = require('uuid')
const server = require('./server')

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

    const url = 'http://localhost:' + port + '/' + urlPath + '?id=' + id
    return phantom.create()
      .then(instance => {
        instance.createPage().then(page => {
          s.events.on('result', (obj) => {
            if (obj.id === id) {
              instance.exit().then(() => {
                s.server.close()
                process.exit(obj.counts.passed === obj.counts.count ? 0 : 2)
              })
            }
          })

          s.events.on('page-error', (obj) => {
            if (obj.id === id) {
              instance.exit().then(() => {
                s.server.close()
                process.exit(1)
              })
            }
          })

          console.log('Launching ' + url)
          page.open(url).catch(err => console.error(err))
        })
      })

  }).catch((err) => console.error(err))
}

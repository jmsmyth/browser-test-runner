'use strict'

const puppeteer = require('puppeteer')
const uuid = require('uuid')
const server = require('./server')

module.exports = async function(options = {}) {
  const port = options.port || 10001
  const sourceDir = options.sourceDir
  const urlPath = options.urlPath || 'test/index.html'
  const responseLimit = options.responseLimit || '100mb'

  try {
    console.log('Starting web server on port ' + port)
    const s = await server.start({
      ids: [0],
      port,
      responseLimit,
      sourceDir,
    })
    const id = uuid.v4()

    const url = 'http://localhost:' + port + '/' + urlPath + '?id=' + id

    console.log('Launching ' + url)
    const browser = await puppeteer.launch()
    const page = await browser.newPage()
    await page.goto(url)

    s.events.on('result', obj => {
      if (obj.id === id) {
        browser.close().then(() => {
          s.server.close()
          process.exit(obj.counts.passed === obj.counts.count ? 0 : 2)
        })
      }
    })

    s.events.on('page-error', obj => {
      if (obj.id === id) {
        browser.close().then(() => {
          s.server.close()
          process.exit(1)
        })
      }
    })
  } catch (err) {
    console.error(err)
  }
}

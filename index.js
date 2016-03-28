var server = require('./server')
var launcher = require('browser-launcher2')

exports.run = function (options) {
  options = options || {}
  var htmlFilename = options.htmlFilename

  server.start({ids: [0]}).then((s) => {
    launcher(function (err, launch) {
      console.log(launch.browsers)
      const id = 'some-unique-id'
      launch('http://localhost:10001/' + htmlFilename + '?id=' + id, 'chrome', function (err, instance) {
        console.log('launched')
        s.events.on('result', (r) => {
          console.log(r)
          if (r.id === 'some-unique-id') {
            instance.stop(function (err) {
              s.server.close()
              console.log('stopped')
            })
          }
        })
      })
    })
  })

}

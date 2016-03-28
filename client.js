// http://stackoverflow.com/a/901144
function getParameterByName (name, url) {
  if (!url) url = window.location.href
  url = url.toLowerCase() // This is just to avoid case sensitiveness
  name = name.replace(/[\[\]]/g, '\\$&').toLowerCase() // This is just to avoid case sensitiveness for query parameter name
  var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)')
  var results = regex.exec(url)
  if (!results) return null
  if (!results[2]) return ''
  return decodeURIComponent(results[2].replace(/\+/g, ' '))
}

function runTests (mochaRunner) {
  var results = []
  var id = getParameterByName('id')
  mochaRunner
    .on('test', function (test) {})
    .on('test end', function (test) {
      results.push({
        title: test.title,
        state: test.state
      })
    })
    .on('end', function () {
      console.log('sending')
      var XHR = new XMLHttpRequest()
      XHR.open('POST', '/results', true)
      XHR.setRequestHeader('Content-type', 'application/json')
      XHR.send(JSON.stringify({
        id: id,
        results: results,
        coverage: [__coverage__]
      }))
    })
}

window.BrowserTestRunner = {
  runTests: runTests
}

window.onerror = function (message, url, lineNumber) {
  var XHR = new XMLHttpRequest()
  XHR.open('POST', '/error', true)
  XHR.setRequestHeader('Content-type', 'application/json')
  XHR.send(JSON.stringify({
    error: message,
    url: url,
    lineNumber: lineNumber
  }))
  return true
}

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

function post (url, data) {
  var XHR = new XMLHttpRequest()
  XHR.open('POST', url, true)
  XHR.setRequestHeader('Content-type', 'application/json')
  XHR.send(JSON.stringify(data))
}

function extractSuites (suites) {
  return suites.map(function (suite) {
    return {
      title: suite.title,
      suites: extractSuites(suite.suites || []),
      tests: suite.tests.map(function (test) {
        return {
          title: test.title,
          state: test.state,
          duration: test.duration,
          err: test.err
        }
      })
    }
  })
}

function init () {
  var id = getParameterByName('id')
  mocha.suite.afterAll(function () {
    post('/results', {
      id: id,
      results: extractSuites(mocha.suite.suites),
      coverage: [__coverage__]
    })

  })
}

window.BrowserTestRunner = {
  init: init
}

window.onerror = function (message, url, lineNumber) {
  post('/error', {
    error: message,
    url: url,
    lineNumber: lineNumber
  })
  return true
}

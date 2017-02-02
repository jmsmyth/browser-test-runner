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
  try {
    var stringifiedData = JSON.stringify(data)
    return fetch(url, {
      method: 'POST',
      headers: {
        'Content-type': 'application/json'
      },
      body: stringifiedData
    })
  } catch (err) {
    console.log(err, data)
    return post('/error', {
      id: id,
      error: {
        message: err.message,
        stack: err.stack
      }
    })
  }
}

var id = getParameterByName('id')

window.addEventListener('error', function (evt) {
  // XXX: remove this and add make init return a promise that contains info
  document.querySelector('body').innerText = evt.message

  console.log(evt)

  post('/error', {
    id: id,
    error: {
      message: evt.message,
      stack: evt.stack
    },
    url: evt.filename,
    lineNumber: evt.lineno,
    columnNumber: evt.colno
  })
  return false
})

function checkArrayForError(arr) {
  if(Array.isArray(arr)) {
    var item = arr.filter(function (x) { return x.err })[0]
    if (item) {
      return {
        message: item.err.message,
        stack: item.err.stack
      }
    }
  }
}

function getErrorFromSuite (suite) {
  var beforeErr = checkArrayForError(suite._before)
  if (beforeErr) return beforeErr
  var beforeEachErr = checkArrayForError(suite._beforeEach)
  if (beforeEachErr) return beforeEachErr
  var afterErr = checkArrayForError(suite._after)
  if (afterErr) return afterErr
  var afterEachErr = checkArrayForError(suite._afterEach)
  if (afterEachErr) return afterEachErr
}

function extractSuites (suites) {
  return suites.map(function (suite) {
    return {
      title: suite.title,
      suites: extractSuites(suite.suites || []),
      err: getErrorFromSuite(suite),
      tests: suite.tests.map(function (test) {
        console.log(test.err)
        return {
          title: test.title,
          state: test.state,
          duration: test.duration,
          err: test.err ? {
            message: test.err.message,
            stack: test.err.stack || ""
          } : undefined
        }
      })
    }
  })
}

function init () {
  mocha.suite.afterAll(function () {
    var coverage = []
    if (window.__coverage__) coverage.push(window.__coverage__)
    if (window._$coffeeIstanbul) coverage.push(window._$coffeeIstanbul)
    post('/results', {
      id: id,
      results: extractSuites(mocha.suite.suites),
      coverage: coverage
    })
  })
}

window.BrowserTestRunner = {
  init: init
}

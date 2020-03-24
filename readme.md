# browser-test-runner

Write tests as a web page, run from the command line for ci.
Outputs coverage for istanbul instrumented code.

## Install

```bash
npm install browser-test-runner
```

## Usage

Run tests on a browser:

```bash
browser-test-runner chrome 'test/index.html'
browser-test-runner firefox 'test/index.html'
browser-test-runner safari 'test/index.html'
browser-test-runner chrome-headless 'test/index.html'
```

Host the test file, and re-run the tests on any browser that has the page open
whenever the tests are changed

```bash
browser-test-runner start 'test/index.html'
```

## Changelog

### 0.8.0

- Replace `browser-test-runner phantom` with `browser-test-runner chrome-headless`, which is backed by puppeteer

// Karma configuration file, see link for more information
// https://karma-runner.github.io/1.0/config/configuration-file.html

module.exports = function (config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine', '@angular-devkit/build-angular'],
    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-launcher'),
      require('karma-jasmine-html-reporter'),
      require('karma-coverage'),
      require('@angular-devkit/build-angular/plugins/karma')
    ],
    client: {
      jasmine: {
        // Reduce memory usage by limiting console output
        random: true,
        seed: '4321',
        stopSpecOnExpectationFailure: true,
        stopOnSpecFailure: true
      },
      clearContext: false // leave Jasmine Spec Runner output visible in browser
    },
    jasmineHtmlReporter: {
      suppressAll: true // removes the duplicated traces
    },
    coverageReporter: {
      dir: require('path').join(__dirname, './coverage/cadentis'),
      subdir: '.',
      reporters: [
        { type: 'html' },
        { type: 'text-summary' }
      ]
    },
    reporters: ['progress', 'kjhtml'],
    browsers: ['ChromeHeadless'],
    customLaunchers: {
      ChromeHeadlessCI: {
        base: 'ChromeHeadless',
        flags: [
          '--no-sandbox',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--remote-debugging-port=9222',
          '--memory-pressure-off',
          '--max-old-space-size=4096'
        ]
      }
    },
    restartOnFileChange: true,
    // Memory optimization settings
    browserNoActivityTimeout: 60000,
    browserDisconnectTimeout: 10000,
    browserDisconnectTolerance: 3,
    captureTimeout: 120000,
    // Reduce memory usage by limiting concurrent browsers
    concurrency: 1,
    // Run tests in random order to catch interdependencies
    randomize: true,
    // Memory leak detection
    detectOpenHandles: true,
    // Limit test output to reduce memory consumption
    logLevel: config.LOG_WARN,
    colors: true,
    autoWatch: true,
    singleRun: false
  });
};

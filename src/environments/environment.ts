export const environment = {
  production: false,
  developmentMode: true,
  version: '2.0.0-dev',
  
  // API Configuration
  api: {
    baseUrl: 'http://localhost:3000/api',
    timeout: 30000,
    retryAttempts: 3
  },
  
  // Feature flags
  features: {
    enableWebWorkers: true,
    enableRealTimeAnalysis: true,
    enableBatchProcessing: true,
    enableAdvancedMetrics: true,
    enableExport: true,
    enableHistory: true,
    enableCache: true,
    enableNotifications: true,
    enableAnalytics: false, // Disabled in development
    enablePerformanceMonitoring: true,
    enableAccessibilityFeatures: true
  },
  
  // Performance settings
  performance: {
    debounceTime: 300,
    cacheTimeout: 30 * 60 * 1000, // 30 minutes
    maxHistoryItems: 100,
    maxCacheSize: 50,
    webWorkerTimeout: 10000
  },
  
  // Logging configuration
  logging: {
    level: 'debug',
    enableConsoleLog: true,
    enableRemoteLog: false,
    logToFile: false
  },
  
  // Analytics (disabled in development)
  analytics: {
    enabled: false,
    trackingId: '',
    anonymizeIp: true
  },
  
  // Error reporting
  errorReporting: {
    enabled: true,
    dsn: '', // Sentry DSN for development
    environment: 'development',
    sampleRate: 1.0
  },
  
  // Security settings
  security: {
    csp: {
      enabled: false, // Relaxed for development
      reportOnly: true
    },
    allowedOrigins: ['http://localhost:4200', 'http://localhost:3000'],
    enableXssProtection: true
  },
  
  // Internationalization
  i18n: {
    defaultLanguage: 'en',
    supportedLanguages: ['en', 'hu', 'de', 'fr'],
    fallbackLanguage: 'en'
  }
};

export const environment = {
  production: true,
  developmentMode: false,
  version: '2.0.0',
  
  // API Configuration
  api: {
    baseUrl: '/api',
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
    enableAnalytics: true,
    enablePerformanceMonitoring: true,
    enableAccessibilityFeatures: true
  },
  
  // Performance settings
  performance: {
    debounceTime: 300,
    cacheTimeout: 60 * 60 * 1000, // 1 hour in production
    maxHistoryItems: 50,
    maxCacheSize: 30,
    webWorkerTimeout: 15000
  },
  
  // Logging configuration
  logging: {
    level: 'error',
    enableConsoleLog: false,
    enableRemoteLog: true,
    logToFile: false
  },
  
  // Analytics
  analytics: {
    enabled: true,
    trackingId: 'GA_TRACKING_ID', // Replace with actual tracking ID
    anonymizeIp: true
  },
  
  // Error reporting
  errorReporting: {
    enabled: true,
    dsn: 'SENTRY_DSN', // Replace with actual Sentry DSN
    environment: 'production',
    sampleRate: 0.1
  },
  
  // Security settings
  security: {
    csp: {
      enabled: true,
      reportOnly: false
    },
    allowedOrigins: ['https://your-domain.com'],
    enableXssProtection: true
  },
  
  // Internationalization
  i18n: {
    defaultLanguage: 'en',
    supportedLanguages: ['en', 'hu', 'de', 'fr'],
    fallbackLanguage: 'en'
  }
};

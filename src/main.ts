import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { environment } from './environments/environment';

bootstrapApplication(AppComponent, appConfig)
  .then(() => {
    // Register Service Worker only in production
    if (environment.production && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/cadentis/sw.js', {
        scope: '/cadentis/'
      })
      .then((registration) => {
        console.log('SW registration successful:', registration);
      })
      .catch((error) => {
        console.log('SW registration failed:', error);
      });
    }
  })
  .catch((err) => console.error('App bootstrap failed:', err));

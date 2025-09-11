import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { environment } from './environments/environment';

bootstrapApplication(AppComponent, appConfig)
  .then(() => {
    // Register Service Worker only in production with correct path
    if (environment.production && 'serviceWorker' in navigator) {
      // Determine correct path based on hostname
      const isGitHubPages = window.location.hostname === 'aporkolab.github.io';
      const swPath = isGitHubPages ? '/cadentis/sw.js' : '/sw.js';
      const scope = isGitHubPages ? '/cadentis/' : '/';
      
      navigator.serviceWorker.register(swPath, { scope })
      .then((registration) => {
        console.log('SW registration successful:', registration);
      })
      .catch((error) => {
        console.log('SW registration failed:', error);
      });
    }
  })
  .catch((err) => console.error('App bootstrap failed:', err));

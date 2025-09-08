import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';

interface PWAStatus {
  isOnline: boolean;
  isInstalled: boolean;
  isInstallable: boolean;
  serviceWorkerActive: boolean;
  pushNotificationsEnabled: boolean;
  cacheSize: number;
  lastUpdate: Date | null;
}

interface InstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

@Component({
  selector: 'app-pwa-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="pwa-dashboard">
      <h2>Progressive Web App Dashboard</h2>
      
      <!-- PWA Status Overview -->
      <div class="status-overview">
        <div class="status-card" [class.online]="status.isOnline" [class.offline]="!status.isOnline">
          <div class="status-icon">{{ status.isOnline ? '🟢' : '🔴' }}</div>
          <h3>Connection Status</h3>
          <p>{{ status.isOnline ? 'Online' : 'Offline' }}</p>
        </div>
        
        <div class="status-card" [class.installed]="status.isInstalled">
          <div class="status-icon">{{ status.isInstalled ? '📱' : '🌐' }}</div>
          <h3>Installation</h3>
          <p>{{ status.isInstalled ? 'Installed' : 'Web App' }}</p>
        </div>
        
        <div class="status-card" [class.active]="status.serviceWorkerActive">
          <div class="status-icon">{{ status.serviceWorkerActive ? '⚙️' : '❌' }}</div>
          <h3>Service Worker</h3>
          <p>{{ status.serviceWorkerActive ? 'Active' : 'Inactive' }}</p>
        </div>
        
        <div class="status-card" [class.enabled]="status.pushNotificationsEnabled">
          <div class="status-icon">{{ status.pushNotificationsEnabled ? '🔔' : '🔕' }}</div>
          <h3>Notifications</h3>
          <p>{{ status.pushNotificationsEnabled ? 'Enabled' : 'Disabled' }}</p>
        </div>
      </div>

      <!-- Installation Section -->
      <div class="feature-section" *ngIf="status.isInstallable && !status.isInstalled">
        <h3>📥 Install App</h3>
        <p>Install Cadentis as a Progressive Web App for the best experience!</p>
        <div class="install-benefits">
          <div class="benefit">✓ Faster loading</div>
          <div class="benefit">✓ Offline access</div>
          <div class="benefit">✓ Native app feel</div>
          <div class="benefit">✓ Push notifications</div>
        </div>
        <button (click)="installApp()" class="primary-btn install-btn">
          Install App
        </button>
      </div>

      <!-- Notifications Section -->
      <div class="feature-section">
        <h3>🔔 Push Notifications</h3>
        <p>Stay updated with important security alerts and test results.</p>
        <div class="notification-controls">
          <button 
            (click)="enableNotifications()" 
            class="secondary-btn"
            [disabled]="status.pushNotificationsEnabled">
            {{ status.pushNotificationsEnabled ? '✓ Enabled' : 'Enable Notifications' }}
          </button>
          <button 
            (click)="sendTestNotification()" 
            class="secondary-btn"
            [disabled]="!status.pushNotificationsEnabled">
            Send Test Notification
          </button>
        </div>
      </div>

      <!-- Cache Management -->
      <div class="feature-section">
        <h3>💾 Cache Management</h3>
        <p>Manage offline storage and cached resources.</p>
        <div class="cache-info">
          <div class="cache-stat">
            <strong>Cache Size:</strong> 
            <span>{{ formatBytes(status.cacheSize) }}</span>
          </div>
          <div class="cache-stat" *ngIf="status.lastUpdate">
            <strong>Last Update:</strong> 
            <span>{{ status.lastUpdate | date:'short' }}</span>
          </div>
        </div>
        <div class="cache-controls">
          <button (click)="refreshCache()" class="secondary-btn">
            Refresh Cache
          </button>
          <button (click)="clearCache()" class="danger-btn">
            Clear Cache
          </button>
        </div>
      </div>

      <!-- Offline Features -->
      <div class="feature-section">
        <h3>📡 Offline Features</h3>
        <p>Features available when you're offline:</p>
        <div class="offline-features">
          <div class="feature-item">
            <span class="feature-icon">🏠</span>
            <div class="feature-info">
              <h4>Browse Cached Pages</h4>
              <p>Access previously visited pages</p>
            </div>
          </div>
          <div class="feature-item">
            <span class="feature-icon">🔐</span>
            <div class="feature-info">
              <h4>Security Tools</h4>
              <p>Use encryption and security utilities</p>
            </div>
          </div>
          <div class="feature-item">
            <span class="feature-icon">🧪</span>
            <div class="feature-info">
              <h4>View Test Results</h4>
              <p>Review previously run tests</p>
            </div>
          </div>
          <div class="feature-item">
            <span class="feature-icon">📊</span>
            <div class="feature-info">
              <h4>Performance Metrics</h4>
              <p>Monitor app performance</p>
            </div>
          </div>
        </div>
      </div>

      <!-- PWA Debug Info -->
      <div class="debug-section" *ngIf="showDebugInfo">
        <h3>🛠️ Debug Information</h3>
        <div class="debug-info">
          <pre>{{ debugInfo | json }}</pre>
        </div>
      </div>
      
      <div class="actions">
        <button (click)="toggleDebugInfo()" class="secondary-btn">
          {{ showDebugInfo ? 'Hide' : 'Show' }} Debug Info
        </button>
        <button (click)="checkForUpdates()" class="secondary-btn">
          Check for Updates
        </button>
      </div>
    </div>
  `,
  styles: [`
    .pwa-dashboard {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }

    h2 {
      color: #2c3e50;
      text-align: center;
      margin-bottom: 30px;
    }

    .status-overview {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 40px;
    }

    .status-card {
      background: white;
      padding: 20px;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      text-align: center;
      border-left: 4px solid #bdc3c7;
      transition: all 0.3s ease;
    }

    .status-card.online, .status-card.installed, .status-card.active, .status-card.enabled {
      border-left-color: #27ae60;
      background: linear-gradient(135deg, #ffffff 0%, #f8fff8 100%);
    }

    .status-card.offline {
      border-left-color: #e74c3c;
      background: linear-gradient(135deg, #ffffff 0%, #fff8f8 100%);
    }

    .status-icon {
      font-size: 2rem;
      margin-bottom: 10px;
    }

    .status-card h3 {
      margin: 0 0 5px 0;
      color: #2c3e50;
      font-size: 1rem;
    }

    .status-card p {
      margin: 0;
      color: #7f8c8d;
      font-weight: bold;
    }

    .feature-section {
      background: white;
      padding: 25px;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      margin-bottom: 25px;
    }

    .feature-section h3 {
      color: #2c3e50;
      margin: 0 0 15px 0;
      font-size: 1.3rem;
    }

    .feature-section p {
      color: #7f8c8d;
      margin-bottom: 20px;
      line-height: 1.6;
    }

    .install-benefits {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 10px;
      margin: 20px 0;
    }

    .benefit {
      color: #27ae60;
      font-weight: 500;
      font-size: 0.9rem;
    }

    .notification-controls, .cache-controls {
      display: flex;
      gap: 15px;
      flex-wrap: wrap;
    }

    .primary-btn, .secondary-btn, .danger-btn {
      padding: 12px 20px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.3s ease;
    }

    .primary-btn {
      background: #3498db;
      color: white;
    }

    .primary-btn:hover {
      background: #2980b9;
      transform: translateY(-2px);
    }

    .secondary-btn {
      background: #95a5a6;
      color: white;
    }

    .secondary-btn:hover:not(:disabled) {
      background: #7f8c8d;
      transform: translateY(-2px);
    }

    .secondary-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .danger-btn {
      background: #e74c3c;
      color: white;
    }

    .danger-btn:hover {
      background: #c0392b;
      transform: translateY(-2px);
    }

    .install-btn {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      font-size: 1.1rem;
      padding: 15px 30px;
    }

    .cache-info {
      background: #f8f9fa;
      padding: 15px;
      border-radius: 6px;
      margin-bottom: 20px;
    }

    .cache-stat {
      margin-bottom: 10px;
    }

    .cache-stat:last-child {
      margin-bottom: 0;
    }

    .offline-features {
      display: grid;
      gap: 15px;
    }

    .feature-item {
      display: flex;
      align-items: center;
      gap: 15px;
      padding: 15px;
      background: #f8f9fa;
      border-radius: 8px;
      transition: all 0.3s ease;
    }

    .feature-item:hover {
      background: #e9ecef;
      transform: translateX(5px);
    }

    .feature-icon {
      font-size: 1.5rem;
      min-width: 40px;
    }

    .feature-info h4 {
      margin: 0 0 5px 0;
      color: #2c3e50;
      font-size: 1rem;
    }

    .feature-info p {
      margin: 0;
      color: #6c757d;
      font-size: 0.9rem;
    }

    .debug-section {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
    }

    .debug-info {
      background: #2c3e50;
      color: #ecf0f1;
      padding: 15px;
      border-radius: 6px;
      overflow-x: auto;
    }

    .debug-info pre {
      margin: 0;
      font-family: 'Courier New', monospace;
      font-size: 12px;
      line-height: 1.4;
    }

    .actions {
      display: flex;
      gap: 15px;
      justify-content: center;
      margin-top: 30px;
    }

    @media (max-width: 768px) {
      .pwa-dashboard {
        padding: 15px;
      }

      .notification-controls, .cache-controls, .actions {
        flex-direction: column;
      }

      .install-benefits {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class PWADashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private deferredPrompt: InstallPromptEvent | null = null;
  
  status: PWAStatus = {
    isOnline: navigator.onLine,
    isInstalled: false,
    isInstallable: false,
    serviceWorkerActive: false,
    pushNotificationsEnabled: false,
    cacheSize: 0,
    lastUpdate: null
  };
  
  showDebugInfo = false;
  debugInfo: any = {};

  ngOnInit() {
    this.initializePWA();
    this.setupEventListeners();
    this.updateStatus();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializePWA() {
    // Check if PWA is installed
    this.status.isInstalled = window.matchMedia('(display-mode: standalone)').matches ||
                             (window.navigator as any).standalone === true;

    // Check service worker status
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(() => {
        this.status.serviceWorkerActive = true;
        this.updateDebugInfo();
      });
    }

    // Check notification permission
    if ('Notification' in window) {
      this.status.pushNotificationsEnabled = Notification.permission === 'granted';
    }
  }

  private setupEventListeners() {
    // Install prompt
    window.addEventListener('beforeinstallprompt', (e: Event) => {
      e.preventDefault();
      this.deferredPrompt = e as InstallPromptEvent;
      this.status.isInstallable = true;
    });

    // App installed
    window.addEventListener('appinstalled', () => {
      this.status.isInstalled = true;
      this.status.isInstallable = false;
      this.deferredPrompt = null;
    });

    // Online/offline events
    window.addEventListener('online', () => {
      this.status.isOnline = true;
    });

    window.addEventListener('offline', () => {
      this.status.isOnline = false;
    });
  }

  async installApp() {
    if (!this.deferredPrompt) return;

    try {
      await this.deferredPrompt.prompt();
      const { outcome } = await this.deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
      
      this.deferredPrompt = null;
      this.status.isInstallable = false;
    } catch (error) {
      console.error('Install failed:', error);
    }
  }

  async enableNotifications() {
    if (!('Notification' in window)) {
      alert('This browser does not support notifications');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      this.status.pushNotificationsEnabled = permission === 'granted';
      
      if (permission === 'granted') {
        console.log('Notifications enabled');
      } else {
        console.log('Notification permission denied');
      }
    } catch (error) {
      console.error('Notification permission failed:', error);
    }
  }

  async sendTestNotification() {
    if (!this.status.pushNotificationsEnabled) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification('Test Notification', {
        body: 'This is a test notification from Cadentis PWA!',
        icon: '/assets/icons/icon-192x192.png',
        badge: '/assets/icons/badge-72x72.png',
        actions: [
          {
            action: 'open',
            title: 'Open App'
          }
        ]
      } as any);
    } catch (error) {
      console.error('Test notification failed:', error);
    }
  }

  async refreshCache() {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.update();
      console.log('Cache refreshed');
      this.status.lastUpdate = new Date();
    } catch (error) {
      console.error('Cache refresh failed:', error);
    }
  }

  async clearCache() {
    if (!confirm('Are you sure you want to clear the cache? This will remove all offline content.')) {
      return;
    }

    try {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(name => caches.delete(name))
      );
      this.status.cacheSize = 0;
      console.log('Cache cleared');
    } catch (error) {
      console.error('Cache clear failed:', error);
    }
  }

  async checkForUpdates() {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.update();
      console.log('Checked for updates');
    } catch (error) {
      console.error('Update check failed:', error);
    }
  }

  toggleDebugInfo() {
    this.showDebugInfo = !this.showDebugInfo;
    if (this.showDebugInfo) {
      this.updateDebugInfo();
    }
  }

  private updateStatus() {
    // This would typically come from a PWA service
    // For now, we'll simulate the data
    setTimeout(() => {
      this.status.cacheSize = Math.floor(Math.random() * 5000000); // Random cache size
    }, 1000);
  }

  private updateDebugInfo() {
    this.debugInfo = {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      onLine: navigator.onLine,
      serviceWorker: 'serviceWorker' in navigator,
      pushManager: 'PushManager' in window,
      notification: 'Notification' in window,
      cacheAPI: 'caches' in window,
      indexedDB: 'indexedDB' in window,
      localStorage: 'localStorage' in window,
      sessionStorage: 'sessionStorage' in window,
      webGL: 'WebGLRenderingContext' in window,
      webAssembly: 'WebAssembly' in window,
      status: this.status
    };
  }

  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

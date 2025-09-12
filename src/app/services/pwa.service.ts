import { Injectable } from '@angular/core';
import { SwUpdate, SwPush } from '@angular/service-worker';
import { BehaviorSubject, Observable, from } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

export interface PWAInstallPrompt {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: any;
  actions?: { action: string; title: string; icon?: string }[];
}

export interface CacheStatus {
  total: number;
  cached: number;
  percentage: number;
  lastUpdated: Date | null;
}

@Injectable({
  providedIn: 'root'
})
export class PWAService {
  private deferredPrompt: PWAInstallPrompt | null = null;
  private isOnline$ = new BehaviorSubject<boolean>(navigator.onLine);
  private isInstalled$ = new BehaviorSubject<boolean>(this.checkIfInstalled());
  private cacheStatus$ = new BehaviorSubject<CacheStatus>({
    total: 0,
    cached: 0,
    percentage: 0,
    lastUpdated: null
  });

  // VAPID public key for push notifications
  private readonly VAPID_PUBLIC_KEY = 'BMxPMhLR6mK-5Hk4LvGZF8i3YTTqxQ0rXvZMzQ5yVz2Q3jSuUu9XlDr4qVvXqK8Zr2J1M9z5V7g3F2h8K6Y4E1';

  constructor(
    private swUpdate: SwUpdate,
    private swPush: SwPush
  ) {
    this.initializePWA();
    this.setupNetworkMonitoring();
    this.setupUpdateMonitoring();
  }

  private initializePWA(): void {
    // Listen for beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e as any;
    });

    // Listen for appinstalled event
    window.addEventListener('appinstalled', () => {
      this.isInstalled$.next(true);
      this.deferredPrompt = null;
      console.log('🎉 PWA installed successfully');
    });

    // Check if running in standalone mode
    this.isInstalled$.next(this.checkIfInstalled());
  }

  private setupNetworkMonitoring(): void {
    window.addEventListener('online', () => {
      this.isOnline$.next(true);
      this.syncOfflineData();
    });

    window.addEventListener('offline', () => {
      this.isOnline$.next(false);
    });
  }

  private setupUpdateMonitoring(): void {
    if (this.swUpdate.isEnabled) {
      // Check for updates every 6 hours
      setInterval(() => {
        this.swUpdate.checkForUpdate();
      }, 6 * 60 * 60 * 1000);

      // Listen for available updates
      this.swUpdate.versionUpdates.subscribe(event => {
        if (event.type === 'VERSION_READY') {
          console.log('🔄 New version available');
          this.showUpdateNotification();
        }
      });
    }
  }

  // Public API
  get isOnline(): Observable<boolean> {
    return this.isOnline$.asObservable();
  }

  get isInstalled(): Observable<boolean> {
    return this.isInstalled$.asObservable();
  }

  get canInstall(): boolean {
    return this.deferredPrompt !== null;
  }

  get cacheStatus(): Observable<CacheStatus> {
    return this.cacheStatus$.asObservable();
  }

  // Installation
  public async installApp(): Promise<boolean> {
    if (!this.deferredPrompt) {
      console.warn('⚠️ PWA install prompt not available');
      return false;
    }

    try {
      await this.deferredPrompt.prompt();
      const { outcome } = await this.deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        this.deferredPrompt = null;
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Failed to install PWA:', error);
      return false;
    }
  }

  // Updates
  public async updateApp(): Promise<boolean> {
    if (!this.swUpdate.isEnabled) {
      console.warn('⚠️ Service Worker not enabled');
      return false;
    }

    try {
      const updateAvailable = await this.swUpdate.checkForUpdate();
      if (updateAvailable) {
        await this.swUpdate.activateUpdate();
        window.location.reload();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to update app:', error);
      return false;
    }
  }

  // Push Notifications
  public async requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('⚠️ This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  public async subscribeToPushNotifications(): Promise<string | null> {
    if (!this.swPush.isEnabled) {
      console.warn('⚠️ Push notifications not enabled');
      return null;
    }

    try {
      const subscription = await this.swPush.requestSubscription({
        serverPublicKey: this.VAPID_PUBLIC_KEY
      });

      console.log('🔔 Subscribed to push notifications');
      return JSON.stringify(subscription);
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      return null;
    }
  }

  public async unsubscribeFromPushNotifications(): Promise<boolean> {
    if (!this.swPush.isEnabled) {
      return false;
    }

    try {
      await this.swPush.unsubscribe();
      console.log('🔕 Unsubscribed from push notifications');
      return true;
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error);
      return false;
    }
  }

  public get pushNotifications(): Observable<any> {
    return this.swPush.messages;
  }

  public get notificationClicks(): Observable<any> {
    return this.swPush.notificationClicks;
  }

  // Local Notifications
  public async showNotification(payload: NotificationPayload): Promise<void> {
    if (!await this.requestNotificationPermission()) {
      throw new Error('Notification permission denied');
    }

    const registration = await navigator.serviceWorker.ready;
    const notificationOptions: any = {
      body: payload.body,
      icon: payload.icon || '/icons/icon-192x192.png',
      badge: payload.badge || '/icons/icon-72x72.png',
      data: payload.data,
      tag: 'cadentis-notification',
      requireInteraction: false,
      vibrate: [100, 50, 100]
    };
    
    // Add actions if supported
    if (payload.actions && 'actions' in Notification.prototype) {
      (notificationOptions as any).actions = payload.actions;
    }
    
    await registration.showNotification(payload.title, notificationOptions);
  }

  // Offline Storage
  public async cacheVerseAnalysis(verseId: string, analysisData: any): Promise<void> {
    try {
      const cache = await caches.open('cadentis-verse-cache-v1');
      const response = new Response(JSON.stringify(analysisData), {
        headers: { 'Content-Type': 'application/json' }
      });
      await cache.put(`verse-analysis-${verseId}`, response);
      this.updateCacheStatus();
    } catch (error) {
      console.error('Failed to cache verse analysis:', error);
    }
  }

  public async getCachedVerseAnalysis(verseId: string): Promise<any | null> {
    try {
      const cache = await caches.open('cadentis-verse-cache-v1');
      const response = await cache.match(`verse-analysis-${verseId}`);
      
      if (response) {
        return await response.json();
      }
      
      return null;
    } catch (error) {
      console.error('Failed to get cached verse analysis:', error);
      return null;
    }
  }

  public async clearCache(): Promise<void> {
    try {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter(name => name.startsWith('cadentis-'))
          .map(name => caches.delete(name))
      );
      this.updateCacheStatus();
      console.log('🧹 Cache cleared');
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }

  // Background Sync
  public async scheduleBackgroundSync(tag: string, data?: any): Promise<void> {
    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Store data for background sync
      if (data) {
        const cache = await caches.open('cadentis-sync-cache-v1');
        const response = new Response(JSON.stringify(data));
        await cache.put(`sync-${tag}`, response);
      }

      // Register background sync
      await (registration as any).sync.register(tag);
      console.log(`📤 Background sync scheduled: ${tag}`);
    } catch (error) {
      console.error('Failed to schedule background sync:', error);
    }
  }

  // Offline Queue Management
  private offlineQueue: Array<{
    id: string;
    action: string;
    data: any;
    timestamp: number;
  }> = [];

  public addToOfflineQueue(action: string, data: any): void {
    const item = {
      id: this.generateId(),
      action,
      data,
      timestamp: Date.now()
    };
    
    this.offlineQueue.push(item);
    this.saveOfflineQueue();
    console.log(`📝 Added to offline queue: ${action}`);
  }

  private async syncOfflineData(): Promise<void> {
    if (this.offlineQueue.length === 0) return;

    console.log(`🔄 Syncing ${this.offlineQueue.length} offline items...`);
    
    const itemsToSync = [...this.offlineQueue];
    this.offlineQueue = [];
    
    for (const item of itemsToSync) {
      try {
        await this.processOfflineItem(item);
      } catch (error) {
        console.error('Failed to sync offline item:', item, error);
        // Re-add failed items to queue
        this.offlineQueue.push(item);
      }
    }
    
    this.saveOfflineQueue();
    
    if (this.offlineQueue.length === 0) {
      await this.showNotification({
        title: 'Szinkronizálás befejezve',
        body: 'Az offline változások sikeresen szinkronizálva lettek.'
      });
    }
  }

  private async processOfflineItem(item: any): Promise<void> {
    // Process different types of offline actions
    switch (item.action) {
      case 'save-analysis':
        await this.syncAnalysis(item.data);
        break;
      case 'share-verse':
        await this.syncSharedVerse(item.data);
        break;
      case 'update-preferences':
        await this.syncPreferences(item.data);
        break;
      default:
        console.warn('Unknown offline action:', item.action);
    }
  }

  private async syncAnalysis(data: any): Promise<void> {
    // Implement analysis sync logic
    console.log('Syncing analysis:', data);
  }

  private async syncSharedVerse(data: any): Promise<void> {
    // Implement shared verse sync logic
    console.log('Syncing shared verse:', data);
  }

  private async syncPreferences(data: any): Promise<void> {
    // Implement preferences sync logic
    console.log('Syncing preferences:', data);
  }

  // Utility methods
  private checkIfInstalled(): boolean {
    // Check if running in standalone mode
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as any).standalone ||
           document.referrer.includes('android-app://');
  }

  private async showUpdateNotification(): Promise<void> {
    await this.showNotification({
      title: 'Új verzió elérhető',
      body: 'Kattints ide a frissítéshez!',
      actions: [
        { action: 'update', title: 'Frissítés' },
        { action: 'later', title: 'Később' }
      ]
    });
  }

  private async updateCacheStatus(): Promise<void> {
    try {
      const cacheNames = await caches.keys();
      let totalSize = 0;
      let itemCount = 0;

      for (const cacheName of cacheNames.filter(name => name.startsWith('cadentis-'))) {
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();
        itemCount += keys.length;
      }

      this.cacheStatus$.next({
        total: itemCount,
        cached: itemCount,
        percentage: 100,
        lastUpdated: new Date()
      });
    } catch (error) {
      console.error('Failed to update cache status:', error);
    }
  }

  private saveOfflineQueue(): void {
    try {
      localStorage.setItem('cadentis-offline-queue', JSON.stringify(this.offlineQueue));
    } catch (error) {
      console.error('Failed to save offline queue:', error);
    }
  }

  private loadOfflineQueue(): void {
    try {
      const stored = localStorage.getItem('cadentis-offline-queue');
      if (stored) {
        this.offlineQueue = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load offline queue:', error);
      this.offlineQueue = [];
    }
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  // App Shortcuts
  public getAppShortcuts(): Array<{ name: string; url: string; icon?: string }> {
    return [
      {
        name: 'Új vers elemzése',
        url: '/analyzer',
        icon: '/icons/icon-192x192.png'
      },
      {
        name: 'Dokumentáció',
        url: '/documentation',
        icon: '/icons/icon-192x192.png'
      },
      {
        name: 'Együttműködés',
        url: '/collaboration',
        icon: '/icons/icon-192x192.png'
      }
    ];
  }

  // Share API
  public async shareContent(content: { title: string; text: string; url?: string }): Promise<boolean> {
    if (navigator.share) {
      try {
        await navigator.share(content);
        return true;
      } catch (error) {
        console.error('Failed to share content:', error);
        return false;
      }
    } else {
      // Fallback to clipboard
      try {
        await navigator.clipboard.writeText(`${content.title}\n${content.text}\n${content.url || ''}`);
        await this.showNotification({
          title: 'Másolva a vágólapra',
          body: 'A tartalom a vágólapra került.'
        });
        return true;
      } catch (error) {
        console.error('Failed to copy to clipboard:', error);
        return false;
      }
    }
  }

  // Performance monitoring
  public getAppMetrics(): Observable<{
    loadTime: number;
    renderTime: number;
    cacheHitRatio: number;
    offlineUsage: number;
  }> {
    return new Observable(observer => {
      // Get performance metrics
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const loadTime = navigation.loadEventEnd - navigation.fetchStart;
      const renderTime = navigation.domContentLoadedEventEnd - navigation.fetchStart;
      
      observer.next({
        loadTime,
        renderTime,
        cacheHitRatio: 0.85, // Placeholder - would be calculated from actual cache hits
        offlineUsage: this.offlineQueue.length
      });
      
      observer.complete();
    });
  }

  // Initialize on service creation
  public init(): void {
    this.loadOfflineQueue();
    this.updateCacheStatus();
    
    // Setup notification click handler
    this.notificationClicks.subscribe(event => {
      if (event.action === 'update') {
        this.updateApp();
      }
    });
    
    console.log('🚀 PWA Service initialized');
  }
}

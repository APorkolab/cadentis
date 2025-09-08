import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  private loadingCountSubject = new BehaviorSubject<number>(0);
  private loadingSubject = new BehaviorSubject<boolean>(false);
  
  public loading$: Observable<boolean> = this.loadingSubject.asObservable();
  public loadingCount$: Observable<number> = this.loadingCountSubject.asObservable();

  private requestMap = new Map<string, number>();

  show(identifier?: string): void {
    if (identifier) {
      // Track specific requests to avoid duplicate loading states
      const count = this.requestMap.get(identifier) || 0;
      this.requestMap.set(identifier, count + 1);
      
      if (count === 0) {
        this.incrementLoading();
      }
    } else {
      this.incrementLoading();
    }
  }

  hide(identifier?: string): void {
    if (identifier) {
      const count = this.requestMap.get(identifier) || 0;
      if (count > 0) {
        const newCount = count - 1;
        this.requestMap.set(identifier, newCount);
        
        if (newCount === 0) {
          this.decrementLoading();
          this.requestMap.delete(identifier);
        }
      }
    } else {
      this.decrementLoading();
    }
  }

  private incrementLoading(): void {
    const currentCount = this.loadingCountSubject.value;
    const newCount = currentCount + 1;
    
    this.loadingCountSubject.next(newCount);
    this.loadingSubject.next(newCount > 0);
  }

  private decrementLoading(): void {
    const currentCount = this.loadingCountSubject.value;
    const newCount = Math.max(0, currentCount - 1);
    
    this.loadingCountSubject.next(newCount);
    this.loadingSubject.next(newCount > 0);
  }

  // Force reset all loading states
  reset(): void {
    this.requestMap.clear();
    this.loadingCountSubject.next(0);
    this.loadingSubject.next(false);
  }

  // Get current loading state synchronously
  get isLoading(): boolean {
    return this.loadingSubject.value;
  }

  // Get current loading count synchronously
  get loadingCount(): number {
    return this.loadingCountSubject.value;
  }
}

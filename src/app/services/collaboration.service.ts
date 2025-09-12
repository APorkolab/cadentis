import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

export interface CollaborationUser {
  id: string;
  name: string;
  color: string;
  cursor: { line: number; column: number } | null;
  isActive: boolean;
  avatar?: string;
}

export interface TextOperation {
  type: 'insert' | 'delete' | 'retain';
  position: number;
  content?: string;
  length?: number;
  userId: string;
  timestamp: number;
}

export interface CollaborationEvent {
  type: 'user-joined' | 'user-left' | 'cursor-moved' | 'text-changed' | 'analysis-shared';
  user: CollaborationUser;
  data?: any;
}

@Injectable({
  providedIn: 'root'
})
export class CollaborationService {
  private socket: Socket | null = null;
  private yDoc: Y.Doc;
  private yText: Y.Text;
  private provider: WebsocketProvider | null = null;
  
  private currentUser$ = new BehaviorSubject<CollaborationUser | null>(null);
  private users$ = new BehaviorSubject<CollaborationUser[]>([]);
  private events$ = new Subject<CollaborationEvent>();
  private isConnected$ = new BehaviorSubject<boolean>(false);
  
  private readonly WEBSOCKET_URL = 'ws://localhost:1234'; // WebSocket server URL
  private readonly COLORS = [
    '#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6',
    '#1abc9c', '#34495e', '#e67e22', '#95a5a6', '#f1c40f'
  ];

  constructor() {
    this.yDoc = new Y.Doc();
    this.yText = this.yDoc.getText('shared-text');
    this.setupYjsObservers();
  }

  // Public API
  public async joinSession(sessionId: string, userName: string): Promise<void> {
    try {
      const user: CollaborationUser = {
        id: this.generateUserId(),
        name: userName,
        color: this.getRandomColor(),
        cursor: null,
        isActive: true
      };

      // Initialize Yjs WebSocket provider
      this.provider = new WebsocketProvider(this.WEBSOCKET_URL, sessionId, this.yDoc);
      
      // Initialize Socket.io connection for real-time events
      this.socket = io('http://localhost:3000', {
        query: { sessionId, userId: user.id, userName: user.name }
      });

      this.setupSocketListeners();
      this.currentUser$.next(user);
      this.isConnected$.next(true);

      console.log(`✅ Joined collaboration session: ${sessionId}`);
    } catch (error) {
      console.error('Failed to join collaboration session:', error);
      throw error;
    }
  }

  public leaveSession(): void {
    if (this.provider) {
      this.provider.destroy();
      this.provider = null;
    }
    
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    
    this.currentUser$.next(null);
    this.users$.next([]);
    this.isConnected$.next(false);
    
    console.log('🚪 Left collaboration session');
  }

  public insertText(position: number, text: string): void {
    if (!this.yText) return;
    
    this.yText.insert(position, text);
    this.broadcastCursorPosition(position + text.length, 0);
  }

  public deleteText(position: number, length: number): void {
    if (!this.yText) return;
    
    this.yText.delete(position, length);
    this.broadcastCursorPosition(position, 0);
  }

  public updateCursor(line: number, column: number): void {
    const currentUser = this.currentUser$.value;
    if (!currentUser || !this.socket) return;

    currentUser.cursor = { line, column };
    this.currentUser$.next(currentUser);
    
    this.socket.emit('cursor-update', {
      userId: currentUser.id,
      cursor: { line, column }
    });
  }

  public shareAnalysis(analysisData: any): void {
    if (!this.socket) return;
    
    this.socket.emit('analysis-share', {
      userId: this.currentUser$.value?.id,
      analysis: analysisData,
      timestamp: Date.now()
    });
  }

  public getText(): string {
    return this.yText?.toString() || '';
  }

  public getTextLength(): number {
    return this.yText?.length || 0;
  }

  // Observables
  get currentUser(): Observable<CollaborationUser | null> {
    return this.currentUser$.asObservable();
  }

  get users(): Observable<CollaborationUser[]> {
    return this.users$.asObservable();
  }

  get events(): Observable<CollaborationEvent> {
    return this.events$.asObservable();
  }

  get isConnected(): Observable<boolean> {
    return this.isConnected$.asObservable();
  }

  get textChanges(): Observable<{ content: string; delta: any }> {
    return new Observable(observer => {
      const handler = (event: Y.YTextEvent) => {
        observer.next({
          content: this.yText.toString(),
          delta: event.delta
        });
      };
      
      this.yText.observe(handler);
      
      return () => {
        this.yText.unobserve(handler);
      };
    });
  }

  // Private methods
  private setupYjsObservers(): void {
    this.yText.observe((event: Y.YTextEvent) => {
      // Handle text changes from other users
      const currentUser = this.currentUser$.value;
      if (currentUser && !event.transaction.local) {
        this.events$.next({
          type: 'text-changed',
          user: currentUser,
          data: {
            content: this.yText.toString(),
            delta: event.delta
          }
        });
      }
    });
  }

  private setupSocketListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('🔗 Connected to collaboration server');
      this.isConnected$.next(true);
    });

    this.socket.on('disconnect', () => {
      console.log('🔌 Disconnected from collaboration server');
      this.isConnected$.next(false);
    });

    this.socket.on('user-joined', (userData: CollaborationUser) => {
      const users = this.users$.value;
      const updatedUsers = [...users.filter(u => u.id !== userData.id), userData];
      this.users$.next(updatedUsers);
      
      this.events$.next({
        type: 'user-joined',
        user: userData
      });
    });

    this.socket.on('user-left', (userId: string) => {
      const users = this.users$.value;
      const leavingUser = users.find(u => u.id === userId);
      const updatedUsers = users.filter(u => u.id !== userId);
      this.users$.next(updatedUsers);
      
      if (leavingUser) {
        this.events$.next({
          type: 'user-left',
          user: leavingUser
        });
      }
    });

    this.socket.on('cursor-update', (data: { userId: string; cursor: { line: number; column: number } }) => {
      const users = this.users$.value;
      const updatedUsers = users.map(user => 
        user.id === data.userId 
          ? { ...user, cursor: data.cursor }
          : user
      );
      this.users$.next(updatedUsers);
      
      const user = updatedUsers.find(u => u.id === data.userId);
      if (user) {
        this.events$.next({
          type: 'cursor-moved',
          user,
          data: data.cursor
        });
      }
    });

    this.socket.on('analysis-share', (data: any) => {
      const users = this.users$.value;
      const user = users.find(u => u.id === data.userId);
      
      if (user) {
        this.events$.next({
          type: 'analysis-shared',
          user,
          data: data.analysis
        });
      }
    });

    this.socket.on('users-list', (usersList: CollaborationUser[]) => {
      this.users$.next(usersList);
    });
  }

  private broadcastCursorPosition(line: number, column: number): void {
    this.updateCursor(line, column);
  }

  private generateUserId(): string {
    return 'user_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
  }

  private getRandomColor(): string {
    return this.COLORS[Math.floor(Math.random() * this.COLORS.length)];
  }

  // Advanced collaborative features
  public createRoom(roomName: string): Observable<string> {
    return new Observable(observer => {
      if (!this.socket) {
        observer.error('Not connected to collaboration server');
        return;
      }

      this.socket.emit('create-room', { roomName }, (response: any) => {
        if (response.success) {
          observer.next(response.roomId);
          observer.complete();
        } else {
          observer.error(response.error);
        }
      });
    });
  }

  public getRoomList(): Observable<Array<{ id: string; name: string; userCount: number }>> {
    return new Observable(observer => {
      if (!this.socket) {
        observer.error('Not connected to collaboration server');
        return;
      }

      this.socket.emit('get-rooms', (response: any) => {
        if (response.success) {
          observer.next(response.rooms);
          observer.complete();
        } else {
          observer.error(response.error);
        }
      });
    });
  }

  public exportSession(): Observable<{ content: string; metadata: any }> {
    return new Observable(observer => {
      const content = this.getText();
      const users = this.users$.value;
      const currentUser = this.currentUser$.value;
      
      const metadata = {
        exportedAt: new Date().toISOString(),
        exportedBy: currentUser?.name || 'Unknown',
        participants: users.map(u => ({ name: u.name, id: u.id })),
        textLength: content.length,
        wordCount: content.split(/\s+/).filter(w => w.length > 0).length
      };
      
      observer.next({ content, metadata });
      observer.complete();
    });
  }

  // Conflict resolution
  public resolveConflicts(): void {
    // Yjs handles conflict resolution automatically through CRDTs
    // This method can be used for additional custom conflict resolution logic
    console.log('🔧 Resolving conflicts automatically via Yjs CRDT...');
  }

  // Permission management
  private userPermissions = new Map<string, {
    canEdit: boolean;
    canShare: boolean;
    isAdmin: boolean;
  }>();

  public setUserPermissions(userId: string, permissions: { canEdit: boolean; canShare: boolean; isAdmin: boolean }): void {
    this.userPermissions.set(userId, permissions);
    
    if (this.socket) {
      this.socket.emit('permissions-update', { userId, permissions });
    }
  }

  public getUserPermissions(userId: string): { canEdit: boolean; canShare: boolean; isAdmin: boolean } {
    return this.userPermissions.get(userId) || { canEdit: true, canShare: true, isAdmin: false };
  }

  // Real-time presence indicators
  public setUserStatus(status: 'typing' | 'idle' | 'analyzing'): void {
    const currentUser = this.currentUser$.value;
    if (!currentUser || !this.socket) return;

    this.socket.emit('status-update', {
      userId: currentUser.id,
      status,
      timestamp: Date.now()
    });
  }

  // Voice/Video integration placeholder
  public startVoiceChat(): Observable<MediaStream> {
    return new Observable(observer => {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
          // In a real implementation, this would integrate with WebRTC
          // for peer-to-peer voice communication
          observer.next(stream);
          console.log('🎤 Voice chat started (placeholder)');
        })
        .catch(error => observer.error(error));
    });
  }

  // Session recording/playback
  public startRecording(): void {
    if (this.socket) {
      this.socket.emit('start-recording', {
        userId: this.currentUser$.value?.id,
        timestamp: Date.now()
      });
    }
  }

  public stopRecording(): Observable<string> {
    return new Observable(observer => {
      if (this.socket) {
        this.socket.emit('stop-recording', {
          userId: this.currentUser$.value?.id,
          timestamp: Date.now()
        }, (response: any) => {
          if (response.success) {
            observer.next(response.recordingId);
          } else {
            observer.error(response.error);
          }
          observer.complete();
        });
      } else {
        observer.error('Not connected to collaboration server');
      }
    });
  }
}

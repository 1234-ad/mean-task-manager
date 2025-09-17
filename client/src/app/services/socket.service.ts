import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { TaskService } from './task.service';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket: Socket | null = null;

  constructor(
    private authService: AuthService,
    private taskService: TaskService
  ) {}

  connect(): void {
    if (this.socket?.connected) return;

    this.socket = io(environment.socketUrl, {
      auth: {
        token: this.authService.getToken()
      }
    });

    this.socket.on('connect', () => {
      console.log('Connected to server');
      const user = this.authService.getCurrentUserValue();
      if (user) {
        this.socket?.emit('join-room', user.id);
      }
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
    });

    // Listen for task updates
    this.socket.on('task-created', (task) => {
      this.taskService.addTaskToList(task);
    });

    this.socket.on('task-updated', (task) => {
      this.taskService.updateTaskInList(task);
    });

    this.socket.on('task-deleted', (data) => {
      this.taskService.removeTaskFromList(data.taskId);
    });

    this.socket.on('task-comment-added', (data) => {
      // Handle new comment notification
      console.log('New comment added to task:', data);
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  emit(event: string, data: any): void {
    if (this.socket) {
      this.socket.emit(event, data);
    }
  }

  listen(event: string): Observable<any> {
    return new Observable(observer => {
      if (this.socket) {
        this.socket.on(event, (data: any) => observer.next(data));
      }
      
      return () => {
        if (this.socket) {
          this.socket.off(event);
        }
      };
    });
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}
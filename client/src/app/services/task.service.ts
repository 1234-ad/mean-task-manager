import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface Task {
  _id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in-progress' | 'review' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo: any;
  createdBy: any;
  project?: any;
  dueDate?: Date;
  estimatedHours?: number;
  actualHours?: number;
  tags: string[];
  attachments: any[];
  comments: any[];
  subtasks: any[];
  completionPercentage?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskFilters {
  page?: number;
  limit?: number;
  status?: string;
  priority?: string;
  assignedTo?: string;
  project?: string;
  search?: string;
}

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private apiUrl = environment.apiUrl;
  private tasksSubject = new BehaviorSubject<Task[]>([]);
  public tasks$ = this.tasksSubject.asObservable();

  constructor(private http: HttpClient) {}

  getTasks(filters: TaskFilters = {}): Observable<any> {
    let params = new HttpParams();
    
    Object.keys(filters).forEach(key => {
      const value = (filters as any)[key];
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, value.toString());
      }
    });

    return this.http.get<any>(`${this.apiUrl}/tasks`, { params })
      .pipe(
        tap(response => {
          this.tasksSubject.next(response.tasks);
        })
      );
  }

  getTask(id: string): Observable<Task> {
    return this.http.get<Task>(`${this.apiUrl}/tasks/${id}`);
  }

  createTask(taskData: Partial<Task>): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/tasks`, taskData)
      .pipe(
        tap(() => {
          // Refresh tasks list
          this.refreshTasks();
        })
      );
  }

  updateTask(id: string, taskData: Partial<Task>): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/tasks/${id}`, taskData)
      .pipe(
        tap(() => {
          // Refresh tasks list
          this.refreshTasks();
        })
      );
  }

  deleteTask(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/tasks/${id}`)
      .pipe(
        tap(() => {
          // Remove task from local state
          const currentTasks = this.tasksSubject.value;
          const updatedTasks = currentTasks.filter(task => task._id !== id);
          this.tasksSubject.next(updatedTasks);
        })
      );
  }

  addComment(taskId: string, comment: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/tasks/${taskId}/comments`, { text: comment });
  }

  getTaskAnalytics(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/tasks/analytics/dashboard`);
  }

  updateTaskStatus(id: string, status: string): Observable<any> {
    return this.updateTask(id, { status: status as any });
  }

  assignTask(id: string, userId: string): Observable<any> {
    return this.updateTask(id, { assignedTo: userId });
  }

  private refreshTasks(): void {
    this.getTasks().subscribe();
  }

  // Real-time updates
  updateTaskInList(updatedTask: Task): void {
    const currentTasks = this.tasksSubject.value;
    const index = currentTasks.findIndex(task => task._id === updatedTask._id);
    
    if (index !== -1) {
      currentTasks[index] = updatedTask;
      this.tasksSubject.next([...currentTasks]);
    }
  }

  addTaskToList(newTask: Task): void {
    const currentTasks = this.tasksSubject.value;
    this.tasksSubject.next([newTask, ...currentTasks]);
  }

  removeTaskFromList(taskId: string): void {
    const currentTasks = this.tasksSubject.value;
    const updatedTasks = currentTasks.filter(task => task._id !== taskId);
    this.tasksSubject.next(updatedTasks);
  }
}
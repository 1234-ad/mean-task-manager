import { Component, OnInit } from '@angular/core';
import { AuthService } from './services/auth.service';
import { SocketService } from './services/socket.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'Task Manager';

  constructor(
    private authService: AuthService,
    private socketService: SocketService
  ) {}

  ngOnInit() {
    // Initialize socket connection if user is authenticated
    if (this.authService.isAuthenticated()) {
      this.socketService.connect();
    }
  }
}
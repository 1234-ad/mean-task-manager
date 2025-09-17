# MEAN Stack Task Management System

A comprehensive task management application built with MongoDB, Express.js, Angular, and Node.js (MEAN Stack) featuring real-time updates, user authentication, project management, and advanced analytics.

## 🚀 Features

### Core Functionality
- **User Authentication & Authorization** - JWT-based auth with role-based access control
- **Task Management** - Create, update, delete, and track tasks with priorities and statuses
- **Project Management** - Organize tasks into projects with team collaboration
- **Real-time Updates** - Socket.IO integration for live task updates
- **Dashboard Analytics** - Visual charts and statistics for productivity tracking
- **Responsive Design** - Mobile-first design with Material Design components

### Advanced Features
- **Comment System** - Add comments to tasks for collaboration
- **File Attachments** - Upload and manage task attachments
- **Subtasks** - Break down tasks into smaller subtasks
- **Time Tracking** - Estimated vs actual hours tracking
- **Search & Filtering** - Advanced search and filtering capabilities
- **User Profiles** - Customizable user profiles with preferences
- **Email Notifications** - Automated email notifications for task updates

## 🛠 Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **Socket.IO** - Real-time communication
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing
- **Multer** - File upload handling

### Frontend
- **Angular 16** - Frontend framework
- **Angular Material** - UI component library
- **Chart.js** - Data visualization
- **Socket.IO Client** - Real-time client
- **RxJS** - Reactive programming
- **SCSS** - Styling

## 📦 Installation

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- Angular CLI (`npm install -g @angular/cli`)

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/1234-ad/mean-task-manager.git
   cd mean-task-manager
   ```

2. **Install backend dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   cp .env.example .env
   ```
   
   Update `.env` with your configuration:
   ```env
   MONGODB_URI=mongodb://localhost:27017/taskmanager
   JWT_SECRET=your_super_secret_jwt_key_here
   PORT=5000
   NODE_ENV=development
   CLIENT_URL=http://localhost:4200
   ```

4. **Start MongoDB**
   ```bash
   # Using MongoDB service
   sudo systemctl start mongod
   
   # Or using Docker
   docker run -d -p 27017:27017 --name mongodb mongo:latest
   ```

5. **Start the backend server**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

### Frontend Setup

1. **Navigate to client directory**
   ```bash
   cd client
   ```

2. **Install frontend dependencies**
   ```bash
   npm install
   ```

3. **Start the Angular development server**
   ```bash
   npm start
   # or
   ng serve
   ```

4. **Access the application**
   - Frontend: http://localhost:4200
   - Backend API: http://localhost:5000

## 🏗 Project Structure

```
mean-task-manager/
├── server.js                 # Main server file
├── package.json              # Backend dependencies
├── .env.example              # Environment variables template
├── models/                   # Database models
│   ├── User.js
│   ├── Task.js
│   └── Project.js
├── routes/                   # API routes
│   ├── auth.js
│   ├── tasks.js
│   ├── projects.js
│   └── users.js
├── middleware/               # Custom middleware
│   └── auth.js
└── client/                   # Angular frontend
    ├── src/
    │   ├── app/
    │   │   ├── components/   # Angular components
    │   │   ├── services/     # Angular services
    │   │   ├── guards/       # Route guards
    │   │   └── interceptors/ # HTTP interceptors
    │   ├── environments/     # Environment configs
    │   └── styles.scss       # Global styles
    ├── package.json          # Frontend dependencies
    └── angular.json          # Angular configuration
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update user profile

### Tasks
- `GET /api/tasks` - Get all tasks (with filtering)
- `GET /api/tasks/:id` - Get single task
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
- `POST /api/tasks/:id/comments` - Add comment to task
- `GET /api/tasks/analytics/dashboard` - Get task analytics

### Projects
- `GET /api/projects` - Get all projects
- `GET /api/projects/:id` - Get single project
- `POST /api/projects` - Create new project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project
- `POST /api/projects/:id/members` - Add project member
- `DELETE /api/projects/:id/members/:userId` - Remove project member

### Users
- `GET /api/users` - Get all users (admin only)
- `GET /api/users/search` - Search users
- `GET /api/users/:id` - Get user profile
- `PUT /api/users/:id` - Update user (admin only)
- `GET /api/users/:id/dashboard` - Get user dashboard data

## 🎨 Features Overview

### Dashboard
- Task statistics and analytics
- Recent tasks overview
- Project progress tracking
- Productivity metrics
- Interactive charts and graphs

### Task Management
- Create tasks with detailed information
- Set priorities (Low, Medium, High, Urgent)
- Track status (Todo, In Progress, Review, Completed)
- Assign tasks to team members
- Set due dates and time estimates
- Add comments and attachments
- Break tasks into subtasks

### Project Management
- Create and manage projects
- Add team members with different roles
- Track project progress
- View project-specific tasks
- Project analytics and reporting

### Real-time Features
- Live task updates across all connected clients
- Real-time notifications for task changes
- Instant comment updates
- Live project collaboration

## 🔐 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control
- Request rate limiting
- Input validation and sanitization
- CORS protection
- Helmet.js security headers

## 📱 Responsive Design

The application is fully responsive and works seamlessly across:
- Desktop computers
- Tablets
- Mobile phones
- Different screen orientations

## 🚀 Deployment

### Using Docker

1. **Build and run with Docker Compose**
   ```bash
   docker-compose up -d
   ```

### Manual Deployment

1. **Build the Angular app**
   ```bash
   cd client
   npm run build
   ```

2. **Set environment variables**
   ```bash
   export NODE_ENV=production
   export MONGODB_URI=your_production_mongodb_uri
   export JWT_SECRET=your_production_jwt_secret
   ```

3. **Start the production server**
   ```bash
   npm start
   ```

### Heroku Deployment

1. **Create Heroku app**
   ```bash
   heroku create your-app-name
   ```

2. **Set environment variables**
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set MONGODB_URI=your_mongodb_uri
   heroku config:set JWT_SECRET=your_jwt_secret
   ```

3. **Deploy**
   ```bash
   git push heroku main
   ```

## 🧪 Testing

### Backend Testing
```bash
npm test
```

### Frontend Testing
```bash
cd client
npm test
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- **Your Name** - *Initial work* - [YourGitHub](https://github.com/yourusername)

## 🙏 Acknowledgments

- Angular Material for the beautiful UI components
- Chart.js for data visualization
- Socket.IO for real-time functionality
- MongoDB for the flexible database solution
- Express.js for the robust backend framework

## 📞 Support

If you have any questions or need help with setup, please open an issue on GitHub or contact [your-email@example.com](mailto:your-email@example.com).

---

**Happy Task Managing! 🎯**
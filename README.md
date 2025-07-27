# 🎯 AI-Powered Task Manager

A modern, full-stack task management application with intelligent AI features to boost your productivity. Built with FastAPI, React, and OpenAI integration.

## ✨ Features

### 🧠 AI-Powered Intelligence
- **Smart Task Creation**: AI analyzes task descriptions and suggests optimal settings
- **Productivity Insights**: Get personalized recommendations based on your work patterns
- **Workload Analysis**: AI-powered workload optimization and stress level assessment
- **Task Complexity Scoring**: Automatic complexity assessment for better planning
- **Intelligent Scheduling**: AI suggests optimal task ordering and time allocation

### 📊 Advanced Task Management
- **Priority Levels**: Low, Medium, High, and Urgent priority management
- **Status Tracking**: Todo, In Progress, Review, Done, and Cancelled statuses
- **Time Tracking**: Estimate and track actual hours spent on tasks
- **Due Date Management**: Never miss a deadline with smart reminders
- **Tagging System**: Organize tasks with custom tags
- **Search & Filter**: Find tasks quickly with advanced filtering options

### 📈 Analytics & Reporting
- **Productivity Trends**: Track your performance over time
- **Completion Rates**: Monitor task completion statistics
- **Time Analytics**: Analyze time spent vs. estimated
- **Priority Distribution**: Visualize your task priorities
- **AI-Generated Reports**: Get comprehensive productivity insights

### 🔐 Security & Authentication
- **JWT Authentication**: Secure token-based authentication
- **User Management**: Register, login, and profile management
- **Password Hashing**: Secure password storage with bcrypt
- **Protected Routes**: Role-based access control

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- OpenAI API Key (for AI features)

### 1. Clone the Repository
```bash
git clone <repository-url>
cd task-manager-project
```

### 2. Set Environment Variables
Create a `.env` file in the root directory:
```env
OPENAI_API_KEY=your_openai_api_key_here
JWT_SECRET_KEY=your_super_secret_jwt_key
DATABASE_URL=postgresql://postgres:password@db:5432/taskmanager
```

### 3. Start the Application
```bash
docker-compose up --build
```

### 4. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

## 🛠️ Development Setup

### Backend Development
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend Development
```bash
cd frontend
npm install
npm run dev
```

## 📁 Project Structure

```
task-manager-project/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI application entry point
│   │   ├── models/              # Database models
│   │   ├── routers/             # API route handlers
│   │   └── services/            # Business logic and AI services
│   ├── requirements.txt         # Python dependencies
│   └── Dockerfile              # Backend container configuration
├── frontend/
│   ├── src/
│   │   ├── components/          # React components
│   │   ├── pages/              # Page components
│   │   ├── contexts/           # React contexts
│   │   ├── services/           # API services
│   │   └── types/              # TypeScript type definitions
│   ├── package.json            # Node.js dependencies
│   └── Dockerfile              # Frontend container configuration
├── docker-compose.yml          # Multi-service orchestration
└── README.md                   # This file
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user info
- `PUT /api/auth/me` - Update user profile

### Tasks
- `GET /api/tasks` - Get all tasks (with filters)
- `POST /api/tasks` - Create new task
- `GET /api/tasks/{id}` - Get specific task
- `PUT /api/tasks/{id}` - Update task
- `DELETE /api/tasks/{id}` - Delete task
- `POST /api/tasks/{id}/complete` - Mark task as complete
- `GET /api/tasks/stats/overview` - Get task statistics

### AI Features
- `GET /api/ai/productivity-report` - Generate AI productivity report
- `GET /api/ai/task-analysis/{id}` - Analyze specific task
- `GET /api/ai/workload-analysis` - Analyze current workload
- `GET /api/ai/productivity-trends` - Get productivity trends
- `POST /api/ai/smart-task-creation` - Create AI-powered task

## 🎨 Frontend Features

### Modern UI/UX
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile
- **Dark Mode**: Toggle between light and dark themes
- **Smooth Animations**: Framer Motion powered animations
- **Real-time Updates**: Live task updates and notifications
- **Drag & Drop**: Intuitive task reordering

### Interactive Components
- **Task Cards**: Beautiful, interactive task cards with hover effects
- **Progress Bars**: Visual progress tracking
- **Charts & Graphs**: Recharts-powered analytics visualization
- **Modal Dialogs**: Clean, accessible modal components
- **Toast Notifications**: User-friendly feedback system

## 🔒 Security Features

- **JWT Tokens**: Secure authentication with automatic token refresh
- **CORS Protection**: Configured CORS for secure cross-origin requests
- **Input Validation**: Comprehensive input validation and sanitization
- **SQL Injection Protection**: SQLAlchemy ORM with parameterized queries
- **XSS Protection**: React's built-in XSS protection

## 🚀 Deployment

### Production Deployment
1. Set production environment variables
2. Build and push Docker images
3. Deploy using Docker Compose or Kubernetes
4. Configure reverse proxy (nginx)
5. Set up SSL certificates

### Environment Variables
```env
# Required
OPENAI_API_KEY=your_openai_api_key
JWT_SECRET_KEY=your_super_secret_jwt_key

# Optional
DATABASE_URL=postgresql://user:pass@host:port/db
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/your-repo/issues) page
2. Create a new issue with detailed information
3. Contact the development team

## 🔮 Roadmap

- [ ] **Real-time Collaboration**: Multi-user task sharing and collaboration
- [ ] **Mobile App**: Native iOS and Android applications
- [ ] **Calendar Integration**: Sync with Google Calendar, Outlook
- [ ] **Advanced AI**: GPT-4 integration for enhanced insights
- [ ] **Time Tracking**: Pomodoro timer and detailed time logging
- [ ] **Project Templates**: Pre-built project templates
- [ ] **API Integrations**: Slack, Teams, and other productivity tools
- [ ] **Advanced Analytics**: Machine learning-powered productivity insights

---

**Built with ❤️ using FastAPI, React, and OpenAI**





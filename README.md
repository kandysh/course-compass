# Course Compass 🧭

Course Compass is an intelligent educational platform that serves as your guide to mastering courses and educational journeys. Built with modern web technologies and powered by AI, it provides a comprehensive learning management system for both students and instructors.

![Course Compass](https://img.shields.io/badge/Course-Compass-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-15.3.3-black.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC.svg)

## ✨ Features

### For Students

- 📚 **Course Management**: Access and track your enrolled courses
- 📊 **Progress Tracking**: Monitor your learning progress with visual indicators
- 🤖 **AI Assistant**: Get help with course content through intelligent chat
- 🔔 **Notifications**: Stay updated with course announcements and deadlines
- 👤 **Profile Management**: Personalized user profiles with avatar generation

### For Instructors

- 🎓 **Course Creation**: Create and manage courses with rich descriptions
- 👥 **Student Management**: View enrolled students and their progress
- 📈 **Analytics**: Track student engagement and course completion rates
- 🛠️ **Teaching Tools**: Comprehensive set of tools for course management

### Core Platform Features

- 🔐 **Secure Authentication**: Role-based access control for students and instructors
- 💬 **Real-time Chat**: AI-powered assistance and communication
- 📱 **Responsive Design**: Works seamlessly across all devices
- 🎨 **Modern UI**: Clean, intuitive interface built with Radix UI components
- 🔄 **Real-time Updates**: Live progress updates and notifications

## 🚀 Tech Stack

### Frontend

- **Next.js 15.3.3** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Accessible UI components
- **Lucide React** - Beautiful icons
- **React Hook Form** - Form management with validation

### Backend

- **Next.js API Routes** - Server-side functionality
- **PostgreSQL** - Primary database
- **Genkit AI** - Google AI integration

### AI & Analytics

- **Google Gemini 2.0 Flash** - AI-powered assistance
- **Genkit** - AI workflow management
- **Recharts** - Data visualization

## 📋 Prerequisites

Before running this project, make sure you have:

- Node.js 18+ installed
- PostgreSQL database
- Google AI API key (Gemini)
- npm or yarn package manager

## 🛠️ Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd course-compass
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   Create a `.env` file in the root directory with the following variables:

   ```env
   # Database Configuration
   POSTGRES_URL=your_postgresql_connection_string

   # AI Configuration
   GEMINI_API_KEY=your_google_ai_api_key

   # Security
   HASHIDS_SALT=your_unique_salt_string
   HASHIDS_MIN_LENGTH=8
   ```

4. **Database Setup**

   The application will automatically create the required database tables on first run. The schema includes:

   - Users (students and instructors)
   - Courses and enrollments
   - Progress tracking
   - Chat sessions and messages
   - Notifications
   - User sessions

## 🚀 Getting Started

1. **Development Mode**

   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:9002`

2. **AI Development Mode** (Optional)

   ```bash
   npm run genkit:dev
   ```

   Start the Genkit development server for AI features

3. **Build for Production**
   ```bash
   npm run build
   npm start
   ```

## 📁 Project Structure

```
course-compass/
├── src/
│   ├── ai/                 # AI workflows and configurations
│   │   ├── flows/          # Genkit AI flows
│   │   └── genkit.ts       # AI setup
│   ├── app/                # Next.js App Router pages
│   │   ├── api/            # API routes
│   │   ├── courses/        # Course-related pages
│   │   ├── instructor/     # Instructor dashboard
│   │   ├── student/        # Student dashboard
│   │   ├── login/          # Authentication pages
│   │   └── signup/         # Registration pages
│   ├── components/         # Reusable UI components
│   │   ├── auth/           # Authentication components
│   │   ├── ui/             # Base UI components
│   │   └── icons/          # Custom icons
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utility functions
│   │   ├── auth.config.ts  # Authentication configuration
│   │   ├── data.ts         # Data types and interfaces
│   │   └── db.ts           # Database connection and schema
│   └── middleware.ts       # Next.js middleware
├── docs/                   # Documentation
├── public/                 # Static assets
└── package.json
```

## 🎯 Usage

### Getting Started as a Student

1. Visit the homepage and click "I am a Student"
2. Sign up for a new account or log in
3. Browse available courses
4. Enroll in courses that interest you
5. Track your progress and interact with the AI assistant

### Getting Started as an Instructor

1. Visit the homepage and click "I am an Instructor"
2. Sign up for a new account or log in
3. Create your first course
4. Manage enrolled students
5. Monitor student progress and engagement

## 🔧 Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript compiler check
- `npm run genkit:dev` - Start Genkit AI development server
- `npm run genkit:watch` - Start Genkit with file watching

## 🔐 Authentication & Security

- Secure password hashing with bcryptjs
- Session-based authentication with secure cookies
- Role-based access control (Student/Instructor)
- Environment variable protection for sensitive data
- SQL injection prevention with parameterized queries

## 🤖 AI Features

Course Compass integrates Google's Gemini AI to provide:

- Intelligent course assistance
- Automated content generation
- Personalized learning recommendations
- User avatar generation
- Natural language interaction

## 🎨 UI/UX Features

- **Responsive Design**: Works on desktop, tablet, and mobile
- **Dark/Light Mode**: Adaptive theming support
- **Accessibility**: Built with Radix UI for maximum accessibility
- **Modern Components**: Cards, dialogs, forms, and interactive elements
- **Smooth Animations**: CSS animations and transitions
- **Progress Visualization**: Charts and progress bars

## 📊 Database Schema

The application uses PostgreSQL with the following main tables:

- `users` - User accounts and profiles
- `courses` - Course information and metadata
- `enrollments` - Student-course relationships
- `course_progress` - Progress tracking
- `chat_sessions` & `chat_messages` - AI chat functionality
- `notifications` - User notifications
- `user_sessions` - Authentication sessions

## 🚀 Deployment

The project includes configuration for deployment on various platforms:

- Built-in Next.js production optimizations
- Database connection pooling support
- Environment variable management

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the Creative Commons Attribution-NonCommercial 4.0 International License - see the LICENSE file for details.

**You are free to:**
- Share — copy and redistribute the material in any medium or format
- Adapt — remix, transform, and build upon the material

**Under the following terms:**
- Attribution — You must give appropriate credit, provide a link to the license, and indicate if changes were made
- NonCommercial — You may not use the material for commercial purposes

For more information, visit: https://creativecommons.org/licenses/by-nc/4.0/

## 🆘 Support

If you encounter any issues or have questions:

1. Check the documentation in the `docs/` folder
2. Review the database setup logs in your console
3. Ensure all environment variables are properly configured
4. Verify your PostgreSQL connection

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [Radix UI](https://www.radix-ui.com/)
- Icons by [Lucide](https://lucide.dev/)
- AI powered by [Google Gemini](https://ai.google.dev/)
- Database hosting by [Neon](https://neon.tech/)

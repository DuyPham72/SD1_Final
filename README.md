# Hospital Management System (HMS)

## Overview
A comprehensive hospital management system with patient-focused interfaces, nurse station functionality, and administrative tools. This application provides a unified interface for hospital staff and patients, improving healthcare service delivery and patient experience.

## Prerequisites
- Node.js (v14 or higher)
- MongoDB account
- Git
- Code editor (VS Code recommended)

## Installation & Setup

1. **Clone the repository:**
```bash
git clone [your-repository-url]
cd SD1_Final
```

2. **Install Dependencies:**
```bash
# Install root dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..

# Install backend dependencies
cd backend
npm install
cd ..
```

3. **Database Configuration:**
   Create a `.env` file in the backend directory with:
```
MONGODB_URI=mongodb+srv://[username]:[password]@cluster0.ygv7r.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
```
   Replace `[username]` and `[password]` with your MongoDB credentials.

## Step by Step Setup

1. Clone the repository:
```bash
git clone [your-repository-url]
cd SD1_Final
```

2. Install Dependencies:
```bash
# Install root dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..

# Install backend dependencies
cd backend
npm install
cd ..
```

3. Database Setup:
Create a .env file in the backend directory with:
```
MONGODB_URI=mongodb+srv://[username]:[password]@cluster0.ygv7r.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
```
Replace [username] and [password] with provided MongoDB credentials

## Project Structure
```
SD1_Final/
├── frontend/               # React frontend application
│   ├── public/             # Static assets
│   └── src/
│       ├── assets/         # Images and other media files
│       ├── pages/          # Main page components
│       │   ├── MainDashboard.js
│       │   ├── Entertainment.js
│       │   ├── PatientInfo.js
│       │   ├── Feedback.js
│       │   ├── PatientRegistrationPage.js
│       │   ├── PatientAccessPage.js
│       │   ├── Settings.js
│       │   └── CallNurse.js
│       ├── shared/         # Shared resources
│       │   ├── components/ # Reusable UI components
│       │   ├── constants/  # Application constants
│       │   ├── hooks/      # Custom React hooks
│       │   └── translations/ # Internationalization files
│       └── styles/         # CSS and styling
│
├── backend/                # Node.js & Express backend
│   ├── models/             # MongoDB models
│   │   ├── Patient.js
│   │   ├── User.js
│   │   ├── FeedbackToken.js
│   │   └── PatientAccess.js
│   ├── server.js           # Express server setup
│   ├── db.js               # Database connection
│   ├── seedData.js         # Initial data seeding
│   └── reseedData.js       # Reset and repopulate database
│
└── main.js                 # Electron main process
```

## Running the Application

1. **Start the backend server:**
```bash
cd backend
node server.js
```

2. **Start the frontend development server (in a new terminal):**
```bash
cd frontend
npm start
```

3. **Run the Electron application (optional, in a new terminal from project root):**
```bash
npm run dev
```

## Available Scripts

- **Start everything in development mode:**
```bash
npm run dev
```

- **Start frontend only:**
```bash
cd frontend
npm start
```

- **Start backend only:**
```bash
cd backend
node server.js
```

- **Build frontend for production:**
```bash
cd frontend
npm run build
```

- **Reseed database with sample data:**
```bash
cd backend
node reseedData.js
```

## Current Features
- Real-time clock display
- Patient information display
- Patient switching functionality
- Basic navigation
- Database integration

## Working on the Project

1. Always pull latest changes before starting:
```bash
git pull origin main
```

2. Create new branch for features:
```bash
git checkout -b feature/your-feature-name
```

3. Make changes and commit:
```bash
git add .
git commit -m "Description of changes"
git push origin feature/your-feature-name
```

4. Create pull request on GitHub

## Testing Database Connection
```bash
# In backend directory
cd backend
node testDb.js
```

## Important Notes
- Never commit .env files
- Always pull latest changes before starting work
- Create new branches for features
- Follow the existing style guide
- Test features locally before pushing

## Current Technologies Used
- Frontend: React.js
- Backend: Node.js, Express.js
- Database: MongoDB
- Desktop: Electron
- State Management: React Hooks
- Routing: React Router

## Troubleshooting Common Issues
1. If modules are missing:
```bash
npm install
```

2. If database connection fails:
- Check .env file exists
- Verify MongoDB credentials
- Ensure MongoDB service is running

3. If frontend won't start:
- Check if port 3000 is available
- Verify all dependencies are installed

4. If Electron won't start:
- Make sure frontend is running first
- Check main.js configuration

## Getting Help
If you encounter any issues:
1. Check the error logs
2. Consult the project documentation
3. Ask team members for help
4. Check GitHub issues

Remember to keep your repository up to date and communicate with team members about the features you're working on!

## Features

### Patient Interface
- Real-time information display
- Entertainment options
- Nurse calling functionality
- Patient feedback system
- Multi-language support

### Staff Interface
- Patient management
- Room assignments
- Treatment tracking
- Quick access to patient information
- Feedback monitoring

### Administrative Tools
- User management
- System settings
- Patient registration
- Access control

## Development Guidelines

1. **Before starting work:**
```bash
git pull origin main
```

2. **Creating a new feature:**
```bash
git checkout -b feature/your-feature-name
```

3. **Committing changes:**
```bash
git add .
git commit -m "Description of changes"
git push origin feature/your-feature-name
```

4. Create a pull request on GitHub for code review

## Technology Stack
- **Frontend:** React.js, CSS
- **Backend:** Node.js, Express.js
- **Database:** MongoDB
- **Desktop Application:** Electron
- **State Management:** React Hooks
- **Routing:** React Router
- **Authentication:** JWT

## Troubleshooting

1. **Missing modules:**
```bash
npm install
```

2. **Database connection issues:**
   - Check `.env` file configuration
   - Verify MongoDB credentials and connection string
   - Ensure MongoDB service is running

3. **Frontend not starting:**
   - Check if port 3000 is available
   - Ensure all dependencies are installed

4. **Backend API errors:**
   - Check server logs for specific error messages
   - Verify database connection
   - Ensure correct API endpoints are being used

## Contributing
- Follow the existing code style and conventions
- Write clear commit messages
- Document new features
- Test thoroughly before submitting pull requests

## Security Guidelines
- Never commit `.env` files or sensitive credentials
- Always validate user input
- Use proper authentication and authorization
- Keep dependencies updated

## Important Notes
- The system is designed for healthcare environments and handles sensitive data
- Follow HIPAA guidelines when working with patient information
- Regularly backup database

# Travel Heaven - Quick Start Guide

## 🚀 Quick Setup (3 steps)

### 1. Run Setup Script
```powershell
.\setup.ps1
```

This will:
- Check prerequisites (Node.js, MongoDB)
- Install backend dependencies
- Install frontend dependencies
- Create .env files

### 2. Configure Environment
Edit `backend/.env`:
```powershell
notepad backend\.env
```

Set your MongoDB URI and JWT secret:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/tourist_helper
JWT_SECRET=your_secret_key_here
JWT_EXPIRE=7d
```

### 3. Start Services
```powershell
.\start.ps1
```

This will start:
- MongoDB (if needed)
- Backend server (port 5000)
- Frontend server (port 3000)

Visit: http://localhost:3000

## 📝 Manual Setup

If you prefer manual setup:

### Backend
```powershell
cd backend
npm install
Copy-Item .env.example .env
# Edit .env file
npm run dev
```

### Frontend
```powershell
cd frontend
npm install
Copy-Item .env.example .env
npm run dev
```

## 👤 Test Users

After setup, register users with different roles:

1. **Admin** - Register with role "admin" (may need to set manually in database)
2. **Guide** - Register with role "guide"
3. **User** - Register with role "user"

## 🔧 Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running: `mongod`
- Or use MongoDB Atlas (cloud)
- Update `MONGODB_URI` in `backend/.env`

### Port Already in Use
- Backend: Change `PORT` in `backend/.env`
- Frontend: Change port in `frontend/vite.config.js`

### Dependencies Issues
```powershell
# Clean install backend
cd backend
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install

# Clean install frontend
cd frontend
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install
```

## 📚 Documentation

See `README.md` for complete documentation including:
- Architecture overview
- Design patterns explanation
- API documentation
- Features list
- Project structure

## 🎯 Key Features to Test

1. **Register** as different user types (user, guide)
2. **Guide**: Add location → wait for approval
3. **Admin**: Approve guide submissions
4. **User**: Browse approved locations and book

## 🛠️ Development

```powershell
# Backend development
cd backend
npm run dev     # Start with nodemon (auto-reload)

# Frontend development
cd frontend
npm run dev     # Start Vite dev server
npm run build   # Build for production
npm run preview # Preview production build
```

## 📦 Tech Stack

**Backend:**
- Node.js + Express
- MongoDB + Mongoose
- JWT Authentication
- Design Patterns: Singleton, Strategy, Repository, Observer, Factory, Decorator

**Frontend:**
- React 18
- Vite
- React Router
- Zustand (State Management)
- Tailwind CSS

## 🤝 Support

For issues or questions, check:
1. `README.md` - Full documentation
2. `backend/README.md` - Backend specific docs
3. `frontend/README.md` - Frontend specific docs

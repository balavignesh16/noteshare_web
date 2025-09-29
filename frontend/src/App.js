import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Header from './components/Layout/Header';
import HomePage from './components/Home/HomePage';
import Login from './components/Auth/Login';
import SignUp from './components/Auth/SignUp';
import Dashboard from './components/Dashboard/Dashboard';
import UserProfile from './components/Profile/UserProfile';
import NoteUpload from './components/Notes/NoteUpload';
import NoteView from './components/Notes/NoteView';
import CourseView from './components/Courses/CourseView';
import FullPageSpinner from './components/Layout/FullPageSpinner';

function ProtectedRoute({ user, children }) {
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function App() {
  const { user, loading } = useAuth();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  if (loading) {
    return <FullPageSpinner />;
  }

  return (
    <Router>
      <div className="min-h-screen bg-light-bg dark:bg-dark-bg font-sans transition-colors duration-300">
        <Header user={user} onDrawerToggle={handleDrawerToggle} />
        <div className="flex">
          
          <main className="flex-1">
            <Routes>
              <Route path="/" element={user ? <Navigate to="/dashboard" /> : <HomePage />} />
              <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
              <Route path="/signup" element={user ? <Navigate to="/dashboard" /> : <SignUp />} />
              
              <Route path="/dashboard" element={<ProtectedRoute user={user}><Dashboard /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute user={user}><UserProfile /></ProtectedRoute>} />
              <Route path="/upload" element={<ProtectedRoute user={user}><NoteUpload /></ProtectedRoute>} />
              <Route path="/note/:noteId" element={<ProtectedRoute user={user}><NoteView /></ProtectedRoute>} />
              <Route path="/course/:courseName" element={<ProtectedRoute user={user}><CourseView /></ProtectedRoute>} />
            

              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;
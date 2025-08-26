import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../../services/firebase';
import { useTheme } from '../../context/ThemeContext';
import Icon from './Icon'; // Using the new Icon component

const ThemeToggleButton = () => {
    const { theme, toggleTheme } = useTheme();
    return (
        <button
            onClick={toggleTheme}
            className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            aria-label="Toggle dark mode"
        >
            {theme === 'light' ? (
                <Icon name="moon" />
            ) : (
                <Icon name="sun" />
            )}
        </button>
    );
};

export default function Header({ user }) {
    const navigate = useNavigate();
    const location = useLocation();

    const handleSignOut = async () => {
        await signOut(auth);
        navigate('/login');
    };

    const handleBack = () => {
        navigate(-1);
    };

    const activeLinkStyle = { backgroundColor: '#EEF2FF', color: '#4338CA' };
    const darkActiveLinkStyle = { backgroundColor: '#3730A3', color: '#E0E7FF' };
    const { theme } = useTheme();
    const isDashboard = location.pathname === '/dashboard';

    return (
        <header className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-40 border-b border-gray-200 dark:border-gray-700">
            <nav className="container mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
                <div className="flex items-center gap-4">
                    {!isDashboard && (
                        <button
                            onClick={handleBack}
                            className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            aria-label="Go back"
                        >
                            <Icon name="arrow-left" />
                        </button>
                    )}
                    <NavLink to="/" className="flex-shrink-0 flex items-center gap-2 text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                        <Icon name="logo" className="w-8 h-8" />
                        <span>NoteShare</span>
                    </NavLink>
                </div>
                <div className="hidden md:flex items-center space-x-4">
                    {user ? (
                        <>
                            <NavLink to="/dashboard" style={({ isActive }) => isActive ? (theme === 'dark' ? darkActiveLinkStyle : activeLinkStyle) : undefined} className="text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 px-3 py-2 rounded-md text-sm font-medium">Dashboard</NavLink>
                            <NavLink to="/upload" style={({ isActive }) => isActive ? (theme === 'dark' ? darkActiveLinkStyle : activeLinkStyle) : undefined} className="text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 px-3 py-2 rounded-md text-sm font-medium">Upload Note</NavLink>
                            <NavLink to="/notifications" style={({ isActive }) => isActive ? (theme === 'dark' ? darkActiveLinkStyle : activeLinkStyle) : undefined} className="text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 px-3 py-2 rounded-md text-sm font-medium">Notifications</NavLink>
                            <NavLink to="/profile" style={({ isActive }) => isActive ? (theme === 'dark' ? darkActiveLinkStyle : activeLinkStyle) : undefined} className="text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 px-3 py-2 rounded-md text-sm font-medium">Profile</NavLink>
                            <button onClick={handleSignOut} className="bg-red-500 text-white hover:bg-red-600 px-3 py-2 rounded-md text-sm font-medium">Sign Out</button>
                        </>
                    ) : (
                        <>
                            <NavLink to="/login" className="text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 px-3 py-2 rounded-md text-sm font-medium">Login</NavLink>
                            <NavLink to="/signup" className="bg-indigo-600 text-white hover:bg-indigo-700 px-3 py-2 rounded-md text-sm font-medium">Sign Up</NavLink>
                        </>
                    )}
                    <ThemeToggleButton />
                </div>
            </nav>
        </header>
    );
}
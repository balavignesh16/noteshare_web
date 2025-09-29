import React, { useState, useEffect, useMemo } from 'react';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { Link } from 'react-router-dom';
import FullPageSpinner from '../Layout/FullPageSpinner';
import { useProfile } from '../../context/ProfileContext';
import Icon from '../Layout/Icon';
import RequestNotes from '../Notes/RequestNotes';

const StatCard = ({ icon, label, value, color }) => {
    const colorVariants = {
        primary: 'bg-primary/10 text-primary',
        secondary: 'bg-secondary/10 text-secondary',
        accent: 'bg-accent/10 text-accent',
    };

    return (
        <div className={`p-6 rounded-lg flex items-center space-x-4 ${colorVariants[color] || colorVariants.primary} animate-slide-up`}>
            <Icon name={icon} className="w-10 h-10" />
            <div>
                <p className="text-2xl font-bold text-text-primary dark:text-white">{value}</p>
                <p className="text-sm font-medium text-text-muted">{label}</p>
            </div>
        </div>
    );
};

const CourseCard = ({ courseName }) => (
    <Link 
        to={`/course/${encodeURIComponent(courseName)}`} 
        className="block p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 animate-scale-in"
    >
        <div className="h-24 bg-gradient-to-r from-primary to-secondary rounded-md mb-4 flex items-center justify-center">
            <Icon name="book-open" className="w-12 h-12 text-white" />
        </div>
        <h3 className="text-lg font-bold text-text-primary dark:text-white truncate">{courseName.split(' - ')[1]}</h3>
        <p className="text-sm text-text-muted mt-1">{courseName.split(' - ')[0]}</p>
    </Link>
);

const LeaderboardItem = ({ user, rank }) => (
    <li className="py-3 flex items-center justify-between">
        <div className="flex items-center">
            <span className="text-lg font-bold text-primary dark:text-secondary w-8">{rank}</span>
            <span className="text-text-secondary dark:text-gray-200 font-medium">{user.name}</span>
        </div>
        <span className="text-lg font-semibold text-text-primary dark:text-white">{user.points} pts</span>
    </li>
);

const ActivityFeedItem = ({ activity }) => (
    <div className="py-3">
        <p className="text-sm text-text-secondary dark:text-gray-200">{activity.text}</p>
        <p className="text-xs text-text-muted mt-1">
            {activity.createdAt?.toDate().toLocaleString()}
        </p>
    </div>
);

const RequestItem = ({ request }) => (
    <div className="py-3">
        <p className="text-sm font-semibold text-text-primary dark:text-white">{request.topic}</p>
        <p className="text-xs text-text-muted">{request.course}</p>
        <p className="text-xs text-text-muted mt-1">Module: {request.module}</p>
        <p className="text-xs text-text-muted mt-1">Requested by: {request.requesterName}</p>
    </div>
);

export default function Dashboard() {
    const { profile } = useProfile();
    const [allAvailableCourses, setAllAvailableCourses] = useState([]);
    const [leaderboard, setLeaderboard] = useState([]);
    const [analytics, setAnalytics] = useState({ totalNotes: 0, totalDownloads: 0 });
    const [activityFeed, setActivityFeed] = useState([]);
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('my-courses');
    const [currentRequest, setCurrentRequest] = useState(0);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch notes and analytics
                const notesSnapshot = await getDocs(collection(db, 'notes'));
                const courseSet = new Set();
                let totalDownloads = 0;
                notesSnapshot.docs.forEach(doc => {
                    const data = doc.data();
                    courseSet.add(data.course);
                    totalDownloads += data.downloads || 0;
                });
                setAllAvailableCourses(Array.from(courseSet));
                setAnalytics({ totalNotes: notesSnapshot.size, totalDownloads });

                // Fetch leaderboard data
                const q = query(collection(db, 'users'), orderBy('points', 'desc'), limit(5));
                const leaderboardSnapshot = await getDocs(q);
                const leaderboardData = leaderboardSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setLeaderboard(leaderboardData);
                
                // Fetch activity feed data
                const activityQuery = query(collection(db, 'activity'), orderBy('createdAt', 'desc'), limit(3));
                const activitySnapshot = await getDocs(activityQuery);
                const activityData = activitySnapshot.docs.map(doc => doc.data());
                setActivityFeed(activityData);
                
                // Fetch requests
                const requestsQuery = query(collection(db, 'requests'), orderBy('createdAt', 'desc'), limit(4));
                const requestsSnapshot = await getDocs(requestsQuery);
                const requestsData = requestsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setRequests(requestsData);

            } catch (err) {
                console.error("Error fetching dashboard data:", err);
                setError('Failed to fetch dashboard data.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    useEffect(() => {
        if (requests.length > 1) {
            const interval = setInterval(() => {
                setCurrentRequest((prev) => (prev + 1) % requests.length);
            }, 20000);
            return () => clearInterval(interval);
        }
    }, [requests]);

    useEffect(() => {
        let start = null;
        const animateProgress = (timestamp) => {
            if (!start) start = timestamp;
            const elapsed = timestamp - start;
            const newProgress = Math.min((elapsed / 20000) * 100, 100);
            setProgress(newProgress);
            if (elapsed < 20000) {
                requestAnimationFrame(animateProgress);
            }
        };

        const animationFrameId = requestAnimationFrame(animateProgress);
        return () => cancelAnimationFrame(animationFrameId);
    }, [currentRequest]);

    const handleNextRequest = () => {
        setCurrentRequest((prev) => (prev + 1) % requests.length);
    };

    const handlePrevRequest = () => {
        setCurrentRequest((prev) => (prev - 1 + requests.length) % requests.length);
    };
    
    const { myCourses, discoverCourses } = useMemo(() => {
        const subscribed = new Set(profile?.subscribedCourses || []);
        const myCourses = allAvailableCourses.filter(course => subscribed.has(course));
        const discoverCourses = allAvailableCourses.filter(course => !subscribed.has(course));
        return { myCourses, discoverCourses };
    }, [profile, allAvailableCourses]);

    const filteredDiscoverCourses = useMemo(() => {
        if (!searchTerm) return discoverCourses;
        return discoverCourses.filter(course => 
            course.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [searchTerm, discoverCourses]);

    if (loading) return <FullPageSpinner />;
    if (error) return <div className="text-center py-10 text-red-500">{error}</div>;

    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            <div className="mb-8 animate-fade-in">
                <h1 className="text-4xl font-extrabold text-text-primary dark:text-white">Welcome, {profile?.name}!</h1>
                <p className="text-lg text-text-muted">Let's start learning!</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <StatCard icon="document-text" label="Total Notes" value={analytics.totalNotes} color="primary" />
                <StatCard icon="download" label="Total Downloads" value={analytics.totalDownloads} color="secondary" />
                <StatCard icon="sparkles" label="Your Points" value={profile?.points || 0} color="accent" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <div className="mb-8">
                        <div className="flex border-b border-gray-200 dark:border-gray-700">
                            <button
                                onClick={() => setActiveTab('my-courses')}
                                className={`px-6 py-3 font-semibold ${activeTab === 'my-courses' ? 'text-primary border-b-2 border-primary' : 'text-text-muted'}`}
                            >
                                My Courses
                            </button>
                            <button
                                onClick={() => setActiveTab('discover')}
                                className={`px-6 py-3 font-semibold ${activeTab === 'discover' ? 'text-primary border-b-2 border-primary' : 'text-text-muted'}`}
                            >
                                Discover
                            </button>
                        </div>
                    </div>

                    {activeTab === 'my-courses' && (
                        <div>
                            {myCourses.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                                    {myCourses.map(courseName => <CourseCard key={courseName} courseName={courseName} />)}
                                </div>
                            ) : (
                                <div className="text-center py-10 px-4 bg-white dark:bg-gray-800 rounded-lg shadow-md animate-fade-in">
                                    <p className="text-text-muted">You haven't subscribed to any courses with available notes yet. Go to your profile to add some!</p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'discover' && (
                        <div>
                            <div className="flex justify-end mb-6">
                                <input 
                                    type="text"
                                    placeholder="Search all courses..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full max-w-xs px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md text-text-primary dark:text-white"
                                />
                            </div>
                            {filteredDiscoverCourses.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                                    {filteredDiscoverCourses.map(courseName => <CourseCard key={courseName} courseName={courseName} />)}
                                </div>
                            ) : (
                                <p className="text-center text-text-muted py-10">No other courses found.</p>
                            )}
                        </div>
                    )}
                </div>
                <div className="lg:col-span-1 space-y-8">
                    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md animate-slide-up" style={{ animationDelay: '0.3s' }}>
                        <h2 className="text-2xl font-bold text-text-primary dark:text-white mb-4">Leaderboard</h2>
                        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                            {leaderboard.map((user, index) => (
                                <LeaderboardItem key={user.id} user={user} rank={index + 1} />
                            ))}
                        </ul>
                    </div>
                    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md animate-slide-up" style={{ animationDelay: '0.2s' }}>
                        <h2 className="text-2xl font-bold text-text-primary dark:text-white mb-4">Activity Feed</h2>
                        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                            {activityFeed.map((activity, index) => (
                                <ActivityFeedItem key={index} activity={activity} />
                            ))}
                        </ul>
                    </div>
                    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md animate-slide-up" style={{ animationDelay: '0.1s' }}>
                        <h2 className="text-2xl font-bold text-text-primary dark:text-white mb-4">Requested Notes</h2>
                        <div className="relative h-40 overflow-hidden">
                            {requests.map((request, index) => (
                                <div
                                    key={request.id}
                                    className={`absolute w-full transition-transform duration-700 ease-in-out ${index === currentRequest ? 'translate-x-0' : '-translate-x-full'}`}
                                >
                                    <RequestItem request={request} />
                                </div>
                            ))}
                        </div>
                        <div className="mt-4">
                            <div className="w-full bg-gray-200 rounded-full h-1 dark:bg-gray-700">
                                <div className="bg-primary h-1 rounded-full" style={{ width: `${progress}%` }}></div>
                            </div>
                            <div className="flex justify-between mt-2">
                                <button onClick={handlePrevRequest} className="text-primary">&lt; Prev</button>
                                <button onClick={handleNextRequest} className="text-primary">Next &gt;</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <RequestNotes />
        </div>
    );
}
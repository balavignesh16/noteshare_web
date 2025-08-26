import React, { useState, useEffect, useMemo } from 'react';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { Link } from 'react-router-dom';
import FullPageSpinner from '../Layout/FullPageSpinner';
import { useProfile } from '../../context/ProfileContext';
import Icon from '../Layout/Icon';

const StatCard = ({ icon, label, value, color }) => (
    <div className={`bg-${color}-100 dark:bg-${color}-900/50 p-6 rounded-lg flex items-center space-x-4`}>
        <div className={`text-${color}-600 dark:text-${color}-400`}>
            <Icon name={icon} className="w-10 h-10" />
        </div>
        <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{label}</p>
        </div>
    </div>
);

const CourseCard = ({ courseName }) => (
    <Link 
        to={`/course/${encodeURIComponent(courseName)}`} 
        className="block p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-xl dark:hover:bg-gray-700 transition-all duration-300 transform hover:-translate-y-1"
    >
        <div className="h-24 bg-indigo-500 dark:bg-indigo-700 rounded-md mb-4 flex items-center justify-center">
            <Icon name="book-open" className="w-12 h-12 text-white" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate">{courseName.split(' - ')[1]}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{courseName.split(' - ')[0]}</p>
    </Link>
);

const LeaderboardItem = ({ user, rank }) => (
    <li className="py-3 flex items-center justify-between">
        <div className="flex items-center">
            <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400 w-8">{rank}</span>
            <span className="text-gray-800 dark:text-gray-200 font-medium">{user.name}</span>
        </div>
        <span className="text-lg font-semibold text-gray-900 dark:text-white">{user.points} pts</span>
    </li>
);

const ActivityFeedItem = ({ activity }) => (
    <div className="py-3">
        <p className="text-sm text-gray-800 dark:text-gray-200">{activity.text}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {activity.createdAt?.toDate().toLocaleString()}
        </p>
    </div>
);

export default function Dashboard() {
    const { profile } = useProfile();
    const [allAvailableCourses, setAllAvailableCourses] = useState([]);
    const [leaderboard, setLeaderboard] = useState([]);
    const [analytics, setAnalytics] = useState({ totalNotes: 0, totalDownloads: 0 });
    const [activityFeed, setActivityFeed] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('my-courses');

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch notes for courses and analytics
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
                const leaderboardData = leaderboardSnapshot.docs.map(doc => doc.data());
                setLeaderboard(leaderboardData);
                
                // Fetch activity feed data
                const activityQuery = query(collection(db, 'activity'), orderBy('createdAt', 'desc'), limit(5));
                const activitySnapshot = await getDocs(activityQuery);
                const activityData = activitySnapshot.docs.map(doc => doc.data());
                setActivityFeed(activityData);

            } catch (err) {
                setError('Failed to fetch dashboard data.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

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
            <div className="mb-8">
                <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white">Welcome, {profile?.name}!</h1>
                <p className="text-lg text-gray-600 dark:text-gray-400">Ready to learn something new today?</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <StatCard icon="document-text" label="Total Notes" value={analytics.totalNotes} color="indigo" />
                <StatCard icon="download" label="Total Downloads" value={analytics.totalDownloads} color="green" />
                <StatCard icon="sparkles" label="Your Points" value={profile?.points || 0} color="yellow" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <div className="mb-8">
                        <div className="flex border-b border-gray-200 dark:border-gray-700">
                            <button
                                onClick={() => setActiveTab('my-courses')}
                                className={`px-6 py-3 font-semibold ${activeTab === 'my-courses' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500'}`}
                            >
                                My Courses
                            </button>
                            <button
                                onClick={() => setActiveTab('discover')}
                                className={`px-6 py-3 font-semibold ${activeTab === 'discover' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500'}`}
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
                                <div className="text-center py-10 px-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                                    <p className="text-gray-500 dark:text-gray-400">You haven't subscribed to any courses with available notes yet. Go to your profile to add some!</p>
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
                                    className="w-full max-w-xs px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md text-gray-900 dark:text-white"
                                />
                            </div>
                            {filteredDiscoverCourses.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                                    {filteredDiscoverCourses.map(courseName => <CourseCard key={courseName} courseName={courseName} />)}
                                </div>
                            ) : (
                                <p className="text-center text-gray-500 dark:text-gray-400 py-10">No other courses found.</p>
                            )}
                        </div>
                    )}
                </div>
                <div className="lg:col-span-1 space-y-8">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Activity Feed</h2>
                        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                            {activityFeed.map((activity, index) => (
                                <ActivityFeedItem key={index} activity={activity} />
                            ))}
                        </ul>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Leaderboard</h2>
                        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                            {leaderboard.map((user, index) => (
                                <LeaderboardItem key={user.uid} user={user} rank={index + 1} />
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
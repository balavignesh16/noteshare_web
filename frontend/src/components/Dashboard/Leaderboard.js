import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase';
import FullPageSpinner from '../Layout/FullPageSpinner';

const Leaderboard = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                const q = query(collection(db, 'users'), orderBy('points', 'desc'), limit(10));
                const querySnapshot = await getDocs(q);
                const leaderboardData = querySnapshot.docs.map((doc, index) => ({
                    rank: index + 1,
                    id: doc.id,
                    ...doc.data(),
                }));
                setUsers(leaderboardData);
            } catch (err) {
                setError('Failed to fetch leaderboard.');
            } finally {
                setLoading(false);
            }
        };

        fetchLeaderboard();
    }, []);

    if (loading) return <FullPageSpinner />;
    if (error) return <div className="text-center py-10 text-red-500">{error}</div>;

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Top Contributors</h2>
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {users.map((user) => (
                    <li key={user.id} className="py-4 flex items-center justify-between">
                        <div className="flex items-center">
                            <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400 w-8">{user.rank}</span>
                            <span className="text-gray-800 dark:text-gray-200 font-medium">{user.name}</span>
                        </div>
                        <span className="text-lg font-semibold text-gray-900 dark:text-white">{user.points} pts</span>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default Leaderboard;
import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db, auth } from '../../services/firebase';
import FullPageSpinner from '../Layout/FullPageSpinner';

const Notifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const user = auth.currentUser;
        if (user) {
            const q = query(
                collection(db, 'notifications'),
                where('userId', '==', user.uid),
                orderBy('createdAt', 'desc')
            );

            const unsubscribe = onSnapshot(q, (querySnapshot) => {
                const notificationsData = [];
                querySnapshot.forEach((doc) => {
                    notificationsData.push({ id: doc.id, ...doc.data() });
                });
                setNotifications(notificationsData);
                setLoading(false);
            }, (err) => {
                setError('Failed to fetch notifications.');
                setLoading(false);
            });

            return () => unsubscribe();
        } else {
            setLoading(false);
        }
    }, []);

    if (loading) return <FullPageSpinner />;
    if (error) return <div className="text-center py-10 text-red-500">{error}</div>;

    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            <div className="max-w-2xl mx-auto">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Notifications</h2>
                    {notifications.length > 0 ? (
                        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                            {notifications.map((notification) => (
                                <li key={notification.id} className="py-4">
                                    <p className="text-gray-800 dark:text-gray-200">{notification.message}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                        {new Date(notification.createdAt.toDate()).toLocaleString()}
                                    </p>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-center text-gray-500 dark:text-gray-400 py-10">You have no new notifications.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Notifications;
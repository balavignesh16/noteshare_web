import React, { useState, useEffect, useMemo } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase';
import FullPageSpinner from '../Layout/FullPageSpinner';

const Analytics = () => {
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchNotes = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, 'notes'));
                const notesList = querySnapshot.docs.map(doc => doc.data());
                setNotes(notesList);
            } catch (err) {
                setError('Failed to fetch analytics data.');
            } finally {
                setLoading(false);
            }
        };

        fetchNotes();
    }, []);

    const analyticsData = useMemo(() => {
        const totalNotes = notes.length;
        const totalDownloads = notes.reduce((sum, note) => sum + (note.downloads || 0), 0);
        
        const courseCounts = notes.reduce((acc, note) => {
            acc[note.course] = (acc[note.course] || 0) + 1;
            return acc;
        }, {});

        const topCourse = Object.keys(courseCounts).reduce((a, b) => courseCounts[a] > courseCounts[b] ? a : b, '');

        return { totalNotes, totalDownloads, topCourse };
    }, [notes]);

    if (loading) return <FullPageSpinner />;
    if (error) return <div className="text-center py-10 text-red-500">{error}</div>;

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Analytics Dashboard</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-indigo-100 dark:bg-indigo-900/50 p-6 rounded-lg text-center">
                    <h3 className="text-4xl font-extrabold text-indigo-600 dark:text-indigo-300">{analyticsData.totalNotes}</h3>
                    <p className="text-lg font-medium text-gray-700 dark:text-gray-400">Total Notes</p>
                </div>
                <div className="bg-green-100 dark:bg-green-900/50 p-6 rounded-lg text-center">
                    <h3 className="text-4xl font-extrabold text-green-600 dark:text-green-300">{analyticsData.totalDownloads}</h3>
                    <p className="text-lg font-medium text-gray-700 dark:text-gray-400">Total Downloads</p>
                </div>
                <div className="bg-yellow-100 dark:bg-yellow-900/50 p-6 rounded-lg text-center">
                    <h3 className="text-2xl font-extrabold text-yellow-600 dark:text-yellow-300">{analyticsData.topCourse.split(' - ')[1]}</h3>
                    <p className="text-lg font-medium text-gray-700 dark:text-gray-400">Top Course</p>
                </div>
            </div>
        </div>
    );
};

export default Analytics;
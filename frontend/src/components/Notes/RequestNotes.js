import React, { useState } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useProfile } from '../../context/ProfileContext';
import allCourses from '../../courseData';
import SearchableDropdown from './SearchableDropdown';

const RequestNotes = () => {
    const [open, setOpen] = useState(false);
    const [requestData, setRequestData] = useState({ course: '', module: '', topic: '' });
    const { profile } = useProfile();

    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);

    const handleChange = (e) => {
        setRequestData({ ...requestData, [e.target.name]: e.target.value });
    };

    const handleCourseSelect = (selectedValue) => {
        setRequestData({ ...requestData, course: selectedValue });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!requestData.course || !requestData.module || !requestData.topic) {
            alert('Please fill out all fields.');
            return;
        }

        try {
            await addDoc(collection(db, 'requests'), {
                ...requestData,
                requesterId: profile.uid,
                requesterName: profile.name,
                createdAt: serverTimestamp(),
            });
            alert('Your request has been submitted!');
            handleClose();
        } catch (error) {
            console.error('Error submitting request:', error);
            alert('Failed to submit request. Please try again.');
        }
    };

    return (
        <>
            <button
                onClick={handleOpen}
                className="fixed bottom-8 right-8 bg-primary text-white p-4 rounded-full shadow-lg hover:bg-primary/90 transition-transform transform hover:scale-110"
                aria-label="Request Notes"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
            </button>

            {open && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
                    <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-2xl max-w-md w-full animate-slide-up">
                        <h2 className="text-2xl font-bold text-text-primary dark:text-white mb-6">Request Notes</h2>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <SearchableDropdown options={allCourses} value={requestData.course} onSelect={handleCourseSelect} />
                            <input
                                name="module"
                                type="number"
                                placeholder="Module Number"
                                value={requestData.module}
                                onChange={handleChange}
                                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 placeholder-gray-500 text-text-primary dark:text-white focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                                required
                            />
                            <input
                                name="topic"
                                placeholder="Topic"
                                value={requestData.topic}
                                onChange={handleChange}
                                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 placeholder-gray-500 text-text-primary dark:text-white focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                                required
                            />
                            <div className="flex justify-end space-x-4">
                                <button
                                    type="button"
                                    onClick={handleClose}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90"
                                >
                                    Submit Request
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default RequestNotes;
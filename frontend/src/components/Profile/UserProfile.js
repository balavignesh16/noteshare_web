import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../../services/firebase';
import FullPageSpinner from '../Layout/FullPageSpinner';
import SearchableMultiSelect from '../Common/SearchableMultiSelect';
import allCourses from '../../courseData';
import { useProfile } from '../../context/ProfileContext';

export default function UserProfile() {
    const { profile: initialProfile, loading: profileLoading } = useProfile();
    const [userProfile, setUserProfile] = useState(null);
    const [error, setError] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [subscribedCourses, setSubscribedCourses] = useState([]);
    const [isSaving, setIsSaving] = useState(false);

    const courseOptions = allCourses.map(c => `${c.courseCode} - ${c.courseTitle}`);

    useEffect(() => {
        if (initialProfile) {
            const currentDate = new Date();
            const currentYear = currentDate.getFullYear();
            const joiningYear = initialProfile.joiningYear;
            let academicYear = currentYear - joiningYear;
            if (currentDate.getMonth() >= 7) { academicYear += 1; }
            
            setUserProfile({ ...initialProfile, currentAcademicYear: academicYear });
            setSubscribedCourses(initialProfile.subscribedCourses || []);
        }
    }, [initialProfile]);

    const handleSave = async () => {
        setIsSaving(true);
        setError('');
        try {
            const userRef = doc(db, 'users', auth.currentUser.uid);
            await updateDoc(userRef, {
                subscribedCourses: subscribedCourses
            });
            setIsEditing(false);
        } catch (err) {
            console.error("Error updating profile:", err);
            setError("Failed to save changes.");
        } finally {
            setIsSaving(false);
        }
    };

    if (profileLoading) return <FullPageSpinner />;
    if (error) return <div className="max-w-4xl mx-auto text-center py-10 px-4 text-red-600 bg-red-50 rounded-lg">{error}</div>;
    if (!userProfile) return <div className="text-center py-10">No profile data available.</div>;

    return (
        <div className="py-12 animate-fade-in">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-white dark:bg-gray-800 shadow-2xl rounded-lg overflow-hidden">
                    <div className="bg-cover bg-center h-40 bg-gradient-to-r from-primary to-secondary animate-gradient-flow" style={{ backgroundSize: '200% 200%' }}></div>
                    <div className="p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-text-primary dark:text-white">My Profile</h2>
                            {!isEditing && <button onClick={() => setIsEditing(true)} className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90 transition-transform transform hover:scale-105">Edit</button>}
                        </div>
                        
                        <div className="sm:flex sm:items-center sm:justify-between">
                            <div className="sm:flex sm:space-x-5">
                                <div className="flex-shrink-0">
                                    <div className="mx-auto h-24 w-24 rounded-full bg-light-bg dark:bg-dark-bg flex items-center justify-center text-primary dark:text-secondary text-4xl font-bold">
                                        {userProfile.name ? userProfile.name.charAt(0).toUpperCase() : '?'}
                                    </div>
                                </div>
                                <div className="mt-4 text-center sm:mt-0 sm:pt-1 sm:text-left">
                                    <p className="text-xl font-bold text-text-primary dark:text-white sm:text-2xl">{userProfile.name}</p>
                                    <p className="text-sm font-medium text-text-muted">{userProfile.programme}</p>
                                </div>
                            </div>
                            <div className="mt-5 sm:mt-0">
                                <span className="inline-flex items-center px-4 py-2 bg-primary/10 text-primary text-sm font-medium rounded-full">
                                    {userProfile.currentAcademicYear}{userProfile.currentAcademicYear === 1 ? 'st' : userProfile.currentAcademicYear === 2 ? 'nd' : userProfile.currentAcademicYear === 3 ? 'rd' : 'th'} Year
                                </span>
                            </div>
                        </div>
                        <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-6">
                            <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
                                <div className="sm:col-span-1">
                                    <dt className="text-sm font-medium text-text-muted">Degree</dt>
                                    <dd className="mt-1 text-sm text-text-primary dark:text-gray-100">{userProfile.degree}</dd>
                                </div>
                                <div className="sm:col-span-1">
                                    <dt className="text-sm font-medium text-text-muted">Registration No.</dt>
                                    <dd className="mt-1 text-sm text-text-primary dark:text-gray-100">{userProfile.registrationNumber}</dd>
                                </div>
                                <div className="sm:col-span-1">
                                    <dt className="text-sm font-medium text-text-muted">Joining Year</dt>
                                    <dd className="mt-1 text-sm text-text-primary dark:text-gray-100">{userProfile.joiningYear}</dd>
                                </div>
                                <div className="sm:col-span-1">
                                    <dt className="text-sm font-medium text-text-muted">Email</dt>
                                    <dd className="mt-1 text-sm text-text-primary dark:text-gray-100">{auth.currentUser.email}</dd>
                                </div>
                            </dl>
                        </div>

                        <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-6">
                            <h3 className="text-lg font-semibold text-text-primary dark:text-white mb-4">My Subscribed Courses</h3>
                            {isEditing ? (
                                <SearchableMultiSelect 
                                    options={courseOptions}
                                    selected={subscribedCourses}
                                    onChange={setSubscribedCourses}
                                    placeholder="Search and add your courses..."
                                />
                            ) : (
                                <div className="flex flex-wrap gap-2">
                                    {userProfile.subscribedCourses && userProfile.subscribedCourses.length > 0 ? (
                                        userProfile.subscribedCourses.map(course => (
                                            <span key={course} className="px-3 py-1 text-sm bg-primary/10 text-primary rounded-full">{course}</span>
                                        ))
                                    ) : (
                                        <p className="text-text-muted">You haven't subscribed to any courses yet.</p>
                                    )}
                                </div>
                            )}
                            {isEditing && (
                                <div className="mt-6 flex gap-4">
                                    <button onClick={handleSave} disabled={isSaving} className="px-4 py-2 text-sm font-medium text-white bg-accent rounded-md hover:bg-accent/90 disabled:bg-accent/50">
                                        {isSaving ? 'Saving...' : 'Save Changes'}
                                    </button>
                                    <button onClick={() => { setIsEditing(false); setSubscribedCourses(userProfile.subscribedCourses || []); }} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">Cancel</button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
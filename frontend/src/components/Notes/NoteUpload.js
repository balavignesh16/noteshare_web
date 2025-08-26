import React, { useState } from 'react';
import { addDoc, collection, doc, updateDoc, increment, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../services/firebase';
import allCourses from '../../courseData';
import SearchableDropdown from './SearchableDropdown';
import { useProfile } from '../../context/ProfileContext';

const uploadInputClass = "appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm";

export default function NoteUpload() {
    const [noteData, setNoteData] = useState({ course: '', faculty: '', module: '', topic: '', tags: '' });
    const [file, setFile] = useState(null);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const { profile } = useProfile();

    const handleDataChange = (e) => setNoteData({ ...noteData, [e.target.name]: e.target.value });
    const handleCourseSelect = (selectedValue) => setNoteData(prev => ({ ...prev, course: selectedValue }));
    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile && selectedFile.type === "application/pdf") {
            setFile(selectedFile);
            setError('');
        } else {
            setFile(null);
            setError('Please select a valid PDF file.');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file || !noteData.course) {
            setError('Please select a file and a course.');
            return;
        }
        setError(''); setMessage(''); setLoading(true);

        const user = auth.currentUser;
        if (!user || !profile) {
            setError("You must be logged in to upload notes.");
            setLoading(false);
            return;
        }

        try {
            const formData = new FormData();
            formData.append('file', file);
            const response = await fetch('/api/upload', { method: 'POST', body: formData });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'File upload failed on the server.');
            }
            const data = await response.json();
            const downloadURL = data.url;

            await addDoc(collection(db, "notes"), {
                userId: user.uid,
                userName: profile.name,
                ...noteData,
                module: Number(noteData.module),
                tags: noteData.tags.split(',').map(tag => tag.trim()),
                fileUrl: downloadURL,
                ocrText: "",
                createdAt: new Date().toISOString(),
                downloads: 0
            });
            
            // Add to activity feed
            await addDoc(collection(db, "activity"), {
                text: `${profile.name} uploaded a new note for ${noteData.course.split(' - ')[1]}`,
                createdAt: serverTimestamp(),
            });

            const userRef = doc(db, 'users', user.uid);
            const userDoc = await getDoc(userRef);
            if (userDoc.exists()) {
                const userData = userDoc.data();
                const today = new Date().toISOString().split('T')[0];
                const lastUploadDate = userData.lastUploadDate;

                let newStreak = userData.streak || 0;
                if (lastUploadDate !== today) {
                    const yesterday = new Date();
                    yesterday.setDate(yesterday.getDate() - 1);
                    if (lastUploadDate === yesterday.toISOString().split('T')[0]) {
                        newStreak++;
                    } else {
                        newStreak = 1;
                    }

                    await updateDoc(userRef, {
                        points: increment(10 + (newStreak > 1 ? 5 : 0)),
                        streak: newStreak,
                        lastUploadDate: today
                    });
                }
            }

            setMessage('Note uploaded successfully!');
            setNoteData({ course: '', faculty: '', module: '', topic: '', tags: '' });
            setFile(null);
            if (e.target.querySelector('input[type="file"]')) {
                e.target.querySelector('input[type="file"]').value = '';
            }
        } catch (err) {
            console.error("Upload process error:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                <div><h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">Upload a New Note</h2></div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                     <SearchableDropdown options={allCourses} value={noteData.course} onSelect={handleCourseSelect} />
                     <input name="faculty" placeholder="Faculty Name" value={noteData.faculty} onChange={handleDataChange} className={uploadInputClass} required />
                     <input name="module" type="number" placeholder="Module Number" value={noteData.module} onChange={handleDataChange} className={uploadInputClass} required />
                     <input name="topic" placeholder="Topic" value={noteData.topic} onChange={handleDataChange} className={uploadInputClass} required />
                     <input name="tags" placeholder="Tags (comma-separated)" value={noteData.tags} onChange={handleDataChange} className={uploadInputClass} />
                     <input type="file" accept=".pdf" onChange={handleFileChange} className={`${uploadInputClass} file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 dark:file:bg-indigo-900/50 file:text-indigo-700 dark:file:text-indigo-300 hover:file:bg-indigo-100 dark:hover:file:bg-indigo-800/50`} required />
                    {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                    {message && <p className="text-green-500 text-sm text-center">{message}</p>}
                    <button type="submit" disabled={loading} className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400">
                        {loading ? 'Uploading...' : 'Upload Note'}
                    </button>
                </form>
            </div>
        </div>
    );
}
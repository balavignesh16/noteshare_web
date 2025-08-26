import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc, collection, addDoc, query, where, onSnapshot, orderBy, serverTimestamp, increment, updateDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useProfile } from '../../context/ProfileContext';
import FullPageSpinner from '../Layout/FullPageSpinner';

const Icon = ({ path, className = "w-5 h-5 mr-2" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d={path} />
    </svg>
);

const TimeAgo = ({ date }) => {
    if (!date) return null;
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return Math.floor(seconds) + " seconds ago";
};

export default function NoteView() {
    const { noteId } = useParams();
    const { profile } = useProfile();
    const [note, setNote] = useState(null);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchNote = async () => {
            try {
                const docRef = doc(db, 'notes', noteId);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setNote({ id: docSnap.id, ...docSnap.data() });
                } else {
                    setError('Note not found.');
                }
            } catch (err) {
                setError('Failed to fetch the note.');
            } finally {
                setLoading(false);
            }
        };
        fetchNote();

        const q = query(collection(db, "comments"), where("noteId", "==", noteId), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const commentsData = [];
            querySnapshot.forEach((doc) => commentsData.push({ id: doc.id, ...doc.data() }));
            setComments(commentsData);
        });
        return () => unsubscribe();
    }, [noteId]);

    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        if (newComment.trim() === '' || !profile) return;
        try {
            await addDoc(collection(db, "comments"), {
                noteId: noteId,
                text: newComment,
                userId: profile.uid,
                userName: profile.name,
                createdAt: serverTimestamp(),
            });

            // Create a notification for the note owner
            if (note && note.userId !== profile.uid) {
                await addDoc(collection(db, "notifications"), {
                    userId: note.userId,
                    message: `${profile.name} commented on your note: "${note.topic}"`,
                    createdAt: serverTimestamp(),
                    read: false,
                });
            }

            setNewComment('');
        } catch (error) {
            console.error("Error adding comment: ", error);
        }
    };
    
    const handleDownload = async () => {
        if (note && note.fileUrl) {
            const noteRef = doc(db, 'notes', note.id);
            await updateDoc(noteRef, {
                downloads: increment(1)
            });
            window.open(note.fileUrl, '_blank');
        }
    };

    if (loading) return <FullPageSpinner />;
    if (error) return <div className="text-center py-10 text-red-500">{error}</div>;

    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Simplified PDF Viewer */}
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md flex flex-col items-center justify-center">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Note Preview</h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-6 text-center">This note will open in a new tab using your browser's PDF viewer.</p>
                    {note && note.fileUrl ? (
                         <button
                            onClick={handleDownload}
                            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                        >
                            <Icon path="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" className="w-5 h-5 mr-2" />
                            Open PDF
                        </button>
                    ) : (
                        <p className="text-red-500">Could not find PDF URL.</p>
                    )}
                </div>

                {/* Note Details & Comments */}
                <div className="lg:col-span-1">
                    {note ? (
                        <>
                            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{note.topic}</h1>
                                <p className="text-md text-indigo-600 dark:text-indigo-400 mt-1">{note.course}</p>
                                <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4 space-y-2 text-sm text-gray-700 dark:text-gray-300">
                                    <p className="flex items-center"><Icon path="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /> <strong>Faculty:</strong> &nbsp;{note.faculty}</p>
                                    <p className="flex items-center"><Icon path="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /> <strong>Module:</strong> &nbsp;{note.module}</p>
                                    <p className="flex items-center"><Icon path="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /> <strong>Downloads:</strong> &nbsp;{note.downloads || 0}</p>
                                </div>
                                <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                                     <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Tags</h3>
                                     <div className="mt-2 flex flex-wrap gap-2">
                                        {note.tags?.map(tag => (
                                            <span key={tag} className="px-3 py-1 text-sm bg-indigo-100 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-200 rounded-full">{tag}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Comments</h2>
                                <form onSubmit={handleCommentSubmit} className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                        placeholder="Add a comment..."
                                        className="flex-grow appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    />
                                    <button type="submit" className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 disabled:bg-indigo-400" disabled={!newComment.trim()}>Post</button>
                                </form>
                                <div className="mt-6 space-y-4">
                                    {comments.map(comment => (
                                        <div key={comment.id} className="flex space-x-3">
                                            <div className="flex-shrink-0 h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-300 font-bold text-sm">
                                                {comment.userName ? comment.userName.charAt(0).toUpperCase() : '?'}
                                            </div>
                                            <div>
                                                <div className="text-sm">
                                                    <span className="font-bold text-gray-900 dark:text-white">{comment.userName}</span>
                                                    <span className="text-gray-500 dark:text-gray-400 ml-2 text-xs">
                                                        <TimeAgo date={comment.createdAt?.toDate()} />
                                                    </span>
                                                </div>
                                                <p className="text-gray-700 dark:text-gray-300 mt-1">{comment.text}</p>
                                            </div>
                                        </div>
                                    ))}
                                    {comments.length === 0 && (
                                        <p className="text-center text-gray-500 dark:text-gray-400 py-4">No comments yet. Be the first to comment!</p>
                                    )}
                                </div>
                            </div>
                        </>
                    ) : null}
                </div>
            </div>
        </div>
    );
}
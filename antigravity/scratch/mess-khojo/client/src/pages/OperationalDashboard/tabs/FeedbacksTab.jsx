import React, { useState } from 'react';
import { MessageSquare, Trash2, Reply } from 'lucide-react';
import { db, auth } from '../../../firebase';
import { updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';

const FeedbacksTab = ({ feedbacks, feedbackReplies, setFeedbackReplies }) => {
    const [visibleCount, setVisibleCount] = useState(10);

    const [prevFeedbacks, setPrevFeedbacks] = useState(feedbacks);

    // Reset pagination when data changes
    if (feedbacks !== prevFeedbacks) {
        setPrevFeedbacks(feedbacks);
        setVisibleCount(10);
    }

    const visibleFeedbacks = feedbacks.slice(0, visibleCount);

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-2 text-purple-500">
                    <MessageSquare />
                    User Feedbacks
                </h2>
                <span className="bg-purple-500/10 text-purple-550 px-3 py-1 rounded-full text-xs font-bold border border-purple-500/20">
                    {feedbacks.length} Total
                </span>
            </div>

            <div className="space-y-4">
                {visibleFeedbacks.length === 0 ? (
                    <div className="text-center py-20 text-slate-500 bg-slate-800/50 rounded-2xl border border-slate-700 border-dashed">
                        No feedbacks submitted yet.
                    </div>
                ) : (
                    visibleFeedbacks.map(feedback => (
                        <div key={feedback.id} className="bg-slate-800 rounded-xl p-5 border border-slate-700 shadow-sm hover:border-slate-600 transition-colors">
                            <div className="flex flex-col gap-4">
                                {/* Header */}
                                <div className="flex justify-between items-start">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${feedback.status === 'replied' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                                                feedback.status === 'resolved' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                                                    'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                                                }`}>
                                                {feedback.status}
                                            </span>
                                            <span className="text-slate-500 text-xs font-mono">ID: {feedback.id.slice(0, 8)}</span>
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-white text-base leading-snug">{feedback.userName}</h3>
                                            {feedback.userEmail && (
                                                <p className="text-slate-405 text-sm font-medium">{feedback.userEmail}</p>
                                            )}
                                            {/* Star Rating Display */}
                                            {feedback.rating > 0 && (
                                                <div className="flex items-center gap-1 mt-1">
                                                    {[1, 2, 3, 4, 5].map((star) => (
                                                        <span key={star} className={`text-sm ${star <= feedback.rating ? 'text-yellow-400 animate-pulse' : 'text-slate-600'}`}>
                                                            ★
                                                        </span>
                                                    ))}
                                                    <span className="text-xs text-slate-500 font-bold ml-1">({feedback.rating}/5)</span>
                                                </div>
                                            )}
                                            <p className="text-slate-500 text-xs mt-1 font-medium">
                                                {feedback.createdAt?.seconds ? new Date(feedback.createdAt.seconds * 1000).toLocaleString() : 'Recently'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Delete Button */}
                                    <button
                                        onClick={async () => {
                                            if (window.confirm("Delete this feedback?")) {
                                                try {
                                                    await deleteDoc(doc(db, "feedbacks", feedback.id));
                                                } catch { alert("Delete failed"); }
                                            }
                                        }}
                                        className="flex items-center gap-1.5 px-3 py-2 bg-slate-705 hover:bg-red-500/20 hover:text-red-400 text-slate-400 rounded-lg text-xs font-bold transition-all border border-slate-700"
                                    >
                                        <Trash2 size={14} /> Delete
                                    </button>
                                </div>

                                {/* Feedback Message */}
                                <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-700/50">
                                    <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider mb-2">Feedback Message</p>
                                    <p className="text-white text-sm leading-relaxed font-medium">"{feedback.message}"</p>
                                </div>

                                {/* Operator Reply Display */}
                                {feedback.operatorReply && (
                                    <div className="p-4 bg-emerald-900/10 rounded-xl border border-emerald-500/20">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Reply size={14} className="text-emerald-500 animate-bounce" />
                                            <p className="text-xs font-bold text-emerald-500 uppercase tracking-wider">Your Reply</p>
                                        </div>
                                        <p className="text-slate-305 text-sm leading-relaxed font-medium">{feedback.operatorReply}</p>
                                        {feedback.repliedAt?.seconds && (
                                            <p className="text-slate-500 text-xs mt-2 font-mono">
                                                Replied: {new Date(feedback.repliedAt.seconds * 1000).toLocaleString()}
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* Reply Form */}
                                {!feedback.operatorReply && (
                                    <div className="space-y-3">
                                        <textarea
                                            placeholder="Write your reply to this feedback..."
                                            value={feedbackReplies[feedback.id] || ''}
                                            onChange={(e) => setFeedbackReplies(prev => ({ ...prev, [feedback.id]: e.target.value }))}
                                            className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:ring-2 focus:ring-purple-500 outline-none resize-none h-20"
                                        />
                                        <button
                                            onClick={async () => {
                                                const reply = feedbackReplies[feedback.id];
                                                if (!reply?.trim()) {
                                                    alert("Please enter a reply");
                                                    return;
                                                }
                                                try {
                                                    await updateDoc(doc(db, "feedbacks", feedback.id), {
                                                        operatorReply: reply.trim(),
                                                        repliedAt: serverTimestamp(),
                                                        repliedBy: auth.currentUser?.email,
                                                        status: 'replied'
                                                    });
                                                    setFeedbackReplies(prev => {
                                                        const updated = { ...prev };
                                                        delete updated[feedback.id];
                                                        return updated;
                                                    });
                                                } catch (error) {
                                                    console.error("Reply failed:", error);
                                                    alert("Failed to send reply");
                                                }
                                            }}
                                            className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-bold transition-colors shadow-lg shadow-purple-950/20 text-xs"
                                        >
                                            <Reply size={14} /> Send Reply
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Pagination View More Button */}
            {visibleCount < feedbacks.length && (
                <div className="flex justify-center pt-4">
                    <button
                        onClick={() => setVisibleCount(prev => prev + 10)}
                        className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl border border-slate-700 transition-all hover:scale-105 active:scale-95 shadow-md flex items-center gap-2 text-sm"
                    >
                        View More ({feedbacks.length - visibleCount} remaining)
                    </button>
                </div>
            )}
        </div>
    );
};

export default FeedbacksTab;

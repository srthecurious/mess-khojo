import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X } from 'lucide-react';
import { Link } from 'react-router-dom';

const NotificationModal = ({
    isNotificationModalOpen,
    closeOverlays,
    setIsNotificationModalOpen,
    currentUser,
    notifications
}) => {
    return createPortal(
        <AnimatePresence>
            {isNotificationModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-start justify-end pt-20 pr-4 sm:pr-8 pointer-events-none">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-transparent pointer-events-auto"
                        onClick={closeOverlays}
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: -20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: -20 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        style={{ transformOrigin: "top right" }}
                        className="bg-brand-secondary w-full max-w-sm max-h-[70vh] rounded-3xl overflow-hidden pointer-events-auto shadow-2xl relative flex flex-col border border-white/40"
                    >
                        {/* Header */}
                        <div className="flex justify-between items-center p-6 border-b border-brand-light-gray shrink-0 bg-white/50">
                            <h3 className="text-xl font-bold text-brand-text-dark flex items-center gap-2">
                                <Bell size={20} className="text-brand-primary" />
                                Notifications
                            </h3>
                            <button onClick={closeOverlays} className="p-3 text-brand-text-dark hover:bg-brand-light-gray rounded-full transition-all">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto bg-brand-secondary p-4 space-y-3">
                            {!currentUser ? (
                                <div className="text-center py-12">
                                    <Link
                                        to="/user-login"
                                        onClick={() => setIsNotificationModalOpen(false)}
                                        className="text-brand-primary hover:text-brand-primary-hover font-medium underline underline-offset-4 decoration-2 italic transition-colors"
                                    >
                                        Please login to view notifications.
                                    </Link>
                                </div>
                            ) : notifications.length === 0 ? (
                                <div className="text-center py-12">
                                    <p className="text-brand-text-gray italic">No new notifications.</p>
                                </div>
                            ) : (
                                notifications.map(note => (
                                    <div key={note.id} className={`p-5 rounded-2xl border transition-all ${note.status === 'confirmed' ? 'bg-green-50/50 border-green-100' : 'bg-red-50/50 border-red-100'}`}>
                                        <div className="flex justify-between items-start mb-2">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${note.status === 'confirmed' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                                                {note.status === 'confirmed' ? 'Approved' : 'Rejected'}
                                            </span>
                                            <span className="text-[10px] text-brand-text-gray font-medium">
                                                {note.respondedAt?.seconds ? new Date(note.respondedAt.seconds * 1000).toLocaleDateString() : ''}
                                            </span>
                                        </div>
                                        <h4 className="font-bold text-brand-text-dark text-base mb-1">{note.messName}</h4>
                                        <p className="text-xs text-brand-text-gray mb-3">{note.roomType} Room Call Request Update</p>

                                        {note.remark && (
                                            <div className="p-3 bg-white/60 rounded-xl border border-white/50 text-sm text-brand-text-dark leading-relaxed shadow-sm">
                                                <span className="text-[10px] font-bold text-brand-text-gray block mb-1 uppercase tracking-tight">Operator Remark:</span>
                                                "{note.remark}"
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default NotificationModal;

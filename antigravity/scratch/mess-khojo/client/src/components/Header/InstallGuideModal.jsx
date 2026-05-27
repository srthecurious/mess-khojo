import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download } from 'lucide-react';

const InstallGuideModal = ({ showInstallGuide, closeOverlays }) => {
    return (
        <AnimatePresence>
            {showInstallGuide && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={closeOverlays}
                    />
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        className="relative bg-white rounded-3xl shadow-xl w-full max-w-sm overflow-hidden z-10"
                    >
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-2">
                                    <Download size={24} />
                                </div>
                                <button onClick={closeOverlays} className="text-gray-400 hover:text-gray-600 p-1 transition-colors">
                                    <X size={20} />
                                </button>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Install MessKhojo</h3>
                            <p className="text-gray-600 text-sm mb-6">Install our app for faster access, offline mode, and a better experience.</p>

                            <div className="space-y-4">
                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                    <div className="font-bold text-gray-800 mb-1 flex items-center gap-2">
                                        <span className="text-xl">🍎</span> iOS (Safari)
                                    </div>
                                    <ol className="text-sm text-gray-600 font-medium pl-5 list-decimal space-y-1">
                                        <li>Tap the <span className="font-bold">Share</span> button</li>
                                        <li>Scroll down and tap <span className="font-bold">Add to Home Screen</span></li>
                                    </ol>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                    <div className="font-bold text-gray-800 mb-1 flex items-center gap-2">
                                        <span className="text-xl">🤖</span> Android (Chrome)
                                    </div>
                                    <ol className="text-sm text-gray-600 font-medium pl-5 list-decimal space-y-1">
                                        <li>Tap the <span className="font-bold">3-dots menu</span> icon</li>
                                        <li>Tap <span className="font-bold">Install app</span> or <span className="font-bold">Add to Home screen</span></li>
                                    </ol>
                                </div>
                            </div>
                            <button
                                onClick={closeOverlays}
                                className="w-full mt-6 bg-gray-900 text-white font-bold py-3 rounded-xl hover:bg-gray-800 transition-colors"
                            >
                                Got it !
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default InstallGuideModal;

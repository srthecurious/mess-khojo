import React, { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import MessCard from '../components/MessCard';
import { Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const Home = () => {
    const [messes, setMesses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, "messes"), (snapshot) => {
            const messesData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setMesses(messesData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching messes:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const filteredMesses = messes.filter(mess =>
        mess.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        mess.address.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-[#FDF8F5] font-sans text-gray-800 selection:bg-pink-200">
            {/* Navbar */}
            <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-pink-100 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-20">
                        <div className="flex items-center gap-3">
                            <img src="/logo.png" alt="Mess Khojo Logo" className="h-16 w-auto" />
                            <span className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-500 tracking-tight font-serif">Mess Khojo</span>
                        </div>
                        <Link to="/admin/login" className="px-6 py-2.5 bg-gradient-to-r from-purple-400 to-pink-400 hover:from-purple-500 hover:to-pink-500 text-white rounded-full font-medium transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 text-sm tracking-wide">
                            Partner Login
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <div className="relative bg-[#FDF8F5] pt-20 pb-32 px-4 overflow-hidden">
                {/* Pastel Blobs Background */}
                <div className="absolute top-20 left-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob"></div>
                <div className="absolute top-20 right-10 w-72 h-72 bg-yellow-200 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob animation-delay-2000"></div>
                <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob animation-delay-4000 transform -translate-x-1/2"></div>

                <div className="max-w-4xl mx-auto text-center relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                    >
                        <span className="inline-block py-1 px-3 rounded-full bg-purple-100 text-purple-600 text-sm font-semibold mb-6 tracking-wider uppercase">
                            Find Your Comfort
                        </span>
                        <h1 className="text-5xl md:text-7xl font-bold mb-8 text-gray-900 leading-tight font-serif">
                            Feels like <span className="relative inline-block">
                                <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500">home</span>
                                <span className="absolute bottom-2 left-0 w-full h-3 bg-pink-200/50 -z-10 rounded-full"></span>
                            </span>, <br /> even when you're away.
                        </h1>
                        <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed">
                            Discover verified messes and hostels that prioritize hygiene, comfort, and community.
                        </p>
                    </motion.div>

                    {/* Search Bar */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className="w-full max-w-2xl mx-auto"
                    >
                        <div className="relative group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-purple-300 via-pink-300 to-yellow-300 rounded-full blur opacity-40 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
                            <div className="relative flex items-center bg-white rounded-full shadow-xl p-2 transition-all duration-300 border border-white">
                                <Search className="ml-6 text-gray-400" size={22} />
                                <input
                                    type="text"
                                    placeholder="Search by location, mess name..."
                                    className="w-full py-4 px-4 text-lg text-gray-700 placeholder-gray-400 bg-transparent border-none focus:ring-0 outline-none"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                                <button className="bg-gray-900 hover:bg-gray-800 text-white px-8 py-3.5 rounded-full font-semibold transition-all duration-300 shadow-lg">
                                    Search
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Mess List */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 bg-white rounded-t-[3rem] shadow-[0_-20px_60px_-15px_rgba(0,0,0,0.05)] relative z-20 min-h-[50vh]">
                <div className="flex items-center justify-center mb-16">
                    <div className="text-center">
                        <h2 className="text-3xl font-bold text-gray-900 font-serif mb-3">Explore Curated Stays</h2>
                        <div className="h-1.5 w-24 bg-gradient-to-r from-purple-300 to-pink-300 rounded-full mx-auto"></div>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-100 border-t-purple-500"></div>
                    </div>
                ) : filteredMesses.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredMesses.map((mess, index) => (
                            <MessCard key={mess.id} mess={mess} index={index} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-24 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                        <div className="bg-white w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-gray-100">
                            <Search size={32} className="text-gray-300" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-700 mb-2">No matches found</h3>
                        <p className="text-gray-500">We couldn't find any messes matching "{searchTerm}".</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Home;

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, Building2, BedDouble, Trash2 } from 'lucide-react';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../hooks/useWishlist';
import MessCard from '../components/MessCard';
import RoomCard from '../components/RoomCard';

const Wishlist = () => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const {
        wishlistedMesses,
        wishlistedRooms,
        toggleMessWishlist,
        toggleRoomWishlist,
        isMessWishlisted,
        isRoomWishlisted,
    } = useWishlist();

    const [activeTab, setActiveTab] = useState('messes');
    const [messes, setMesses] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [loadingMesses, setLoadingMesses] = useState(false);
    const [loadingRooms, setLoadingRooms] = useState(false);

    // Redirect to login if not authenticated
    useEffect(() => {
        if (!currentUser) {
            navigate('/user-login', { replace: true });
        }
    }, [currentUser, navigate]);

    // Fetch wishlisted messes from Firestore
    useEffect(() => {
        if (!currentUser || wishlistedMesses.size === 0) {
            setMesses([]);
            return;
        }
        const fetchMesses = async () => {
            setLoadingMesses(true);
            try {
                const ids = [...wishlistedMesses];
                // Fetch in batches of 10 (Firestore 'in' limit)
                const batches = [];
                for (let i = 0; i < ids.length; i += 10) {
                    batches.push(ids.slice(i, i + 10));
                }
                // Fetch mess documents
                const messResults = await Promise.all(
                    batches.map(batch => {
                        const q = query(collection(db, 'messes'), where('__name__', 'in', batch));
                        return getDocs(q);
                    })
                );
                const messData = messResults.flatMap(snap =>
                    snap.docs.map(d => ({ id: d.id, ...d.data() }))
                );

                // Fetch rooms for these messes to compute price ranges
                const roomResults = await Promise.all(
                    batches.map(batch => {
                        const q = query(collection(db, 'rooms'), where('messId', 'in', batch));
                        return getDocs(q);
                    })
                );
                const allRooms = roomResults.flatMap(snap =>
                    snap.docs.map(d => ({ id: d.id, ...d.data() }))
                );

                // Attach minPrice / maxPrice to each mess
                const data = messData.map(mess => {
                    const messRooms = allRooms.filter(r => r.messId === mess.id);
                    const prices = messRooms
                        .map(r => Number(r.price || r.rent))
                        .filter(p => !isNaN(p) && p > 0);
                    return {
                        ...mess,
                        minPrice: prices.length ? Math.min(...prices) : null,
                        maxPrice: prices.length ? Math.max(...prices) : null,
                    };
                });
                setMesses(data);
            } catch (err) {
                console.error('Error fetching wishlist messes:', err);
            } finally {
                setLoadingMesses(false);
            }
        };
        fetchMesses();
    }, [currentUser, wishlistedMesses]);

    // Fetch wishlisted rooms from Firestore
    useEffect(() => {
        if (!currentUser || wishlistedRooms.size === 0) {
            setRooms([]);
            return;
        }
        const fetchRooms = async () => {
            setLoadingRooms(true);
            try {
                const ids = [...wishlistedRooms];
                const batches = [];
                for (let i = 0; i < ids.length; i += 10) {
                    batches.push(ids.slice(i, i + 10));
                }
                const results = await Promise.all(
                    batches.map(batch => {
                        const q = query(collection(db, 'rooms'), where('__name__', 'in', batch));
                        return getDocs(q);
                    })
                );
                const data = results.flatMap(snap =>
                    snap.docs.map(d => ({ id: d.id, ...d.data() }))
                );
                setRooms(data);
            } catch (err) {
                console.error('Error fetching wishlist rooms:', err);
            } finally {
                setLoadingRooms(false);
            }
        };
        fetchRooms();
    }, [currentUser, wishlistedRooms]);

    if (!currentUser) return null;

    const totalMesses = wishlistedMesses.size;
    const totalRooms = wishlistedRooms.size;

    return (
        <div className="min-h-screen bg-brand-secondary pb-20">
            {/* Header */}
            <div className="bg-brand-primary p-4 sticky top-0 z-10 shadow-md">
                <div className="max-w-5xl mx-auto flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="text-white/80 hover:text-white transition-colors">
                        <ArrowLeft size={24} />
                    </button>
                    <div className="flex items-center gap-2">
                        <Heart size={20} className="text-red-300 fill-red-300" />
                        <h1 className="text-xl font-bold text-white">My Wishlist</h1>
                    </div>
                    <div className="ml-auto text-sm text-white/70 font-medium">
                        {totalMesses + totalRooms} saved
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 py-6">
                {/* Tabs */}
                <div className="flex bg-white rounded-2xl p-1 shadow-sm border border-gray-100 mb-6 gap-1">
                    <button
                        onClick={() => setActiveTab('messes')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all ${activeTab === 'messes'
                                ? 'bg-brand-primary text-white shadow-md shadow-brand-primary/20'
                                : 'text-brand-text-gray hover:text-brand-text-dark'
                            }`}
                    >
                        <Building2 size={16} />
                        Messes
                        {totalMesses > 0 && (
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${activeTab === 'messes' ? 'bg-white/25 text-white' : 'bg-brand-primary/10 text-brand-primary'
                                }`}>
                                {totalMesses}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('rooms')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all ${activeTab === 'rooms'
                                ? 'bg-brand-primary text-white shadow-md shadow-brand-primary/20'
                                : 'text-brand-text-gray hover:text-brand-text-dark'
                            }`}
                    >
                        <BedDouble size={16} />
                        Rooms
                        {totalRooms > 0 && (
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${activeTab === 'rooms' ? 'bg-white/25 text-white' : 'bg-brand-primary/10 text-brand-primary'
                                }`}>
                                {totalRooms}
                            </span>
                        )}
                    </button>
                </div>

                {/* MESSES TAB */}
                {activeTab === 'messes' && (
                    <>
                        {loadingMesses ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {[...Array(4)].map((_, i) => (
                                    <div key={i} className="h-56 rounded-2xl bg-gray-200 animate-pulse" />
                                ))}
                            </div>
                        ) : messes.length === 0 ? (
                            <div className="text-center py-20 px-6 bg-white rounded-3xl border border-gray-100 shadow-sm">
                                <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Heart size={36} className="text-red-300" />
                                </div>
                                <h3 className="text-xl font-bold text-brand-text-dark mb-2">No Messes Saved</h3>
                                <p className="text-brand-text-gray mb-6 text-sm">
                                    Tap the ❤️ on any mess card to save it here for quick access.
                                </p>
                                <Link
                                    to="/"
                                    className="inline-flex items-center justify-center px-6 py-3 bg-brand-primary text-white font-semibold rounded-xl hover:bg-brand-primary-hover transition-colors shadow-lg shadow-brand-primary/20 text-sm"
                                >
                                    Browse Messes
                                </Link>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                                {messes.map(mess => (
                                    <MessCard
                                        key={mess.id}
                                        mess={mess}
                                        isWishlisted={isMessWishlisted(mess.id)}
                                        onToggleWishlist={toggleMessWishlist}
                                    />
                                ))}
                            </div>
                        )}
                    </>
                )}

                {/* ROOMS TAB */}
                {activeTab === 'rooms' && (
                    <>
                        {loadingRooms ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {[...Array(4)].map((_, i) => (
                                    <div key={i} className="h-56 rounded-2xl bg-gray-200 animate-pulse" />
                                ))}
                            </div>
                        ) : rooms.length === 0 ? (
                            <div className="text-center py-20 px-6 bg-white rounded-3xl border border-gray-100 shadow-sm">
                                <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <BedDouble size={36} className="text-red-300" />
                                </div>
                                <h3 className="text-xl font-bold text-brand-text-dark mb-2">No Rooms Saved</h3>
                                <p className="text-brand-text-gray mb-6 text-sm">
                                    Tap the ❤️ on any room card to save it here for quick access.
                                </p>
                                <Link
                                    to="/"
                                    className="inline-flex items-center justify-center px-6 py-3 bg-brand-primary text-white font-semibold rounded-xl hover:bg-brand-primary-hover transition-colors shadow-lg shadow-brand-primary/20 text-sm"
                                >
                                    Browse Messes
                                </Link>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {rooms.map(room => (
                                    <RoomCard
                                        key={room.id}
                                        room={room}
                                        isWishlisted={isRoomWishlisted(room.id)}
                                        onToggleWishlist={toggleRoomWishlist}
                                    />
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default Wishlist;

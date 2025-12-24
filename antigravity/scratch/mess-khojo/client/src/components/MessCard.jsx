import React, { useState, useEffect } from 'react';
import { MapPin, Phone, ArrowRight, BedDouble, Briefcase, Info } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { storage, auth, db } from '../firebase';
import { ref, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, query, getDocs, where } from 'firebase/firestore';

const MessCard = ({ mess, index }) => {
    const [imageUrl, setImageUrl] = useState(null);

    useEffect(() => {
        const resolveImageUrl = async () => {
            if (!mess.posterUrl) {
                setImageUrl(null);
                return;
            }

            // 1. Block unsupported formats (HEIC) immediately to prevent browser errors
            if (mess.posterUrl.toLowerCase().includes('.heic')) {
                console.warn("HEIC format not supported in browsers:", mess.name);
                setImageUrl(null);
                return;
            }

            const extractPathFromUrl = (url) => {
                try {
                    if (url.includes('/o/')) {
                        const pathSection = url.split('/o/')[1].split('?')[0];
                        return decodeURIComponent(pathSection);
                    }
                } catch (e) { return null; }
                return null;
            };

            let finalUrl = mess.posterUrl;

            try {
                // 2. If it's already a Firebase URL, try to refresh the token by verifying the path exists
                const storagePath = extractPathFromUrl(mess.posterUrl);

                if (storagePath) {
                    finalUrl = await getDownloadURL(ref(storage, storagePath));
                }
                // 3. If it's a raw path (not a URL), fetch the URL
                else if (!mess.posterUrl.startsWith('http')) {
                    finalUrl = await getDownloadURL(ref(storage, mess.posterUrl));
                }

                // If we got here, we have a potentially valid URL
                setImageUrl(finalUrl);

            } catch (error) {
                // If SDK fails (object not found), fallback gracefully without setting broken src
                console.log("Could not resolve image:", error.code);
                setImageUrl(null);
            }
        };

        resolveImageUrl();
    }, [mess.posterUrl]);




    return (
        <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, type: "spring", stiffness: 100, damping: 20 }}
            className="uiverse-card flex flex-col h-full"
        >
            <Link to={`/mess/${mess.id}`} className="block h-full flex flex-col">
                {/* Poster Image (Optional - reduced height to fit style) */}
                <div className="h-44 rounded-2xl overflow-hidden mb-4 relative shadow-sm">
                    {imageUrl ? (
                        <img
                            src={imageUrl}
                            alt={mess.name}
                            className="w-full h-full object-cover"
                            onError={() => setImageUrl(null)}
                        />
                    ) : (
                        <div className="w-full h-full bg-brand-light-gray flex items-center justify-center text-brand-primary">
                            <span className="text-4xl drop-shadow-md">🏡</span>
                        </div>
                    )}

                    {/* Filter Match Badge */}
                    {mess.isFiltered && (
                        <div className="absolute top-2 left-2 bg-brand-accent-green px-2 py-1 rounded-lg text-xs font-bold text-white shadow-sm">
                            {mess.matchingBeds > 0 ? `${mess.matchingBeds} Beds` : 'No Match'}
                        </div>
                    )}

                    {/* User Sourced Badge */}
                    {mess.isUserSourced && (
                        <div className="absolute top-2 right-2 bg-brand-amber px-2 py-1 rounded-lg text-[10px] font-bold text-brand-text-dark shadow-sm flex items-center gap-1">
                            <Info size={10} /> USER SOURCED
                        </div>
                    )}
                </div>

                <div className="flex flex-col gap-2 flex-grow">
                    {/* Header */}
                    <div>
                        <h3 className="uiverse-header-title mb-1 line-clamp-1">{mess.name}</h3>
                        <div className="flex items-center gap-1 uiverse-header-subtitle">
                            <MapPin size={12} className="opacity-60" />
                            <span className="truncate">{mess.address || "No information"}</span>
                        </div>
                    </div>

                    {/* Content (Contact) */}
                    <div className="mt-2 flex items-center gap-2 uiverse-header-subtitle">
                        <Phone size={12} />
                        <span>{mess.contact || "No information"}</span>
                    </div>
                </div>

                {/* Footer / Bottom Actions */}
                <div className="mt-4 flex items-end justify-between">
                    {/* View Details Button - Now on LEFT and LARGER */}
                    <div className="uiverse-badge text-base px-6 py-2.5">
                        View Details
                    </div>

                    {/* Distance - Now on RIGHT and SMALLER */}
                    <div>
                        {typeof mess.distance === 'number' && isFinite(mess.distance) ? (
                            <div className="text-lg font-bold text-brand-primary flex items-baseline">
                                {mess.distance < 1 ? Math.round(mess.distance * 1000) : mess.distance.toFixed(1)}
                                <span className="text-xs ml-1 opacity-60 font-normal">{mess.distance < 1 ? 'm' : 'km'}</span>
                            </div>
                        ) : (
                            <div className="text-lg font-bold text-brand-primary opacity-50">--</div>
                        )}
                    </div>
                </div>


            </Link>
        </motion.div>
    );
};

export default MessCard;

import React, { useState, useEffect, memo } from 'react';
import { MapPin, Phone, ArrowRight, BedDouble, Briefcase, Info } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { storage, auth, db } from '../firebase';
import { ref, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, query, getDocs, where } from 'firebase/firestore';

const MessCard = memo(({ mess, index }) => {
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
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            whileHover={{
                y: -6,
                scale: 1.01,
                transition: { duration: 0.2, ease: "easeOut" }
            }}
            className="uiverse-card flex flex-col h-full group bg-gradient-to-br from-white via-white to-purple-50/50"
            style={{ willChange: "transform" }}
        >
            <Link to={`/mess/${mess.id}`} className="block h-full flex flex-col">
                {/* Poster Image (Optional - reduced height to fit style) */}
                <div className="w-full aspect-[16/9] rounded-2xl overflow-hidden mb-2 relative shadow-sm bg-gray-100">
                    {imageUrl ? (
                        <>
                            <img
                                src={imageUrl}
                                alt={mess.name}
                                className="w-full h-full object-cover"
                                loading="lazy"
                                onError={() => setImageUrl(null)}
                            />
                            {/* Gradient Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none"></div>
                        </>
                    ) : (
                        <div className="w-full h-full bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] animate-[shimmer_2s_ease-in-out_infinite] flex items-center justify-center text-brand-primary">
                            <span className="text-4xl drop-shadow-md">🏡</span>
                        </div>
                    )}



                    {/* Filter Match Badge - Only show when there are matching beds */}
                    {mess.isFiltered && mess.matchingBeds > 0 && (
                        <div className="absolute top-2 left-2 bg-brand-accent-green px-2 py-0.5 rounded-md text-[10px] font-bold text-white shadow-md">
                            Available
                        </div>
                    )}

                    {/* User Sourced Badge */}
                    {mess.isUserSourced && (
                        <div className="absolute top-2 right-2 bg-brand-amber px-1.5 py-0.5 rounded-md text-[9px] font-bold text-brand-text-dark shadow-md flex items-center gap-0.5">
                            <Info size={9} /> USER SOURCED
                        </div>
                    )}
                </div>

                <div className="flex flex-col gap-1.5 flex-grow">
                    {/* Header */}
                    <div>
                        <h3 className="text-lg font-bold text-brand-text-dark mb-1 line-clamp-1 leading-tight">{mess.name}</h3>
                        <div className="flex items-center gap-1.5 text-sm text-gray-600">
                            <MapPin size={14} className="text-gray-400 flex-shrink-0" />
                            <span className="truncate">{mess.address || "No information"}</span>
                        </div>
                    </div>

                    {/* Content (Contact) */}
                    <div className="flex items-center gap-1.5 text-sm text-gray-600">
                        <Phone size={14} className="text-gray-400 flex-shrink-0" />
                        <span className="truncate">{mess.hideContact ? "Not Available" : (mess.contact || "No information")}</span>
                    </div>
                </div>

                {/* Footer / Bottom Actions */}
                <div className="mt-2 flex items-end justify-between">
                    {/* View Details Button - Option 3: Sleek Circular Arrow */}
                    <div className="w-10 h-10 rounded-full bg-brand-light-gray flex items-center justify-center text-brand-primary transition-all duration-300 group-hover:bg-brand-primary group-hover:text-white group-hover:scale-110 shadow-sm ml-auto">
                        <ArrowRight size={20} strokeWidth={2.5} />
                    </div>

                    {/* Distance - Hidden for now */}
                    {/* <div>
                        {typeof mess.distance === 'number' && isFinite(mess.distance) ? (
                            <div className="text-base sm:text-lg font-bold text-brand-primary flex items-baseline">
                                {mess.distance < 1 ? Math.round(mess.distance * 1000) : mess.distance.toFixed(1)}
                                <span className="text-[10px] ml-0.5 opacity-60 font-normal">{mess.distance < 1 ? 'm' : 'km'}</span>
                            </div>
                        ) : (
                            <div className="text-base sm:text-lg font-bold text-brand-primary opacity-50">--</div>
                        )}
                    </div> */}
                </div>


            </Link>
        </motion.div>
    );
});

MessCard.displayName = 'MessCard';

export default MessCard;

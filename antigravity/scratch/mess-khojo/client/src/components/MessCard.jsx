import React, { useState, useEffect, memo } from 'react';
import PropTypes from 'prop-types';
import { MapPin, ArrowRight, Info, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { storage } from '../firebase';
import { ref, getDownloadURL } from 'firebase/storage';

const MessCard = memo(({ mess, isWishlisted = false, onToggleWishlist }) => {
    const [imageUrl, setImageUrl] = useState(null);
    const [imgLoading, setImgLoading] = useState(true);

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

            // If already a full HTTP URL, use it directly — no SDK call needed
            if (mess.posterUrl.startsWith('https://') || mess.posterUrl.startsWith('http://')) {
                setImageUrl(mess.posterUrl);
                return;
            }

            try {
                const finalUrl = await getDownloadURL(ref(storage, mess.posterUrl));
                setImageUrl(finalUrl);
            } catch (error) { // eslint-disable-line no-unused-vars
                // If SDK fails (object not found), fallback gracefully
                setImageUrl(null);
            }
        };

        resolveImageUrl();
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
                                className={`w-full h-full object-cover transition-opacity duration-500 ${imgLoading ? 'opacity-0' : 'opacity-100'}`}
                                loading="lazy"
                                decoding="async"
                                width={400}
                                height={225}
                                onLoad={() => setImgLoading(false)}
                                onError={() => setImageUrl(null)}
                            />
                            {imgLoading && <div className="absolute inset-0 skeleton-shimmer"></div>}
                            {/* Gradient Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none"></div>
                        </>
                    ) : (
                        <div className="w-full h-full bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] animate-[shimmer_2s_ease-in-out_infinite] flex items-center justify-center text-brand-primary">
                            <span className="text-4xl drop-shadow-md">🏡</span>
                        </div>
                    )}

                    {/* Wishlist Heart Button */}
                    {onToggleWishlist && (
                        <button
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleWishlist(mess.id); }}
                            className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-all active:scale-90 ${isWishlisted
                                    ? 'bg-red-500 text-white'
                                    : 'bg-white/80 backdrop-blur-sm text-gray-500 hover:text-red-500'
                                }`}
                            title={isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
                        >
                            <Heart size={15} fill={isWishlisted ? 'currentColor' : 'none'} strokeWidth={2} />
                        </button>
                    )}


                    {mess.isFiltered && mess.matchingBeds > 0 && (
                        <div className="absolute top-2 left-2 bg-brand-accent-green px-2 py-0.5 rounded-md text-[10px] font-bold text-white shadow-md">
                            Available
                        </div>
                    )}


                </div>

                <div className="flex flex-col gap-1.5 flex-grow">
                    {/* Header */}
                    <div>
                        <div className="mb-1">
                            <h3 className="text-lg font-bold text-brand-text-dark line-clamp-1 leading-tight">{mess.name}</h3>
                        </div>
                        <div className="flex items-center gap-1.5 text-sm text-gray-600">
                            <MapPin size={14} className="text-gray-400 flex-shrink-0" />
                            <span className="truncate">{mess.address || "No information"}</span>
                        </div>
                    </div>

                    {/* Content (Contact) */}
                    {/* Price Range */}
                    <div className="flex items-center gap-1.5 min-h-[24px]">
                        {mess.minPrice && mess.maxPrice ? (
                            <div className="flex items-baseline gap-1 text-brand-primary">
                                <span className="text-base font-bold">
                                    ₹{mess.minPrice}
                                </span>
                                {mess.minPrice !== mess.maxPrice && (
                                    <>
                                        <span className="text-sm text-gray-600 font-bold px-1 self-center">–</span>
                                        <span className="text-base font-bold">
                                            {mess.maxPrice}
                                        </span>
                                    </>
                                )}
                                <span className="text-[10px] text-gray-500 font-medium">
                                    {mess.rentCycle === 'yearly' ? '/yr' : '/mo'}
                                </span>
                                {mess.minStayDuration && mess.minStayDuration >= 12 && (
                                    <span className="text-[9px] md:text-[10px] font-extrabold text-indigo-600 bg-indigo-50 border border-indigo-100/50 px-1.5 py-0.5 rounded shadow-sm self-center ml-2">
                                        ⏱️ 1-Yr Stay
                                    </span>
                                )}
                            </div>
                        ) : null}
                    </div>
                </div>

                {/* Footer / Bottom Actions */}
                <div className="mt-2 flex items-center justify-between">
                    {/* User Sourced Badge */}
                    {mess.isUserSourced ? (
                        <div className="bg-brand-amber text-white px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 shadow-sm">
                            <Info size={12} /> USER SOURCED
                        </div>
                    ) : (
                        <div></div>
                    )}

                    {/* View Details Button - Option 3: Sleek Circular Arrow */}
                    <div className="w-10 h-10 rounded-full bg-brand-light-gray flex items-center justify-center text-brand-primary transition-all duration-300 group-hover:bg-brand-primary group-hover:text-white group-hover:scale-110 shadow-sm ml-auto">
                        <ArrowRight size={20} strokeWidth={2.5} />
                    </div>


                </div>


            </Link>
        </motion.div>
    );
});

MessCard.propTypes = {
    mess: PropTypes.shape({
        id: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        address: PropTypes.string,
        posterUrl: PropTypes.string,
        galleryUrls: PropTypes.arrayOf(PropTypes.string),
        images: PropTypes.arrayOf(PropTypes.string),
        isUserSourced: PropTypes.bool,
        isFiltered: PropTypes.bool,
        matchingBeds: PropTypes.number,
        minPrice: PropTypes.number,
        maxPrice: PropTypes.number,
        rentCycle: PropTypes.string,
        minStayDuration: PropTypes.number
    }).isRequired,
    isWishlisted: PropTypes.bool,
    onToggleWishlist: PropTypes.func
};

MessCard.displayName = 'MessCard';

export default MessCard;

import React from 'react';

const SkeletonCard = () => {
    return (
        <div className="uiverse-card flex flex-col h-full animate-pulse">
            {/* Image Skeleton */}
            <div className="w-full aspect-[16/9] rounded-2xl overflow-hidden mb-3 relative bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-shimmer bg-[length:200%_100%]">
            </div>

            <div className="flex flex-col gap-2 flex-grow">
                {/* Title Skeleton */}
                <div className="h-6 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded-lg w-3/4"></div>

                {/* Address Skeleton */}
                <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded-lg w-full"></div>

                {/* Contact Skeleton */}
                <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded-lg w-2/3 mt-2"></div>
            </div>

            {/* Footer Skeleton */}
            <div className="mt-4 flex items-end justify-between">
                <div className="h-10 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded-xl w-32"></div>
                <div className="h-6 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded-lg w-12"></div>
            </div>
        </div>
    );
};

export default SkeletonCard;

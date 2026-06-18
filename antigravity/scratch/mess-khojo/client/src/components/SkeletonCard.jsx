import React from 'react';

const SkeletonCard = ({ index = 0, layout = 'grid', compact = false }) => {
    const delay = `${index * 80}ms`;

    if (compact) {
        return (
            <div
                className="flex flex-col gap-2 w-full animate-pulse"
                style={{ animationDelay: delay }}
            >
                <div className="w-full aspect-[4/3] rounded-2xl bg-gray-200 shrink-0" />
                <div className="flex flex-col gap-2 flex-grow">
                    <div className="h-4 w-3/4 bg-gray-200 rounded-md" />
                    <div className="h-3.5 w-1/2 bg-gray-200 rounded-md" />
                    <div className="h-4 w-1/3 bg-gray-200 rounded-md mt-1" />
                </div>
            </div>
        );
    }

    if (layout === 'horizontal') {
        return (
            <div
                className="bg-white rounded-3xl p-3 border border-gray-100/80 shadow-[0_4px_16px_rgba(0,0,0,0.02)] flex gap-4 w-full animate-pulse"
                style={{ animationDelay: delay }}
            >
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gray-200 shrink-0" />
                <div className="flex flex-col justify-between flex-grow py-0.5">
                    <div>
                        <div className="h-5 w-3/4 bg-gray-200 rounded-md" />
                        <div className="h-4 w-1/2 bg-gray-200 rounded-md mt-2" />
                    </div>
                    <div className="h-4 w-1/3 bg-gray-200 rounded-md mt-2" />
                </div>
            </div>
        );
    }

    return (
        <div
            className="skeleton-card"
            style={{ animationDelay: delay }}
        >
            {/* Image area — matches MessCard aspect-[16/9] */}
            <div className="skeleton-image skeleton-shimmer" />

            {/* Content body */}
            <div className="skeleton-body">
                {/* Title — matches h3 font-bold */}
                <div className="skeleton-shimmer skeleton-title" />

                {/* Address row — matches MapPin + address */}
                <div className="skeleton-shimmer skeleton-address" />

                {/* Price — matches ₹price text */}
                <div className="skeleton-shimmer skeleton-price" />
            </div>

            {/* Footer row — matches badge + arrow button */}
            <div className="skeleton-footer">
                <div className="skeleton-shimmer skeleton-badge" />
                <div className="skeleton-shimmer skeleton-arrow" />
            </div>
        </div>
    );
};

export default SkeletonCard;

import React from 'react';

const SkeletonCard = ({ index = 0 }) => {
    const delay = `${index * 80}ms`;

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

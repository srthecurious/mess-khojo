import React from 'react';

const BookingsOverviewTab = ({
    bookings,
    bookingRemarks,
    setBookingRemarks,
    bookingActionLoading,
    handleUpdateBookingStatus
}) => {
    return (
        <div className="mt-12 mb-8 border-t border-brand-light-gray pt-8">
            <h2 className="text-2xl font-bold mb-6 text-brand-text-dark flex items-center gap-3">
                Booking Requests
                {bookings.filter(b => b.status === 'pending').length > 0 && (
                    <span className="text-sm font-normal bg-brand-primary text-white px-3 py-1 rounded-full">
                        {bookings.filter(b => b.status === 'pending').length} New
                    </span>
                )}
            </h2>

            {bookings.length === 0 ? (
                <div className="bg-white p-8 rounded-xl text-center border-2 border-dashed border-gray-200 text-gray-400">
                    <p>No booking requests yet.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {bookings.map(booking => (
                        <div key={booking.id} className="bg-white p-5 rounded-xl shadow-sm border border-brand-light-gray flex flex-col md:flex-row justify-between gap-4">
                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <h3 className="font-bold text-lg text-brand-text-dark">{booking.userName || 'Unknown User'}</h3>
                                    <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                                        booking.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                            'bg-yellow-100 text-yellow-700'
                                        }`}>
                                        {booking.status}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-600 mb-2">📞 {booking.userPhone}</p>
                                <div className="flex items-center gap-4 text-sm text-gray-500">
                                    <span>🛏. {({
                                        'Single': '1',
                                        'Double': '2',
                                        'Triple': '3',
                                        'Four': '4',
                                        'Five': '5',
                                        'Six': '6'
                                    })[booking.roomType] || booking.roomType} Seater</span>
                                    <span>💰 ₹{booking.price}{booking.rentCycle === 'yearly' ? '/yr' : '/mo'}</span>
                                    <span>📅 {booking.createdAt ? new Date(booking.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}</span>
                                </div>
                            </div>

                            {booking.status === 'pending' && (
                                <div className="flex flex-col gap-2 min-w-[200px]">
                                    <textarea
                                        placeholder="Remark (optional)"
                                        value={bookingRemarks[booking.id] || ''}
                                        onChange={(e) => setBookingRemarks(prev => ({ ...prev, [booking.id]: e.target.value }))}
                                        className="w-full px-3 py-1.5 border border-brand-light-gray rounded-lg text-sm focus:ring-1 focus:ring-brand-primary outline-none resize-none h-16"
                                    />
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleUpdateBookingStatus(booking.id, 'confirmed')}
                                            disabled={!!bookingActionLoading[booking.id]}
                                            className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-green-300 disabled:cursor-not-allowed text-white rounded-lg font-medium shadow-sm transition-colors text-sm"
                                        >
                                            {bookingActionLoading[booking.id] ? '...' : 'Approve'}
                                        </button>
                                        <button
                                            onClick={() => handleUpdateBookingStatus(booking.id, 'rejected')}
                                            disabled={!!bookingActionLoading[booking.id]}
                                            className="flex-1 px-4 py-2 bg-red-50 hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed text-red-600 rounded-lg font-medium transition-colors text-sm"
                                        >
                                            {bookingActionLoading[booking.id] ? '...' : 'Reject'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {booking.status !== 'pending' && booking.remark && (
                                <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-100 text-xs text-gray-500 italic md:max-w-xs">
                                    Remark: {booking.remark}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default BookingsOverviewTab;

/**
 * Telegram Bot Notification System
 * 
 * Sends real-time notifications to operator via Telegram Bot
 * Free, instant, and reliable notification delivery
 */

/**
 * Send notification to Telegram
 * Uses Netlify Function in production for security
 * Uses direct API in development for testing
 * @param {string} message - The message to send (supports HTML formatting)
 * @returns {Promise<boolean>} - Success status
 */
// Escape special HTML characters to prevent Telegram parse errors
const esc = (str) => String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export const sendTelegramNotification = async (message) => {
    try {
        const response = await fetch('/.netlify/functions/send-telegram', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message })
        });
        if (!response.ok) {
            console.error('Telegram notification failed with status:', response.status);
        }
        return response.ok;
    } catch (error) {
        // In local dev without Netlify CLI, the function endpoint won't exist.
        // Log a warning and fail silently — notifications are non-critical.
        if (import.meta.env.DEV) {
            console.warn('Telegram notification skipped (Netlify Functions not available in local dev). Run `netlify dev` to test notifications.');
        } else {
            console.error('Telegram notification error:', error);
        }
        return false;
    }
};

/**
 * Notification templates with HTML formatting for different event types
 */
export const telegramTemplates = {
    /**
     * New booking notification
     */
    newBooking: (booking) => {
        const time = new Date().toLocaleString('en-IN', {
            timeZone: 'Asia/Kolkata',
            dateStyle: 'medium',
            timeStyle: 'short'
        });

        return `📞 <b>OWNER CONTACTED!</b>\n\n` +
            `🏢 <b>Mess:</b> ${booking.messName}\n` +
            `🛏️ <b>Room:</b> ${booking.roomType}\n` +
            `👤 <b>User:</b> ${booking.userName}\n` +
            `📱 <b>User Phone:</b> ${booking.userPhone}\n` +
            `💰 <b>Price:</b> ₹${booking.price}/month\n\n` +
            `ℹ️ <i>User has been given the owner's contact number to call directly.</i>\n\n` +
            `⏰ <i>${time}</i>\n\n` +
            `<a href="${window.location.origin}/operational">📊 View Dashboard</a>`;
    },

    /**
     * New mess registration notification
     */
    newRegistration: (registration) => {
        const time = new Date().toLocaleString('en-IN', {
            timeZone: 'Asia/Kolkata',
            dateStyle: 'medium',
            timeStyle: 'short'
        });

        let rentDetails = '';
        if (registration.rentInfo && Object.keys(registration.rentInfo).length > 0) {
            rentDetails = '\\n💰 <b>Rent Info:</b>\\n' + Object.entries(registration.rentInfo).map(([room, rent]) => `  - ${room}: ₹${rent}`).join('\\n');
        }

        let inclusions = '';
        if (registration.includedInRent && registration.includedInRent.length > 0) {
            inclusions = `\\n✅ <b>Included:</b> ${registration.includedInRent.join(', ')}`;
        }

        let advanceInfo = '';
        if (registration.advancePayment && registration.advancePayment.type) {
            advanceInfo = `\\n💳 <b>Advance:</b> ${registration.advancePayment.type === 'Custom Amount' ? `₹${registration.advancePayment.customAmount}` : registration.advancePayment.type}`;
        }

        let maintenanceInfo = '';
        if (registration.maintenanceCharge?.taken) {
            maintenanceInfo = `\\n🔧 <b>Maintenance:</b> ₹${registration.maintenanceCharge.amount} (${registration.maintenanceCharge.frequency})`;
        }

        let vacantInfo = '';
        if (registration.vacantRooms && registration.vacantRooms.length > 0) {
            vacantInfo = `\\n🛏️ <b>Vacant:</b> ${registration.vacantRooms.join(', ')}`;
        }

        const messTypeStr = Array.isArray(registration.messType) ? registration.messType.join(', ') : (registration.messType || 'Not specified');

        return `🏢 <b>NEW MESS REGISTRATION!</b>\\n\\n` +
            `📍 <b>Mess:</b> ${registration.messName || 'Not provided'}\\n` +
            `📞 <b>Contact:</b> ${registration.phoneNumber || registration.contactNumber || 'Not provided'}\\n` +
            `🏷️ <b>Type:</b> ${messTypeStr}` +
            rentDetails + inclusions + advanceInfo + maintenanceInfo + vacantInfo + `\\n\\n` +
            `⏰ <i>${time}</i>\\n\\n` +
            `<a href="${window.location.origin}/operational">📊 View Dashboard</a>`;
    },

    /**
     * New listing claim notification
     */
    newClaim: (claim) => {
        const time = new Date().toLocaleString('en-IN', {
            timeZone: 'Asia/Kolkata',
            dateStyle: 'medium',
            timeStyle: 'short'
        });

        return `📋 <b>NEW LISTING CLAIM!</b>\n\n` +
            `🏢 <b>Mess:</b> ${claim.messName}\n` +
            `👤 <b>Claimant:</b> ${claim.userName}\n` +
            `📧 <b>Email:</b> ${claim.userEmail}\n` +
            `📱 <b>Phone:</b> ${claim.userPhone}\n\n` +
            `⏰ <i>${time}</i>\n\n` +
            `<a href="${window.location.origin}/operational">📊 View Dashboard</a>`;
    },

    /**
     * New general inquiry notification
     */
    newInquiry: (inquiry) => {
        const time = new Date().toLocaleString('en-IN', {
            timeZone: 'Asia/Kolkata',
            dateStyle: 'medium',
            timeStyle: 'short'
        });

        const messagePreview = inquiry.message
            ? inquiry.message.substring(0, 100) + (inquiry.message.length > 100 ? '...' : '')
            : 'No message';

        return `❓ <b>NEW INQUIRY!</b>\n\n` +
            `🏢 <b>Mess:</b> ${inquiry.messName || 'General Inquiry'}\n` +
            `👤 <b>Name:</b> ${inquiry.name}\n` +
            `📱 <b>Phone:</b> ${inquiry.phone}\n` +
            `💬 <b>Message:</b> ${messagePreview}\n\n` +
            `⏰ <i>${time}</i>\n\n` +
            `<a href="${window.location.origin}/operational">📊 View Dashboard</a>`;
    },

    /**
     * New room inquiry notification
     */
    newRoomInquiry: (inquiry) => {
        const time = new Date().toLocaleString('en-IN', {
            timeZone: 'Asia/Kolkata',
            dateStyle: 'medium',
            timeStyle: 'short'
        });

        return `🛏️ <b>NEW ROOM INQUIRY!</b>\n\n` +
            `👤 <b>Name:</b> ${esc(inquiry.name)}\n` +
            `📱 <b>Phone:</b> ${esc(inquiry.phone)}\n` +
            `🚻 <b>Gender:</b> ${esc(inquiry.gender)}\n` +
            `📍 <b>Location:</b> ${esc(inquiry.location)}\n` +
            `💰 <b>Budget:</b> ${esc(inquiry.budget)}\n` +
            `👥 <b>Occupancy:</b> ${esc(inquiry.occupancy)}\n` +
            `📅 <b>Move-in:</b> ${esc(inquiry.expectedMoveIn)}\n` +
            `${inquiry.contactMethod ? `📞 <b>Prefer:</b> ${esc(inquiry.contactMethod).toUpperCase()}\n` : ''}` +
            `${inquiry.requirements ? `📝 <b>Requirements:</b> ${esc(inquiry.requirements).substring(0, 80)}\n` : ''}` +
            `\n⏰ <i>${time}</i>\n\n` +
            `<a href="${window.location.origin}/operational">📊 View Dashboard</a>`;
    },

    /**
     * New feedback notification
     */
    newFeedback: (feedback) => {
        const time = new Date().toLocaleString('en-IN', {
            timeZone: 'Asia/Kolkata',
            dateStyle: 'medium',
            timeStyle: 'short'
        });

        const messagePreview = feedback.message
            ? feedback.message.substring(0, 150) + (feedback.message.length > 150 ? '...' : '')
            : 'No message';

        // Create star rating display
        const ratingStars = feedback.rating
            ? '⭐'.repeat(feedback.rating) + '☆'.repeat(5 - feedback.rating) + ` (${feedback.rating}/5)`
            : 'Not rated';

        return `💬 <b>NEW USER FEEDBACK!</b>\n\n` +
            `👤 <b>User:</b> ${feedback.userName || 'Anonymous'}\n` +
            `📧 <b>Email:</b> ${feedback.userEmail || 'Not provided'}\n` +
            `⭐ <b>Rating:</b> ${ratingStars}\n` +
            `📝 <b>Type:</b> ${feedback.type || 'General'}\n` +
            `💬 <b>Feedback:</b>\n${messagePreview}\n\n` +
            `⏰ <i>${time}</i>\n\n` +
            `<a href="${window.location.origin}/operational">📊 View Dashboard</a>`;
    },
};

/**
 * Test function to verify Telegram setup
 */
export const testTelegramNotification = async () => {
    const testMessage = `✅ <b>Telegram Bot Test</b>\n\n` +
        `Your MessKhojo notification system is working!\n\n` +
        `You will now receive instant alerts for:\n` +
        `• New bookings\n` +
        `• Mess registrations\n` +
        `• Claims & inquiries\n` +
        `• User feedback\n\n` +
        `<i>Time: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</i>`;

    return await sendTelegramNotification(testMessage);
};

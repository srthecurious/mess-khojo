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
export const sendTelegramNotification = async (message) => {
    // In production, use the secure Netlify Function
    if (!import.meta.env.DEV) {
        try {
            const response = await fetch('/.netlify/functions/send-telegram', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message })
            });
            if (!response.ok) {
                console.error('Netlify Function call failed with status:', response.status);
                // Optionally, parse response body for more details if the function returns error messages
                // const errorData = await response.json();
                // console.error('Netlify Function error details:', errorData);
            } else {
                console.log('✅ Telegram notification sent via Netlify Function successfully');
            }
            return response.ok;
        } catch (error) {
            console.error('Netlify Function Error:', error);
            return false;
        }
    }

    // In development, keep using direct API (fallback)
    const botToken = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
    const chatId = import.meta.env.VITE_TELEGRAM_CHAT_ID;

    // Skip if credentials not configured (prevents errors during setup)
    if (!botToken || !chatId) {
        console.warn('Telegram notifications not configured. Add VITE_TELEGRAM_BOT_TOKEN and VITE_TELEGRAM_CHAT_ID to .env');
        return false;
    }

    try {
        const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: chatId,
                text: message,
                parse_mode: 'HTML', // Allows <b>, <i>, <a> tags for formatting
                disable_web_page_preview: true, // Don't show link previews
            }),
        });

        const result = await response.json();

        if (!result.ok) {
            console.error('Telegram send failed:', result);
            return false;
        }

        console.log('✅ Telegram notification sent successfully');
        return true;
    } catch (error) {
        console.error('❌ Telegram notification error:', error);
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

        return `🆕 <b>NEW BOOKING ALERT!</b>\n\n` +
            `🏢 <b>Mess:</b> ${booking.messName}\n` +
            `🛏️ <b>Room:</b> ${booking.roomType}\n` +
            `👤 <b>User:</b> ${booking.userName}\n` +
            `📱 <b>Phone:</b> ${booking.userPhone}\n` +
            `💰 <b>Price:</b> ₹${booking.price}/month\n\n` +
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

        return `🏢 <b>NEW MESS REGISTRATION!</b>\n\n` +
            `📍 <b>Mess:</b> ${registration.messName}\n` +
            `👤 <b>Owner:</b> ${registration.ownerName}\n` +
            `📞 <b>Contact:</b> ${registration.contactNumber}\n` +
            `📧 <b>Email:</b> ${registration.email || 'Not provided'}\n` +
            `🏷️ <b>Type:</b> ${Array.isArray(registration.messType) ? registration.messType.join(', ') : registration.messType}\n\n` +
            `⏰ <i>${time}</i>\n\n` +
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
            `👤 <b>Name:</b> ${inquiry.name}\n` +
            `📱 <b>Phone:</b> ${inquiry.phone}\n` +
            `📍 <b>Location:</b> ${inquiry.location}\n` +
            `💰 <b>Budget:</b> ${inquiry.budget}\n` +
            `👥 <b>Occupancy:</b> ${inquiry.occupancy}\n` +
            `${inquiry.contactMethod ? `📞 <b>Prefer:</b> ${inquiry.contactMethod.toUpperCase()}\n` : ''}` +
            `${inquiry.requirements ? `📝 <b>Requirements:</b> ${inquiry.requirements.substring(0, 80)}...\n` : ''}` +
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

        return `💬 <b>NEW USER FEEDBACK!</b>\n\n` +
            `👤 <b>User:</b> ${feedback.userName || 'Anonymous'}\n` +
            `📧 <b>Email:</b> ${feedback.userEmail || 'Not provided'}\n` +
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

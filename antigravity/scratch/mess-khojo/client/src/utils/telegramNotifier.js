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

        const roomLabel = booking.roomType || 'General Inquiry';
        const priceLabel = booking.price ? `₹${booking.price}/${booking.rentCycle === 'yearly' ? 'year' : 'month'}` : 'N/A';

        return `📞 <b>USER CONTACTED OWNER!</b>\n\n` +
            `🏢 <b>Mess:</b> ${esc(booking.messName)}\n` +
            `🛏️ <b>Inquiring Occupancy:</b> ${esc(roomLabel)}\n` +
            `👤 <b>User Name:</b> ${esc(booking.userName)}\n` +
            `📱 <b>User Phone:</b> ${esc(booking.userPhone)}\n` +
            `💰 <b>Price / Rent:</b> ${esc(priceLabel)}\n\n` +
            `ℹ️ <i>User contacted the mess owner directly via phone call.</i>\n\n` +
            `⏰ <i>${time}</i>\n\n` +
            `<a href="${window.location.origin}/operational">📊 View Operational Dashboard</a>`;
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

        const messTypeStr = Array.isArray(registration.messType) ? registration.messType.join(', ') : (registration.messType || 'Not specified');

        let locDetails = '';
        const locParts = [registration.address, registration.locality || registration.landmark, registration.city, registration.district].filter(Boolean);
        if (locParts.length > 0) {
            locDetails = `\n📍 <b>Location:</b> ${esc(locParts.join(', '))}`;
        }

        let bedInfo = '';
        if (registration.totalBeds || registration.totalRooms) {
            bedInfo = `\n🛏️ <b>Total Beds:</b> ${registration.totalBeds || registration.totalRooms}`;
        }

        let foodInfo = '';
        if (registration.foodAvailability || registration.managedBy) {
            foodInfo = `\n🍲 <b>Food:</b> ${esc(registration.foodAvailability || 'Available')} (Managed by: ${esc(registration.managedBy || 'Owner')})`;
            if (registration.mealsPerDay || registration.foodType) {
                foodInfo += ` [${[registration.mealsPerDay, registration.foodType].filter(Boolean).join(', ')}]`;
            }
        }

        let livingServices = '';
        const services = [];
        if (registration.waterFacility) services.push(`Water: ${registration.waterFacility}`);
        if (registration.laundryFacility) services.push(`Laundry: ${registration.laundryFacility}`);
        if (registration.cleaningService) services.push(`Cleaning: ${registration.cleaningService}`);
        if (services.length > 0) {
            livingServices = `\n🧼 <b>Services:</b> ${esc(services.join(' | '))}`;
        }

        let rentDetails = '';
        if (registration.roomVariants && Object.keys(registration.roomVariants).length > 0) {
            rentDetails = '\n💰 <b>Room Variants:</b>\n' + Object.entries(registration.roomVariants).map(([room, vars]) => {
                if (Array.isArray(vars)) {
                    return `  - ${room}: ` + vars.map(v => `${v.label || 'Standard'} (₹${v.price})`).join(', ');
                }
                return `  - ${room}`;
            }).join('\n');
        } else if (registration.rentInfo && Object.keys(registration.rentInfo).length > 0) {
            rentDetails = '\n💰 <b>Rent Info:</b>\n' + Object.entries(registration.rentInfo).map(([room, rent]) => `  - ${room}: ₹${rent}`).join('\n');
        }

        let inclusions = '';
        if (registration.includedInRent && registration.includedInRent.length > 0) {
            inclusions = `\n✅ <b>Included:</b> ${registration.includedInRent.join(', ')}`;
        }

        let advanceInfo = '';
        const advType = registration.advancePayment?.type || (typeof registration.advancePayment === 'string' ? registration.advancePayment : '');
        if (advType && advType !== 'None' && advType !== 'No Advance') {
            advanceInfo = `\n💳 <b>Advance:</b> ${advType === 'Custom' || advType === 'Custom Amount' ? `₹${registration.advancePayment?.customAmount || registration.advancePaymentCustom || ''}` : advType}`;
        }

        let securityInfo = '';
        if (registration.securityDeposit && registration.securityDeposit !== 'No Deposit') {
            securityInfo = `\n🔒 <b>Security:</b> ${registration.securityDeposit === 'Custom' ? `₹${registration.securityDepositCustom || ''}` : registration.securityDeposit}`;
        }

        let maintenanceInfo = '';
        if (registration.maintenanceCharge?.taken || registration.maintenanceFee === 'Extra Charge') {
            maintenanceInfo = `\n🔧 <b>Maintenance:</b> ₹${registration.maintenanceCharge?.amount || registration.maintenanceFeeAmount || ''}`;
        }

        let extraDetails = '';
        if (registration.noticePeriod) {
            extraDetails += `\n⏳ <b>Notice:</b> ${registration.noticePeriod === 'Other' && registration.noticePeriodCustom ? registration.noticePeriodCustom : registration.noticePeriod}`;
        }
        if (registration.operatingSince) {
            extraDetails += `\n📅 <b>Operating Since:</b> ${registration.operatingSince}`;
        }

        let vacantInfo = '';
        if (registration.vacantRooms && registration.vacantRooms.length > 0) {
            vacantInfo = `\n🛏️ <b>Vacant:</b> ${registration.vacantRooms.join(', ')}`;
        }

        return `🏢 <b>NEW MESS REGISTRATION!</b>\n\n` +
            `🏠 <b>Mess:</b> ${esc(registration.messName || 'Not provided')}\n` +
            `📞 <b>Contact:</b> ${esc(registration.phoneNumber || registration.contactNumber || 'Not provided')}\n` +
            `🏷️ <b>Type:</b> ${esc(messTypeStr)}` +
            locDetails + bedInfo + foodInfo + livingServices + rentDetails + inclusions + advanceInfo + securityInfo + maintenanceInfo + extraDetails + vacantInfo + `\n\n` +
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

        const actionText = claim.claimAction === 'change_details' ? 'Change Details' : 'Remove Listing';
        const feedbackText = claim.feedback ? `\n💬 <b>Feedback:</b> ${claim.feedback}` : '';

        return `📋 <b>NEW LISTING CLAIM!</b>\n\n` +
            `🏢 <b>Mess:</b> ${claim.messName}\n` +
            `👤 <b>Claimant:</b> ${claim.claimantName || claim.userName}\n` +
            `👑 <b>Is Owner:</b> ${claim.isOwner ? 'Yes' : 'No'}\n` +
            `⚙️ <b>Requested Action:</b> ${actionText}\n` +
            `📧 <b>Email:</b> ${claim.userEmail}\n` +
            `📱 <b>Phone:</b> ${claim.userPhone}\n` +
            `${feedbackText}\n\n` +
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
            `${inquiry.city ? `🏙️ <b>City:</b> ${esc(inquiry.city === 'baleshwar' ? 'Balasore' : inquiry.city === 'jajpur_road' ? 'Jajpur Road' : inquiry.city === 'jajpur_town' ? 'Jajpur Town' : inquiry.city === 'bhubaneswar' ? 'Bhubaneswar' : inquiry.city === 'khordha_town' ? 'Khordha Town' : inquiry.city.charAt(0).toUpperCase() + inquiry.city.slice(1))}\n` : ''}` +
            `📍 <b>Location:</b> ${esc(inquiry.location)}\n` +
            `💰 <b>Budget:</b> ${esc(inquiry.budget)}\n` +
            `👥 <b>Occupancy:</b> ${esc(inquiry.occupancy)}\n` +
            `📅 <b>Move-in:</b> ${esc(inquiry.expectedMoveIn)}\n` +
            `${inquiry.whatsapp ? `🟢 <b>WhatsApp:</b> ${esc(inquiry.whatsapp)}\n` : ''}` +
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

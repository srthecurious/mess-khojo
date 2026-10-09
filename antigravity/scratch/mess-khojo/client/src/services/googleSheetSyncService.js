import { collection, doc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';
import { getCleanOccupancy } from '../utils/occupancy';

const WEBHOOK_URL = import.meta.env.VITE_GOOGLE_SHEET_WEBHOOK_URL || import.meta.env.VITE_GOOGLE_SHEETS_WEBHOOK_URL || '';
const WEBHOOK_SECRET = import.meta.env.VITE_GOOGLE_SHEET_SECRET || 'mk_sync_secret_2026';

/**
 * Standardized Occupancy Configuration (Tiers 1 to 8 seaters)
 */
export const OCCUPANCY_TYPES = [
    { key: '1', label: 'Single', adminRent: 'Single Bed Rent', adminVac: 'Single Bed Vacancy', currRentKey: 'singleRentCurr', currVacKey: 'singleVacCurr', currRentHeader: 'Single Rent (Curr)', currVacHeader: 'Single Vac (Curr)', newRentHeader: 'Single Rent (New)', newVacHeader: 'Single Vac (New)' },
    { key: '2', label: 'Double', adminRent: 'Double Bed Rent', adminVac: 'Double Bed Vacancy', currRentKey: 'doubleRentCurr', currVacKey: 'doubleVacCurr', currRentHeader: 'Double Rent (Curr)', currVacHeader: 'Double Vac (Curr)', newRentHeader: 'Double Rent (New)', newVacHeader: 'Double Vac (New)' },
    { key: '3', label: 'Triple', adminRent: 'Triple Bed Rent', adminVac: 'Triple Bed Vacancy', currRentKey: 'tripleRentCurr', currVacKey: 'tripleVacCurr', currRentHeader: 'Triple Rent (Curr)', currVacHeader: 'Triple Vac (Curr)', newRentHeader: 'Triple Rent (New)', newVacHeader: 'Triple Vac (New)' },
    { key: '4', label: '4 Seater', adminRent: '4 Bed Rent', adminVac: '4 Bed Vacancy', currRentKey: 'fourRentCurr', currVacKey: 'fourVacCurr', currRentHeader: '4 Bed Rent (Curr)', currVacHeader: '4 Bed Vac (Curr)', newRentHeader: '4 Bed Rent (New)', newVacHeader: '4 Bed Vac (New)' },
    { key: '5', label: '5 Seater', adminRent: '5 Bed Rent', adminVac: '5 Bed Vacancy', currRentKey: 'fiveRentCurr', currVacKey: 'fiveVacCurr', currRentHeader: '5 Bed Rent (Curr)', currVacHeader: '5 Bed Vac (Curr)', newRentHeader: '5 Bed Rent (New)', newVacHeader: '5 Bed Vac (New)' },
    { key: '6', label: '6 Seater', adminRent: '6 Bed Rent', adminVac: '6 Bed Vacancy', currRentKey: 'sixRentCurr', currVacKey: 'sixVacCurr', currRentHeader: '6 Bed Rent (Curr)', currVacHeader: '6 Bed Vac (Curr)', newRentHeader: '6 Bed Rent (New)', newVacHeader: '6 Bed Vac (New)' },
    { key: '7', label: '7 Seater', adminRent: '7 Bed Rent', adminVac: '7 Bed Vacancy', currRentKey: 'sevenRentCurr', currVacKey: 'sevenVacCurr', currRentHeader: '7 Bed Rent (Curr)', currVacHeader: '7 Bed Vac (Curr)', newRentHeader: '7 Bed Rent (New)', newVacHeader: '7 Bed Vac (New)' },
    { key: '8', label: '8 Seater', adminRent: '8 Bed Rent', adminVac: '8 Bed Vacancy', currRentKey: 'eightRentCurr', currVacKey: 'eightVacCurr', currRentHeader: '8 Bed Rent (Curr)', currVacHeader: '8 Bed Vac (Curr)', newRentHeader: '8 Bed Rent (New)', newVacHeader: '8 Bed Vac (New)' }
];

/**
 * Generate a deterministic or sequential task code for a mess.
 * If the mess already has a taskCode in Firestore, reuse it.
 */
export const getTaskCode = (mess, index) => {
    if (mess.taskCode) return mess.taskCode;
    return `MK-${101 + index}`;
};

/**
 * Map rooms of a mess into standardized occupancy slots ('1' to '8' and 'other')
 */
export const mapRoomsToOccupancy = (messRooms = []) => {
    const slots = {
        '1': null,
        '2': null,
        '3': null,
        '4': null,
        '5': null,
        '6': null,
        '7': null,
        '8': null,
        'other': null
    };

    messRooms.forEach(room => {
        const occ = getCleanOccupancy(room.occupancy || room.seater || room.category);
        if (['1', '2', '3', '4', '5', '6', '7', '8'].includes(occ)) {
            if (!slots[occ]) slots[occ] = room;
        } else {
            if (!slots['other']) slots['other'] = room;
        }
    });

    return slots;
};

/**
 * Helper to extract safe numeric or placeholder strings
 */
const safeVal = (val, fallback = '-') => (val !== undefined && val !== null && String(val).trim() !== '' ? val : fallback);

/**
 * Format messes and rooms for the Admin Master Sheet (Messes_Master).
 * Includes detailed rent & vacancy breakdown per room type (1 to 8 Seater + Total).
 */
export const formatMessesForAdminSheet = (messes, rooms) => {
    const headers = [
        'Mess ID',
        'Task Code',
        'Mess Name',
        'Contact Number',
        'District',
        'City',
        'Locality',
        'Address',
        'Gender / Type',
        'Food Facility',
        'Security Deposit',
        'Rent Cycle',
        'Single Bed Rent',
        'Single Bed Vacancy',
        'Double Bed Rent',
        'Double Bed Vacancy',
        'Triple Bed Rent',
        'Triple Bed Vacancy',
        '4 Bed Rent',
        '4 Bed Vacancy',
        '5 Bed Rent',
        '5 Bed Vacancy',
        '6 Bed Rent',
        '6 Bed Vacancy',
        '7 Bed Rent',
        '7 Bed Vacancy',
        '8 Bed Rent',
        '8 Bed Vacancy',
        'Total Vacancies',
        'Visibility Status',
        'Assign to Freelancer?',
        'Hide Contact?',
        'Google Maps URL',
        'Last Synced At'
    ];

    const sortedMesses = [...messes].sort((a, b) => {
        const timeA = a.createdAt?.seconds || a.createdAt?.toMillis?.() || 0;
        const timeB = b.createdAt?.seconds || b.createdAt?.toMillis?.() || 0;
        if (timeA !== timeB) return timeA - timeB;
        return (a.id || '').localeCompare(b.id || '');
    });

    const rows = sortedMesses.map((mess, idx) => {
        const messRooms = rooms.filter(r => r.messId === mess.id);
        const occRooms = mapRoomsToOccupancy(messRooms);

        const roomCols = [];
        OCCUPANCY_TYPES.forEach(occ => {
            const room = occRooms[occ.key];
            roomCols.push(room ? safeVal(room.price || room.rent) : '-');
            roomCols.push(room ? safeVal(room.availableCount, '0') : '-');
        });

        const totalVacancies = messRooms.reduce((sum, r) => sum + (Number(r.availableCount || r.vacancies || 0)), 0);

        const visibilityStatus = mess.hidden ? 'Private' : 'Public';
        const assignToFreelancer = mess.assignToFreelancer !== undefined 
            ? (mess.assignToFreelancer ? 'Yes' : 'No') 
            : (mess.hidden ? 'No' : 'Yes');

        return [
            mess.id,
            getTaskCode(mess, idx),
            mess.name || '',
            mess.contact || '',
            mess.district || '',
            mess.city || '',
            mess.locality || '',
            mess.address || '',
            Array.isArray(mess.messType) ? mess.messType.join(', ') : (mess.messType || 'General'),
            mess.foodAvailability || (mess.foodIncluded ? 'Included' : 'Self/Optional'),
            mess.securityDeposit || 0,
            mess.rentCycle || 'Monthly',
            ...roomCols,
            totalVacancies,
            visibilityStatus,
            assignToFreelancer,
            mess.hideContact ? 'Yes' : 'No',
            mess.locationUrl || (mess.latitude && mess.longitude ? `https://maps.google.com/?q=${mess.latitude},${mess.longitude}` : ''),
            new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
        ];
    });

    return { headers, rows };
};

/**
 * Format messes for the Freelancer Calling Board (Calling_Tasks).
 * Breaks down current rent and vacancy per room type up to 8 seater.
 * Deterministic sorting prevents task code shifting.
 */
export const formatTasksForFreelancerBoard = (messes, rooms) => {
    const sorted = [...messes]
        .filter(mess => {
            const isExplicitlyNo = mess.assignToFreelancer === false ||
                                   String(mess.assignToFreelancer || '').trim().toLowerCase() === 'no' ||
                                   String(mess.assignToFreelancer || '').trim().toLowerCase() === 'false';

            if (isExplicitlyNo) return false;

            const isExplicitlyYes = mess.assignToFreelancer === true ||
                                    String(mess.assignToFreelancer || '').trim().toLowerCase() === 'yes' ||
                                    String(mess.assignToFreelancer || '').trim().toLowerCase() === 'true';

            if (mess.hidden) {
                // Private mess: Only include if explicitly assigned to freelancer
                return isExplicitlyYes;
            }

            // Public mess: Include by default unless explicitly marked No
            return !isExplicitlyNo;
        })
        .sort((a, b) => {
            const timeA = a.createdAt?.seconds || a.createdAt?.toMillis?.() || 0;
            const timeB = b.createdAt?.seconds || b.createdAt?.toMillis?.() || 0;
            if (timeA !== timeB) return timeA - timeB;
            return (a.id || '').localeCompare(b.id || '');
        });

    return sorted.map((mess, idx) => {
        const messRooms = rooms.filter(r => r.messId === mess.id);
        const taskCode = getTaskCode(mess, idx);

        let totalVac = 0;
        let sumRent = 0;
        let rentCount = 0;

        const roomItems = messRooms.map((room, rIdx) => {
            const occ = getCleanOccupancy(room.occupancy || room.seater || room.category);
            const rPrice = Number(room.price || room.rent || 0);
            const rVac = Number(room.availableCount ?? 0);

            if (rVac > 0) totalVac += rVac;
            if (rPrice > 0) {
                sumRent += rPrice;
                rentCount++;
            }

            const features = [];
            if (room.ac) features.push('AC');
            if (room.attachedWashroom || room.washroom === 'attached') features.push('Attached Bath');
            const featStr = features.length > 0 ? ` (${features.join(', ')})` : '';
            const variantTitle = room.title || room.name || `${occ ? occ + ' Seater' : 'Room'}${featStr}`;

            return {
                roomId: room.id,
                taskCode: `${taskCode}-R${rIdx + 1}`,
                title: variantTitle,
                currentRent: rPrice,
                currentVacancies: rVac
            };
        });

        const avgRent = rentCount > 0 ? Math.round(sumRent / rentCount) : 0;

        return {
            id: mess.id,
            taskCode,
            name: mess.name || '',
            contact: mess.contact || '',
            locality: (mess.locality ? mess.locality + ', ' : '') + (mess.city || ''),
            messType: Array.isArray(mess.messType) ? mess.messType.join(', ') : (mess.messType || 'General'),
            hidden: !!mess.hidden,
            assignToFreelancer: mess.assignToFreelancer,
            totalVac,
            avgRent,
            rooms: roomItems
        };
    });
};

/**
 * Push data to Google Apps Script for Admin Master Sheet.
 */
export const pushToGoogleSheet = async (messes, rooms) => {
    if (!WEBHOOK_URL) {
        throw new Error('Google Sheet Webhook URL is not configured in .env (VITE_GOOGLE_SHEET_WEBHOOK_URL)');
    }

    const { headers, rows } = formatMessesForAdminSheet(messes, rooms);

    const response = await fetch(`${WEBHOOK_URL}?secret=${encodeURIComponent(WEBHOOK_SECRET)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
            action: 'sync_messes',
            headers,
            rows
        })
    });

    return await response.json();
};

/**
 * Push calling task queue to Freelancer Workbook with full room-by-room breakdown (1 to 8 seater).
 */
export const pushCallingTasksToGoogleSheet = async (messes, rooms) => {
    if (!WEBHOOK_URL) {
        throw new Error('Google Sheet Webhook URL is not configured in .env (VITE_GOOGLE_SHEET_WEBHOOK_URL)');
    }

    const tasks = formatTasksForFreelancerBoard(messes, rooms);

    try {
        const response = await fetch(`${WEBHOOK_URL}?secret=${encodeURIComponent(WEBHOOK_SECRET)}`, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify({
                action: 'export_calling_tasks',
                tasks
            })
        });

        const text = await response.text();
        let res;
        try {
            res = JSON.parse(text);
        } catch {
            throw new Error('Google Apps Script returned an invalid response. Ensure the script is deployed with "Who has access: Anyone".');
        }
        return res;
    } catch (err) {
        if (err.message && (err.message.includes('Failed to fetch') || err.name === 'TypeError')) {
            throw new Error('Google Sheet connection blocked. Please check Apps Script: Deploy > Manage Deployments > Edit > ensure "Who has access" is set to "Anyone" and save New Version.');
        }
        throw err;
    }
};

/**
 * Pull updates from Google Sheet with descriptive error handling.
 * @param {string} target 'master' or 'calling'
 */
export const pullFromGoogleSheet = async (target = 'calling') => {
    if (!WEBHOOK_URL) {
        throw new Error('Google Sheet Webhook URL is not configured in .env (VITE_GOOGLE_SHEET_WEBHOOK_URL)');
    }

    let response;
    try {
        response = await fetch(`${WEBHOOK_URL}?secret=${encodeURIComponent(WEBHOOK_SECRET)}&target=${target}`);
    } catch {
        throw new Error('Network error connecting to Google Apps Script. Please check your internet connection.');
    }

    if (!response.ok) {
        if (response.status === 404) {
            throw new Error('Google Apps Script returned 404. Ensure "Who has access" is set to "Anyone" in your deployment, or update VITE_GOOGLE_SHEET_WEBHOOK_URL in .env if a new deployment was created.');
        }
        throw new Error(`Google Sheet request failed with HTTP ${response.status}`);
    }

    let result;
    try {
        result = await response.json();
    } catch {
        throw new Error('Google Apps Script returned an HTML page instead of JSON. Verify in Apps Script that "Who has access" is set to "Anyone".');
    }

    if (result.status !== 'success') {
        throw new Error(result.message || 'Failed to pull from Google Sheet');
    }

    return result.data || [];
};

/**
 * Check if a cell has valid user input (not empty, not '-')
 */
const hasValidInput = (val) => val !== undefined && val !== null && String(val).trim() !== '' && String(val).trim() !== '-';

/**
 * Compute differences between sheet rows and live Firestore messes and rooms.
 * Works seamlessly with BOTH Calling_Tasks and Messes_Master sheets.
 */
export const computeDiff = (sheetRows, currentMesses, currentRooms = []) => {
    const diffs = [];
    const messesMap = new Map(currentMesses.map(m => [m.id, m]));
    const messesByCode = new Map(currentMesses.filter(m => m.taskCode).map(m => [String(m.taskCode).trim().toUpperCase(), m]));
    const messesByPhoneName = new Map(currentMesses.map(m => [
        (String(m.contact || '').replace(/\D/g, '').slice(-10)) + '_' + (String(m.name || '').trim().toLowerCase()),
        m
    ]));
    const messesByPhone = new Map(currentMesses.map(m => [
        (String(m.contact || '').replace(/\D/g, '').slice(-10)),
        m
    ]));
    const roomsMap = new Map(currentRooms.map(r => [r.id, r]));

    sheetRows.forEach(row => {
        const rawRoomId = row['Room ID'];
        const isRoomRow = rawRoomId && String(rawRoomId).trim() !== '' && String(rawRoomId).trim() !== '—';

        // ── PATH A: Hierarchical Room-ID Row ─────────────────────────────────
        if (isRoomRow) {
            const roomId = String(rawRoomId).trim();
            const room = roomsMap.get(roomId);
            const messId = row['Mess ID'] || (room ? room.messId : null);
            let mess = messId ? messesMap.get(messId) : null;

            if (!mess && row['Owner Phone']) {
                const cleanPhone = String(row['Owner Phone']).replace(/\D/g, '').slice(-10);
                mess = messesByPhone.get(cleanPhone);
            }
            if (!mess) return;

            const newRentRaw = row['Updated Rent (New)'];
            const newVacRaw  = row['Updated Vacancies (New)'];
            const hasRentEdit = hasValidInput(newRentRaw);
            const hasVacEdit  = hasValidInput(newVacRaw);

            const oldPrice = room ? Number(room.price || room.rent || 0) : null;
            const newPrice = hasRentEdit ? Number(String(newRentRaw).replace(/[^0-9]/g, '')) : oldPrice;

            const oldVac = room ? Number(room.availableCount ?? 0) : 0;
            const newVac = hasVacEdit ? Number(String(newVacRaw).replace(/[^0-9]/g, '')) : oldVac;

            const changes = [];
            const roomUpdates = [];

            if (hasRentEdit && newPrice !== oldPrice) {
                changes.push({
                    field: 'price',
                    label: `${row['Mess / Room Title'] ? String(row['Mess / Room Title']).trim().replace(/^🛏️\s*/, '') : 'Room'} Rent`,
                    oldVal: oldPrice !== null ? `₹${oldPrice}` : 'None',
                    newVal: `₹${newPrice}`
                });
            }
            if (hasVacEdit && (newVac !== oldVac || !room)) {
                changes.push({
                    field: 'availableCount',
                    label: `${row['Mess / Room Title'] ? String(row['Mess / Room Title']).trim().replace(/^🛏️\s*/, '') : 'Room'} Vacancies`,
                    oldVal: `${oldVac} seats`,
                    newVal: `${newVac} seats`
                });
            }

            if (changes.length > 0) {
                roomUpdates.push({
                    roomId: room ? room.id : roomId,
                    price: newPrice !== null ? newPrice : (room?.price || 0),
                    availableCount: newVac
                });
            }

            const verification = row['Call Verification'];
            const duration = row['Call Duration'];
            const attempts = row['Call Attempts'];
            const recording = row['Recording'];
            const hasCallVerification = verification && String(verification).trim() !== '' && !String(verification).includes('PENDING');

            if (changes.length > 0 || hasCallVerification) {
                diffs.push({
                    messId: mess.id,
                    taskCode: row['Task Code'] || mess.taskCode || 'MK-Task',
                    messName: mess.name,
                    roomTitle: row['Mess / Room Title'] ? String(row['Mess / Room Title']).trim().replace(/^🛏️\s*/, '') : '',
                    district: mess.district || 'balasore',
                    city: mess.city || 'baleshwar',
                    ownerPhone: mess.contact || row['Owner Phone'],
                    verificationBadge: verification || 'NOT RECORDED',
                    duration: duration || '',
                    attempts: attempts || 1,
                    recordingUrl: recording || '',
                    remarks: row['Notes / Remarks'] || '',
                    changes,
                    roomUpdates
                });
            }
            return;
        }

        // ── PATH B: Parent Mess Row / Master Sheet / Legacy Row ──────────────
        let messId = row.firestoreMessId || row['Mess ID'];
        let mess = messId ? messesMap.get(messId) : null;

        if (!mess && row['Task Code']) {
            mess = messesByCode.get(String(row['Task Code']).trim().toUpperCase());
        }
        if (!mess && row['Owner Phone']) {
            const cleanPhone = String(row['Owner Phone']).replace(/\D/g, '').slice(-10);
            const cleanName = String(row['Mess / Hostel Name'] || row['Mess / Room Title'] || '').trim().toLowerCase();
            mess = messesByPhoneName.get(cleanPhone + '_' + cleanName) || messesByPhone.get(cleanPhone);
        }

        if (!mess) return;
        messId = mess.id;

        const messRooms = currentRooms.filter(r => r.messId === messId);
        const occRooms = mapRoomsToOccupancy(messRooms);

        const changes = [];
        const roomUpdates = [];

        OCCUPANCY_TYPES.forEach(occ => {
            const newRentRaw = hasValidInput(row[occ.newRentHeader]) ? row[occ.newRentHeader] : (hasValidInput(row[occ.adminRent]) ? row[occ.adminRent] : undefined);
            const newVacRaw = hasValidInput(row[occ.newVacHeader]) ? row[occ.newVacHeader] : (hasValidInput(row[occ.adminVac]) ? row[occ.adminVac] : undefined);

            const hasRentEdit = hasValidInput(newRentRaw);
            const hasVacEdit = hasValidInput(newVacRaw);

            if (!hasRentEdit && !hasVacEdit) return;

            const room = occRooms[occ.key];
            const oldPrice = room ? Number(room.price || room.rent || 0) : null;
            const newPrice = hasRentEdit ? Number(String(newRentRaw).replace(/[^0-9]/g, '')) : oldPrice;

            const oldVac = room ? Number(room.availableCount || 0) : 0;
            const newVac = hasVacEdit ? Number(String(newVacRaw).replace(/[^0-9]/g, '')) : oldVac;

            let oldSummary = '';
            let newSummary = '';

            if (hasRentEdit && newPrice !== oldPrice) {
                oldSummary += oldPrice !== null ? `₹${oldPrice}` : 'None';
                newSummary += `₹${newPrice}`;
            }
            if (hasVacEdit && (newVac !== oldVac || !room)) {
                if (oldSummary) oldSummary += ', ';
                if (newSummary) newSummary += ', ';
                oldSummary += `${oldVac} seat${oldVac !== 1 ? 's' : ''}`;
                newSummary += `${newVac} seat${newVac !== 1 ? 's' : ''}`;
            }

            if (newSummary) {
                changes.push({
                    field: `room_${occ.key}`,
                    label: `${occ.label} Room`,
                    oldVal: oldSummary || 'Current',
                    newVal: newSummary
                });

                roomUpdates.push({
                    roomId: room?.id || null,
                    occupancy: occ.key,
                    price: newPrice !== null ? newPrice : (room?.price || 0),
                    availableCount: newVac
                });
            }
        });

        // Backward compatibility for generic Updated Rent / Vacancies if used
        if (hasValidInput(row['Updated Rent'])) {
            changes.push({
                field: 'pricing',
                label: 'General Rent',
                oldVal: 'Current',
                newVal: `₹${row['Updated Rent']}`
            });
        }
        if (hasValidInput(row['Updated Vacancies'])) {
            changes.push({
                field: 'vacancies',
                label: 'General Vacancies',
                oldVal: 'Current',
                newVal: `${row['Updated Vacancies']} seats`
            });
        }

        const verification = row['Call Verification'];
        const duration = row['Call Duration'];
        const attempts = row['Call Attempts'];
        const recording = row['Recording'];
        const hasCallVerification = verification && String(verification).trim() !== '' && !String(verification).includes('PENDING');

        if (changes.length > 0 || hasCallVerification) {
            diffs.push({
                messId,
                taskCode: row['Task Code'] || mess.taskCode || 'MK-Task',
                messName: mess.name,
                district: mess.district || 'balasore',
                city: mess.city || 'baleshwar',
                ownerPhone: mess.contact,
                verificationBadge: verification || 'NOT RECORDED',
                duration: duration || '',
                attempts: attempts || 1,
                recordingUrl: recording || '',
                remarks: row['Notes / Remarks'] || '',
                changes,
                roomUpdates
            });
        }
    });

    return diffs;
};

/**
 * Apply approved diffs to Firestore.
 * STRICT GUARDRAIL: ONLY updates room price (rent) and availableCount (vacancies),
 * plus an audit timestamp on the parent mess document. Never modifies visibility or other mess fields.
 */
export const applyDiffToFirestore = async (approvedDiffs, operatorEmail) => {
    let currentBatch = writeBatch(db);
    let opCount = 0;

    for (const diff of approvedDiffs) {
        const messRef = doc(db, 'messes', diff.messId);
        const updateData = {
            vacancyLastUpdated: serverTimestamp(),
            lastVerifiedAt: serverTimestamp(),
            lastVerifiedBy: operatorEmail || 'operator'
        };

        if (diff.district) updateData.district = diff.district;
        if (diff.city) updateData.city = diff.city;

        if (diff.verificationBadge && diff.verificationBadge.includes('VERIFIED')) {
            updateData.ownerCallStatus = 'verified';
            if (diff.duration) updateData.lastCallDuration = diff.duration;
            if (diff.attempts) updateData.lastCallAttempts = Number(diff.attempts);
            if (diff.recordingUrl) updateData.lastCallRecordingUrl = diff.recordingUrl;
        }

        currentBatch.update(messRef, updateData);
        opCount++;

        // Update individual room documents in Firestore, or create if new
        if (Array.isArray(diff.roomUpdates)) {
            diff.roomUpdates.forEach(u => {
                if (u.roomId) {
                    const roomRef = doc(db, 'rooms', u.roomId);
                    const roomData = {
                        updatedAt: serverTimestamp()
                    };
                    if (u.price !== undefined && !isNaN(u.price)) roomData.price = u.price;
                    if (u.availableCount !== undefined && !isNaN(u.availableCount)) roomData.availableCount = u.availableCount;
                    if (diff.district) roomData.district = diff.district;
                    currentBatch.update(roomRef, roomData);
                    opCount++;
                } else if (u.occupancy && diff.messId) {
                    // Create new room document in Firestore for this mess
                    const newRoomRef = doc(collection(db, 'rooms'));
                    currentBatch.set(newRoomRef, {
                        messId: diff.messId,
                        district: diff.district || 'balasore',
                        occupancy: u.occupancy,
                        price: u.price || 0,
                        availableCount: u.availableCount || 0,
                        totalInventory: u.availableCount || 1,
                        createdAt: serverTimestamp(),
                        updatedAt: serverTimestamp()
                    });
                    opCount++;
                }
            });
        }

        if (opCount >= 400) {
            await currentBatch.commit();
            currentBatch = writeBatch(db);
            opCount = 0;
        }
    }

    if (opCount > 0) {
        await currentBatch.commit();
    }
    return { success: true, count: approvedDiffs.length };
};

import { collection, getDocs, updateDoc, doc, writeBatch, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

export const backfillRoomDistricts = async () => {
    try {
        console.log('Starting Room District Backfill...');
        // 1. Fetch all messes
        const messesSnap = await getDocs(collection(db, 'messes'));
        const messDistricts = {};
        messesSnap.forEach(snap => {
            const data = snap.data();
            // Default to balasore if missing, based on legacy logic
            messDistricts[snap.id] = data.district || 'balasore';
        });

        // 2. Fetch all rooms
        const roomsSnap = await getDocs(collection(db, 'rooms'));
        let updatedCount = 0;

        // 3. Update rooms that are missing the district or have the wrong one
        const updatePromises = [];
        roomsSnap.forEach(snap => {
            const roomData = snap.data();
            const messId = roomData.messId;
            const correctDistrict = messDistricts[messId];

            if (correctDistrict && roomData.district !== correctDistrict) {
                const roomRef = doc(db, 'rooms', snap.id);
                updatePromises.push(
                    updateDoc(roomRef, { district: correctDistrict })
                );
                updatedCount++;
            }
        });

        await Promise.all(updatePromises);
        console.log(`Backfill complete. Updated ${updatedCount} rooms.`);
        return { success: true, count: updatedCount };
    } catch (error) {
        console.error('Error in backfillRoomDistricts:', error);
        return { success: false, error };
    }
};

export function parseMessData(d, force = false) {
    const updates = {};
    const reasons = [];

    const extraStr = (d.extraAppliances || '').toLowerCase();
    const incList = Array.isArray(d.includedInRent) ? d.includedInRent : [];
    const advStr = (d.advanceDeposit || '').toLowerCase();
    const secStr = (d.security || '').toLowerCase();

    // 1. ELECTRICITY
    if (d.electricityBill && !force) {
        // Already set and not forced, leave intact
    } else if (!d.electricityBill || (force && (d.electricityBill === '-' || d.electricityBill === ''))) {
        const fixedMatch = extraStr.match(/(\d+)\s*(?:rupees)?\s*\/\s*month/) || advStr.match(/(\d+)\s*\(\s*electric\s*bill\s*\)/);
        if (fixedMatch) {
            updates.electricityBill = 'Extra Fixed';
            updates.electricityBillAmount = fixedMatch[1];
            reasons.push(`electricityBill -> Extra Fixed (${fixedMatch[1]})`);
        } else if (
            incList.includes('Electricity Bills') ||
            incList.includes('electricity') ||
            extraStr.includes('electricity and food charges included') ||
            extraStr.includes('food and electricity charges are included') ||
            extraStr.includes('food and electricity charges included') ||
            extraStr.includes('electricity bill included') ||
            extraStr.includes('electricity charges included') ||
            extraStr.includes('all charges included')
        ) {
            updates.electricityBill = 'Included in Rent';
            reasons.push(`electricityBill -> Included in Rent`);
        } else if (
            extraStr.includes('electricity bill not included') ||
            secStr.includes('electricity bill not included') ||
            extraStr.includes('electricity charges not included') ||
            extraStr.includes('electricity not included') ||
            extraStr.includes('bill not included') ||
            Array.isArray(d.includedInRent)
        ) {
            updates.electricityBill = 'As per Meter';
            reasons.push(`electricityBill -> As per Meter`);
        }
    }

    // 2. MAINTENANCE FEE & LEGACY MAINTENANCE CHARGE SYNC
    // Conflict resolution rule:
    // Legacy maintenance can be in d.maintenanceCharge, d.security, or d.advanceDeposit
    const hasLegacyMaintTaken = d.maintenanceCharge && typeof d.maintenanceCharge === 'object' &&
        (d.maintenanceCharge.taken === true || d.maintenanceCharge.taken === 'true' || Number(d.maintenanceCharge.amount) > 0);
    const hasLegacyMaintFree = d.maintenanceCharge && typeof d.maintenanceCharge === 'object' && d.maintenanceCharge.taken === false;

    // Check d.security for maintenance (e.g. "₹800 maintenance (Per Year)", "₹100 maintenance (Per Month)")
    let secMaintMatch = null;
    if (d.security && typeof d.security === 'string') {
        secMaintMatch = d.security.match(/(?:₹\s*)?(\d+)\s*(?:maintenance)?\s*\(([^)]+)\)/i) ||
                        d.security.match(/(?:₹\s*)?(\d+)\s*\/\s*(year|month)/i) ||
                        d.security.match(/(?:₹\s*)?(\d+)\s+(per year|per month|one time)/i) ||
                        d.security.match(/(?:₹\s*)?(\d+)\s*maintenance/i);
    }

    // Check d.advanceDeposit for maintenance (e.g. "3 months + 800 (per year)")
    let advMaintMatch = null;
    if (d.advanceDeposit && typeof d.advanceDeposit === 'string') {
        advMaintMatch = d.advanceDeposit.match(/\+\s*(?:₹\s*)?(\d+)\s*(?:maintenance)?\s*\(([^)]+)\)/i) ||
                        d.advanceDeposit.match(/\+\s*(?:₹\s*)?(\d+)\s*\/\s*(year|month)/i) ||
                        d.advanceDeposit.match(/\+\s*(?:₹\s*)?(\d+)\s+(one time|per year|per month)/i);
    }

    if (hasLegacyMaintTaken) {
        const rawAmt = String(d.maintenanceCharge.amount || d.maintenanceFeeAmount || '').trim();
        if (d.maintenanceFee !== 'Extra Charge' || (rawAmt && d.maintenanceFeeAmount !== rawAmt)) {
            updates.maintenanceFee = 'Extra Charge';
            if (rawAmt) updates.maintenanceFeeAmount = rawAmt;
            reasons.push(`maintenanceFee -> Extra Charge (${rawAmt}) [from legacy maintenanceCharge]`);
        }
        if (!d.maintenanceCharge?.taken || (rawAmt && d.maintenanceCharge?.amount !== rawAmt)) {
            updates.maintenanceCharge = {
                taken: true,
                amount: rawAmt,
                frequency: d.maintenanceCharge?.frequency || 'monthly'
            };
        }
    } else if (secMaintMatch) {
        const amt = secMaintMatch[1];
        const rawFreq = secMaintMatch[2] || (secStr.includes('year') ? 'Per Year' : (secStr.includes('month') ? 'Per Month' : (secStr.includes('one time') ? 'One Time' : 'Per Year')));
        const freq = rawFreq.toLowerCase().includes('year') ? 'Per Year' : (rawFreq.toLowerCase().includes('month') ? 'Per Month' : 'One Time');

        if (d.maintenanceFee !== 'Extra Charge' || d.maintenanceFeeAmount !== amt || d.maintenanceCharge?.frequency !== freq) {
            updates.maintenanceFee = 'Extra Charge';
            updates.maintenanceFeeAmount = amt;
            updates.maintenanceCharge = { taken: true, amount: amt, frequency: freq };
            reasons.push(`maintenanceFee -> Extra Charge (${amt}/${freq}) [from legacy security: ${d.security}]`);
        }
    } else if (advMaintMatch) {
        const amt = advMaintMatch[1];
        const rawFreq = advMaintMatch[2] || (advStr.includes('year') ? 'Per Year' : (advStr.includes('month') ? 'Per Month' : 'One Time'));
        const freq = rawFreq.toLowerCase().includes('year') ? 'Per Year' : (rawFreq.toLowerCase().includes('month') ? 'Per Month' : 'One Time');

        if (d.maintenanceFee !== 'Extra Charge' || d.maintenanceFeeAmount !== amt) {
            updates.maintenanceFee = 'Extra Charge';
            updates.maintenanceFeeAmount = amt;
            updates.maintenanceCharge = { taken: true, amount: amt, frequency: freq };
            reasons.push(`maintenanceFee -> Extra Charge (${amt}/${freq}) [from legacy advanceDeposit]`);
        }
    } else if (hasLegacyMaintFree && (!d.maintenanceFee || force)) {
        if (d.maintenanceFee !== 'Included') {
            updates.maintenanceFee = 'Included';
            updates.maintenanceFeeAmount = '';
            updates.maintenanceCharge = { taken: false, amount: '', frequency: 'monthly' };
            reasons.push(`maintenanceFee -> Included [from legacy maintenanceCharge.taken=false]`);
        }
    } else if (!d.maintenanceFee || (force && d.maintenanceFee === 'Included')) {
        const simplePlus = advStr.match(/\+\s*(?:₹\s*)?(\d+)\s*$/);
        if (secStr.includes('maintenance')) {
            const amtMatch = secStr.match(/(\d+)/);
            if (amtMatch) {
                const amt = amtMatch[1];
                updates.maintenanceFee = 'Extra Charge';
                updates.maintenanceFeeAmount = amt;
                updates.maintenanceCharge = { taken: true, amount: amt, frequency: secStr.includes('year') ? 'Per Year' : 'Per Month' };
                reasons.push(`maintenanceFee -> Extra Charge (${amt}) [from security maintenance text]`);
            }
        } else if (advStr.includes('maintenance')) {
            const amtMatch = advStr.match(/(\d+)/);
            if (amtMatch) {
                const amt = amtMatch[1];
                updates.maintenanceFee = 'Extra Charge';
                updates.maintenanceFeeAmount = amt;
                updates.maintenanceCharge = { taken: true, amount: amt, frequency: 'monthly' };
                reasons.push(`maintenanceFee -> Extra Charge (${amt})`);
            }
        } else if (simplePlus && !advStr.includes('electric') && !advStr.includes('utensil')) {
            const amt = simplePlus[1];
            updates.maintenanceFee = 'Extra Charge';
            updates.maintenanceFeeAmount = amt;
            updates.maintenanceCharge = { taken: true, amount: amt, frequency: 'monthly' };
            reasons.push(`maintenanceFee -> Extra Charge (${amt})`);
        } else if (!d.maintenanceFee && (incList.includes('Maintenance Fee') || extraStr.includes('all charges included'))) {
            updates.maintenanceFee = 'Included';
            updates.maintenanceCharge = { taken: false, amount: '', frequency: 'monthly' };
            reasons.push(`maintenanceFee -> Included`);
        }
    }

    // Keep legacy object in sync if maintenanceFee is Extra Charge but maintenanceCharge is missing
    if ((d.maintenanceFee === 'Extra Charge' || updates.maintenanceFee === 'Extra Charge') && !updates.maintenanceCharge && !d.maintenanceCharge) {
        updates.maintenanceCharge = {
            taken: true,
            amount: updates.maintenanceFeeAmount || d.maintenanceFeeAmount || '',
            frequency: 'monthly'
        };
    }

    // 3. CLEANING CHARGES
    if (d.cleaningCharges && !force) {
        // Already set
    } else if (!d.cleaningCharges || (force && (d.cleaningCharges === '-' || d.cleaningCharges === ''))) {
        if (
            incList.includes('Cleaning Charges') ||
            extraStr.includes('cleaning all charges included') ||
            extraStr.includes('cleaning charges included') ||
            extraStr.includes('cleaning included') ||
            extraStr.includes('all charges included')
        ) {
            updates.cleaningCharges = 'Included in Rent';
            reasons.push(`cleaningCharges -> Included in Rent`);
        } else if (Array.isArray(d.includedInRent) && d.includedInRent.length >= 0) {
            updates.cleaningCharges = 'Extra Charge';
            reasons.push(`cleaningCharges -> Extra Charge [from includedInRent exclusion]`);
        }
    }

    // 4. FOOD BILL & FACILITY
    if (d.foodBill && !force) {
        // Already set
    } else if (!d.foodBill || (force && (d.foodBill === '-' || d.foodBill === ''))) {
        if (
            incList.includes('Food Charges') ||
            extraStr.includes('food charges included') ||
            extraStr.includes('food and electricity') ||
            extraStr.includes('all charges included')
        ) {
            updates.foodBill = 'Included in Rent';
            reasons.push(`foodBill -> Included in Rent`);
        } else if (d.foodFacility && d.foodFacility.toLowerCase().includes('student')) {
            updates.foodBill = 'Separate';
            reasons.push(`foodBill -> Separate [Managed by Students]`);
        } else if (Array.isArray(d.includedInRent) && d.includedInRent.length >= 0) {
            updates.foodBill = 'Separate';
            reasons.push(`foodBill -> Separate [from includedInRent exclusion]`);
        }
    }
    if (!d.foodFacility && (d.amenities?.food === true || d.foodBill === 'Included in Rent' || updates.foodBill === 'Included in Rent')) {
        updates.foodFacility = 'Food Available';
        reasons.push(`foodFacility -> Food Available`);
    }

    // 5. UTENSILS CHARGES
    if (d.utensilsCharges && !force) {
        // Already set
    } else if (!d.utensilsCharges || (force && (d.utensilsCharges === '-' || d.utensilsCharges === ''))) {
        if (advStr.includes('utensil')) {
            updates.utensilsCharges = 'Chargeable';
            reasons.push(`utensilsCharges -> Chargeable`);
        } else if (incList.includes('Utensils Charges')) {
            updates.utensilsCharges = 'Provided';
            reasons.push(`utensilsCharges -> Provided`);
        }
    }

    // 6. SECURITY DEPOSIT
    if (d.securityDeposit && !force) {
        // Already set
    } else if (!d.securityDeposit || (force && (d.securityDeposit === '-' || d.securityDeposit === ''))) {
        if (d.advanceDeposit) {
            const raw = d.advanceDeposit.trim();
            // Split by '+' to extract pure deposit part, e.g. "3 months + 800 (per year)" -> "3 months"
            const parts = raw.split(/\s*\+\s*/);
            const depositRaw = parts[0].trim();

            const monthMatch = depositRaw.match(/^(\d+)\s*months?/i);
            if (monthMatch) {
                const count = monthMatch[1];
                updates.securityDeposit = `${count} Month${count > 1 ? 's' : ''}`;
                reasons.push(`securityDeposit -> ${updates.securityDeposit}`);
            } else if (depositRaw.toLowerCase().includes('1 month rent')) {
                updates.securityDeposit = '1 Month';
                reasons.push(`securityDeposit -> 1 Month`);
            } else if (depositRaw === '₹0' || depositRaw === '0' || depositRaw.toLowerCase().includes('no deposit')) {
                updates.securityDeposit = 'No Deposit';
                reasons.push(`securityDeposit -> No Deposit`);
            } else {
                const digits = depositRaw.replace(/,/g, '').match(/(?:₹\s*)?(\d{3,6})/);
                if (digits) {
                    updates.securityDeposit = 'Custom';
                    updates.securityDepositCustom = digits[1];
                    reasons.push(`securityDeposit -> Custom (₹${digits[1]})`);
                }
            }
        }
    }

    // 7. ADVANCE PAYMENT (Move-in advance rent normalization)
    if (d.advancePayment && typeof d.advancePayment === 'object') {
        const apType = d.advancePayment.type;
        let mappedAdv = null;
        let mappedCustom = '';

        if (apType === '1 Month' || apType === '1 Month Rent') {
            mappedAdv = '1 Month';
        } else if (apType === '2 Months') {
            mappedAdv = '2 Months';
        } else if (apType === 'None') {
            mappedAdv = 'No Advance';
        } else if (apType === 'Custom Amount' || apType === 'Custom') {
            mappedAdv = 'Custom';
            mappedCustom = String(d.advancePayment.customAmount || d.advancePaymentCustom || '');
        } else if (apType && apType.includes('Month')) {
            mappedAdv = apType;
        }

        if (mappedAdv) {
            updates.advancePayment = mappedAdv;
            if (mappedCustom) updates.advancePaymentCustom = mappedCustom;
            updates.advancePaymentObj = d.advancePayment; // preserve legacy object structure
            reasons.push(`advancePayment -> ${mappedAdv}`);
        }
    } else if (!d.advancePayment || (force && d.advancePayment === '-')) {
        // If advancePayment is empty, check advanceDeposit or default
        if (d.advanceDeposit && (d.advanceDeposit.toLowerCase().includes('no advance') || d.advanceDeposit === '₹0' || d.advanceDeposit === '0')) {
            updates.advancePayment = 'No Advance';
            reasons.push(`advancePayment -> No Advance`);
        }
    }

    // 8. LIVING SERVICES (WiFi, PowerBackup, CCTV)
    const hasWifi = d.amenities?.wifi === true || (Array.isArray(d.facilities) && d.facilities.includes('Wifi'));
    if (d.wifi === undefined || (force && hasWifi && !d.wifi)) {
        if (hasWifi) {
            updates.wifi = true;
            if (!d.wifiAvailable) updates.wifiAvailable = 'High Speed WiFi';
            reasons.push(`wifi -> true`);
        }
    }

    const hasPower = d.amenities?.inverter === true ||
                     (Array.isArray(d.facilities) && d.facilities.includes('InverterPower')) ||
                     d.powerBackup === 'Inverter Backup';
    if (d.powerBackup === undefined || typeof d.powerBackup === 'string' || (force && hasPower && d.powerBackup !== true)) {
        if (hasPower) {
            updates.powerBackup = true;
            if (!d.powerBackupType) updates.powerBackupType = 'Inverter Backup';
            reasons.push(`powerBackup -> true`);
        }
    }

    const hasCctv = d.amenities?.cctv === true ||
                    (Array.isArray(d.facilities) && d.facilities.includes('CCTV')) ||
                    (typeof d.security === 'string' && d.security.toLowerCase().includes('cctv'));
    if (d.cctv === undefined || (force && hasCctv && !d.cctv)) {
        if (hasCctv) {
            updates.cctv = true;
            if (!d.cctvInstalled) updates.cctvInstalled = 'CCTV Installed';
            reasons.push(`cctv -> true`);
        }
    }

    return { updates, reasons };
}

export const mergeMessChargesAndFacilities = async () => {
    return mergeAllMessData();
};

export const mergeAllMessData = async (onProgress = null) => {
    try {
        console.log('Starting Full Mess Data Deep Merge...');
        const messesSnap = await getDocs(collection(db, 'messes'));
        const totalMesses = messesSnap.docs.length;
        let updatedCount = 0;
        let skippedCount = 0;

        const stats = {
            electricityBill: 0,
            maintenanceFee: 0,
            cleaningCharges: 0,
            foodBill: 0,
            utensilsCharges: 0,
            securityDeposit: 0,
            advancePayment: 0,
            services: 0
        };

        const batchSize = 400;
        let batch = writeBatch(db);
        let batchCount = 0;

        for (let i = 0; i < totalMesses; i++) {
            const snap = messesSnap.docs[i];
            const data = snap.data();
            const { updates } = parseMessData(data, true);

            // Filter out updates where values in data are already identical
            const finalUpdates = {};
            for (const [k, val] of Object.entries(updates)) {
                if (typeof val === 'object' && val !== null) {
                    if (JSON.stringify(data[k]) !== JSON.stringify(val)) {
                        finalUpdates[k] = val;
                    }
                } else if (data[k] !== val) {
                    finalUpdates[k] = val;
                }
            }

            if (Object.keys(finalUpdates).length > 0) {
                batch.update(doc(db, 'messes', snap.id), finalUpdates);
                batchCount++;
                updatedCount++;

                // Track granular stats
                if (finalUpdates.electricityBill || finalUpdates.electricityBillAmount) stats.electricityBill++;
                if (finalUpdates.maintenanceFee || finalUpdates.maintenanceFeeAmount || finalUpdates.maintenanceCharge) stats.maintenanceFee++;
                if (finalUpdates.cleaningCharges || finalUpdates.cleaningChargesAmount) stats.cleaningCharges++;
                if (finalUpdates.foodBill) stats.foodBill++;
                if (finalUpdates.utensilsCharges) stats.utensilsCharges++;
                if (finalUpdates.securityDeposit || finalUpdates.securityDepositCustom) stats.securityDeposit++;
                if (finalUpdates.advancePayment || finalUpdates.advancePaymentCustom) stats.advancePayment++;
                if (finalUpdates.wifi !== undefined || finalUpdates.powerBackup !== undefined || finalUpdates.cctv !== undefined) stats.services++;

                if (batchCount >= batchSize) {
                    await batch.commit();
                    batch = writeBatch(db);
                    batchCount = 0;
                }
            } else {
                skippedCount++;
            }

            if (onProgress && (i % 10 === 0 || i === totalMesses - 1)) {
                onProgress({ current: i + 1, total: totalMesses, updated: updatedCount });
            }
        }

        if (batchCount > 0) {
            await batch.commit();
        }

        console.log(`Deep Merge complete. Updated ${updatedCount}/${totalMesses} messes.`);
        return {
            success: true,
            totalMesses,
            updatedMesses: updatedCount,
            count: updatedCount,
            skippedMesses: skippedCount,
            skipped: skippedCount,
            stats
        };
    } catch (error) {
        console.error('Error in mergeAllMessData:', error);
        return { success: false, error };
    }
};

export const syncBhubaneswarLocalities = async () => {
    try {
        console.log('Syncing Bhubaneswar & Khorda localities to Firestore...');
        const docRef = doc(db, 'app_config', 'localities');
        const docSnap = await getDoc(docRef);
        const existing = docSnap.exists() ? docSnap.data() : {};

        const bhubaneswarLandmarks = [
            'Patia', 'Khandagiri', 'Jayadev Vihar', 'Saheed Nagar', 'Nayapalli',
            'Chandrasekharpur', 'Master Canteen', 'Baramunda', 'Acharya Vihar',
            'Rasulgarh', 'Infocity', 'Kalinga Nagar', 'Vani Vihar', 'Old Town',
            'Bhubaneswar'
        ];
        const khordhaTownLandmarks = [
            'Khorda New Bus Stand', 'Khorda Old Bus Stand', 'Gurujang',
            'Collectorate Road', 'Khordha Road Junction', 'Khorda Town'
        ];

        const updatedData = {
            ...existing,
            bhubaneswar: Array.from(new Set([...(existing.bhubaneswar || []), ...bhubaneswarLandmarks])),
            khordha_town: Array.from(new Set([...(existing.khordha_town || []), ...khordhaTownLandmarks]))
        };

        await setDoc(docRef, updatedData, { merge: true });
        console.log('Bhubaneswar & Khorda localities successfully synced to Firestore.');
        return {
            success: true,
            bhubaneswarCount: updatedData.bhubaneswar.length,
            khordhaCount: updatedData.khordha_town.length
        };
    } catch (error) {
        console.error('Error syncing Bhubaneswar localities:', error);
        return { success: false, error };
    }
};

/**
 * migrate_landmarks.cjs
 * ─────────────────────
 * Approach 1 Migration: Copy the 'landmark' field to the new 'locality' field
 * for all mess documents that have a 'landmark' but no 'locality'.
 * 
 * Usage:
 *   node scripts/migrate_landmarks.cjs                  # Dry-run (no writes)
 *   node scripts/migrate_landmarks.cjs --write          # Actually write to Firestore
 * 
 * Prerequisites:
 *   1. Download a Firebase Service Account JSON key from Firebase Console:
 *      Project Settings → Service Accounts → Generate New Private Key
 *   2. Save it as scripts/serviceAccount.json  (already in .gitignore)
 *   3. npm install firebase-admin  (in the project root or client folder)
 */

const { initializeApp, cert } = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');
const path = require('path');

const DRY_RUN = !process.argv.includes('--write');
const BATCH_SIZE = 499; // Firestore batch limit

const serviceAccountPath = path.join(__dirname, 'serviceAccount.json');

let serviceAccount;
try {
    serviceAccount = require(serviceAccountPath);
} catch {
    console.error('\n❌ ERROR: Service account file not found.');
    console.error('   Expected at:', serviceAccountPath);
    console.error('   Download it from: Firebase Console → Project Settings → Service Accounts\n');
    process.exit(1);
}

initializeApp({
    credential: cert(serviceAccount),
});

const db = getFirestore();

async function migrate() {
    console.log('\n🚀 MessKhojo: Landmark → Locality Migration Script');
    console.log('───────────────────────────────────────────────────');
    console.log(`   Mode: ${DRY_RUN ? '🔍 DRY RUN (no writes)' : '✏️  WRITE MODE'}`);
    console.log('');

    let migratedCount = 0;
    let skippedCount = 0;
    let emptyLandmarkCount = 0;
    let errorCount = 0;

    let batch = db.batch();
    let batchOpsCount = 0;

    const snapshot = await db.collection('messes').get();
    console.log(`   Found ${snapshot.size} total mess documents.\n`);

    for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        const landmark = data.landmark;
        const locality = data.locality;

        // Skip if locality is already set (previously migrated or set by new registration)
        if (locality !== undefined && locality !== null && locality !== '') {
            skippedCount++;
            continue;
        }

        // Skip if there's no landmark value to copy
        if (!landmark || landmark.trim() === '') {
            emptyLandmarkCount++;
            console.log(`   ⚠️  [${docSnap.id}] "${data.name || 'unknown'}" — no landmark value, skipping.`);
            continue;
        }

        const newLocality = landmark.trim();

        if (DRY_RUN) {
            console.log(`   🔍 [DRY] "${data.name || docSnap.id}" → locality = "${newLocality}"`);
        } else {
            batch.update(docSnap.ref, { locality: newLocality });
            batchOpsCount++;

            // Commit when we hit the batch limit
            if (batchOpsCount >= BATCH_SIZE) {
                try {
                    await batch.commit();
                    console.log(`   ✅ Committed batch of ${batchOpsCount} writes.`);
                } catch (err) {
                    console.error(`   ❌ Batch commit failed:`, err.message);
                    errorCount += batchOpsCount;
                }
                batch = db.batch();
                batchOpsCount = 0;
            }
        }
        migratedCount++;
    }

    // Commit any remaining operations
    if (!DRY_RUN && batchOpsCount > 0) {
        try {
            await batch.commit();
            console.log(`   ✅ Committed final batch of ${batchOpsCount} writes.`);
        } catch (err) {
            console.error(`   ❌ Final batch commit failed:`, err.message);
            errorCount += batchOpsCount;
        }
    }

    console.log('\n───────────────────────────────────────────────────');
    console.log('📊 Migration Summary:');
    console.log(`   ✅ Migrated  : ${migratedCount} messes (landmark → locality)`);
    console.log(`   ⏭️  Skipped   : ${skippedCount} messes (already had locality)`);
    console.log(`   ⚠️  No value  : ${emptyLandmarkCount} messes (blank landmark, skipped)`);
    if (errorCount > 0) {
        console.log(`   ❌ Errors    : ${errorCount} write failures`);
    }
    if (DRY_RUN) {
        console.log('\n⚡ This was a DRY RUN. No data was changed.');
        console.log('   To apply, run: node scripts/migrate_landmarks.cjs --write');
    } else {
        console.log('\n🎉 Migration complete!');
    }
    console.log('');
}

migrate().catch(err => {
    console.error('\n❌ Fatal error:', err.message);
    process.exit(1);
});

const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

admin.initializeApp();

exports.updatePartnerPassword = onCall({ cors: true }, async (request) => {
    // 1. Verify the caller is logged in
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'You must be logged in to perform this action.');
    }

    const { targetEmail, newPassword } = request.data;

    if (!targetEmail || !newPassword || newPassword.length < 6) {
        throw new HttpsError('invalid-argument', 'Valid email and new password (min 6 chars) are required.');
    }

    try {
        // 2. Verify the caller is an authorized Operator
        // The allowed operator email is messkhojooperator@gmail.com
        const callerEmail = request.auth.token.email;
        if (callerEmail !== 'messkhojooperator@gmail.com') {
             throw new HttpsError('permission-denied', 'Only authorized operators can reset passwords.');
        }

        // 3. Find the partner user by email
        const userRecord = await admin.auth().getUserByEmail(targetEmail);

        // 4. Update their password
        await admin.auth().updateUser(userRecord.uid, {
            password: newPassword
        });

        return { success: true, message: `Password updated successfully for ${targetEmail}` };

    } catch (error) {
        console.error("Password Update Error:", error);
        
        // Handle specific Firebase Admin errors
        if (error.code === 'auth/user-not-found') {
             throw new HttpsError('not-found', 'No partner found with this email.');
        }
        
        throw new HttpsError('internal', error.message || 'An error occurred while updating the password.');
    }
});

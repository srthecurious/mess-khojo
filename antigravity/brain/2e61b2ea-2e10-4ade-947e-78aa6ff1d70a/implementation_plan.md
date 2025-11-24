

# Mess Khojo - Implementation Plan

## Goal Description
Build "Mess Khojo", a web application connecting users with mess/hostel rooms.
- **Admin Interface**: Secure login, manage room listings (photos, details).
- **User Interface**: Public access to view room listings.
- **Tech Stack**: React (Frontend), Firebase (Backend-as-a-Service).

## User Review Required
> [!IMPORTANT]
> **Firebase Configuration**: You will need to provide the Firebase configuration object (API keys, etc.) after I set up the project structure. I cannot create the Firebase project for you on the Google Console.

## Proposed Changes

### Configuration
#### [NEW] client/src/firebase.js
- Initialize Firebase App.
- Export `auth`, `db` (Firestore), `storage`.

### Frontend (Client)
#### [MODIFY] client/src/pages/Home.jsx
- **Theme**: Soft Pastel (Lavender, Soft Pink, Mint Blue).
- **Hero**: Soft gradient background, cozy typography.
- **Header**: Integrate `logo.png`.

#### [MODIFY] client/src/components/MessCard.jsx
- **Style**: Pill-shaped buttons, soft shadows, rounded corners.
- **Colors**: Pastel accents.

#### [MODIFY] client/src/pages/MessDetails.jsx
- Consistent pastel theming.

#### [MODIFY] client/src/pages/AdminLogin.jsx & AdminDashboard.jsx
- Apply new branding to admin pages.

#### [NEW] client/package.json
- **Room Data**: Include `messId` and `messName` when adding a room.

#### [NEW] client/src/components/RoomCard.jsx
- Display Mess Name if available.

## Verification Plan
### Manual Verification
- **Setup**: User provides Firebase config.
- **Admin**:
    - Login with test credentials (created in Firebase Console).
    - Upload a room image and details.
    - Verify image appears in Storage and data in Firestore.
- **User**:
    - Verify Home page loads data from Firestore.

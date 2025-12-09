¨
# Google Ads Integration Plan

## Goal Description
Integrate Google Ads into the Syllabus Tracker and Mock Test Tracker sections as requested by the user. The ad script should only be present in these specific sections.

## User Review Required
> [!IMPORTANT]
> I will be using `next/script` to load the Google Ad script. This is the recommended way to load third-party scripts in Next.js applications.

## Proposed Changes

### Components

#### [MODIFY] [syllabus-tracker.tsx](file:///c:/Apps/NEETrack/NEETrack/src/components/syllabus-tracker.tsx)
- Import `Script` from `next/script`.
- Add the Google Ad script using the `Script` component.

#### [MODIFY] [mock-test-tracker.tsx](file:///c:/Apps/NEETrack/NEETrack/src/components/mock-test-tracker.tsx)
- Import `Script` from `next/script`.
- Add the Google Ad script using the `Script` component.

## Verification Plan

### Manual Verification
- Run the application locally using `npm run dev`.
- Navigate to the Syllabus Tracker page.
- Verify that the Google Ad script is loaded (check network tab or inspect elements).
- Navigate to the Mock Test Tracker page.
- Verify that the Google Ad script is loaded.
- Navigate to other pages to ensure the script is NOT loaded there (if possible, though `next/script` might optimize loading).
¨
"(c3a39cef2b9afd8776f0d208ad342f6993b0b25328file:///c:/Apps/NEETrack/NEETrack/implementation_plan.md:!file:///c:/Apps/NEETrack/NEETrack
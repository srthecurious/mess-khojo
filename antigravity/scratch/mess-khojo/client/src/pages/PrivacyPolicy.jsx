import React from 'react';
import Header from '../components/Header';
import { usePageSEO } from '../hooks/usePageSEO';

const PrivacyPolicy = () => {
    usePageSEO({
        title: 'Privacy Policy | MessKhojo',
        description: 'Read the official MessKhojo Privacy Policy to understand how we collect, use, store, and protect your information across our website and mobile application.',
        canonicalUrl: 'https://messkhojo.com/privacy-policy',
    });

    return (
        <div className="min-h-screen bg-brand-secondary">
            <Header />
            <div className="max-w-4xl mx-auto p-6 md:p-10">
                <div className="bg-white rounded-3xl shadow-sm border border-brand-light-gray p-8 md:p-12">
                    <div className="border-b border-gray-100 pb-6 mb-8">
                        <span className="inline-block bg-brand-primary text-white text-xs font-extrabold uppercase px-3 py-1 rounded-md tracking-wider mb-3">
                            MESSKHOJO
                        </span>
                        <h1 className="text-3xl md:text-4xl font-extrabold text-brand-text-dark tracking-tight">
                            PRIVACY POLICY
                        </h1>
                        <div className="flex flex-wrap gap-4 mt-3 text-xs font-semibold text-gray-500">
                            <span className="bg-gray-100 px-2.5 py-1 rounded-md">Last Updated: 28/09/2026</span>
                        </div>
                    </div>

                    <div className="prose prose-slate max-w-none text-gray-700 leading-relaxed text-sm md:text-base">
                        <p>
                            This Privacy Policy explains how MessKhojo (“MessKhojo”, “we”, “us”, or “our”) collects, uses, stores, discloses, and protects information when you use the MessKhojo mobile application (“App”), website, and related services (collectively, the “Services”).
                        </p>
                        <p>
                            MessKhojo is an online platform that helps users discover accommodation options such as messes, hostels and PGs and connect with the relevant property owners or managers.
                        </p>
                        <p>
                            MessKhojo generally acts as an intermediary/discovery platform. We do not own, operate, manage, or control the properties listed on the platform unless expressly stated otherwise.
                        </p>
                        <p>
                            By using the App, you acknowledge that you have read and understood this Privacy Policy.
                        </p>
                        <div className="p-4 my-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 font-medium text-sm">
                            If you do not agree with this Privacy Policy, please do not use the Services.
                        </div>

                        <hr className="my-8 border-gray-200" />

                        {/* 1. INFORMATION WE COLLECT */}
                        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mt-8 mb-4 text-brand-primary">1. INFORMATION WE COLLECT</h2>
                        <p>
                            The information we collect depends on how you use MessKhojo and the features you choose to access.
                        </p>

                        <h3 className="text-base md:text-lg font-bold text-gray-800 mt-6 mb-2">1.1 Information You Provide Directly</h3>
                        <p>Depending on the features available to you, we may collect:</p>
                        <ul className="list-disc pl-5 space-y-1 mb-4">
                            <li>Name</li>
                            <li>Mobile/telephone number</li>
                            <li>Email address</li>
                            <li>Account/login information</li>
                            <li>Password or authentication information, where applicable</li>
                            <li>City, locality or accommodation preferences</li>
                            <li>Contact preferences</li>
                            <li>Information provided during booking or enquiry requests</li>
                            <li>Information submitted through customer support</li>
                            <li>Feedback, reviews and ratings</li>
                            <li>Photographs or other content that you voluntarily upload</li>
                            <li>Information provided when reporting or claiming a listing</li>
                            <li>Information required to communicate with property owners/managers</li>
                        </ul>
                        <p>We ask you to provide accurate and current information.</p>

                        <hr className="my-8 border-gray-200" />

                        {/* 2. INFORMATION RELATED TO ACCOMMODATION SEARCHES */}
                        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mt-8 mb-4 text-brand-primary">2. INFORMATION RELATED TO ACCOMMODATION SEARCHES</h2>
                        <p>
                            When you search for or interact with accommodation listings, we may process information such as:
                        </p>
                        <ul className="list-disc pl-5 space-y-1 mb-4">
                            <li>Search queries</li>
                            <li>Selected city/locality</li>
                            <li>Budget preferences</li>
                            <li>Accommodation preferences</li>
                            <li>Filters and preferences</li>
                            <li>Listings viewed</li>
                            <li>Enquiries or booking requests</li>
                            <li>Interactions with property listings</li>
                        </ul>
                        <p>
                            We use this information to provide and improve the accommodation discovery experience.
                        </p>

                        <hr className="my-8 border-gray-200" />

                        {/* 3. LOCATION INFORMATION */}
                        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mt-8 mb-4 text-brand-primary">3. LOCATION INFORMATION</h2>
                        <p>
                            MessKhojo may request access to your device location where location functionality is necessary for features such as:
                        </p>
                        <ul className="list-disc pl-5 space-y-1 mb-4">
                            <li>Finding accommodation near your location</li>
                            <li>Showing relevant locations</li>
                            <li>Improving location-based search results</li>
                            <li>Providing map-related functionality</li>
                        </ul>
                        <p>
                            Depending on the feature and your device settings, location information may be precise or approximate.
                        </p>
                        <p>
                            You can control location permissions through your Android device settings.
                        </p>
                        <p>
                            If you deny location permission, certain location-based features may not work or may provide reduced functionality.
                        </p>
                        <p>
                            We will not request location access merely for unrelated purposes.
                        </p>
                        <div className="p-3 my-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-900 text-xs">
                            Google Play requires sensitive permissions to be necessary for the app’s current functionality and appropriately disclosed.
                        </div>

                        <hr className="my-8 border-gray-200" />

                        {/* 4. DEVICE AND TECHNICAL INFORMATION */}
                        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mt-8 mb-4 text-brand-primary">4. DEVICE AND TECHNICAL INFORMATION</h2>
                        <p>When you use the App, certain technical information may be collected automatically, such as:</p>
                        <ul className="list-disc pl-5 space-y-1 mb-4">
                            <li>IP address</li>
                            <li>Device type</li>
                            <li>Device model</li>
                            <li>Operating system and version</li>
                            <li>App version</li>
                            <li>Language and regional settings</li>
                            <li>Network information</li>
                            <li>General device configuration</li>
                            <li>Crash and diagnostic information</li>
                            <li>App performance information</li>
                            <li>Log information</li>
                            <li>Date and time of interactions</li>
                            <li>Features accessed and usage information</li>
                        </ul>
                        <p>We use this information primarily to:</p>
                        <ul className="list-disc pl-5 space-y-1 mb-4">
                            <li>Operate the App</li>
                            <li>Maintain security</li>
                            <li>Detect errors</li>
                            <li>Diagnose technical problems</li>
                            <li>Improve performance</li>
                            <li>Prevent fraud and abuse</li>
                            <li>Understand general usage patterns</li>
                        </ul>
                        <p>
                            We do not intentionally collect persistent device identifiers such as IMEI or IMSI for purposes prohibited by Google Play policy. Google Play specifically restricts linking persistent device identifiers with personal or sensitive information.
                        </p>

                        <hr className="my-8 border-gray-200" />

                        {/* 5. PHOTOS, IMAGES AND USER-GENERATED CONTENT */}
                        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mt-8 mb-4 text-brand-primary">5. PHOTOS, IMAGES AND USER-GENERATED CONTENT</h2>
                        <p>
                            If the App allows you to upload photographs, reviews, feedback, or other content, we may process that content to provide the relevant functionality.
                        </p>
                        <p>For example, users or property owners may provide:</p>
                        <ul className="list-disc pl-5 space-y-1 mb-4">
                            <li>Property photographs</li>
                            <li>Profile photographs</li>
                            <li>Reviews</li>
                            <li>Ratings</li>
                            <li>Feedback</li>
                            <li>Listing information</li>
                        </ul>
                        <p>
                            You should not upload sensitive personal information, government identification documents, financial information, passwords, or information belonging to another person unless the feature specifically requires it and you are legally permitted to provide it.
                        </p>
                        <p>
                            Where images or content are publicly displayed as part of a listing, review, profile or other platform feature, that content may be visible to other users.
                        </p>

                        <hr className="my-8 border-gray-200" />

                        {/* 6. HOW WE USE YOUR INFORMATION */}
                        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mt-8 mb-4 text-brand-primary">6. HOW WE USE YOUR INFORMATION</h2>
                        <p>We may use information for the following purposes:</p>

                        <h3 className="text-base md:text-lg font-bold text-gray-800 mt-4 mb-2">Providing the Services</h3>
                        <ul className="list-disc pl-5 space-y-1 mb-4">
                            <li>Create and manage accounts</li>
                            <li>Provide search and discovery functionality</li>
                            <li>Display relevant accommodation listings</li>
                            <li>Facilitate enquiries</li>
                            <li>Facilitate booking requests where available</li>
                            <li>Connect users with property owners/managers</li>
                            <li>Provide customer support</li>
                        </ul>

                        <h3 className="text-base md:text-lg font-bold text-gray-800 mt-4 mb-2">Communication</h3>
                        <p>We may use your contact information to send:</p>
                        <ul className="list-disc pl-5 space-y-1 mb-4">
                            <li>Account-related communications</li>
                            <li>Booking/enquiry communications</li>
                            <li>Verification communications</li>
                            <li>Service notifications</li>
                            <li>Security alerts</li>
                            <li>Important changes to the Services</li>
                            <li>Policy updates</li>
                        </ul>

                        <h3 className="text-base md:text-lg font-bold text-gray-800 mt-4 mb-2">Security</h3>
                        <p>We may process information to:</p>
                        <ul className="list-disc pl-5 space-y-1 mb-4">
                            <li>Detect fraudulent activity</li>
                            <li>Prevent abuse</li>
                            <li>Protect accounts</li>
                            <li>Investigate suspicious activity</li>
                            <li>Protect our systems</li>
                            <li>Enforce our Terms & Conditions</li>
                        </ul>

                        <h3 className="text-base md:text-lg font-bold text-gray-800 mt-4 mb-2">Improvement</h3>
                        <p>We may analyse aggregated or appropriately protected usage information to:</p>
                        <ul className="list-disc pl-5 space-y-1 mb-4">
                            <li>Improve App functionality</li>
                            <li>Understand user behaviour</li>
                            <li>Identify technical problems</li>
                            <li>Improve search and discovery</li>
                            <li>Develop new features</li>
                            <li>Improve user experience</li>
                        </ul>

                        <h3 className="text-base md:text-lg font-bold text-gray-800 mt-4 mb-2">Legal compliance</h3>
                        <p>We may process and disclose information where necessary to:</p>
                        <ul className="list-disc pl-5 space-y-1 mb-4">
                            <li>Comply with applicable laws</li>
                            <li>Respond to lawful government requests</li>
                            <li>Protect legal rights</li>
                            <li>Investigate suspected unlawful activity</li>
                            <li>Prevent fraud or security incidents</li>
                        </ul>

                        <hr className="my-8 border-gray-200" />

                        {/* 7. SHARING OF INFORMATION */}
                        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mt-8 mb-4 text-brand-primary">7. SHARING OF INFORMATION</h2>
                        <p>
                            We do not sell your personal information as a product.
                        </p>
                        <p>We may share information in the circumstances described below.</p>

                        <h3 className="text-base md:text-lg font-bold text-gray-800 mt-4 mb-2">7.1 Property Owners or Managers</h3>
                        <p>
                            When you voluntarily initiate an enquiry, booking request, or similar interaction with a property, we may share relevant information with the applicable property owner, manager, or representative so that they can respond to your request.
                        </p>
                        <p>For example, this may include:</p>
                        <ul className="list-disc pl-5 space-y-1 mb-4">
                            <li>Name</li>
                            <li>Phone number</li>
                            <li>Email address</li>
                            <li>Booking/enquiry details</li>
                            <li>Relevant accommodation preferences</li>
                        </ul>
                        <p>
                            Similarly, where appropriate, we may provide you with contact information relating to the relevant property.
                        </p>
                        <p>
                            This sharing is part of the core functionality of MessKhojo.
                        </p>

                        <h3 className="text-base md:text-lg font-bold text-gray-800 mt-6 mb-2">7.2 Service Providers</h3>
                        <p>
                            We may use third-party service providers to operate the App, such as providers of:
                        </p>
                        <ul className="list-disc pl-5 space-y-1 mb-4">
                            <li>Cloud hosting</li>
                            <li>Data storage</li>
                            <li>Authentication</li>
                            <li>Analytics</li>
                            <li>Crash reporting</li>
                            <li>Communication services</li>
                            <li>Maps and location services</li>
                            <li>Security services</li>
                            <li>Technical infrastructure</li>
                        </ul>
                        <p>
                            These providers may process information on our behalf and are expected to handle information in accordance with applicable requirements and contractual obligations.
                        </p>
                        <div className="p-3 my-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-900 text-xs">
                            Google Play makes developers responsible for ensuring third-party SDKs used in their apps comply with Google Play’s User Data requirements.
                        </div>

                        <h3 className="text-base md:text-lg font-bold text-gray-800 mt-6 mb-2">7.3 Legal and Regulatory Authorities</h3>
                        <p>We may disclose information where reasonably necessary to:</p>
                        <ul className="list-disc pl-5 space-y-1 mb-4">
                            <li>Comply with applicable law</li>
                            <li>Respond to legal process</li>
                            <li>Protect users</li>
                            <li>Protect MessKhojo</li>
                            <li>Investigate fraud or unlawful activity</li>
                            <li>Respond to valid governmental requests</li>
                        </ul>

                        <h3 className="text-base md:text-lg font-bold text-gray-800 mt-6 mb-2">7.4 Business Transfers</h3>
                        <p>
                            If MessKhojo is involved in a merger, acquisition, restructuring, financing, sale of assets, or similar corporate transaction, information may be transferred as part of that transaction, subject to applicable law.
                        </p>

                        <hr className="my-8 border-gray-200" />

                        {/* 8. GOOGLE SERVICES AND APIS */}
                        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mt-8 mb-4 text-brand-primary">8. GOOGLE SERVICES AND APIS</h2>
                        <p>
                            Where MessKhojo uses Google services or APIs, such as Google Maps Platform, authentication services, analytics, Firebase services, or other Google APIs, information may be processed by Google according to the applicable Google terms and privacy practices.
                        </p>
                        <p>
                            Our actual use of Google services will be limited to the functionality implemented in the App.
                        </p>
                        <p>
                            Where Google API user data is involved, MessKhojo will comply with applicable Google API Services User Data Policy requirements, including Limited Use requirements where applicable.
                        </p>
                        <div className="p-3 my-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-600 text-xs italic">
                            Important: this section should be adjusted after we verify exactly which Google/Firebase SDKs are actually inside your Android build.
                        </div>

                        <hr className="my-8 border-gray-200" />

                        {/* 9. THIRD-PARTY SERVICES AND LINKS */}
                        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mt-8 mb-4 text-brand-primary">9. THIRD-PARTY SERVICES AND LINKS</h2>
                        <p>
                            The App may contain links to or integrations with third-party services.
                        </p>
                        <p>
                            Third parties may have their own privacy policies and terms.
                        </p>
                        <p>
                            MessKhojo is not responsible for the independent privacy practices of third parties outside our control.
                        </p>
                        <p>
                            You should review the privacy policies of third-party services before providing information directly to them.
                        </p>

                        <hr className="my-8 border-gray-200" />

                        {/* 10. COOKIES AND SIMILAR TECHNOLOGIES */}
                        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mt-8 mb-4 text-brand-primary">10. COOKIES AND SIMILAR TECHNOLOGIES</h2>
                        <p>
                            The MessKhojo website may use cookies and similar technologies.
                        </p>
                        <p>
                            The App may use technologies such as analytics identifiers, SDKs, logs, or similar technical mechanisms necessary for:
                        </p>
                        <ul className="list-disc pl-5 space-y-1 mb-4">
                            <li>Security</li>
                            <li>Performance</li>
                            <li>Analytics</li>
                            <li>Crash reporting</li>
                            <li>App functionality</li>
                        </ul>
                        <p>
                            The specific technologies used may change as the App evolves.
                        </p>
                        <p>
                            Where legally or technically required, we will provide appropriate disclosures and controls.
                        </p>

                        <hr className="my-8 border-gray-200" />

                        {/* 11. ADVERTISING AND MARKETING */}
                        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mt-8 mb-4 text-brand-primary">11. ADVERTISING AND MARKETING</h2>
                        <p>
                            If MessKhojo introduces advertising or personalised marketing features, the applicable data practices will be disclosed through this Privacy Policy and, where required, through appropriate consent or controls.
                        </p>
                        <p>
                            We will not represent that advertising-related data practices exist unless they are actually implemented.
                        </p>
                        <p>
                            Users may have choices regarding promotional communications, subject to applicable law.
                        </p>

                        <hr className="my-8 border-gray-200" />

                        {/* 12. DATA SECURITY */}
                        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mt-8 mb-4 text-brand-primary">12. DATA SECURITY</h2>
                        <p>
                            We implement reasonable technical and organisational measures designed to protect personal information against unauthorised access, alteration, disclosure, loss, or destruction.
                        </p>
                        <p>These measures may include:</p>
                        <ul className="list-disc pl-5 space-y-1 mb-4">
                            <li>Encryption during transmission</li>
                            <li>Access controls</li>
                            <li>Authentication controls</li>
                            <li>Security monitoring</li>
                            <li>Secure infrastructure</li>
                            <li>Limited employee/vendor access</li>
                            <li>Backup and recovery procedures</li>
                        </ul>
                        <p>
                            However, no internet transmission or electronic storage system can be guaranteed to be completely secure.
                        </p>

                        <hr className="my-8 border-gray-200" />

                        {/* 13. DATA RETENTION */}
                        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mt-8 mb-4 text-brand-primary">13. DATA RETENTION</h2>
                        <p>
                            We retain personal information only for as long as reasonably necessary for the purposes described in this Privacy Policy, including:
                        </p>
                        <ul className="list-disc pl-5 space-y-1 mb-4">
                            <li>Providing Services</li>
                            <li>Maintaining accounts</li>
                            <li>Security and fraud prevention</li>
                            <li>Resolving disputes</li>
                            <li>Meeting legal obligations</li>
                            <li>Maintaining necessary business records</li>
                        </ul>
                        <p>
                            When information is no longer required, we will delete, anonymise, or securely isolate it, subject to applicable legal or legitimate retention requirements.
                        </p>
                        <div className="p-3 my-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-600 text-xs italic">
                            We should NOT retain the current website’s blanket “seven months” statement unless your actual retention system is designed to follow that rule. This is one of the places where I recommend changing the website policy.
                        </div>

                        <hr className="my-8 border-gray-200" />

                        {/* 14. ACCOUNT DELETION */}
                        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mt-8 mb-4 text-brand-primary">14. ACCOUNT DELETION</h2>
                        <p>
                            If you create a MessKhojo account, you may request deletion of your account and associated personal information.
                        </p>
                        <p>
                            MessKhojo will provide an accessible account-deletion mechanism within the App and an appropriate web-based mechanism.
                        </p>
                        <p>
                            When an account deletion request is received, we will process the request in accordance with applicable law and our retention obligations.
                        </p>
                        <p>
                            Certain information may need to be retained where required or permitted by law, or where reasonably necessary for security, fraud prevention, dispute resolution, or enforcement of legal obligations.
                        </p>
                        <div className="p-3 my-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-900 text-xs">
                            Google Play currently requires account-creating apps to provide an in-app deletion path and an external web resource for deletion requests. This must actually be implemented before Play submission.
                        </div>

                        <hr className="my-8 border-gray-200" />

                        {/* 15. YOUR PRIVACY RIGHTS */}
                        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mt-8 mb-4 text-brand-primary">15. YOUR PRIVACY RIGHTS</h2>
                        <p>
                            Depending on applicable law, you may have rights concerning your personal information, which may include:
                        </p>
                        <ul className="list-disc pl-5 space-y-1 mb-4">
                            <li>Requesting access to personal information</li>
                            <li>Requesting correction of inaccurate information</li>
                            <li>Requesting deletion</li>
                            <li>Withdrawing consent where processing relies on consent</li>
                            <li>Requesting information regarding processing</li>
                            <li>Raising a grievance</li>
                            <li>Exercising other rights provided under applicable law</li>
                        </ul>
                        <p>
                            Requests may be subject to applicable legal limitations and verification requirements.
                        </p>

                        <hr className="my-8 border-gray-200" />

                        {/* 16. MARKETING COMMUNICATIONS */}
                        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mt-8 mb-4 text-brand-primary">16. MARKETING COMMUNICATIONS</h2>
                        <p>
                            You may opt out of promotional communications where an opt-out mechanism is provided.
                        </p>
                        <p>
                            However, we may continue sending essential service communications, including:
                        </p>
                        <ul className="list-disc pl-5 space-y-1 mb-4">
                            <li>Security notices</li>
                            <li>Account notifications</li>
                            <li>Booking/enquiry updates</li>
                            <li>Important service announcements</li>
                            <li>Legal or policy updates</li>
                        </ul>

                        <hr className="my-8 border-gray-200" />

                        {/* 17. CHILDREN’S PRIVACY */}
                        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mt-8 mb-4 text-brand-primary">17. CHILDREN’S PRIVACY</h2>
                        <p>
                            MessKhojo is not specifically designed as a children’s service.
                        </p>
                        <p>
                            We do not knowingly seek to collect personal information from children in violation of applicable law.
                        </p>
                        <p>
                            If we become aware that personal information has been collected from a child contrary to applicable requirements, we will take appropriate steps consistent with applicable law.
                        </p>
                        <div className="p-3 my-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-600 text-xs italic">
                            Our Play Console target-audience declaration and actual app functionality will determine whether additional Google Play Families requirements apply.
                        </div>

                        <hr className="my-8 border-gray-200" />

                        {/* 18. DATA ACCURACY */}
                        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mt-8 mb-4 text-brand-primary">18. DATA ACCURACY</h2>
                        <p>
                            You are responsible for ensuring that information you provide to MessKhojo is accurate, complete, and current.
                        </p>
                        <p>
                            If your information changes, you should update it where the App provides such functionality or contact us.
                        </p>

                        <hr className="my-8 border-gray-200" />

                        {/* 19. USER-GENERATED CONTENT */}
                        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mt-8 mb-4 text-brand-primary">19. USER-GENERATED CONTENT</h2>
                        <p>
                            Reviews, ratings, photographs, feedback, listing information, and other content submitted through MessKhojo may be visible to other users depending on the feature.
                        </p>
                        <p>
                            We may moderate, remove, restrict, or investigate content that violates our Terms & Conditions or applicable law.
                        </p>

                        <hr className="my-8 border-gray-200" />

                        {/* 20. PROPERTY OWNER INFORMATION */}
                        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mt-8 mb-4 text-brand-primary">20. PROPERTY OWNER INFORMATION</h2>
                        <p>
                            MessKhojo may display property-related information obtained from:
                        </p>
                        <ul className="list-disc pl-5 space-y-1 mb-4">
                            <li>Property owners/managers</li>
                            <li>Publicly available sources</li>
                            <li>User submissions</li>
                            <li>MessKhojo verification activities</li>
                        </ul>
                        <p>Property information may include:</p>
                        <ul className="list-disc pl-5 space-y-1 mb-4">
                            <li>Property name</li>
                            <li>Contact information</li>
                            <li>Location</li>
                            <li>Photographs</li>
                            <li>Amenities</li>
                            <li>Pricing</li>
                            <li>Other listing information</li>
                        </ul>
                        <p>
                            Where appropriate, a property owner or authorised representative may request correction or removal of information, subject to verification and applicable law.
                        </p>

                        <hr className="my-8 border-gray-200" />

                        {/* 21. CHANGES TO THIS PRIVACY POLICY */}
                        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mt-8 mb-4 text-brand-primary">21. CHANGES TO THIS PRIVACY POLICY</h2>
                        <p>
                            We may update this Privacy Policy from time to time to reflect:
                        </p>
                        <ul className="list-disc pl-5 space-y-1 mb-4">
                            <li>New features</li>
                            <li>Changes in our business model</li>
                            <li>Changes in data practices</li>
                            <li>Changes in technology</li>
                            <li>Changes in applicable law</li>
                            <li>Changes required by Google Play or other platforms</li>
                        </ul>
                        <p>
                            When we make material changes, we may provide appropriate notice through the App, website, email, or other reasonable means.
                        </p>
                        <p>
                            The “Last Updated” date at the top of this Privacy Policy will indicate when it was most recently revised.
                        </p>

                        <hr className="my-8 border-gray-200" />

                        {/* 22. CONTACT AND GRIEVANCE */}
                        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mt-8 mb-4 text-brand-primary">22. CONTACT AND GRIEVANCE</h2>
                        <p>
                            If you have questions, concerns, or requests relating to your personal information or this Privacy Policy, you may contact us at:
                        </p>
                        <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 my-4">
                            <p className="font-bold text-gray-900 mb-1">MessKhojo</p>
                            <p className="text-gray-600 mb-1">Jayadebkasapa, Bardhanpur</p>
                            <p className="text-gray-600 mb-3">Balasore, Odisha – 756021, India</p>

                            <p className="font-semibold text-gray-800 mt-3 mb-1">Privacy / Data Contact:</p>
                            <a href="mailto:messkhojooperator@gmail.com" className="text-brand-primary hover:underline font-medium">
                                messkhojooperator@gmail.com
                            </a>

                            <p className="font-semibold text-gray-800 mt-3 mb-1">General Contact:</p>
                            <a href="mailto:messkhojobalasore@gmail.com" className="text-brand-primary hover:underline font-medium">
                                messkhojobalasore@gmail.com
                            </a>
                        </div>
                        <p>
                            We will review and respond to privacy-related requests in accordance with applicable law.
                        </p>

                        <hr className="my-8 border-gray-200" />

                        {/* 23. GOVERNING LAW */}
                        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mt-8 mb-4 text-brand-primary">23. GOVERNING LAW</h2>
                        <p>
                            This Privacy Policy will be interpreted in accordance with applicable laws of India, subject to any mandatory rights or protections applicable to you.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PrivacyPolicy;

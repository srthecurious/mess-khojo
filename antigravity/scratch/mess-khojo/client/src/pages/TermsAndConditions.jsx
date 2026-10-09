import React from 'react';
import Header from '../components/Header';
import { usePageSEO } from '../hooks/usePageSEO';

const TermsAndConditions = () => {
    usePageSEO({
        title: 'Terms and Conditions | MessKhojo',
        description: 'Read the official MessKhojo Terms & Conditions governing your access and use of our accommodation discovery platform.',
        canonicalUrl: 'https://messkhojo.com/terms-and-conditions',
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
                            TERMS & CONDITIONS
                        </h1>
                        <div className="flex flex-wrap gap-4 mt-3 text-xs font-semibold text-gray-500">
                            <span className="bg-gray-100 px-2.5 py-1 rounded-md">Last Updated: 28/09/2026</span>
                            <span className="bg-gray-100 px-2.5 py-1 rounded-md">Effective Date: 28/09/2026</span>
                        </div>
                    </div>

                    <div className="prose prose-slate max-w-none text-gray-700 leading-relaxed text-sm md:text-base">
                        <p className="font-semibold text-gray-900">Welcome to MessKhojo.</p>
                        <p>
                            These Terms & Conditions (“Terms”, “Terms and Conditions”) constitute a legally binding agreement between MessKhojo (“MessKhojo”, “we”, “us”, or “our”) and the person accessing or using our website, mobile application, and related services (“User”, “you”, or “your”).
                        </p>
                        <p>
                            These Terms govern your access to and use of the MessKhojo website, mobile application, and related services (collectively, the “Platform”).
                        </p>
                        <p>
                            By downloading, installing, accessing, registering for, or using the Platform, you acknowledge that you have read, understood, and agreed to these Terms.
                        </p>
                        <div className="p-4 my-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 font-medium text-sm">
                            If you do not agree with these Terms, please do not access or use the Platform.
                        </div>

                        <hr className="my-8 border-gray-200" />

                        {/* 1. ABOUT MESSKHOJO */}
                        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mt-8 mb-4 text-brand-primary">1. ABOUT MESSKHOJO</h2>
                        <h3 className="text-base md:text-lg font-bold text-gray-800 mt-4 mb-2">1.1 Nature of the Platform</h3>
                        <p>
                            MessKhojo is an online discovery and intermediary platform designed to help students, working professionals, and other individuals discover and connect with accommodation providers, including messes, hostels, PGs and similar accommodation options.
                        </p>
                        <p>The Platform may allow users to:</p>
                        <ul className="list-disc pl-5 space-y-1 mb-4">
                            <li>Search for accommodation;</li>
                            <li>Discover accommodation based on location;</li>
                            <li>Filter and compare available options;</li>
                            <li>View property information;</li>
                            <li>View photographs, facilities and other listing information;</li>
                            <li>View pricing information;</li>
                            <li>Contact property owners or managers;</li>
                            <li>Submit enquiries or booking requests;</li>
                            <li>View ratings and reviews;</li>
                            <li>Save or interact with listings;</li>
                            <li>Submit feedback; and</li>
                            <li>Use other features introduced by MessKhojo from time to time.</li>
                        </ul>

                        <h3 className="text-base md:text-lg font-bold text-gray-800 mt-6 mb-2">1.2 MessKhojo’s Role</h3>
                        <p>
                            MessKhojo acts primarily as an online intermediary and discovery platform connecting users (“Tenants”) with property owners, managers, or accommodation providers (“Hosts”).
                        </p>
                        <p>
                            Unless expressly stated otherwise, MessKhojo does not own, sell, rent, manage, operate, furnish, or control the properties displayed on the Platform.
                        </p>
                        <p>
                            MessKhojo is not itself the landlord, property owner, accommodation provider, or insurer merely because a property is displayed or discovered through the Platform.
                        </p>

                        <h3 className="text-base md:text-lg font-bold text-gray-800 mt-6 mb-2">1.3 Independent Providers</h3>
                        <p>
                            The accommodation displayed on MessKhojo may be owned or operated by independent Hosts.
                        </p>
                        <p>
                            The agreement concerning the actual accommodation, including occupancy, rent, deposit, rules, facilities, and other arrangements, is generally between the Tenant and the Host.
                        </p>
                        <p>
                            MessKhojo is not a party to such private arrangements unless expressly stated otherwise.
                        </p>

                        <hr className="my-8 border-gray-200" />

                        {/* 2. LISTINGS */}
                        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mt-8 mb-4 text-brand-primary">2. LISTINGS</h2>
                        <h3 className="text-base md:text-lg font-bold text-gray-800 mt-4 mb-2">2.1 Types of Listings</h3>
                        <p>MessKhojo may display different categories of listings, including:</p>
                        <p className="font-bold text-gray-900 mt-3 mb-1">MessKhojo Verified Listings</p>
                        <p>
                            These are listings that MessKhojo may have physically visited or otherwise verified according to its internal verification process. Verification is limited to the scope and date of the particular verification activity.
                        </p>
                        <p>A verified listing does not mean that:</p>
                        <ul className="list-disc pl-5 space-y-1 mb-4">
                            <li>The property will remain in the same condition;</li>
                            <li>Every property detail is permanently accurate;</li>
                            <li>The property is legally compliant in every respect;</li>
                            <li>The Host will always provide the advertised services;</li>
                            <li>The property is suitable for every user.</li>
                        </ul>
                        <p>Property conditions and information may change after verification.</p>

                        <p className="font-bold text-gray-900 mt-4 mb-1">User-Sourced Listings</p>
                        <p>
                            Some listings may be created or populated using information submitted by users, students, Hosts, members of the public, or other sources. MessKhojo may not physically inspect every such listing.
                        </p>
                        <p>
                            Accordingly, users should independently verify important information before entering into any arrangement.
                        </p>

                        <hr className="my-8 border-gray-200" />

                        {/* 3. SOURCES OF LISTING INFORMATION */}
                        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mt-8 mb-4 text-brand-primary">3. SOURCES OF LISTING INFORMATION</h2>
                        <p>Property-related information displayed on MessKhojo may be obtained from:</p>
                        <ul className="list-disc pl-5 space-y-1 mb-4">
                            <li>Hosts or property managers;</li>
                            <li>Information voluntarily submitted by users;</li>
                            <li>Publicly available sources;</li>
                            <li>Information collected or verified by MessKhojo;</li>
                            <li>Other legitimate sources.</li>
                        </ul>
                        <p>Such information may include:</p>
                        <ul className="list-disc pl-5 space-y-1 mb-4">
                            <li>Property name;</li>
                            <li>Owner or manager information;</li>
                            <li>Contact details;</li>
                            <li>Location;</li>
                            <li>Photographs;</li>
                            <li>Pricing;</li>
                            <li>Facilities;</li>
                            <li>Amenities;</li>
                            <li>Accommodation details;</li>
                            <li>Rules;</li>
                            <li>Other listing information.</li>
                        </ul>
                        <p>
                            MessKhojo may update, correct, modify, restrict, or remove listing information where appropriate.
                        </p>

                        <hr className="my-8 border-gray-200" />

                        {/* 4. PROPERTY OWNERSHIP AND LEGAL COMPLIANCE */}
                        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mt-8 mb-4 text-brand-primary">4. PROPERTY OWNERSHIP AND LEGAL COMPLIANCE</h2>
                        <p>
                            MessKhojo does not independently guarantee the legal status or ownership of every property listed on the Platform. Unless expressly stated otherwise, MessKhojo does not verify or guarantee:
                        </p>
                        <ul className="list-disc pl-5 space-y-1 mb-4">
                            <li>Ownership title;</li>
                            <li>Property registration;</li>
                            <li>Rental permissions;</li>
                            <li>Licences;</li>
                            <li>Zoning permissions;</li>
                            <li>Electricity approvals;</li>
                            <li>Water approvals;</li>
                            <li>Fire-safety compliance;</li>
                            <li>Municipal compliance;</li>
                            <li>Building approvals;</li>
                            <li>Other statutory or regulatory requirements.</li>
                        </ul>
                        <p>
                            The Host is responsible for ensuring that the property operated by them complies with applicable laws and regulations.
                        </p>
                        <p>
                            If MessKhojo becomes aware of potentially unlawful, fraudulent, unsafe, or materially misleading information, it may investigate, restrict, modify, suspend, or remove the relevant listing.
                        </p>

                        <hr className="my-8 border-gray-200" />

                        {/* 5. SEARCH, FILTERS AND RECOMMENDATIONS */}
                        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mt-8 mb-4 text-brand-primary">5. SEARCH, FILTERS AND RECOMMENDATIONS</h2>
                        <p>
                            MessKhojo may provide search, filtering, sorting, ranking, comparison, or recommendation features. Results may depend on factors including:
                        </p>
                        <ul className="list-disc pl-5 space-y-1 mb-4">
                            <li>Location;</li>
                            <li>Search terms;</li>
                            <li>User-selected preferences;</li>
                            <li>Budget;</li>
                            <li>Listing information;</li>
                            <li>Availability;</li>
                            <li>Relevance;</li>
                            <li>Verification status;</li>
                            <li>Platform functionality;</li>
                            <li>Other legitimate ranking factors.</li>
                        </ul>
                        <p>
                            The position of a listing in search results does not necessarily constitute an endorsement or guarantee by MessKhojo.
                        </p>

                        <hr className="my-8 border-gray-200" />

                        {/* 6. ACCOUNT REGISTRATION */}
                        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mt-8 mb-4 text-brand-primary">6. ACCOUNT REGISTRATION</h2>
                        <p>
                            Certain features may require users to create an account. When creating an account, you agree to provide accurate, current, and complete information.
                        </p>
                        <p>You must not:</p>
                        <ul className="list-disc pl-5 space-y-1 mb-4">
                            <li>Create an account using false information;</li>
                            <li>Impersonate another person;</li>
                            <li>Create an account for fraudulent purposes;</li>
                            <li>Use another person’s account without permission;</li>
                            <li>Provide another person’s personal information without lawful authority.</li>
                        </ul>
                        <p>
                            You are responsible for maintaining the security of your account credentials and authentication information.
                        </p>

                        <hr className="my-8 border-gray-200" />

                        {/* 7. ACCOUNT SECURITY */}
                        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mt-8 mb-4 text-brand-primary">7. ACCOUNT SECURITY</h2>
                        <p>
                            You are responsible for taking reasonable steps to protect your account. You must not share passwords, OTPs, authentication codes, or other security credentials with unauthorised persons.
                        </p>
                        <p>
                            If you suspect unauthorised access to your account, you should contact MessKhojo promptly.
                        </p>
                        <p>
                            MessKhojo may temporarily restrict an account where reasonably necessary to protect users, the Platform, or security.
                        </p>

                        <hr className="my-8 border-gray-200" />

                        {/* 8. BOOKING REQUESTS */}
                        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mt-8 mb-4 text-brand-primary">8. BOOKING REQUESTS</h2>
                        <p>
                            Where booking functionality is available, submitting a booking request through MessKhojo constitutes a request or offer to obtain accommodation and does not by itself guarantee acceptance or availability.
                        </p>
                        <p>
                            A booking is considered confirmed only when the applicable confirmation process has been completed and MessKhojo or the relevant Host has communicated confirmation.
                        </p>
                        <p>Submitting a booking request does not guarantee:</p>
                        <ul className="list-disc pl-5 space-y-1 mb-4">
                            <li>Availability;</li>
                            <li>Acceptance by the Host;</li>
                            <li>Property suitability;</li>
                            <li>Legal compliance;</li>
                            <li>Particular facilities;</li>
                            <li>Particular room conditions.</li>
                        </ul>

                        <hr className="my-8 border-gray-200" />

                        {/* 9. BOOKING VERIFICATION */}
                        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mt-8 mb-4 text-brand-primary">9. BOOKING VERIFICATION</h2>
                        <p>
                            Where MessKhojo operates a booking verification process, our support team may contact you through available communication channels, including telephone, WhatsApp, email, in-app communication, or other legitimate communication methods.
                        </p>
                        <p>The purpose may include verifying:</p>
                        <ul className="list-disc pl-5 space-y-1 mb-4">
                            <li>Your identity or contact information;</li>
                            <li>Your booking intent;</li>
                            <li>Accommodation requirements;</li>
                            <li>Booking details.</li>
                        </ul>
                        <p>You agree to cooperate reasonably with the verification process.</p>
                        <p>
                            If you fail to respond after reasonable attempts, MessKhojo may cancel or close the booking request.
                        </p>

                        <hr className="my-8 border-gray-200" />

                        {/* 10. SHARING OF CONTACT INFORMATION */}
                        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mt-8 mb-4 text-brand-primary">10. SHARING OF CONTACT INFORMATION</h2>
                        <p>
                            When you voluntarily initiate an enquiry or booking interaction with a Host, MessKhojo may share relevant contact or booking information with that Host to facilitate communication.
                        </p>
                        <p>
                            Similarly, MessKhojo may provide relevant Host contact information to the user. Such sharing is part of the Platform’s core intermediary functionality.
                        </p>
                        <p>
                            The handling of information by Hosts after it has been shared may also be subject to the Host’s own legal and privacy obligations. For details regarding personal-data processing, please refer to the MessKhojo Privacy Policy.
                        </p>

                        <hr className="my-8 border-gray-200" />

                        {/* 11. CANCELLATION */}
                        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mt-8 mb-4 text-brand-primary">11. CANCELLATION</h2>
                        <h3 className="text-base md:text-lg font-bold text-gray-800 mt-4 mb-2">11.1 Before Confirmation</h3>
                        <p>
                            Where applicable, users may cancel a booking request before confirmation through the available Platform mechanism or by contacting MessKhojo.
                        </p>
                        <h3 className="text-base md:text-lg font-bold text-gray-800 mt-6 mb-2">11.2 After Confirmation</h3>
                        <p>
                            Once a booking has been confirmed, cancellation may require contacting MessKhojo support and/or the relevant Host. The applicable cancellation conditions may depend on the specific booking and Host.
                        </p>
                        <p>
                            Repeated unjustified cancellations or misuse of the booking system may result in restrictions on the user’s account.
                        </p>

                        <hr className="my-8 border-gray-200" />

                        {/* 12. PAYMENTS AND FEES */}
                        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mt-8 mb-4 text-brand-primary">12. PAYMENTS AND FEES</h2>
                        <h3 className="text-base md:text-lg font-bold text-gray-800 mt-4 mb-2">12.1 Current Platform Model</h3>
                        <p>
                            As of the date of these Terms, MessKhojo does not currently charge commission or service fees to Tenants or Hosts for using the Platform, unless expressly stated otherwise for a particular service or promotion.
                        </p>
                        <h3 className="text-base md:text-lg font-bold text-gray-800 mt-6 mb-2">12.2 Direct Payments</h3>
                        <p>
                            Where accommodation payments, rent, security deposits, advances, or other amounts are payable directly to a Host, those payments are transactions between the Tenant and Host. MessKhojo does not currently process, hold, or transfer such accommodation payments unless expressly stated otherwise.
                        </p>
                        <h3 className="text-base md:text-lg font-bold text-gray-800 mt-6 mb-2">12.3 Payment Disputes</h3>
                        <p>Where MessKhojo does not process the payment, disputes concerning:</p>
                        <ul className="list-disc pl-5 space-y-1 mb-4">
                            <li>Rent;</li>
                            <li>Deposits;</li>
                            <li>Advances;</li>
                            <li>Refunds;</li>
                            <li>Payment failures;</li>
                            <li>Charges;</li>
                            <li>Payment receipts</li>
                        </ul>
                        <p>
                            are primarily between the Tenant and Host. MessKhojo may assist with communication where reasonably possible but does not guarantee resolution of such disputes.
                        </p>
                        <h3 className="text-base md:text-lg font-bold text-gray-800 mt-6 mb-2">12.4 Future Payment Features</h3>
                        <p>
                            If MessKhojo introduces online payment, subscriptions, commissions, paid services, or other monetisation mechanisms, additional terms may apply. The applicable pricing, payment, cancellation, and refund terms will be communicated to users where required.
                        </p>

                        <hr className="my-8 border-gray-200" />

                        {/* 13. PROMOTIONAL CASHBACK AND OFFERS */}
                        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mt-8 mb-4 text-brand-primary">13. PROMOTIONAL CASHBACK AND OFFERS</h2>
                        <p>
                            MessKhojo may introduce promotional offers, rewards, cashback, coupons, referral benefits, or similar incentives. Such promotions may be subject to additional terms, eligibility criteria, expiry dates, limits, verification requirements, or other conditions.
                        </p>
                        <p>Unless expressly stated otherwise, promotional benefits:</p>
                        <ul className="list-disc pl-5 space-y-1 mb-4">
                            <li>Are not guaranteed;</li>
                            <li>May be withdrawn where permitted;</li>
                            <li>May not be transferable;</li>
                            <li>May be subject to fraud or abuse checks.</li>
                        </ul>
                        <p>
                            MessKhojo may refuse or cancel promotional benefits where it reasonably believes they have been obtained through misuse, fraud, or violation of applicable terms.
                        </p>

                        <hr className="my-8 border-gray-200" />

                        {/* 14. UTILITIES AND PROPERTY-RELATED PAYMENTS */}
                        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mt-8 mb-4 text-brand-primary">14. UTILITIES AND PROPERTY-RELATED PAYMENTS</h2>
                        <p>MessKhojo does not generally verify or guarantee the payment status of:</p>
                        <ul className="list-disc pl-5 space-y-1 mb-4">
                            <li>Electricity bills;</li>
                            <li>Water bills;</li>
                            <li>Maintenance charges;</li>
                            <li>Municipal dues;</li>
                            <li>Internet charges;</li>
                            <li>Other property-related expenses.</li>
                        </ul>
                        <p>
                            Any disagreement regarding such expenses is generally between the Tenant and Host. Users should clarify applicable charges and responsibilities with the Host before entering into an accommodation arrangement.
                        </p>

                        <hr className="my-8 border-gray-200" />

                        {/* 15. USER RESPONSIBILITIES */}
                        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mt-8 mb-4 text-brand-primary">15. USER RESPONSIBILITIES</h2>
                        <p>You agree to:</p>
                        <ul className="list-disc pl-5 space-y-1 mb-4">
                            <li>Provide accurate information;</li>
                            <li>Use the Platform lawfully;</li>
                            <li>Respect Hosts and other users;</li>
                            <li>Follow applicable property rules;</li>
                            <li>Respect contractual arrangements entered into with Hosts;</li>
                            <li>Verify important accommodation information before committing;</li>
                            <li>Protect your account credentials;</li>
                            <li>Use the Platform responsibly.</li>
                        </ul>
                        <p>You are responsible for your conduct when interacting with Hosts and using accommodation.</p>

                        <hr className="my-8 border-gray-200" />

                        {/* 16. HOST RULES */}
                        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mt-8 mb-4 text-brand-primary">16. HOST RULES</h2>
                        <p>Individual properties may have their own rules and conditions. These may include rules relating to:</p>
                        <ul className="list-disc pl-5 space-y-1 mb-4">
                            <li>Entry and exit;</li>
                            <li>Visitors;</li>
                            <li>Curfew;</li>
                            <li>Occupancy;</li>
                            <li>Property use;</li>
                            <li>Behaviour;</li>
                            <li>Payments;</li>
                            <li>Maintenance;</li>
                            <li>Security;</li>
                            <li>Other property-specific requirements.</li>
                        </ul>
                        <p>
                            MessKhojo does not generally create or control Host-specific rules. Users should review and understand applicable Host rules before agreeing to stay at a property.
                        </p>

                        <hr className="my-8 border-gray-200" />

                        {/* 17. PROPERTY DAMAGE AND PERSONAL CONDUCT */}
                        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mt-8 mb-4 text-brand-primary">17. PROPERTY DAMAGE AND PERSONAL CONDUCT</h2>
                        <p>Users are responsible for their conduct at any accommodation they occupy.</p>
                        <p>
                            Damage to property, theft, violations of Host rules, or similar incidents are generally matters between the Tenant and Host. MessKhojo is not responsible for damage caused by a user to a Host’s property.
                        </p>
                        <p>Likewise, MessKhojo does not guarantee the conduct of an independent Host or other occupant.</p>
                        <p>Nothing in these Terms limits rights that cannot legally be excluded.</p>

                        <hr className="my-8 border-gray-200" />

                        {/* 18. REVIEWS AND RATINGS */}
                        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mt-8 mb-4 text-brand-primary">18. REVIEWS AND RATINGS</h2>
                        <p>
                            MessKhojo may allow users to rate or review properties. Reviews should be based on genuine experiences and should be honest, relevant, and non-misleading.
                        </p>
                        <p>You must not:</p>
                        <ul className="list-disc pl-5 space-y-1 mb-4">
                            <li>Create fake reviews;</li>
                            <li>Manipulate ratings;</li>
                            <li>Review a property without a genuine basis;</li>
                            <li>Threaten a Host with a negative review;</li>
                            <li>Offer or accept improper incentives for reviews;</li>
                            <li>Impersonate another person;</li>
                            <li>Post defamatory or unlawful material;</li>
                            <li>Include another person’s private information without appropriate authority.</li>
                        </ul>
                        <p>
                            MessKhojo may moderate, restrict, or remove reviews that violate these Terms or applicable law. MessKhojo does not guarantee that every review is accurate or represents the views of MessKhojo.
                        </p>

                        <hr className="my-8 border-gray-200" />

                        {/* 19. FEEDBACK AND COMPLAINTS */}
                        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mt-8 mb-4 text-brand-primary">19. FEEDBACK AND COMPLAINTS</h2>
                        <p>
                            Users may submit feedback or complaints through the Platform or available support channels. Where appropriate, MessKhojo may communicate a complaint to the relevant Host and facilitate communication between the parties.
                        </p>
                        <p>MessKhojo is not a judicial authority and generally cannot compel an independent Host to:</p>
                        <ul className="list-disc pl-5 space-y-1 mb-4">
                            <li>Provide a refund;</li>
                            <li>Change property conditions;</li>
                            <li>Accept a complaint;</li>
                            <li>Modify a contract;</li>
                            <li>Provide compensation.</li>
                        </ul>
                        <p>Nothing in this section limits any legal rights available to a user.</p>

                        <hr className="my-8 border-gray-200" />

                        {/* 20. CLAIMING OR CORRECTING LISTINGS */}
                        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mt-8 mb-4 text-brand-primary">20. CLAIMING OR CORRECTING LISTINGS</h2>
                        <p>
                            A Host or authorised representative may request to claim, modify, correct, or remove a listing. MessKhojo may request reasonable information to verify the claimant’s authority.
                        </p>
                        <p>After verification, MessKhojo may:</p>
                        <ul className="list-disc pl-5 space-y-1 mb-4">
                            <li>Update information;</li>
                            <li>Transfer listing management;</li>
                            <li>Correct inaccurate information;</li>
                            <li>Remove information;</li>
                            <li>Remove the listing where appropriate.</li>
                        </ul>
                        <p>Until verification is completed, MessKhojo may retain the listing in its existing form.</p>

                        <hr className="my-8 border-gray-200" />

                        {/* 21. USER-GENERATED CONTENT */}
                        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mt-8 mb-4 text-brand-primary">21. USER-GENERATED CONTENT</h2>
                        <p>
                            Users may submit photographs, reviews, ratings, comments, feedback, or other content. You represent that you have the necessary rights to submit such content.
                        </p>
                        <p>You must not submit content that:</p>
                        <ul className="list-disc pl-5 space-y-1 mb-4">
                            <li>Is unlawful;</li>
                            <li>Is fraudulent;</li>
                            <li>Infringes intellectual-property rights;</li>
                            <li>Violates privacy;</li>
                            <li>Contains malicious software;</li>
                            <li>Is abusive or threatening;</li>
                            <li>Is materially misleading;</li>
                            <li>Contains unnecessary sensitive personal information.</li>
                        </ul>
                        <p>
                            By submitting content, you grant MessKhojo a non-exclusive, worldwide, royalty-free licence to host, reproduce, display, distribute, adapt, and use the content as reasonably necessary to operate, improve, and promote the Platform.
                        </p>
                        <p>MessKhojo may remove or restrict content that violates these Terms or applicable law.</p>

                        <hr className="my-8 border-gray-200" />

                        {/* 22. PROHIBITED ACTIVITIES */}
                        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mt-8 mb-4 text-brand-primary">22. PROHIBITED ACTIVITIES</h2>
                        <p>You must not use MessKhojo to:</p>
                        <ol className="list-decimal pl-5 space-y-1 mb-4 font-medium text-gray-800">
                            <li>Commit fraud;</li>
                            <li>Impersonate another person;</li>
                            <li>Create fraudulent accounts;</li>
                            <li>Submit false information;</li>
                            <li>Manipulate reviews;</li>
                            <li>Harass or threaten users or Hosts;</li>
                            <li>Upload malware;</li>
                            <li>Attempt unauthorised access;</li>
                            <li>Circumvent Platform security;</li>
                            <li>Scrape or systematically extract data without permission;</li>
                            <li>Use bots or automated systems to abuse the Platform;</li>
                            <li>Interfere with Platform operation;</li>
                            <li>Reverse engineer the Platform except where legally permitted;</li>
                            <li>Copy substantial Platform content without permission;</li>
                            <li>Conduct unlawful commercial activity;</li>
                            <li>Violate another person’s privacy;</li>
                            <li>Infringe intellectual-property rights;</li>
                            <li>Use the Platform for unlawful purposes;</li>
                            <li>Attempt to exploit vulnerabilities;</li>
                            <li>Encourage another person to violate these Terms.</li>
                        </ol>

                        <hr className="my-8 border-gray-200" />

                        {/* 23. HOST RESPONSIBILITIES */}
                        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mt-8 mb-4 text-brand-primary">23. HOST RESPONSIBILITIES</h2>
                        <p>
                            Hosts using MessKhojo are responsible for ensuring that information they provide is accurate and lawful.
                        </p>
                        <p>Hosts must not:</p>
                        <ul className="list-disc pl-5 space-y-1 mb-4">
                            <li>Create fraudulent listings;</li>
                            <li>Misrepresent property facilities;</li>
                            <li>Misrepresent pricing;</li>
                            <li>Upload misleading photographs;</li>
                            <li>Manipulate reviews;</li>
                            <li>Harass users;</li>
                            <li>Misuse user information;</li>
                            <li>Engage in discriminatory unlawful conduct;</li>
                            <li>Provide materially false information;</li>
                            <li>Use the Platform for fraudulent purposes.</li>
                        </ul>
                        <p>Hosts are responsible for complying with applicable laws governing their property and activities.</p>

                        <hr className="my-8 border-gray-200" />

                        {/* 24. VERIFICATION */}
                        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mt-8 mb-4 text-brand-primary">24. VERIFICATION</h2>
                        <p>
                            MessKhojo may introduce verification badges, labels, or other indicators. Verification only indicates that MessKhojo has performed the particular verification activity associated with that designation.
                        </p>
                        <p>It does not constitute a guarantee of:</p>
                        <ul className="list-disc pl-5 space-y-1 mb-4">
                            <li>Property quality;</li>
                            <li>Safety;</li>
                            <li>Legal compliance;</li>
                            <li>Permanent accuracy;</li>
                            <li>Availability;</li>
                            <li>Host behaviour;</li>
                            <li>Future condition of the property.</li>
                        </ul>

                        <hr className="my-8 border-gray-200" />

                        {/* 25. SAFETY AND INDEPENDENT VERIFICATION */}
                        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mt-8 mb-4 text-brand-primary">25. SAFETY AND INDEPENDENT VERIFICATION</h2>
                        <p>
                            Users should exercise reasonable caution before entering into any accommodation arrangement. Before making a commitment, users should independently verify information that is important to them, including:
                        </p>
                        <ul className="list-disc pl-5 space-y-1 mb-4">
                            <li>Property location;</li>
                            <li>Facilities;</li>
                            <li>Pricing;</li>
                            <li>Availability;</li>
                            <li>Rules;</li>
                            <li>Deposit requirements;</li>
                            <li>Identity of the Host;</li>
                            <li>Payment arrangements;</li>
                            <li>Applicable accommodation conditions.</li>
                        </ul>
                        <p>MessKhojo does not guarantee that an accommodation will meet every user’s expectations.</p>

                        <hr className="my-8 border-gray-200" />

                        {/* 26. THIRD-PARTY SERVICES */}
                        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mt-8 mb-4 text-brand-primary">26. THIRD-PARTY SERVICES</h2>
                        <p>
                            The Platform may integrate third-party services, including services relating to maps, authentication, hosting, analytics, notifications, communications, security, and payments (where introduced).
                        </p>
                        <p>
                            Use of third-party services may be subject to separate terms and policies. MessKhojo is not responsible for third-party services to the extent they operate independently of MessKhojo.
                        </p>

                        <hr className="my-8 border-gray-200" />

                        {/* 27. INTELLECTUAL PROPERTY */}
                        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mt-8 mb-4 text-brand-primary">27. INTELLECTUAL PROPERTY</h2>
                        <p>
                            All intellectual property in the Platform owned by or licensed to MessKhojo, including MessKhojo name, logo, brand identity, software, interface, graphics, design, original text, platform functionality, and other proprietary materials is protected by applicable law.
                        </p>
                        <p>
                            Except as permitted by law or with written permission, you must not copy, reproduce, modify, distribute, sell, lease, license, or commercially exploit such materials.
                        </p>

                        <hr className="my-8 border-gray-200" />

                        {/* 28. TRADEMARKS */}
                        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mt-8 mb-4 text-brand-primary">28. TRADEMARKS</h2>
                        <p>
                            MessKhojo and its associated names, logos, marks, designs, and branding are owned by or licensed to MessKhojo. You may not use MessKhojo branding without prior written permission.
                        </p>

                        <hr className="my-8 border-gray-200" />

                        {/* 29. MOBILE APPLICATION LICENCE */}
                        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mt-8 mb-4 text-brand-primary">29. MOBILE APPLICATION LICENCE</h2>
                        <p>
                            Subject to these Terms, MessKhojo grants you a limited, non-exclusive, non-transferable, revocable licence to install and use the App for lawful personal use.
                        </p>
                        <p>You must not:</p>
                        <ul className="list-disc pl-5 space-y-1 mb-4">
                            <li>Copy or redistribute the App;</li>
                            <li>Sell or sublicense the App;</li>
                            <li>Modify the App;</li>
                            <li>Attempt to extract source code;</li>
                            <li>Circumvent technical restrictions;</li>
                            <li>Use the App to build a competing service through unauthorised extraction or scraping.</li>
                        </ul>
                        <p>Nothing in these Terms restricts rights that cannot legally be restricted.</p>

                        <hr className="my-8 border-gray-200" />

                        {/* 30. GOOGLE PLAY AND APP STORE REQUIREMENTS */}
                        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mt-8 mb-4 text-brand-primary">30. GOOGLE PLAY AND APP STORE REQUIREMENTS</h2>
                        <p>
                            The MessKhojo App may be distributed through Google Play and other applicable app stores. Your use of the App is also subject to the relevant app store’s applicable terms and policies.
                        </p>
                        <p>
                            MessKhojo may update the App where reasonably necessary to comply with platform requirements, security requirements, privacy requirements, applicable laws, and technical standards.
                        </p>
                        <p>
                            Google Play’s policies may impose additional requirements relating to privacy, user data, permissions, account deletion, user-generated content, payments, and other areas. MessKhojo will seek to comply with requirements applicable to its Services.
                        </p>

                        <hr className="my-8 border-gray-200" />

                        {/* 31. PRIVACY */}
                        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mt-8 mb-4 text-brand-primary">31. PRIVACY</h2>
                        <p>
                            Your use of MessKhojo is also governed by the MessKhojo Privacy Policy. The Privacy Policy explains how MessKhojo collects, uses, stores, shares, and protects personal information.
                        </p>
                        <p>The Privacy Policy forms an integral part of your relationship with MessKhojo.</p>

                        <hr className="my-8 border-gray-200" />

                        {/* 32. COMMUNICATIONS */}
                        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mt-8 mb-4 text-brand-primary">32. COMMUNICATIONS</h2>
                        <p>
                            MessKhojo may send communications necessary to operate the Platform, including OTPs, account notifications, booking-related communications, enquiry notifications, security alerts, important service announcements, and policy updates.
                        </p>
                        <p>
                            Where permitted by law, MessKhojo may also send promotional communications. Users may opt out of promotional communications through available mechanisms. Essential service communications may continue where reasonably necessary.
                        </p>

                        <hr className="my-8 border-gray-200" />

                        {/* 33. PLATFORM AVAILABILITY */}
                        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mt-8 mb-4 text-brand-primary">33. PLATFORM AVAILABILITY</h2>
                        <p>
                            MessKhojo attempts to maintain reliable Platform availability but does not guarantee uninterrupted or error-free operation. The Platform may be temporarily unavailable because of maintenance, updates, technical problems, security measures, network failures, third-party service failures, or circumstances beyond our reasonable control.
                        </p>
                        <p>MessKhojo may modify, suspend, or discontinue particular features.</p>

                        <hr className="my-8 border-gray-200" />

                        {/* 34. DISCLAIMER OF WARRANTIES */}
                        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mt-8 mb-4 text-brand-primary">34. DISCLAIMER OF WARRANTIES</h2>
                        <p>
                            To the maximum extent permitted by applicable law, the Platform is provided on an “as is” and “as available” basis. MessKhojo does not guarantee that:
                        </p>
                        <ul className="list-disc pl-5 space-y-1 mb-4">
                            <li>The Platform will always be available;</li>
                            <li>Information will always be complete or error-free;</li>
                            <li>Every listing will be accurate;</li>
                            <li>Every property will meet user expectations;</li>
                            <li>Every Host will behave appropriately;</li>
                            <li>A particular accommodation will be available;</li>
                            <li>A booking request will be accepted.</li>
                        </ul>
                        <p>Nothing in these Terms excludes statutory rights that cannot legally be excluded.</p>

                        <hr className="my-8 border-gray-200" />

                        {/* 35. LIMITATION OF LIABILITY */}
                        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mt-8 mb-4 text-brand-primary">35. LIMITATION OF LIABILITY</h2>
                        <p>
                            To the maximum extent permitted by applicable law, MessKhojo shall not be liable for indirect, incidental, special, consequential, or punitive losses arising from or relating to:
                        </p>
                        <ul className="list-disc pl-5 space-y-1 mb-4">
                            <li>Use of the Platform;</li>
                            <li>Inability to use the Platform;</li>
                            <li>Independent Host conduct;</li>
                            <li>Property conditions;</li>
                            <li>Property-related incidents;</li>
                            <li>Incorrect or outdated listing information;</li>
                            <li>User-to-Host disputes;</li>
                            <li>Payment disputes where MessKhojo does not process the payment;</li>
                            <li>Third-party services;</li>
                            <li>Unauthorised conduct of third parties;</li>
                            <li>Technical interruptions.</li>
                        </ul>
                        <p>
                            MessKhojo’s liability, if any, will be determined subject to applicable law. Nothing in these Terms excludes or limits liability that cannot legally be excluded or limited.
                        </p>

                        <hr className="my-8 border-gray-200" />

                        {/* 36. INDEMNIFICATION */}
                        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mt-8 mb-4 text-brand-primary">36. INDEMNIFICATION</h2>
                        <p>
                            To the extent permitted by applicable law, you agree to indemnify and hold harmless MessKhojo and its officers, employees, representatives, affiliates, and authorised personnel from claims, losses, liabilities, costs, and expenses arising from:
                        </p>
                        <ul className="list-disc pl-5 space-y-1 mb-4">
                            <li>Your violation of these Terms;</li>
                            <li>Your unlawful use of the Platform;</li>
                            <li>Fraudulent activity;</li>
                            <li>Your submitted content;</li>
                            <li>Your violation of another person’s rights;</li>
                            <li>Your dealings with Hosts;</li>
                            <li>Your misuse of the Platform.</li>
                        </ul>
                        <p>This provision does not apply to the extent that the relevant loss is caused by MessKhojo’s own unlawful conduct.</p>

                        <hr className="my-8 border-gray-200" />

                        {/* 37. SUSPENSION OR TERMINATION */}
                        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mt-8 mb-4 text-brand-primary">37. SUSPENSION OR TERMINATION</h2>
                        <p>
                            MessKhojo may suspend, restrict, or terminate access to an account or listing where reasonably necessary, including where: these Terms are violated; fraud is suspected; illegal activity is suspected; false information is provided; Platform security is threatened; the Platform is abused; a listing is fraudulent; or a legal obligation requires action.
                        </p>
                        <p>
                            Where appropriate, MessKhojo may provide notice or an opportunity to remedy a violation. Immediate action may be taken where reasonably necessary to protect users, the Platform, or legal rights.
                        </p>

                        <hr className="my-8 border-gray-200" />

                        {/* 38. ACCOUNT DELETION */}
                        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mt-8 mb-4 text-brand-primary">38. ACCOUNT DELETION</h2>
                        <p>
                            If you have created a MessKhojo account, you may request account deletion through the mechanism provided within the App and/or the designated web-based deletion mechanism.
                        </p>
                        <p>Account deletion may result in loss of access to:</p>
                        <ul className="list-disc pl-5 space-y-1 mb-4">
                            <li>Your account;</li>
                            <li>Saved listings;</li>
                            <li>Preferences;</li>
                            <li>Reviews;</li>
                            <li>Other account-associated features.</li>
                        </ul>
                        <p>
                            MessKhojo will process account deletion requests in accordance with its Privacy Policy and applicable law. Certain information may be retained where legally required or reasonably necessary for security, fraud prevention, dispute resolution, or legal compliance.
                        </p>

                        <hr className="my-8 border-gray-200" />

                        {/* 39. GRIEVANCE AND CUSTOMER SUPPORT */}
                        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mt-8 mb-4 text-brand-primary">39. GRIEVANCE AND CUSTOMER SUPPORT</h2>
                        <p>
                            For questions, complaints, listing issues, privacy concerns, or other Platform-related matters, users may contact MessKhojo through the available support channels:
                        </p>
                        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 my-4 space-y-2 text-sm">
                            <p className="font-bold text-gray-900">Grievance & Support Contacts</p>
                            <p><strong>General Support:</strong> <a href="mailto:messkhojobalasore@gmail.com" className="text-brand-primary hover:underline">messkhojobalasore@gmail.com</a></p>
                            <p><strong>Privacy/Data Contact:</strong> <a href="mailto:messkhojooperator@gmail.com" className="text-brand-primary hover:underline">messkhojooperator@gmail.com</a></p>
                            <p><strong>Telephone:</strong> <a href="tel:+919692819621" className="text-brand-primary hover:underline">+91 96928 19621</a></p>
                        </div>
                        <p>
                            MessKhojo will review complaints in accordance with applicable law and its internal procedures.
                        </p>

                        <hr className="my-8 border-gray-200" />

                        {/* 40. DISPUTES BETWEEN USERS AND HOSTS */}
                        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mt-8 mb-4 text-brand-primary">40. DISPUTES BETWEEN USERS AND HOSTS</h2>
                        <p>
                            Where a dispute concerns the actual accommodation or service provided by an independent Host, users should first attempt to resolve the matter directly with the Host.
                        </p>
                        <p>
                            MessKhojo may facilitate communication where appropriate. However, MessKhojo does not guarantee that an independent Host will provide a refund, compensation, replacement accommodation, or other remedy.
                        </p>
                        <p>Nothing in these Terms prevents a user from exercising rights available under applicable law.</p>

                        <hr className="my-8 border-gray-200" />

                        {/* 41. GOVERNING LAW */}
                        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mt-8 mb-4 text-brand-primary">41. GOVERNING LAW</h2>
                        <p>
                            These Terms shall be governed by and interpreted in accordance with the laws of India.
                        </p>
                        <p>
                            Subject to applicable mandatory law, the courts having appropriate jurisdiction at Balasore, Odisha, India shall have jurisdiction over disputes arising in connection with these Terms or the Platform.
                        </p>

                        <hr className="my-8 border-gray-200" />

                        {/* 42. CHANGES TO THESE TERMS */}
                        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mt-8 mb-4 text-brand-primary">42. CHANGES TO THESE TERMS</h2>
                        <p>
                            MessKhojo may update these Terms from time to time to reflect new features, changes to the business model, new services, changes in data practices, changes in applicable law, regulatory requirements, security requirements, and changes to Platform functionality.
                        </p>
                        <p>
                            Where changes are material, MessKhojo may provide reasonable notice through the App, website, email, or other appropriate means. The updated Terms will contain a revised “Last Updated” date.
                        </p>
                        <p>
                            Your continued use of the Platform after the effective date of updated Terms may constitute acceptance of the revised Terms to the extent permitted by law.
                        </p>

                        <hr className="my-8 border-gray-200" />

                        {/* 43. SEVERABILITY */}
                        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mt-8 mb-4 text-brand-primary">43. SEVERABILITY</h2>
                        <p>
                            If any provision of these Terms is found to be invalid or unenforceable, that provision shall be interpreted to the maximum extent permitted by law, and the remaining provisions shall continue in effect.
                        </p>

                        <hr className="my-8 border-gray-200" />

                        {/* 44. NO WAIVER */}
                        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mt-8 mb-4 text-brand-primary">44. NO WAIVER</h2>
                        <p>
                            Failure by MessKhojo to enforce any provision of these Terms immediately does not constitute a waiver of its right to enforce that provision in the future.
                        </p>

                        <hr className="my-8 border-gray-200" />

                        {/* 45. ENTIRE AGREEMENT */}
                        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mt-8 mb-4 text-brand-primary">45. ENTIRE AGREEMENT</h2>
                        <p>
                            These Terms, together with the MessKhojo Privacy Policy and any additional terms expressly applicable to specific features, constitute the agreement governing your use of the Platform.
                        </p>
                        <p>
                            Where a specific service has additional terms, those terms will apply to that service to the extent of any inconsistency.
                        </p>

                        <hr className="my-8 border-gray-200" />

                        {/* 46. CONTACT INFORMATION */}
                        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mt-8 mb-4 text-brand-primary">46. CONTACT INFORMATION</h2>
                        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 my-4 space-y-2 text-sm">
                            <p className="font-extrabold text-base text-gray-900">MessKhojo</p>
                            <p className="text-gray-600">Jayadebkasapa, Bardhanpur<br />Balasore, Odisha – 756021<br />India</p>
                            <div className="pt-2 space-y-1">
                                <p><strong>Email:</strong> <a href="mailto:messkhojobalasore@gmail.com" className="text-brand-primary hover:underline">messkhojobalasore@gmail.com</a></p>
                                <p><strong>Privacy/Data Contact:</strong> <a href="mailto:messkhojooperator@gmail.com" className="text-brand-primary hover:underline">messkhojooperator@gmail.com</a></p>
                                <p><strong>Phone:</strong> <a href="tel:+919692819621" className="text-brand-primary hover:underline">+91 96928 19621</a></p>
                                <p><strong>Website:</strong> <a href="https://messkhojo.com" target="_blank" rel="noopener noreferrer" className="text-brand-primary hover:underline">messkhojo.com</a></p>
                            </div>
                        </div>

                        <div className="p-4 mt-8 bg-purple-50 border border-purple-200 rounded-xl text-purple-900 font-semibold text-center text-sm">
                            By using MessKhojo, you acknowledge that you have read and understood these Terms & Conditions and agree to comply with them.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TermsAndConditions;

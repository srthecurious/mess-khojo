import React from 'react';
import Header from '../components/Header';

const TermsAndConditions = () => {
    return (
        <div className="min-h-screen bg-brand-secondary">
            <Header />
            <div className="max-w-4xl mx-auto p-6 md:p-10">
                <div className="bg-white rounded-3xl shadow-sm border border-brand-light-gray p-8 md:p-12">
                    <h1 className="text-3xl md:text-4xl font-bold text-brand-text-dark mb-6">TERMS AND CONDITIONS</h1>
                    <div className="prose prose-lg text-gray-600">
                        <p className="mb-4">Last Updated: February 05, 2026</p>

                        <p className="mb-4"><strong>Welcome to MessKhojo!</strong></p>
                        <p className="mb-4">
                            These Terms and Conditions constitute a legally binding agreement between you ("User", "you", or "your") and MessKhojo (doing business as messkhojo.com) ("we", "us", or "our"), regarding your access to and use of our website (https://messkhojo.com/), mobile application, and related services (collectively, the "Platform").
                        </p>
                        <p className="mb-4">
                            By accessing or using the Platform, you agree to be bound by these Terms. If you disagree with any part of these Terms, you may not access the Platform.
                        </p>

                        <h2 className="text-2xl font-bold text-gray-800 mt-8 mb-4">1. NATURE OF SERVICES</h2>

                        <p className="mb-2 font-semibold">1.1. Platform Role:</p>
                        <p className="mb-4">MessKhojo acts exclusively as an online intermediary and discovery platform connecting students and individuals seeking accommodation ("Tenants") with hostel/mess owners and PG manager ("Hosts").</p>

                        <p className="mb-2 font-semibold">1.2. No Ownership:</p>
                        <p className="mb-4">We do not own, sell, resell, furnish, provide, rent, re-rent, manage, or control any of the properties listed on our Platform. We are not a real estate broker or an insurer.</p>

                        <p className="mb-2 font-semibold">1.3. Listings Types:</p>
                        <ul className="list-disc pl-5 mb-4">
                            <li className="mb-2"><strong>MessKhojo Verified:</strong> These listings have been physically visited by our team to verify the existence and basic accuracy of the property at the time of verification. However, property conditions can change, and we do not guarantee that the property will remain in the same condition indefinitely.</li>
                            <li className="mb-2"><strong>User-Sourced Listings:</strong> These listings are created based on data provided by students, users, or the public. MessKhojo does not physically verify these listings. We do not guarantee the accuracy, quality, or safety of User-Sourced listings. Users access these listings at their own risk.</li>
                        </ul>

                        <p className="mb-2 font-semibold">1.4. Data Source Disclosure:</p>
                        <ul className="list-disc pl-5 mb-4">
                            <li className="mb-2">Property-related information, including owner name, contact details, photographs, and location, may be obtained from: (a) Information voluntarily provided by Hosts, (b) publicly available sources, or (c) User-contributed submissions.</li>
                            <li className="mb-2">If a Host does not consent to the continued display of such information, they may request modification or removal, subject to verification. Until such request is processed, the listing may remain categorized as a User-Sourced listing.</li>
                        </ul>

                        <p className="mb-2 font-semibold">1.5. Legal Compliance Disclaimer:</p>
                        <ul className="list-disc pl-5 mb-4">
                            <li className="mb-2">MessKhojo does not verify the legal status, ownership title, registration, licenses, zoning permissions, electricity connections, water supply approvals, fire safety compliance, or any other statutory or regulatory compliance of any listed property.</li>
                            <li className="mb-2">The responsibility to ensure that a property is lawful, compliant, and fit for accommodation rests solely with the respective Host. MessKhojo shall not be held liable for any illegal, unauthorised, or non-compliant property listing.</li>
                        </ul>

                        <h2 className="text-2xl font-bold text-gray-800 mt-8 mb-4">2. BOOKINGS AND CANCELLATIONS</h2>

                        <p className="mb-2 font-semibold">2.1. Booking Request:</p>
                        <p className="mb-4">When you submit a booking request through the Platform, it constitutes an offer to book the accommodation. This is not a confirmed booking until verified. Submission of a booking request does not guarantee availability, legality, or acceptance by the Host.</p>

                        <p className="mb-2 font-semibold">2.2. Verification & Confirmation Process:</p>
                        <ul className="list-disc pl-5 mb-4">
                            <li className="mb-2">After a booking request is made, our Support Team will attempt to contact you via WhatsApp, email, or phone call to verify your details and intent.</li>
                            <li className="mb-2"><strong>Mandatory Response:</strong> You must respond to our verification attempts. If you fail to respond after reasonable attempts by our team, your booking request will be automatically cancelled.</li>
                            <li className="mb-2">Upon successful verification, we will share the Host’s contact details with you and your details with the Host.</li>
                        </ul>

                        <p className="mb-2 font-semibold">2.3. Cancellations:</p>
                        <ul className="list-disc pl-5 mb-4">
                            <li className="mb-2"><strong>Pre-Confirmation:</strong> You may cancel a request via the Platform before it is confirmed. You must specify a valid reason for the cancellation.</li>
                            <li className="mb-2"><strong>Post-Confirmation:</strong> Once a booking is confirmed (after our verification call/message), you cannot cancel it directly through the Platform. To cancel a confirmed booking, you must contact MessKhojo support or the Host directly.</li>
                            <li className="mb-2">Repeated unjustified cancellations may result in the suspension of your account.</li>
                        </ul>

                        <h2 className="text-2xl font-bold text-gray-800 mt-8 mb-4">3. PAYMENTS AND FEES</h2>

                        <p className="mb-2 font-semibold">3.1. No Platform Fees:</p>
                        <p className="mb-4">Currently, MessKhojo does not charge any commission or service fees to Tenants or Hosts for using the Platform.</p>

                        <p className="mb-2 font-semibold">3.2. Direct Payments:</p>
                        <p className="mb-4">All rental payments, security deposits, and advances must be paid directly to the Host. MessKhojo does not process, hold, or transfer funds.</p>

                        <p className="mb-2 font-semibold">3.3. No Liability for Payments:</p>
                        <p className="mb-4">Since we do not handle money, MessKhojo is not responsible for any refunds, payment disputes, or financial losses arising from transactions between Tenants and Hosts.</p>

                        <p className="mb-2 font-semibold">3.4. Promotional Cashback:</p>
                        <p className="mb-4">We may, at our sole discretion, offer promotional "Cashback" or cash coupons to users who successfully book through our Platform. These offers will be governed by specific terms released at the time of the promotion. Cashback is a reward, not a right, and is subject to successful booking verification.</p>

                        <p className="mb-2 font-semibold">3.5. Utilities and Bills Disclaimer:</p>
                        <p className="mb-4">MessKhojo does not verify or guarantee the payment status of electricity bills, water bills, maintenance charges, municipal dues, or any other utility-related obligations of a Host. Any dispute or issue regarding utilities shall be strictly between the Tenant and the Host. MessKhojo bears no responsibility for disconnection, non-payment, or misrepresentation of utility services.</p>

                        <h2 className="text-2xl font-bold text-gray-800 mt-8 mb-4">4. USER CONDUCT AND RESPONSIBILITIES</h2>

                        <p className="mb-2 font-semibold">4.1. Accuracy of Information:</p>
                        <p className="mb-4">You agree to provide accurate, current, and complete information during the booking process.</p>

                        <p className="mb-2 font-semibold">4.2. Host Rules:</p>
                        <p className="mb-4">Every Mess/Hostel has its own specific rulebook (e.g., curfew, guest policies, food timings). MessKhojo does not dictate these rules. You need to agree to abide by the rules set by the Host.</p>

                        <p className="mb-2 font-semibold">4.3. Property Damage:</p>
                        <p className="mb-4">You are solely responsible for your conduct at the accommodation. Any damage to the property, theft, or violation of Host rules is a matter strictly between you and the Host. MessKhojo expressly disclaims any liability for such incidents.</p>

                        <h2 className="text-2xl font-bold text-gray-800 mt-8 mb-4">5. REVIEWS, FEEDBACK, AND DISPUTES</h2>

                        <p className="mb-2 font-semibold">5.1. Feedback Mechanism:</p>
                        <p className="mb-4">If you face a bad experience, you may submit feedback or a complaint through the Platform. Our team acts as a communication bridge to notify the Specific Host for the discrepancy.</p>

                        <p className="mb-2 font-semibold">5.2. Dispute Resolution:</p>
                        <p className="mb-4">While we facilitate communication regarding complaints, MessKhojo is not a judicial body. We cannot force a Host to provide a refund or improve facilities.</p>

                        <p className="mb-2 font-semibold">5.3. Ratings:</p>
                        <p className="mb-4">Users can rate properties. We reserve the right to remove reviews that are abusive, fake, or irrelevant.</p>

                        <p className="mb-2 font-semibold">5.4. Listing Corrections:</p>
                        <p className="mb-4">If a Host or User finds false data in a User-Sourced listing, they may "Claim" the listing or report it. Our team will verify and update the information accordingly.</p>

                        <h2 className="text-2xl font-bold text-gray-800 mt-8 mb-4">6. LIMITATION OF LIABILITY</h2>

                        <p className="mb-2 font-semibold">6.1. "As Is" Service:</p>
                        <p className="mb-4">The Platform and content are provided on an "as is" and "as available" basis.</p>

                        <p className="mb-2 font-semibold">6.2. Disclaimer:</p>
                        <p className="mb-4">To the fullest extent permitted by law, MessKhojo disclaims all liability for:</p>
                        <ul className="list-disc pl-5 mb-4">
                            <li>Any errors or omissions in property descriptions (especially in User-Sourced listings).</li>
                            <li>Personal injury, property damage, or other damages resulting from your stay at any accommodation.</li>
                            <li>Any conduct or speech of any third party or Host.</li>
                            <li>Any payment disputes between you and the Host.</li>
                        </ul>

                        <h2 className="text-2xl font-bold text-gray-800 mt-8 mb-4">7. INTELLECTUAL PROPERTY</h2>
                        <p className="mb-4">The content on the Platform, including text, graphics, logos, and software, is the property of MessKhojo or its content suppliers and is protected by Indian copyright laws.</p>

                        <h2 className="text-2xl font-bold text-gray-800 mt-8 mb-4">8. GOVERNING LAW</h2>
                        <p className="mb-4">These Terms shall be governed by and defined following the laws of India. MessKhojo and yourself irrevocably consent that the courts of Balasore, Odisha shall have exclusive jurisdiction to resolve any dispute which may arise in connection with these terms.</p>

                        <h2 className="text-2xl font-bold text-gray-800 mt-8 mb-4">9. CONTACT US</h2>
                        <p className="mb-4">If you have questions or comments about these Terms, please contact us at:</p>
                        <ul className="list-disc pl-5 mb-4">
                            <li>Email: messkhojobalasore@gmail.com</li>
                            <li>Address: MessKhojo, Jayadebkasapa, Bardhanpur, Balasore, Odisha 756021, India.</li>
                        </ul>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default TermsAndConditions;

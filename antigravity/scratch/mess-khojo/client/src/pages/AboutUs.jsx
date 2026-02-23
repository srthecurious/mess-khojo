import React from 'react';
import { motion } from 'framer-motion';

const AboutUs = () => {
    return (
        <div className="min-h-screen bg-brand-secondary py-12 px-4 sm:px-6 lg:px-8 font-sans">
            <div className="max-w-3xl mx-auto mt-16">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="bg-white rounded-3xl p-8 md:p-12 shadow-xl border border-white/40"
                    style={{
                        boxShadow: `
                        0 8px 32px rgba(139, 92, 246, 0.05),
                        0 2px 8px rgba(0, 0, 0, 0.05)
                        `
                    }}
                >
                    <h1 className="text-3xl md:text-5xl font-extrabold text-brand-text-dark mb-6 text-center">About Us</h1>

                    <div className="prose prose-purple prose-lg text-brand-text-gray max-w-none space-y-6">
                        <p className="font-semibold text-lg text-brand-primary leading-relaxed">
                            Welcome to MessKhojo, your smart companion to find the perfect mess, hostel, or PG without stepping out of your home.
                        </p>

                        <p className="leading-relaxed">
                            MessKhojo is a digital platform available as both a <strong>mobile app</strong> and a <strong>website</strong>, designed to simplify the way students and working professionals search for accommodation. We understand how stressful and time-consuming it can be to find a comfortable stay in a new city. That's why we created MessKhojo to make the process simple, transparent, and convenient.
                        </p>

                        <h3 className="text-xl font-bold text-brand-text-dark mt-8 mb-4">Through our platform, users can:</h3>
                        <ul className="space-y-3 bg-purple-50/50 p-6 rounded-2xl border border-purple-100 list-disc list-inside">
                            <li>Explore verified messes, hostels, and PGs</li>
                            <li>View room details, pricing, and amenities</li>
                            <li>Compare options based on budget and preference</li>
                            <li>Get direct contact details of owners for easy communication</li>
                        </ul>

                        <p className="leading-relaxed mt-6">
                            Our mission is to bridge the gap between property owners and students by providing a smooth, reliable, and accessible platform. Whether you prefer browsing on our website or using our mobile app, MessKhojo ensures that your search experience is fast, clear, and hassle-free.
                        </p>

                        <p className="leading-relaxed">
                            We are committed to continuously improving our platform to make accommodation hunting easier, smarter, and more accessible for everyone.
                        </p>

                        <div className="mt-10 p-6 bg-gradient-to-r from-brand-primary/10 to-brand-accent-blue/10 rounded-2xl border border-brand-primary/20 text-center">
                            <p className="text-xl font-bold text-brand-primary italic">
                                "MessKhojo – Find your mess, find your comfort"
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default AboutUs;

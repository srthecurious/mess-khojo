import React from 'react';
import Header from '../components/Header';

const PrivacyPolicy = () => {
    return (
        <div className="min-h-screen bg-brand-secondary">
            <Header />
            <div className="max-w-4xl mx-auto p-6 md:p-10">
                <div className="bg-white rounded-3xl shadow-sm border border-brand-light-gray p-8 md:p-12">
                    <h1 className="text-3xl md:text-4xl font-bold text-brand-text-dark mb-6">Privacy Policy</h1>
                    <div className="prose prose-lg text-gray-600">
                        <p className="mb-4">Last updated: {new Date().toLocaleDateString()}</p>

                        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-8">
                            <p className="text-blue-700 font-medium">
                                Placeholder Content: Please replace the text below with your actual Privacy Policy.
                            </p>
                        </div>

                        <h2 className="text-xl font-bold text-gray-800 mt-8 mb-4">1. Introduction</h2>
                        <p>
                            Welcome to Mess Khojo. We refer to our website and app as the "Platform".
                            We are committed to protecting your personal information and your right to privacy.
                        </p>

                        <h2 className="text-xl font-bold text-gray-800 mt-8 mb-4">2. Information We Collect</h2>
                        <p>
                            We collect personal information that you verify voluntarily provide to us when you register on the Platform,
                            express an interest in obtaining information about us or our products and services, when you participate
                            in activities on the Platform, or otherwise when you contact us.
                        </p>

                        {/* Add your content here */}

                    </div>
                </div>
            </div>
        </div>
    );
};

export default PrivacyPolicy;

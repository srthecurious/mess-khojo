import React from 'react';
import Header from '../components/Header';

const TermsAndConditions = () => {
    return (
        <div className="min-h-screen bg-brand-secondary">
            <Header />
            <div className="max-w-4xl mx-auto p-6 md:p-10">
                <div className="bg-white rounded-3xl shadow-sm border border-brand-light-gray p-8 md:p-12">
                    <h1 className="text-3xl md:text-4xl font-bold text-brand-text-dark mb-6">Terms and Conditions</h1>
                    <div className="prose prose-lg text-gray-600">
                        <p className="mb-4">Last updated: {new Date().toLocaleDateString()}</p>

                        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-8">
                            <p className="text-blue-700 font-medium">
                                Placeholder Content: Please replace the text below with your actual Terms and Conditions.
                            </p>
                        </div>

                        <h2 className="text-xl font-bold text-gray-800 mt-8 mb-4">1. Agreement to Terms</h2>
                        <p>
                            These Terms of Use constitute a legally binding agreement made between you, whether personally or on behalf of an entity (“you”) and Mess Khojo ("Platform"),
                            concerning your access to and use of the Mess Khojo website and application.
                        </p>

                        <h2 className="text-xl font-bold text-gray-800 mt-8 mb-4">2. User Representations</h2>
                        <p>
                            By using the Platform, you represent and warrant that: (1) all registration information you submit will be true, accurate, current, and complete;
                            (2) you will maintain the accuracy of such information and promptly update such registration information as necessary.
                        </p>

                        {/* Add your content here */}

                    </div>
                </div>
            </div>
        </div>
    );
};

export default TermsAndConditions;

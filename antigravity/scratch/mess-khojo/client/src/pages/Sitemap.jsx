import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Header from '../components/Header';
import { BRAND } from '../constants';
import { usePageSEO } from '../hooks/usePageSEO';

const Sitemap = () => {
    const navigate = useNavigate();

    usePageSEO({
        title: 'Sitemap | MessKhojo',
        description: 'Browse all pages on MessKhojo including city listings, mess details, and more.',
        noindex: true,
    });

    return (
        <div className="min-h-screen bg-brand-secondary flex flex-col">
            <Header showSearch={false} messes={[]} />
            
            <div className="max-w-md mx-auto w-full px-6 py-8 flex-grow">
                {/* Header with Back Button */}
                <div className="flex items-center gap-4 mb-8">
                    <button 
                        onClick={() => navigate(-1)} 
                        className="w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-gray-50 active:scale-95 transition-all shrink-0"
                        aria-label="Go back"
                    >
                        <ArrowLeft size={18} className="text-brand-text-dark" />
                    </button>
                    <h2 className="text-xl font-bold text-brand-text-dark">Sitemap</h2>
                </div>

                {/* Sitemap Sections */}
                <div className="space-y-8 pl-2">
                    {/* Main Page */}
                    <div>
                        <h3 className="text-xs font-black tracking-wider text-brand-text-gray uppercase mb-3">
                            MAIN PAGE
                        </h3>
                        <ul className="list-disc pl-5 space-y-3 text-brand-text-dark">
                            <li>
                                <Link to="/" className="text-sm font-semibold text-brand-text-dark hover:text-brand-primary transition-colors">
                                    City Landing Page
                                </Link>
                            </li>
                            <li>
                                <Link to="/find-your-room" className="text-sm font-semibold text-brand-text-dark hover:text-brand-primary transition-colors">
                                    Find Your Room
                                </Link>
                            </li>
                            <li>
                                <Link to="/register-mess" className="text-sm font-semibold text-brand-text-dark hover:text-brand-primary transition-colors">
                                    Register Your Mess
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Cities */}
                    <div>
                        <h3 className="text-xs font-black tracking-wider text-brand-text-gray uppercase mb-3">
                            CITIES
                        </h3>
                        <ul className="list-disc pl-5 space-y-3 text-brand-text-dark">
                            <li>
                                <Link to="/district/balasore/city/baleshwar" className="text-sm font-semibold text-brand-text-dark hover:text-brand-primary transition-colors">
                                    Baleshwar
                                </Link>
                            </li>
                            <li>
                                <Link to="/district/balasore/city/remuna" className="text-sm font-semibold text-brand-text-dark hover:text-brand-primary transition-colors">
                                    Remuna
                                </Link>
                            </li>
                            <li>
                                <Link to="/district/bhadrak/city/bhadrak" className="text-sm font-semibold text-brand-text-dark hover:text-brand-primary transition-colors">
                                    Bhadrak
                                </Link>
                            </li>
                            <li>
                                <Link to="/district/bhadrak/city/basudevpur" className="text-sm font-semibold text-brand-text-dark hover:text-brand-primary transition-colors">
                                    Basudevpur
                                </Link>
                            </li>
                            <li>
                                <Link to="/district/mayurbhanj/city/baripada" className="text-sm font-semibold text-brand-text-dark hover:text-brand-primary transition-colors">
                                    Baripada
                                </Link>
                            </li>
                            <li>
                                <Link to="/district/jajpur/city/jajpur_road" className="text-sm font-semibold text-brand-text-dark hover:text-brand-primary transition-colors">
                                    Jajpur Road
                                </Link>
                            </li>
                            <li>
                                <Link to="/district/jajpur/city/jajpur_town" className="text-sm font-semibold text-brand-text-dark hover:text-brand-primary transition-colors">
                                    Jajpur Town
                                </Link>
                            </li>
                            <li>
                                <Link to="/district/khorda/city/bhubaneswar" className="text-sm font-semibold text-brand-text-dark hover:text-brand-primary transition-colors">
                                    Bhubaneswar
                                </Link>
                            </li>
                            <li>
                                <Link to="/district/khorda/city/khordha_town" className="text-sm font-semibold text-brand-text-dark hover:text-brand-primary transition-colors">
                                    Khordha Town
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Support and Legal */}
                    <div>
                        <h3 className="text-xs font-black tracking-wider text-brand-text-gray uppercase mb-3">
                            SUPPORT AND LEGAL
                        </h3>
                        <ul className="list-disc pl-5 space-y-3 text-brand-text-dark">
                            <li>
                                <Link to="/terms-and-conditions" className="text-sm font-semibold text-brand-text-dark hover:text-brand-primary transition-colors">
                                    Terms and Conditions
                                </Link>
                            </li>
                            <li>
                                <Link to="/privacy-policy" className="text-sm font-semibold text-brand-text-dark hover:text-brand-primary transition-colors">
                                    Privacy Policy
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Connect With Us */}
                    <div>
                        <h3 className="text-xs font-black tracking-wider text-brand-text-gray uppercase mb-3">
                            CONNECT WITH US
                        </h3>
                        <ul className="list-disc pl-5 space-y-3 text-brand-text-dark">
                            <li>
                                <a 
                                    href={`mailto:${BRAND.email}`} 
                                    className="text-sm font-semibold text-brand-text-dark hover:text-brand-primary transition-colors"
                                >
                                    Email Us
                                </a>
                            </li>
                            <li>
                                <a 
                                    href={BRAND.instagramUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="text-sm font-semibold text-brand-text-dark hover:text-brand-primary transition-colors"
                                >
                                    Instagram
                                </a>
                            </li>
                            <li>
                                <a 
                                    href={`https://wa.me/${BRAND.whatsappNumber}`} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="text-sm font-semibold text-brand-text-dark hover:text-brand-primary transition-colors"
                                >
                                    WhatsApp
                                </a>
                            </li>
                            <li>
                                <a 
                                    href={BRAND.whatsappCommunityUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="text-sm font-semibold text-brand-text-dark hover:text-brand-primary transition-colors"
                                >
                                    WhatsApp Community
                                </a>
                            </li>
                            <li>
                                <a 
                                    href={BRAND.telegramUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="text-sm font-semibold text-brand-text-dark hover:text-brand-primary transition-colors"
                                >
                                    Telegram Group
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Sitemap;

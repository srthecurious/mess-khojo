import React from 'react';
import { Phone, Mail, MapPin } from 'lucide-react';

const Footer = () => {
    return (
        <footer className="bg-white/80 backdrop-blur-md border-t border-purple-100 mt-12 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    {/* Brand & Trademark */}
                    <div className="text-center md:text-left">
                        <h3 className="text-2xl font-black text-black font-serif mb-2">Mess<span className="text-[#DF73FF]">Khojo</span></h3>
                        <p className="text-sm text-black/70 font-serif">
                            © {new Date().getFullYear()} MessKhojo. All rights reserved.
                        </p>
                        <p className="text-xs text-black/50 mt-1 font-serif">
                            Trade Mark Registered.
                        </p>
                    </div>

                    {/* Contact Us */}
                    <div className="flex flex-col items-center md:items-end gap-2">
                        <h4 className="font-bold text-black font-serif mb-1">Contact Us</h4>
                        <div className="flex items-center gap-2 text-sm text-black/80 font-serif">
                            <Mail size={14} />
                            <a href="mailto:support@messkhojo.com" className="hover:text-purple-600 transition-colors">support@messkhojo.com</a>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-black/80 font-serif">
                            <Phone size={14} />
                            <span>+91 96928 19621</span>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;

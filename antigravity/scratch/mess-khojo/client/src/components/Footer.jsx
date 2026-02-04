import React from 'react';
import { Phone, Mail, MapPin, Instagram } from 'lucide-react';

const Footer = () => {
    return (
        <footer className="bg-brand-primary mt-12 py-12 text-white border-t border-white/10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                    {/* Brand & Trademark */}
                    <div className="text-center md:text-left">
                        <h3 className="text-3xl font-bold mb-2 text-white">MessKhojo</h3>
                        <p className="text-sm text-white/70 font-medium">
                            © {new Date().getFullYear()} MessKhojo. All rights reserved.
                        </p>
                        <p className="text-xs text-white/40 mt-1 uppercase tracking-widest">
                            Trade Mark Registered
                        </p>
                        <div className="flex gap-4 mt-4 text-xs font-medium text-white/60">
                            <a href="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</a>
                            <span>•</span>
                            <a href="/terms-and-conditions" className="hover:text-white transition-colors">Terms & Conditions</a>
                        </div>
                    </div>

                    {/* Contact Us */}
                    <div className="flex flex-col items-center md:items-end gap-3">
                        <h4 className="font-bold text-lg text-white mb-1">Contact Us</h4>
                        <div className="flex items-center gap-3 text-sm text-white/90">
                            <Mail size={16} className="text-brand-accent-green" />
                            <a href="mailto:messkhojobalasore@gmail.com" className="hover:text-brand-accent-green transition-colors font-medium">messkhojobalasore@gmail.com</a>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-white/90">
                            <Instagram size={16} className="text-brand-accent-green" />
                            <a href="https://www.instagram.com/messkhojo?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==" target="_blank" rel="noopener noreferrer" className="hover:text-brand-accent-green transition-colors font-medium">Follow us on Instagram</a>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-white/90">
                            <Phone size={16} className="text-brand-accent-green" />
                            <span className="font-medium">+91 96928 19621</span>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;

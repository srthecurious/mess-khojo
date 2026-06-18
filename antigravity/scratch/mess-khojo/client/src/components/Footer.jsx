import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail, Instagram } from 'lucide-react';
import { BRAND } from '../constants';

const Footer = () => {
    return (
        <footer className="bg-[#300868] mt-12 py-12 text-white">
            <div className="max-w-7xl mx-auto px-6 sm:px-8 flex flex-col gap-8">
                {/* Brand Logo Row */}
                <div className="flex items-center gap-3">
                    <img
                        src="/logo.png"
                        alt="MessKhojo"
                        className="h-12 w-auto object-contain"
                    />
                    <span className="text-2xl font-bold text-white tracking-normal animate-fadeIn" style={{ fontFamily: 'Outfit, sans-serif' }}>
                        MessKhojo
                    </span>
                </div>

                {/* Footer Columns Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-4">
                    
                    {/* Support Section */}
                    <div className="flex flex-col items-start">
                        <h4 className="text-[11px] font-bold uppercase tracking-wider text-white/50 mb-4">
                            SUPPORT
                        </h4>
                        <div className="flex flex-col gap-4">
                            <a href="/terms-and-conditions" className="text-[15px] font-bold text-white hover:text-white/80 transition-colors">
                                Terms & Conditions
                            </a>
                            <a href="/privacy-policy" className="text-[15px] font-bold text-white hover:text-white/80 transition-colors">
                                Privacy Policy
                            </a>
                            <Link to="/sitemap" className="text-[15px] font-bold text-white hover:text-white/80 transition-colors">
                                Sitemap
                            </Link>
                        </div>
                    </div>

                    {/* Contact Us Section */}
                    <div className="flex flex-col items-start">
                        <h4 className="text-[11px] font-bold uppercase tracking-wider text-white/50 mb-4">
                            CONTACT US
                        </h4>
                        <div className="flex flex-col gap-4">
                            <a 
                                href={`mailto:${BRAND.email}`} 
                                className="flex items-center gap-3 text-[15px] font-bold text-white hover:text-white/80 transition-colors"
                            >
                                <Mail size={16} className="text-white shrink-0" />
                                <span className="break-all">{BRAND.email}</span>
                            </a>
                            <a 
                                href={BRAND.instagramUrl} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="flex items-center gap-3 text-[15px] font-bold text-white hover:text-white/80 transition-colors"
                            >
                                <Instagram size={16} className="text-white shrink-0" />
                                <span>Follow us on Instagram</span>
                            </a>
                            <div className="flex items-center gap-3 text-[15px] font-bold text-white">
                                <Phone size={16} className="text-white shrink-0" />
                                <span>{BRAND.phone}</span>
                            </div>
                        </div>
                    </div>

                    {/* Join Our Community Section */}
                    <div className="flex flex-col items-start">
                        <h4 className="text-[11px] font-bold uppercase tracking-wider text-white/50 mb-4">
                            JOIN OUR COMMUNITY
                        </h4>
                        <div className="flex flex-col gap-4">
                            <a 
                                href={BRAND.whatsappCommunityUrl} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="flex items-center gap-3 text-[15px] font-bold text-white hover:text-white/80 transition-colors"
                            >
                                <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] fill-current text-white shrink-0">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                </svg>
                                <span>Join Our WhatsApp Community</span>
                            </a>
                            <a 
                                href={BRAND.telegramUrl} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="flex items-center gap-3 text-[15px] font-bold text-white hover:text-white/80 transition-colors"
                            >
                                <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] fill-current text-white shrink-0">
                                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                                </svg>
                                <span>Join Our Telegram Group</span>
                            </a>
                        </div>
                    </div>

                </div>

                {/* Bottom Copyright */}
                <div className="mt-4">
                    <p className="text-[11px] font-bold text-white/50 tracking-wide">
                        ©MessKhojo 2026. All Rights Reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;

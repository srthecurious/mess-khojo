import React from 'react';
import { MapPin, ChevronDown } from 'lucide-react';
import { useDistrict } from '../context/DistrictContext';

const DistrictSwitcher = ({ theme = 'light' }) => {
    const { districtConfig, setIsDistrictSelectorOpen } = useDistrict();

    if (!districtConfig) return null;

    const isLight = theme === 'light';

    return (
        <button
            onClick={() => setIsDistrictSelectorOpen(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all group border ${
                isLight 
                    ? 'bg-white text-gray-700 hover:bg-gray-50 border-gray-200 shadow-sm' 
                    : 'bg-white/10 text-white hover:bg-white/20 border-white/20'
            }`}
            title="Change City"
        >
            <MapPin size={16} className={`${isLight ? 'text-brand-primary' : 'text-white'} group-hover:animate-bounce-in`} />
            <span className={`text-sm font-semibold whitespace-nowrap ${isLight ? 'inline' : 'hidden sm:inline'}`}>
                {districtConfig.name}
            </span>
            <ChevronDown size={14} className={isLight ? 'text-gray-400' : 'text-white/70'} />
        </button>
    );
};

export default DistrictSwitcher;

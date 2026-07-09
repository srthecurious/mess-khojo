import React from 'react';
import { MapPin, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { trackMessExplorer, trackRegisterMessClick } from '../analytics';

const MessExplorer = ({ cityId, districtId, compact = false }) => {
    const navigate = useNavigate();

    // Open Map by navigating to the new dedicated explorer route
    const handleOpenMap = React.useCallback(() => {
        trackMessExplorer('opened');
        if (districtId) {
            navigate(`/district/${districtId}/city/${cityId}/explorer`);
        } else {
            navigate(`/city/${cityId}/explorer`);
        }
    }, [navigate, districtId, cityId]);

    return (
        <>
            {/* Quick Actions Grid */}
            {!compact && (
                <div className="px-4 sm:px-6 lg:px-8 mb-0 max-w-md mx-auto sm:max-w-[1440px]">
                    <div className="grid grid-cols-2 gap-4">
                        {/* Mess Explorer Card */}
                        <button
                            onClick={handleOpenMap}
                            className="relative overflow-hidden flex items-center justify-between p-4 rounded-2xl bg-[#300868] text-white hover:bg-[#250453] active:scale-[0.98] transition-all duration-300 shadow-md text-left group"
                        >
                            <div className="flex flex-col">
                                <span className="text-sm sm:text-base font-bold tracking-tight leading-tight mb-0.5">Mess Explorer</span>
                                <span className="text-[9px] sm:text-xs font-medium text-white/80">View Interactive Map</span>
                            </div>
                            <MapPin size={20} className="text-white ml-2 shrink-0 group-hover:scale-105 transition-transform duration-300" />
                        </button>

                        {/* Register Your Mess Card */}
                        <button
                            onClick={() => {
                                trackRegisterMessClick('mess_explorer');
                                navigate('/register-mess');
                            }}
                            className="relative overflow-hidden flex items-center justify-between p-4 rounded-2xl bg-[#300868] text-white hover:bg-[#250453] active:scale-[0.98] transition-all duration-300 shadow-md text-left group"
                        >
                            <div className="flex flex-col">
                                <span className="text-sm sm:text-base font-bold tracking-tight leading-tight mb-0.5">Register Your Mess</span>
                                <span className="text-[9px] sm:text-xs font-medium text-white/80">Enroll Today!</span>
                            </div>
                            <Home size={20} className="text-white ml-2 shrink-0 group-hover:scale-105 transition-transform duration-300" />
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default MessExplorer;

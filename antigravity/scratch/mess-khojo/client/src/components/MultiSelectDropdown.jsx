import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

const MultiSelectDropdown = ({ label, options, selected, onChange, color = 'indigo', theme = 'dark' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, []);

    const selectedKeys = Object.keys(selected).filter(key => selected[key]);
    const selectedLabels = selectedKeys.map(key => {
        const option = options.find(opt => opt.key === key);
        return option ? option.label : key;
    });

    const displayText = selectedLabels.length > 0
        ? selectedLabels.join(', ')
        : 'Select amenities...';

    const getThemeClasses = () => {
        const isLight = theme === 'light';

        // Base styles based on theme
        const base = {
            button: isLight
                ? 'bg-white/90 backdrop-blur-sm border-2 border-purple-100 text-black shadow-sm hover:shadow-md'
                : 'bg-slate-900 border border-slate-700 text-white',
            dropdown: isLight
                ? 'bg-white border-purple-100'
                : 'bg-slate-800 border-slate-700',
            itemHover: isLight ? 'hover:bg-purple-50' : 'hover:bg-slate-700/50',
            checkboxEmpty: isLight
                ? 'bg-white border-gray-300 group-hover:border-purple-400'
                : 'bg-slate-900 border-slate-600 group-hover:border-slate-500',
            textSelected: isLight ? 'text-purple-700 font-bold' : 'text-white font-medium',
            textNormal: isLight ? 'text-gray-600 group-hover:text-gray-900' : 'text-slate-400 group-hover:text-slate-200',
            label: isLight ? 'text-gray-700' : 'text-slate-500'
        };

        // Color specific styles (Focused ring & Checked background)
        let colorStyles = {};
        if (color === 'cyan') {
            colorStyles = {
                focus: isLight ? 'focus:ring-cyan-400 focus:border-cyan-400' : 'focus:ring-cyan-500',
                checkedBg: 'bg-cyan-500',
                checkedText: isLight ? 'text-cyan-700' : 'text-cyan-400'
            };
        } else if (color === 'purple') {
            colorStyles = {
                focus: isLight ? 'focus:ring-purple-400 focus:border-purple-400' : 'focus:ring-purple-500',
                checkedBg: 'bg-purple-500',
                checkedText: isLight ? 'text-purple-700' : 'text-purple-400'
            };
        } else { // indigo default
            colorStyles = {
                focus: isLight ? 'focus:ring-indigo-400 focus:border-indigo-400' : 'focus:ring-indigo-500',
                checkedBg: 'bg-indigo-500',
                checkedText: isLight ? 'text-indigo-700' : 'text-indigo-400'
            };
        }

        return { ...base, ...colorStyles };
    };

    const styles = getThemeClasses();

    return (
        <div className="relative min-w-[200px]" ref={dropdownRef}>
            <label className={`block text-sm font-bold mb-2 ${styles.label}`}>{label}</label>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full rounded-xl px-4 py-2 text-left text-sm outline-none focus:ring-2 flex justify-between items-center transition-all ${styles.button} ${styles.focus}`}
            >
                <span className={`block truncate ${selectedLabels.length === 0 ? 'opacity-70' : ''}`}>
                    {displayText}
                </span>
                <ChevronDown size={16} className={`opacity-70 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className={`absolute z-[60] w-full mt-2 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 border ${styles.dropdown}`}>
                    <div className="max-h-60 overflow-y-auto p-2 space-y-1">
                        {options.map((option) => (
                            <label
                                key={option.key}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer group transition-colors ${styles.itemHover}`}
                            >
                                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors flex-shrink-0 ${selected[option.key]
                                    ? `${styles.checkedBg} border-transparent`
                                    : styles.checkboxEmpty
                                    }`}>
                                    {selected[option.key] && <Check size={14} className="text-white" />}
                                </div>
                                <input
                                    type="checkbox"
                                    className="hidden"
                                    checked={!!selected[option.key]}
                                    onChange={(e) => onChange(option.key, e.target.checked)}
                                />
                                <span className={`text-sm ${selected[option.key] ? styles.textSelected : styles.textNormal}`}>
                                    {option.label}
                                </span>
                            </label>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default MultiSelectDropdown;

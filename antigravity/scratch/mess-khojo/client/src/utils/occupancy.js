/**
 * Occupancy normalization helper function.
 * Converts various occupancy string representations into standardized digits ("1", "2", etc.).
 */
export const getCleanOccupancy = (val) => {
    if (!val) return '';
    const s = String(val).toLowerCase().trim();
    if (s === '1' || s === 'single' || s === '1 seater' || s.includes('single')) return '1';
    if (s === '2' || s === 'double' || s === '2 seater' || s.includes('double')) return '2';
    if (s === '3' || s === 'triple' || s === '3 seater' || s.includes('triple')) return '3';
    if (s === '4' || s === 'four' || s === '4 seater' || s.includes('four')) return '4';
    if (s === '5' || s === 'five' || s === '5 seater' || s.includes('five')) return '5';
    if (s === '6' || s === 'six' || s === '6 seater' || s.includes('six')) return '6';
    if (s === '8' || s === 'eight' || s === '8 seater' || s.includes('eight')) return '8';
    
    return val.toString().replace(/\s*(?:seater|sharing|room|beds?|seats?)\b/gi, '').trim();
};

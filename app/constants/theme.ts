
export const LIGHT_THEME = {
    background: ['#E0C3FC', '#8EC5FC'], // Soft Purple to Blue gradient
    primary: '#6C63FF',
    secondary: '#FF6584',
    text: '#2D3436',
    textSecondary: '#636E72',
    cardBg: 'rgba(255, 255, 255, 0.85)',
    white: '#FFFFFF',
    error: '#FF7675',
    success: '#55EFC4',
    iconBg: 'rgba(255,255,255,0.2)',
    tabBar: '#ffffff',
} as const;

export const DARK_THEME = {
    background: ['#2d3436', '#000000'], // Dark Gray to Black
    primary: '#a29bfe',
    secondary: '#ff7675',
    text: '#dfe6e9',
    textSecondary: '#b2bec3',
    cardBg: 'rgba(45, 52, 54, 0.85)',
    white: '#dfe6e9',
    error: '#d63031',
    success: '#00b894',
    iconBg: 'rgba(255,255,255,0.1)',
    tabBar: '#1e272e',
} as const;

export type ThemeColors = {
    background: readonly string[];
    primary: string;
    secondary: string;
    text: string;
    textSecondary: string;
    cardBg: string;
    white: string;
    error: string;
    success: string;
    iconBg: string;
    tabBar: string;
};

// Keep for backward compatibility until refactor is complete, but warn or mark deprecated ideally (not doing strictly here)
export const COLORS = LIGHT_THEME;


export const SHADOWS = {
    medium: {
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 8,
    },
    light: {
        shadowColor: "#6C63FF",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 4,
    }
};

export const FONTS = {
    // Assuming default fonts for now, but configured for easy swap
    regular: 'System',
    bold: 'System',
    weight: {
        regular: '400',
        medium: '600',
        bold: '800',
    }
};

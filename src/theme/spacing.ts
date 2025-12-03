// Clean Minimalist Educational Design System - Spacing & Layout
export const spacing = {
    // Base spacing unit (8px system)
    xs: 4,
    sm: 8,
    md: 12,
    base: 16,
    lg: 20,
    xl: 24,
    xxl: 32,
    xxxl: 40,
    huge: 48,

    // Specific use cases
    cardPadding: 20,
    screenPadding: 20,
    sectionGap: 16,
    itemGap: 12,
};

// Border Radius tokens - More subtle
export const borderRadius = {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    round: 999, // Fully rounded (pills)
};

// Shadow elevations - Much more subtle
export const shadows = {
    none: {
        shadowColor: 'transparent',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0,
        shadowRadius: 0,
        elevation: 0,
    },
    sm: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 3,
        elevation: 1,
    },
    md: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    lg: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 3,
    },
    xl: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
        elevation: 4,
    },
};

// Common component dimensions
export const dimensions = {
    buttonHeight: 48,
    inputHeight: 48,
    iconSize: {
        sm: 16,
        md: 20,
        lg: 24,
        xl: 32,
        xxl: 48,
    },
    minTouchTarget: 44, // Accessibility minimum
};

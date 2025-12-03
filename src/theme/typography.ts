import { Platform } from 'react-native';

// Clean Minimalist Educational Design System - Typography
export const typography = {
    // Font Families - Explicitly defined for cross-platform reliability
    fontFamily: {
        heading: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
        body: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    },

    // Font Sizes - Larger for better readability
    fontSize: {
        h1: 28,      // Main titles
        h2: 24,      // Section titles
        h3: 20,      // Subsection titles
        subtitle: 18, // Subtitles
        body: 16,    // Body text
        bodySmall: 14, // Small body text
        label: 14,   // Labels
        caption: 12, // Captions and notes
    },

    // Font Weights - Using standard weights supported by system fonts
    fontWeight: {
        regular: '400' as const,
        medium: '500' as const,
        semibold: '600' as const,
        bold: '700' as const,
        extrabold: '800' as const,
    },

    // Line Heights
    lineHeight: {
        tight: 1.2,
        normal: 1.5,
        relaxed: 1.75,
    },

    // Letter Spacing
    letterSpacing: {
        tight: -0.5,
        normal: 0,
        wide: 0.5,
        wider: 1,
    },
};

// Typography Presets for common use cases
export const textStyles = {
    h1: {
        fontFamily: typography.fontFamily.heading,
        fontSize: typography.fontSize.h1,
        fontWeight: typography.fontWeight.bold,
        lineHeight: typography.fontSize.h1 * typography.lineHeight.tight,
        letterSpacing: typography.letterSpacing.normal,
        color: '#1A1A1A', // Ensure high contrast
    },
    h2: {
        fontFamily: typography.fontFamily.heading,
        fontSize: typography.fontSize.h2,
        fontWeight: typography.fontWeight.bold,
        lineHeight: typography.fontSize.h2 * typography.lineHeight.tight,
        letterSpacing: typography.letterSpacing.normal,
        color: '#1A1A1A',
    },
    h3: {
        fontFamily: typography.fontFamily.heading,
        fontSize: typography.fontSize.h3,
        fontWeight: typography.fontWeight.semibold,
        lineHeight: typography.fontSize.h3 * typography.lineHeight.normal,
        color: '#1A1A1A',
    },
    h4: {
        fontFamily: typography.fontFamily.heading,
        fontSize: typography.fontSize.subtitle,
        fontWeight: typography.fontWeight.semibold,
        lineHeight: typography.fontSize.subtitle * typography.lineHeight.normal,
        color: '#1A1A1A',
    },
    subtitle: {
        fontFamily: typography.fontFamily.body,
        fontSize: typography.fontSize.subtitle,
        fontWeight: typography.fontWeight.medium,
        lineHeight: typography.fontSize.subtitle * typography.lineHeight.normal,
        color: '#333333',
    },
    body: {
        fontFamily: typography.fontFamily.body,
        fontSize: typography.fontSize.body,
        fontWeight: typography.fontWeight.regular,
        lineHeight: typography.fontSize.body * typography.lineHeight.normal,
        color: '#333333',
    },
    bodySmall: {
        fontFamily: typography.fontFamily.body,
        fontSize: typography.fontSize.bodySmall,
        fontWeight: typography.fontWeight.regular,
        lineHeight: typography.fontSize.bodySmall * typography.lineHeight.normal,
        color: '#444444',
    },
    label: {
        fontFamily: typography.fontFamily.body,
        fontSize: typography.fontSize.label,
        fontWeight: typography.fontWeight.semibold,
        lineHeight: typography.fontSize.label * typography.lineHeight.normal,
        color: '#333333',
    },
    caption: {
        fontFamily: typography.fontFamily.body,
        fontSize: typography.fontSize.caption,
        fontWeight: typography.fontWeight.medium,
        lineHeight: typography.fontSize.caption * typography.lineHeight.normal,
        color: '#666666',
    },
    button: {
        fontFamily: typography.fontFamily.body,
        fontSize: typography.fontSize.body,
        fontWeight: typography.fontWeight.bold,
        lineHeight: typography.fontSize.body * typography.lineHeight.normal,
        color: '#FFFFFF',
    },
};

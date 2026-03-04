// Mapping between the token used and the color
export const colorMap = {
    // ----- Surfaces -----

    // Default page background. If this changes, make sure to adapt the native side as well:
    //  - JitsiMeetView.m
    //  - JitsiMeetView.java
    uiBackground: 'surface01',
    uiBackground01: 'primary06',

    // Container backgrounds
    ui01: 'surface02',
    ui02: 'surface03',
    ui03: 'surface04',
    ui04: 'surface05',
    ui05: 'surface06',
    ui06: 'surface07',
    ui07: 'surface08',
    ui08: 'surface09',
    ui09: 'surface10',
    ui10: 'surface11',
    ui11: 'primary06',
    ui12: 'support10',

    // ----- Actions -----

    // Primary
    action01: 'primary06',
    action01Hover: 'primary07',
    action01Active: 'primary04',

    // Secondary
    action02: 'surface10',
    action02Hover: 'surface11',
    action02Active: 'surface09',

    // Destructive
    actionDanger: 'error05',
    actionDangerHover: 'error06',
    actionDangerActive: 'error04',

    // Tertiary
    action03: 'transparent',
    action03Hover: 'surface04',
    action03Active: 'surface03',

    // Disabled
    disabled01: 'surface09',

    // Focus
    focus01: 'primary07',

    // ----- Links -----

    link01: 'primary07',
    link01Hover: 'primary08',
    link01Active: 'primary06',

    // ----- Text -----

    // Primary
    text01: 'surface11',

    // Secondary
    text02: 'surface09',

    // Tertiary
    text03: 'surface07',

    // High-contrast
    text04: 'surface01',

    // overflowmenu
    text05: 'primary05',

    // Error
    textError: 'error08',

    // ----- Icons -----

    // Primary
    icon01: 'primary05',

    // Secondary
    icon02: 'surface09',

    // Tertiary
    icon03: 'surface07',

    // High-contrast
    icon04: 'surface01',

    // Error
    iconError: 'error06',

    // Normal
    iconNormal: 'action04',

    // Success
    iconSuccess: 'alertGreen',

    // Warning
    iconWarning: 'warning01',

    // ----- Forms -----

    field01: 'surface04',

    // ----- Feedback -----

    // Success
    success01: 'success05',
    success02: 'success04',

    // Warning
    warning01: 'warning05',
    warning02: 'warning06',

    // ----- Support -----

    support01: 'support01',
    support02: 'support02',
    support03: 'support03',
    support04: 'support04',
    support05: 'support05',
    support06: 'support06',
    support07: 'support07',
    support08: 'support08',
    support09: 'support09'
};


export const font = {
    weightRegular: 400,
    weightSemiBold: 600
};

export const shape = {
    borderRadius: 6,
    circleRadius: 50,
    boxShadow: 'inset 0px -1px 0px rgba(255, 255, 255, 0.15)'
};

export const spacing = [ 0, 4, 8, 16, 24, 32, 40, 48, 56, 64, 72, 80, 88, 96, 104, 112, 120, 128 ];

export const typography = {
    labelRegular: 'label01',

    labelBold: 'labelBold01',

    bodyShortRegularSmall: {
        fontSize: '0.625rem',
        lineHeight: '1rem',
        fontWeight: font.weightRegular,
        letterSpacing: 0
    },

    bodyShortRegular: {
        fontSize: '0.875rem',
        lineHeight: '1.25rem',
        fontWeight: font.weightRegular,
        letterSpacing: 0
    },

    bodyShortBold: {
        fontSize: '0.875rem',
        lineHeight: '1.25rem',
        fontWeight: font.weightSemiBold,
        letterSpacing: 0
    },

    bodyShortRegularLarge: {
        fontSize: '1rem',
        lineHeight: '1.375rem',
        fontWeight: font.weightRegular,
        letterSpacing: 0
    },

    bodyShortBoldLarge: {
        fontSize: '1rem',
        lineHeight: '1.375rem',
        fontWeight: font.weightSemiBold,
        letterSpacing: 0
    },

    bodyLongRegular: {
        fontSize: '0.875rem',
        lineHeight: '1.5rem',
        fontWeight: font.weightRegular,
        letterSpacing: 0
    },

    bodyLongRegularLarge: {
        fontSize: '1rem',
        lineHeight: '1.625rem',
        fontWeight: font.weightRegular,
        letterSpacing: 0
    },

    bodyLongBold: {
        fontSize: '0.875rem',
        lineHeight: '1.5rem',
        fontWeight: font.weightSemiBold,
        letterSpacing: 0
    },

    bodyLongBoldLarge: {
        fontSize: '1rem',
        lineHeight: '1.625rem',
        fontWeight: font.weightSemiBold,
        letterSpacing: 0
    },

    heading1: 'heading01',

    heading2: 'heading02',

    heading3: {
        fontSize: '2rem',
        lineHeight: '2.5rem',
        fontWeight: font.weightSemiBold,
        letterSpacing: 0
    },

    heading4: {
        fontSize: '1.75rem',
        lineHeight: '2.25rem',
        fontWeight: font.weightSemiBold,
        letterSpacing: 0
    },

    heading5: {
        fontSize: '1.25rem',
        lineHeight: '1.75rem',
        fontWeight: font.weightSemiBold,
        letterSpacing: 0
    },

    heading6: {
        fontSize: '1rem',
        lineHeight: '1.625rem',
        fontWeight: font.weightSemiBold,
        letterSpacing: 0
    }
};

export const breakpoints = {
    values: {
        '0': 0,
        '320': 320,
        '400': 400,
        '480': 480
    }
};

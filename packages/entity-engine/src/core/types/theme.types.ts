export interface IEntityEngineTheme {
    colors: {
        primary: string;
        secondary: string;
        success: string;
        warning: string;
        error: string;
        background: {
            main: string;
            secondary: string;
            accent: string;
        };
        text: {
            primary: string;
            secondary: string;
            muted: string;
        };
        border: {
            default: string;
            light: string;
            strong: string;
        };
    };
    spacing: {
        xs: string;
        sm: string;
        md: string;
        lg: string;
        xl: string;
    };
    typography: {
        fontFamily: {
            sans: string;
            mono: string;
        };
        fontSize: {
            xs: string;
            sm: string;
            base: string;
            lg: string;
            xl: string;
        };
    };
    borderRadius: {
        sm: string;
        md: string;
        lg: string;
    };
    shadows: {
        sm: string;
        md: string;
        lg: string;
    };
}

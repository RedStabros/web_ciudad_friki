import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type Theme =
    | 'dark-friki'
    | 'light-friki'
    | 'amoled'
    | 'pastel'
    | 'neon'
    | 'autumn'
    | 'midnight'
    | 'abyss'
    | 'sky'
    | 'crimson'
    | 'desert'
    | 'teal'
    | 'pastel-purple'
    | 'pastel-mint'
    | 'pastel-peach'
    | 'retro-gb'
    | 'hacker'
    | 'fantasy'
    | 'steampunk'
    | 'galactic';

interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setTheme] = useState<Theme>(() => {
        const saved = localStorage.getItem('ciudad-friki-theme');
        return (saved as Theme) || 'dark-friki';
    });

    useEffect(() => {
        // Remove all previous theme classes or attributes if necessary
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('ciudad-friki-theme', theme);

        // Update meta theme-color for mobile browsers based on theme
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (metaThemeColor) {
            const themeColors: Record<string, string> = {
                'dark-friki': '#1e222a',
                'light-friki': '#ffffff',
                'amoled': '#000000',
                'pastel': '#fef3f8',
                'neon': '#0f0f23',
                'autumn': '#2d1b0e',
                'midnight': '#1a0b2e',
                'abyss': '#0b1120',
                'sky': '#e0f2fe',
                'crimson': '#1a0404',
                'desert': '#fef3c7',
                'teal': '#083344',
                'pastel-purple': '#fbf5ff',
                'pastel-mint': '#f0fdf4',
                'pastel-peach': '#fffbeb',
                'retro-gb': '#8bac0f',
                'hacker': '#000000',
                'fantasy': '#0e1a12',
                'steampunk': '#2b1b17',
                'galactic': '#080d1a'
            };
            metaThemeColor.setAttribute('content', themeColors[theme] || '#111827');
        }
    }, [theme]);

    return (
        <ThemeContext.Provider value={{ theme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}

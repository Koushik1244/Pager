"use client";

import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext({
    dark: false,
    toggleTheme: () => { },
});

export const ThemeProvider = ({ children }: any) => {
    const [dark, setDark] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem("theme");
        if (saved === "dark") {
            setDark(true);
            document.documentElement.classList.add("dark");
        }
    }, []);

    const toggleTheme = () => {
        const newDark = !dark;
        setDark(newDark);

        if (newDark) {
            document.documentElement.classList.add("dark");
            localStorage.setItem("theme", "dark");
        } else {
            document.documentElement.classList.remove("dark");
            localStorage.setItem("theme", "light");
        }
    };

    return (
        <ThemeContext.Provider value={{ dark, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);

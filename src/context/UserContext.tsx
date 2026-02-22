"use client";

import { createContext, useContext, useState, useEffect } from "react";

type UserType = {
    walletAddress: string;
    username: string;
    _id: string;
} | null;

type UserContextType = {
    user: UserType;
    setUser: (user: UserType) => void;
};

const UserContext = createContext<UserContextType>({
    user: null,
    setUser: () => { },
});

export const UserProvider = ({ children }: any) => {
    const [user, setUser] = useState<UserType>(null);

    // Load from localStorage on refresh
    useEffect(() => {
        const storedUser = localStorage.getItem("pagerUser");
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    // Save whenever user changes
    useEffect(() => {
        if (user) {
            localStorage.setItem("pagerUser", JSON.stringify(user));
        }
    }, [user]);

    return (
        <UserContext.Provider value={{ user, setUser }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => useContext(UserContext);

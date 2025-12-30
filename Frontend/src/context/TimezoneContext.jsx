import React, { createContext, useState, useContext, useEffect } from 'react';

const TimezoneContext = createContext();

export const useTimezone = () => {
    const context = useContext(TimezoneContext);
    if (!context) {
        throw new Error('useTimezone must be used within a TimezoneProvider');
    }
    return context;
};

export const TimezoneProvider = ({ children }) => {
    const [currentTimezone, setCurrentTimezone] = useState('auto');

    useEffect(() => {
        // Try to get from localStorage
        const stored = localStorage.getItem('app_timezone');
        if (stored) {
            setCurrentTimezone(stored);
        } else {
            // Default to 'auto' which uses system timezone
            setCurrentTimezone('auto');
        }
    }, []);

    const changeTimezone = (tz) => {
        setCurrentTimezone(tz);
        localStorage.setItem('app_timezone', tz);
    };

    return (
        <TimezoneContext.Provider value={{ currentTimezone, changeTimezone }}>
            {children}
        </TimezoneContext.Provider>
    );
};

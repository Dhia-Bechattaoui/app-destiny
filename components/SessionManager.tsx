"use client";

import { useEffect } from "react";

export function SessionManager() {
    useEffect(() => {
        const checkSession = async () => {
            try {
                await fetch('/api/auth/session', { method: 'POST' });
            } catch (e) {
                // Ignore errors
            }
        };

        // Check on mount
        checkSession();

        // Check every 5 minutes
        const interval = setInterval(checkSession, 5 * 60 * 1000);

        return () => clearInterval(interval);
    }, []);

    return null;
}

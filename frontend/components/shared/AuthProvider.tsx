'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

const AuthContext = createContext<{
    user: any;
    loading: boolean;
    logout: () => void;
} | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    const publicRoutes = ['/', '/login', '/register', '/verify-email'];

    const logout = () => {
        localStorage.clear();
        setUser(null);
        router.push('/login');
    };

    useEffect(() => {
        const checkAuth = () => {
            const userStr = localStorage.getItem('user');
            const token = localStorage.getItem('token');
            const role = localStorage.getItem('role');

            if (userStr && token && role) {
                const userData = JSON.parse(userStr);
                setUser(userData);

                // Auto-redirect if on a public route
                if (publicRoutes.includes(pathname)) {
                    router.push(role === 'doctor' ? '/doctor/dashboard' : '/patient/dashboard');
                }
            } else {
                setUser(null);
                // If on a protected route and no token, the sidebar/page logic usually handles it,
                // but we can add a global check here if needed.
            }
            setLoading(false);
        };

        checkAuth();

        // Listen for storage changes (logout in another tab)
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'token' && !e.newValue) {
                logout();
            } else if (e.key === 'token' && e.newValue) {
                // Login in another tab
                window.location.reload();
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [pathname, router]);

    return (
        <AuthContext.Provider value={{ user, loading, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
}

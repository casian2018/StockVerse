import { useEffect } from 'react';
import { useRouter } from 'next/router';

const Logout = () => {
    const router = useRouter();

    useEffect(() => {
        const logout = async () => {
            try {
                await fetch('/api/logout', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });
                router.push('/login');
            } catch (error) {
                console.error('Error during logout:', error);
            }
        };

        logout();
    }, [router]);

    return <div>Logging out...</div>;
};

export default Logout;
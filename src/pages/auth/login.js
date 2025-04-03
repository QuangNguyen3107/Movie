import { useState } from 'react';
import Head from 'next/head';
import AuthForm from '../../components/Auth/AuthForm';
import { useRouter } from 'next/router';
import axios from 'axios';

export default function Login() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    const handleLogin = async (credentials) => {
        try {
            setIsLoading(true);
            setError('');
            
            // Connect to backend API for authentication
            const response = await axios.post('/api/auth/login', credentials);
            
            if (response.data && response.data.token) {
                // Store the token in localStorage
                localStorage.setItem('auth_token', response.data.token);
                
                // Store user information if available
                if (response.data.user) {
                    localStorage.setItem('user', JSON.stringify(response.data.user));
                }
                
                // Redirect to homepage or dashboard after successful login
                router.push('/');
            }
        } catch (err) {
            console.error('Login error:', err);
            setError(err.response?.data?.message || 'Failed to login. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <Head>
                <title>Login - Movie Streaming</title>
            </Head>
            <AuthForm 
                onSubmit={handleLogin} 
                isLoading={isLoading} 
                error={error} 
            />
            
            {/* Add simple styling for error message */}
            <style jsx global>{`
                .error-message {
                    color: #ff5555;
                    text-align: center;
                    margin-bottom: 15px;
                    font-size: 14px;
                }
            `}</style>
        </>
    );
}
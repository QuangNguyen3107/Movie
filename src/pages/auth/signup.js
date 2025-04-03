import { useState } from 'react';
import Head from 'next/head';
import AuthForm from '../../components/Auth/AuthForm';
import { useRouter } from 'next/router';
import axios from 'axios';

export default function Signup() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    const handleSignup = async (credentials) => {
        try {
            setIsLoading(true);
            setError('');

            // Validate input fields
            if (!credentials.fullname || !credentials.email || !credentials.password || !credentials.retype_password || !credentials.address || !credentials.phone || !credentials.date_of_birth) {
                setError('All fields are required.');
                setIsLoading(false);
                return;
            }

            if (credentials.password !== credentials.retype_password) {
                setError('Passwords do not match.');
                setIsLoading(false);
                return;
            }

            // Call our API endpoint for signup
            const response = await axios.post('/api/auth/register', credentials);

            if (response.data && response.data.token) {
                // Store the token in localStorage
                localStorage.setItem('auth_token', response.data.token);

                // Store user information if available
                if (response.data.user) {
                    localStorage.setItem('user', JSON.stringify(response.data.user));
                }

                // Redirect to login page after successful signup
                router.push('/auth/login');
            }
        } catch (err) {
            console.error('Signup error:', err);
            setError(err.response?.data?.error || 'Failed to create account. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <Head>
                <title>Sign Up - Movie Streaming</title>
            </Head>
            <AuthForm 
                onSubmit={handleSignup} 
                isLoading={isLoading} 
                error={error} 
            />
        </>
    );
}

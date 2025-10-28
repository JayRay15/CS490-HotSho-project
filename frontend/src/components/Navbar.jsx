import { Link } from "react-router-dom";
import { SignedIn, SignedOut, UserButton } from "@clerk/clerk-react";
import { useEffect, useState } from "react";
import { useAuth, useUser } from "@clerk/clerk-react";
import api, { setAuthToken } from "../api/axios";

export default function Navbar() {
    const { getToken } = useAuth();
    const { user } = useUser();
    const [profilePicture, setProfilePicture] = useState(null);

    // Fetch user's custom profile picture
    useEffect(() => {
        const fetchProfilePicture = async () => {
            try {
                const token = await getToken();
                setAuthToken(token);
                const response = await api.get('/api/users/me');
                
                if (response.data.data?.picture) {
                    setProfilePicture(response.data.data.picture);
                } else {
                    setProfilePicture(null);
                }
            } catch (err) {
                // Silently fail - will use Clerk's default avatar
                console.debug("Could not load custom profile picture:", err);
                setProfilePicture(null);
            }
        };

        if (user) {
            fetchProfilePicture();
            // Poll for updates every 3 seconds to catch new uploads
            const interval = setInterval(fetchProfilePicture, 3000);
            return () => clearInterval(interval);
        }
    }, [getToken, user]);

    return (
        <nav className="bg-blue-600 text-white px-6 py-3 flex justify-between items-center shadow-md">
            <Link to="/" className="text-xl font-bold">HotSho</Link>

            <div className="flex items-center space-x-4">
                <SignedOut>
                    <Link to="/register" className="hover:underline">Register</Link>
                    <Link to="/login" className="hover:underline">Login</Link>
                </SignedOut>
                <SignedIn>
                    <Link to="/dashboard" className="hover:underline">Dashboard</Link>
                    <Link to="/profile" className="hover:underline">Profile</Link>
                    <div className="custom-user-button">
                        <UserButton 
                            afterSignOutUrl="/login"
                            appearance={{
                                elements: {
                                    avatarBox: "w-8 h-8",
                                    userButtonAvatarBox: "w-8 h-8"
                                }
                            }}
                        />
                        {profilePicture && (
                            <style>{`
                                .custom-user-button [class*="avatarBox"],
                                .custom-user-button [class*="Avatar"] {
                                    background-image: url('${profilePicture}') !important;
                                    background-size: cover !important;
                                    background-position: center !important;
                                    border-radius: 9999px !important;
                                    overflow: hidden !important;
                                    display: block !important;
                                }
                                .custom-user-button [class*="avatarBox"] img,
                                .custom-user-button [class*="Avatar"] img {
                                    opacity: 0 !important;
                                }
                                /* Also apply to menu dropdown */
                                [class*="userButton"][class*="popover"] [class*="avatarBox"],
                                [class*="userButton"][class*="popover"] [class*="Avatar"],
                                [class*="userProfile"] [class*="avatarBox"],
                                [class*="userProfile"] [class*="Avatar"] {
                                    background-image: url('${profilePicture}') !important;
                                    background-size: cover !important;
                                    background-position: center !important;
                                    border-radius: 9999px !important;
                                    overflow: hidden !important;
                                    display: block !important;
                                }
                                [class*="userButton"][class*="popover"] [class*="avatarBox"] img,
                                [class*="userButton"][class*="popover"] [class*="Avatar"] img,
                                [class*="userProfile"] [class*="avatarBox"] img,
                                [class*="userProfile"] [class*="Avatar"] img {
                                    opacity: 0 !important;
                                }
                            `}</style>
                        )}
                    </div>
                </SignedIn>
            </div>
        </nav>
    );
}

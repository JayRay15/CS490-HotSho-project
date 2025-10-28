import { Link } from "react-router-dom";
import { SignedIn, SignedOut, UserButton } from "@clerk/clerk-react";

export default function Navbar() {
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
                    <UserButton 
                        afterSignOutUrl="/login"
                        appearance={{
                            elements: {
                                avatarBox: "w-8 h-8"
                            }
                        }}
                    />
                </SignedIn>
            </div>
        </nav>
    );
}

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const savedUser = localStorage.getItem("user");
        if (!savedUser) {
            navigate("/login");
        } else {
            setUser(JSON.parse(savedUser));
        }
    }, [navigate]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
            {user ? (
                <>
                    <h1 className="text-3xl font-semibold mb-4">
                        Welcome, {user.name || user.email} 👋
                    </h1>
                    <p className="text-gray-600">You’re logged in!</p>
                </>
            ) : (
                <p>Loading...</p>
            )}
        </div>
    );
}

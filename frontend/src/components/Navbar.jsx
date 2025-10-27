import { Link, useNavigate } from "react-router-dom";

export default function Navbar() {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem("user"));

    const handleLogout = () => {
        localStorage.removeItem("user");
        navigate("/login");
    };

    return (
        <nav className="bg-blue-600 text-white px-6 py-3 flex justify-between items-center shadow-md">
            <Link to="/" className="text-xl font-bold">HotSho</Link>

            <div className="space-x-4">
                {!user ? (
                    <>
                        <Link to="/register" className="hover:underline">Register</Link>
                        <Link to="/login" className="hover:underline">Login</Link>
                    </>
                ) : (
                    <button
                        onClick={handleLogout}
                        className="hover:underline bg-transparent border-none text-white"
                    >
                        Logout
                    </button>
                )}
            </div>
        </nav>
    );
}

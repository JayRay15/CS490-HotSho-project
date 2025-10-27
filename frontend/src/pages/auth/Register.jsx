import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/; // min 8 chars, 1 upper, 1 lower, 1 number

export default function Register() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const validate = () => {
    const err = {};
    if (!firstName.trim()) err.firstName = "First name is required";
    if (!lastName.trim()) err.lastName = "Last name is required";
    if (!emailRegex.test(email)) err.email = "Enter a valid email address";
    if (!passwordRegex.test(password))
      err.password = "Password must be at least 8 characters and include uppercase, lowercase and a number";
    if (password !== confirmPassword) err.confirmPassword = "Passwords do not match";
    return err;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setMessage("");
    const v = validate();
    setErrors(v);
    if (Object.keys(v).length) return;

    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          password,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage("Registration successful — redirecting to dashboard...");
        // store minimal user info and navigate to dashboard
        if (data && data.data) {
          try {
            localStorage.setItem("user", JSON.stringify(data.data));
          } catch (err) {
            // ignore storage errors
          }
        }
        setTimeout(() => navigate("/dashboard"), 1000);
      } else {
        // show error from server
        setMessage(data.message || "Registration failed");
      }
    } catch (err) {
      console.error(err);
      setMessage("Server error. Try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <form onSubmit={handleRegister} className="bg-white p-8 rounded-2xl shadow-md w-96">
        <h2 className="text-2xl font-semibold mb-4 text-center">Register</h2>

        {message && <p className="text-center text-sm text-blue-600 mb-3">{message}</p>}

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block mb-1 font-medium">First name</label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full border rounded-lg p-2 focus:outline-none focus:ring focus:ring-blue-400"
              aria-invalid={!!errors.firstName}
            />
            {errors.firstName && <p className="text-sm text-red-600">{errors.firstName}</p>}
          </div>

          <div>
            <label className="block mb-1 font-medium">Last name</label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full border rounded-lg p-2 focus:outline-none focus:ring focus:ring-blue-400"
              aria-invalid={!!errors.lastName}
            />
            {errors.lastName && <p className="text-sm text-red-600">{errors.lastName}</p>}
          </div>
        </div>

        <div className="mb-4">
          <label className="block mb-1 font-medium">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border rounded-lg p-2 focus:outline-none focus:ring focus:ring-blue-400"
            aria-invalid={!!errors.email}
          />
          {errors.email && <p className="text-sm text-red-600">{errors.email}</p>}
        </div>

        <div className="mb-4">
          <label className="block mb-1 font-medium">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border rounded-lg p-2 focus:outline-none focus:ring focus:ring-blue-400"
            aria-invalid={!!errors.password}
          />
          {errors.password && <p className="text-sm text-red-600">{errors.password}</p>}
        </div>

        <div className="mb-6">
          <label className="block mb-1 font-medium">Confirm password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full border rounded-lg p-2 focus:outline-none focus:ring focus:ring-blue-400"
            aria-invalid={!!errors.confirmPassword}
          />
          {errors.confirmPassword && <p className="text-sm text-red-600">{errors.confirmPassword}</p>}
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition ${
            loading ? "opacity-70 cursor-not-allowed" : ""
          }`}
        >
          {loading ? "Registering..." : "Register"}
        </button>

        <p className="mt-4 text-sm text-center">
          Already have an account? <Link to="/login" className="text-blue-600 underline">Login</Link>
        </p>
      </form>
    </div>
  );
}

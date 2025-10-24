import User from "../models/User.js";

export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ msg: "Email already registered" });

    const newUser = await User.create({ name, email, password });
    res.status(201).json({
      msg: "User registered successfully",
      user: { id: newUser.id, email: newUser.email, name: newUser.name },
    });
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

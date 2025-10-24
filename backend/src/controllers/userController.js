import { User } from "../models/User.js";

// Called after successful Auth0 authentication
export const registerOrGetUser = async (req, res) => {
  try {
    const { sub, name, email, picture } = req.auth.payload;

    let user = await User.findOne({ auth0Id: sub });

    if (!user) {
      user = await User.create({ auth0Id: sub, name, email, picture });
      console.log(`🆕 New user created: ${email}`);
    }

    res.status(200).json({
      message: "User retrieved or registered successfully",
      user,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// server/verifyLogin.js
require("dotenv").config();
const { sequelize } = require("./src/config/db");
const User = require("./src/model/user.model");
const bcrypt = require("bcrypt");

const verifyString = "SecurePassword123!";

const check = async () => {
    try {
        await sequelize.authenticate();
        console.log("Database connected...");

        const user = await User.findOne({ where: { Email: "admin@livebaz.com" } });
        if (!user) {
            console.log("User not found!");
            return;
        }

        console.log("Found User ID:", user.id);
        console.log("Stored Hash:", user.Password);
        console.log("Testing Password:", verifyString);

        const isMatch = await bcrypt.compare(verifyString, user.Password);
        console.log("Direct bcrypt comparison result:", isMatch);

        const modelMethodMatch = await user.comparePassword(verifyString);
        console.log("Model method comparison result:", modelMethodMatch);
        
        console.log("is_admin value:", user.is_admin);
        console.log("is_admin type:", typeof user.is_admin);

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await sequelize.close();
    }
};

check();

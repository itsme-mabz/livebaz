const { Sequelize } = require("sequelize");

const sequelize = new Sequelize(
    process.env.MYSQL_DATABASE,
    process.env.MYSQL_USER,
    process.env.MYSQL_PASSWORD,
    {
        
        host: process.env.MYSQL_HOST,
        dialect: "mysql",
        logging: false,
        port: process.env.MYSQL_PORT || 3306
    }
);

// MySQL Connection Function
const connectDB = async () => {
    try {
        await sequelize.authenticate();
        console.log(`MySQL Connected: ${process.env.MYSQL_HOST}`);
    } catch (error) {
        console.log("MySQL Connection Error (continuing without database):", error.message);
        // Don't exit - predictions API works without MySQL
    }
};

module.exports = { sequelize, connectDB };

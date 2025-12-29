require('dotenv').config();
const { sequelize } = require('./src/config/db');

async function runMigration() {
    try {
        console.log('Running migration: create_correct_translations_table...');
        
        const query = `
            CREATE TABLE IF NOT EXISTS correct_translations (
                id INT AUTO_INCREMENT PRIMARY KEY,
                original_word VARCHAR(255) NOT NULL,
                wrong_translation VARCHAR(255) NOT NULL,
                correct_translation VARCHAR(255) NOT NULL,
                language_code VARCHAR(10) NOT NULL COMMENT 'e.g., fa for Persian, ar for Arabic',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY unique_translation (original_word, wrong_translation, language_code),
                INDEX idx_language (language_code),
                INDEX idx_original (original_word)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `;

        await sequelize.query(query);
        console.log('✓ Table correct_translations created successfully');
        
        process.exit(0);
    } catch (error) {
        console.error('✗ Migration failed:', error.message);
        process.exit(1);
    }
}

runMigration();

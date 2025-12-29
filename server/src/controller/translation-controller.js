const { sequelize } = require('../config/db');

// Store correct translation
const storeCorrectTranslation = async (req, res) => {
    try {
        const { original_word, wrong_translation, correct_translation, language_code } = req.body;

        if (!original_word || !wrong_translation || !correct_translation || !language_code) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required: original_word, wrong_translation, correct_translation, language_code'
            });
        }

        const query = `
            INSERT INTO correct_translations (original_word, wrong_translation, correct_translation, language_code)
            VALUES (:original_word, :wrong_translation, :correct_translation, :language_code)
            ON DUPLICATE KEY UPDATE 
                correct_translation = VALUES(correct_translation),
                updated_at = CURRENT_TIMESTAMP
        `;

        await sequelize.query(query, {
            replacements: { original_word, wrong_translation, correct_translation, language_code },
            type: sequelize.QueryTypes.INSERT
        });

        res.status(201).json({
            success: true,
            message: 'Translation stored successfully',
            data: {
                original_word,
                wrong_translation,
                correct_translation,
                language_code
            }
        });
    } catch (error) {
        console.error('Error storing translation:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to store translation',
            error: error.message
        });
    }
};

// Get all correct translations
const getCorrectTranslations = async (req, res) => {
    try {
        const { language_code } = req.query;

        let query = 'SELECT * FROM correct_translations';
        const replacements = {};

        if (language_code) {
            query += ' WHERE language_code = :language_code';
            replacements.language_code = language_code;
        }

        query += ' ORDER BY created_at DESC';

        const translations = await sequelize.query(query, {
            replacements,
            type: sequelize.QueryTypes.SELECT
        });

        res.status(200).json({
            success: true,
            count: translations.length,
            data: translations
        });
    } catch (error) {
        console.error('Error fetching translations:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch translations',
            error: error.message
        });
    }
};

// Update translation
const updateTranslation = async (req, res) => {
    try {
        const { id } = req.params;
        const { original_word, wrong_translation, correct_translation, language_code } = req.body;

        if (!original_word || !wrong_translation || !correct_translation || !language_code) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        const query = `
            UPDATE correct_translations 
            SET original_word = :original_word,
                wrong_translation = :wrong_translation,
                correct_translation = :correct_translation,
                language_code = :language_code,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = :id
        `;

        const [result] = await sequelize.query(query, {
            replacements: { id, original_word, wrong_translation, correct_translation, language_code },
            type: sequelize.QueryTypes.UPDATE
        });

        if (result === 0) {
            return res.status(404).json({
                success: false,
                message: 'Translation not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Translation updated successfully'
        });
    } catch (error) {
        console.error('Error updating translation:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update translation',
            error: error.message
        });
    }
};

// Delete translation
const deleteTranslation = async (req, res) => {
    try {
        const { id } = req.params;

        const query = 'DELETE FROM correct_translations WHERE id = :id';
        
        await sequelize.query(query, {
            replacements: { id },
            type: sequelize.QueryTypes.DELETE
        });

        res.status(200).json({
            success: true,
            message: 'Translation deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting translation:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete translation',
            error: error.message
        });
    }
};

module.exports = {
    storeCorrectTranslation,
    getCorrectTranslations,
    updateTranslation,
    deleteTranslation
};

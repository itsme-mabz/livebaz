const express = require('express');
const router = express.Router();
const { storeCorrectTranslation, getCorrectTranslations, updateTranslation, deleteTranslation } = require('../controller/translation-controller');

// POST /api/translations - Store correct translation
router.post('/', storeCorrectTranslation);

// GET /api/translations - Get all translations (optional: filter by language_code)
router.get('/', getCorrectTranslations);

// PUT /api/translations/:id - Update translation
router.put('/:id', updateTranslation);

// DELETE /api/translations/:id - Delete translation
router.delete('/:id', deleteTranslation);

module.exports = router;

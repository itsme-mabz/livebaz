import axios from 'axios';
import React from 'react';

let translationMap = {};
let isLoaded = false;
let loadPromise = null;

// Load translations from backend
export const loadTranslations = async () => {
    if (isLoaded) return;
    if (loadPromise) return loadPromise; // Prevent multiple simultaneous loads

    loadPromise = (async () => {
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
            const response = await axios.get(`${API_URL}/api/v1/translations`);

            if (response.data.success) {
                translationMap = {};
                response.data.data.forEach(trans => {
                    if (!translationMap[trans.language_code]) {
                        translationMap[trans.language_code] = {};
                    }
                    // Use original_word (English) as key
                    translationMap[trans.language_code][trans.original_word] = trans.correct_translation;
                    // Backward compatibility
                    if (trans.wrong_translation) {
                        translationMap[trans.language_code][trans.wrong_translation] = trans.correct_translation;
                    }
                });
                isLoaded = true;
                console.log('Translations loaded:', Object.keys(translationMap));
            }
        } catch (error) {
            console.error('Error loading translations:', error);
        } finally {
            loadPromise = null;
        }
    })();

    return loadPromise;
};

// Replace wrong translations with correct ones
export const replaceTranslation = (text, languageCode) => {
    // Get language from localStorage if not provided
    if (!languageCode) {
        languageCode = localStorage.getItem('app_language') || 'en';
    }
    
    if (!text || languageCode === 'en') return text;
    
    if (!translationMap[languageCode]) {
        return text;
    }

    const translated = translationMap[languageCode][text];
    if (translated) {
        // Return a span with notranslate class to prevent Google from re-translating it
        return <span className="notranslate">{translated}</span>;
    }

    return text;
};

// Get raw translation string (for attributes, options, etc.)
export const getTranslation = (text, languageCode) => {
    // Get language from localStorage if not provided
    if (!languageCode) {
        languageCode = localStorage.getItem('app_language') || 'en';
    }
    
    if (!text || languageCode === 'en') return text;
    if (!translationMap[languageCode]) return text;
    return translationMap[languageCode][text] || text;
};

// Force reload translations
export const reloadTranslations = () => {
    isLoaded = false;
    return loadTranslations();
};

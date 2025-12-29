import axios from 'axios';

let translationMap = {};
let isLoaded = false;

// Load translations from backend
export const loadTranslations = async () => {
    if (isLoaded) return;
    
    try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        const response = await axios.get(`${API_URL}/api/v1/translations`);
        
        if (response.data.success) {
            translationMap = {};
            response.data.data.forEach(trans => {
                if (!translationMap[trans.language_code]) {
                    translationMap[trans.language_code] = {};
                }
                translationMap[trans.language_code][trans.wrong_translation] = trans.correct_translation;
            });
            isLoaded = true;
            startTranslationObserver();
        }
    } catch (error) {
        console.error('Error loading translations:', error);
    }
};

// Replace wrong translations with correct ones
export const replaceTranslation = (text, languageCode = 'fa') => {
    if (!text || !translationMap[languageCode]) return text;
    
    return translationMap[languageCode][text] || text;
};

// Force reload translations (useful after admin updates)
export const reloadTranslations = () => {
    isLoaded = false;
    return loadTranslations();
};

// Get current language from Google Translate
const getCurrentLanguage = () => {
    const select = document.querySelector('.goog-te-combo');
    return select?.value || 'fa';
};

// Replace text in a node
const replaceTextInNode = (node, languageCode) => {
    if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
        const originalText = node.textContent.trim();
        const replacedText = replaceTranslation(originalText, languageCode);
        if (replacedText !== originalText) {
            node.textContent = node.textContent.replace(originalText, replacedText);
        }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
        node.childNodes.forEach(child => replaceTextInNode(child, languageCode));
    }
};

// Start observing DOM changes
const startTranslationObserver = () => {
    const observer = new MutationObserver((mutations) => {
        const languageCode = getCurrentLanguage();
        if (!translationMap[languageCode]) return;

        mutations.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
                replaceTextInNode(node, languageCode);
            });
            
            if (mutation.type === 'characterData') {
                replaceTextInNode(mutation.target.parentNode, languageCode);
            }
        });
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true
    });

    // Initial replacement
    const languageCode = getCurrentLanguage();
    if (translationMap[languageCode]) {
        replaceTextInNode(document.body, languageCode);
    }
};

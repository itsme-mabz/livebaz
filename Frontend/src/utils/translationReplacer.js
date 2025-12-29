import axios from 'axios';

let translationMap = {};
let isLoaded = false;
let currentLanguage = 'en';
let observer = null;

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
            console.log('Translations loaded:', translationMap);
            startTranslationObserver();
            startLanguageMonitor();
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
    return select?.value || 'en';
};

// Replace text in a node recursively
const replaceTextInNode = (node, languageCode) => {
    if (!translationMap[languageCode]) return;
    
    if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent;
        if (!text || !text.trim()) return;
        
        let newText = text;
        Object.keys(translationMap[languageCode]).forEach(wrongText => {
            const correctText = translationMap[languageCode][wrongText];
            newText = newText.replace(new RegExp(wrongText, 'g'), correctText);
        });
        
        if (newText !== text) {
            node.textContent = newText;
        }
    } else if (node.nodeType === Node.ELEMENT_NODE && node.childNodes.length > 0) {
        node.childNodes.forEach(child => replaceTextInNode(child, languageCode));
    }
};

// Apply translations to entire page
const applyTranslations = (languageCode) => {
    if (!translationMap[languageCode]) return;
    console.log('Applying translations for:', languageCode);
    replaceTextInNode(document.body, languageCode);
};

// Monitor language changes
const startLanguageMonitor = () => {
    setInterval(() => {
        const newLanguage = getCurrentLanguage();
        if (newLanguage !== currentLanguage) {
            console.log('Language changed from', currentLanguage, 'to', newLanguage);
            currentLanguage = newLanguage;
            setTimeout(() => applyTranslations(currentLanguage), 1000);
        }
    }, 500);
};

// Start observing DOM changes
const startTranslationObserver = () => {
    if (observer) observer.disconnect();
    
    observer = new MutationObserver((mutations) => {
        const languageCode = getCurrentLanguage();
        if (!translationMap[languageCode] || languageCode === 'en') return;

        mutations.forEach(mutation => {
            if (mutation.addedNodes.length > 0) {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === Node.ELEMENT_NODE || node.nodeType === Node.TEXT_NODE) {
                        setTimeout(() => replaceTextInNode(node, languageCode), 100);
                    }
                });
            }
            
            if (mutation.type === 'characterData' && mutation.target.parentNode) {
                setTimeout(() => replaceTextInNode(mutation.target.parentNode, languageCode), 100);
            }
        });
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true
    });

    // Initial replacement
    currentLanguage = getCurrentLanguage();
    if (currentLanguage !== 'en') {
        setTimeout(() => applyTranslations(currentLanguage), 1000);
    }
};

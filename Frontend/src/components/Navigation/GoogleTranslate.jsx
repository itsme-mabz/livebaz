import React, { useEffect, useState, useRef } from 'react';
import './Navigation.css'; // Ensure CSS is available
import { MdOutlineLanguage } from "react-icons/md";

const LANGUAGE_URL_MAP = {
    'en': '',
    'es': 'es',
    'fr': 'fr',
    'de': 'de',
    'it': 'it',
    'pt': 'pt',
    'ru': 'ru',
    'ar': 'ar',
    'fa': 'pr',
    'zh-CN': 'cn',
    'ja': 'ja',
    'hi': 'hi',
    'tr': 'tr'
};

const LANGUAGES = [
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'es', label: 'Español', flag: '🇪🇸' },
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
    { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
    { code: 'it', label: 'Italiano', flag: '🇮🇹' },
    { code: 'pt', label: 'Português', flag: '🇵🇹' },
    { code: 'ru', label: 'Русский', flag: '🇷🇺' },
    { code: 'ar', label: 'العربية', flag: '🇸🇦' },
    { code: 'fa', label: 'فارسی', flag: '🇮🇷' },
    { code: 'zh-CN', label: '中文', flag: '🇨🇳' },
    { code: 'ja', label: '日本語', flag: '🇯🇵' },
    { code: 'hi', label: 'हिन्दी', flag: '🇮🇳' },
    { code: 'tr', label: 'Türkçe', flag: '🇹🇷' },
];

const GoogleTranslate = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedLang, setSelectedLang] = useState(LANGUAGES[0]);
    const dropdownRef = useRef(null);
    const [isBlocked, setIsBlocked] = useState(false);

    // Initialize Google Translate Script
    useEffect(() => {
        let intervalId = null;

        const checkGoogleTranslate = () => {
            // Check if Google object is loaded
            if (window.google && window.google.translate && window.google.translate.TranslateElement) {
                // Initialize only if not already done
                if (!document.getElementById('google_translate_element').hasChildNodes()) {
                    new window.google.translate.TranslateElement(
                        {
                            pageLanguage: 'en',
                            layout: window.google.translate.TranslateElement.InlineLayout.VERTICAL,
                            autoDisplay: false,
                            multilanguagePage: false
                        },
                        'google_translate_element'
                    );
                    
                    // Force English as default after initialization
                    setTimeout(() => {
                        const select = document.querySelector('.goog-te-combo');
                        if (select && !window.location.pathname.match(/^\/([a-z]{2})(?:\/|$)/)) {
                            select.value = 'en';
                        }
                    }, 500);
                }
                clearInterval(intervalId);
            }
        };

        // Poll for the Google object
        intervalId = setInterval(checkGoogleTranslate, 100);

        // Inject script if not present
        if (!document.querySelector('script[src*="translate.google.com"]')) {
            const addScript = document.createElement('script');
            addScript.setAttribute('src', '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit');
            addScript.onerror = () => {
                console.error("Google Translate script failed to load. Likely blocked by an ad blocker.");
                setIsBlocked(true);
            };
            document.body.appendChild(addScript);
            window.googleTranslateElementInit = checkGoogleTranslate;
        }

        return () => clearInterval(intervalId);
    }, []);

    // Handle clicks outside to close dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Aggressively hide the Google Translate banner
    useEffect(() => {
        const hideElements = () => {
            document.body.style.top = '0';
            document.body.style.position = 'static';
        };

        const interval = setInterval(hideElements, 500);
        return () => clearInterval(interval);
    }, []);

    // Detect language from URL and sync with Google Translate
    useEffect(() => {
        const checkCurrentLanguage = () => {
            const urlMatch = window.location.pathname.match(/^\/([a-z]{2})(?:\/|$)/);
            const urlCode = urlMatch ? urlMatch[1] : '';
            const langCode = Object.keys(LANGUAGE_URL_MAP).find(key => LANGUAGE_URL_MAP[key] === urlCode);

            if (langCode) {
                const lang = LANGUAGES.find(l => l.code === langCode);
                if (lang) {
                    setSelectedLang(lang);
                    const select = document.querySelector('.goog-te-combo');
                    if (select && select.value !== lang.code) {
                        select.value = lang.code;
                        select.dispatchEvent(new Event('change'));
                    }
                }
            }
        };

        const timer = setTimeout(checkCurrentLanguage, 500);
        return () => clearTimeout(timer);
    }, []);

    // Sync Google Translate Widget with URL (Source of Truth)
    useEffect(() => {
        const syncWidgetWithUrl = () => {
            const select = document.querySelector('.goog-te-combo');
            if (!select) return;

            const currentPath = window.location.pathname;
            const currentUrlMatch = currentPath.match(/^\/([a-z]{2})(?:\/|$)/);
            const currentUrlCode = currentUrlMatch ? currentUrlMatch[1] : '';

            // Find the language code corresponding to the current URL prefix
            const targetLangCode = Object.keys(LANGUAGE_URL_MAP).find(key => LANGUAGE_URL_MAP[key] === currentUrlCode) || 'en';

            if (currentUrlCode) {
                // If URL has an explicit language prefix (e.g. 'pr'), FORCE the widget to match it.
                // This prevents the widget's default 'en' state from stripping the URL prefix on reload.
                if (select.value !== targetLangCode) {
                    select.value = targetLangCode;
                    select.dispatchEvent(new Event('change'));

                    // Update internal state to match
                    const lang = LANGUAGES.find(l => l.code === targetLangCode);
                    if (lang) setSelectedLang(lang);
                }
            } else {
                // If URL is default (no prefix, i.e., English), FORCE widget to stay on English
                // Ignore any cookie-based language preferences from Google Translate
                if (select.value !== 'en' && select.value !== '') {
                    select.value = 'en';
                    select.dispatchEvent(new Event('change'));
                    setSelectedLang(LANGUAGES[0]); // English
                }
            }
        };

        const interval = setInterval(syncWidgetWithUrl, 1000); // Check every second
        return () => clearInterval(interval);
    }, []);

    // Function to trigger the Google Translate change
    // Function to trigger the Google Translate change
    const changeLanguage = (langCode) => {
        const lang = LANGUAGES.find(l => l.code === langCode);
        if (lang) {
            setSelectedLang(lang);

            // Update URL immediately - this is our source of truth
            const urlCode = LANGUAGE_URL_MAP[langCode];
            const currentPath = window.location.pathname;
            const pathWithoutLang = currentPath.replace(/^\/[a-z]{2}(?=\/|$)/, '');
            const newPath = urlCode ? `/${urlCode}${pathWithoutLang || '/'}` : (pathWithoutLang || '/');
            window.history.replaceState({}, '', newPath);
        }

        const select = document.querySelector('.goog-te-combo');
        if (select) {
            select.value = langCode;
            select.dispatchEvent(new Event('change'));
        } else {
            // If widget isn't ready yet, the useEffect sync will handle it later since we updated the URL
            console.warn("Google Translate selector not found yet. URL updated, widget will sync shortly.");
        }
        setIsOpen(false);
    };

    return (
        <div className="custom-translate-wrapper" ref={dropdownRef}>
            {/* The Hidden Container for the actual Google Translate Widget */}
            {/* IMPORTANT: We use visibility: hidden instead of display: none so the widget actually loads and renders the select box */}
            <div
                id="google_translate_element"
                style={{
                    visibility: 'hidden',
                    position: 'absolute',
                    width: '1px',
                    height: '1px',
                    overflow: 'hidden',
                    top: 0,
                    left: 0
                }}
            ></div>

            {/* Custom Trigger Button */}
            <button
                className={`custom-translate-btn ${isOpen ? 'active' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Select Language"
            >
                {isBlocked ? (
                    <span className="lang-label" style={{ color: '#ff6b6b' }}>Blocked by AdBlock</span>
                ) : (
                    <>
                        <MdOutlineLanguage size={23} color="white" />

                    </>
                )}
            </button>

            {/* Custom Dropdown List */}
            {!isBlocked && (
                <div className={`custom-translate-dropdown ${isOpen ? 'show' : ''}`}>
                    <div className="dropdown-scroll-container">
                        {LANGUAGES.map((lang) => (
                            <div
                                key={lang.code}
                                className={`dropdown-item ${selectedLang.code === lang.code ? 'selected' : ''}`}
                                onClick={() => changeLanguage(lang.code)}
                            >
                                <span className="item-flag">{lang.flag}</span>
                                <span className="item-label">{lang.label}</span>
                                {selectedLang.code === lang.code && <span className="item-check">✓</span>}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default GoogleTranslate;

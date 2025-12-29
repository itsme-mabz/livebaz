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
                            multilanguagePage: true
                        },
                        'google_translate_element'
                    );
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
        const hideGoogleBanner = () => {
            // Hide the top banner frame
            const bannerFrame = document.querySelector('.goog-te-banner-frame');
            if (bannerFrame) {
                bannerFrame.style.display = 'none';
                bannerFrame.style.visibility = 'hidden';
            }

            // Reset body top position that Google adds
            document.body.style.top = '0px';
            document.body.style.position = 'static';

            // Hide the entire iframe if it exists
            const iframes = document.querySelectorAll('iframe.goog-te-banner-frame');
            iframes.forEach(iframe => {
                iframe.style.display = 'none';
                iframe.style.visibility = 'hidden';
            });

            // Hide the menu frame that appears
            const menuFrame = document.querySelector('.goog-te-menu-frame');
            if (menuFrame) {
                menuFrame.style.display = 'none';
            }
        };

        // Run immediately
        hideGoogleBanner();

        // Run periodically to catch any new banners
        const interval = setInterval(hideGoogleBanner, 100);

        // Also observe DOM mutations
        const observer = new MutationObserver(hideGoogleBanner);
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['style', 'class']
        });

        return () => {
            clearInterval(interval);
            observer.disconnect();
        };
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

    // Force language code to stay in URL based on selected language
    useEffect(() => {
        const enforceLanguageUrl = () => {
            const select = document.querySelector('.goog-te-combo');
            if (!select) return;
            
            const currentLangCode = select.value;
            const urlCode = LANGUAGE_URL_MAP[currentLangCode];
            const currentPath = window.location.pathname;
            const currentUrlMatch = currentPath.match(/^\/([a-z]{2})(?:\/|$)/);
            const currentUrlCode = currentUrlMatch ? currentUrlMatch[1] : '';
            
            if (urlCode && currentUrlCode !== urlCode) {
                const pathWithoutLang = currentPath.replace(/^\/[a-z]{2}(?=\/|$)/, '');
                const newPath = `/${urlCode}${pathWithoutLang || '/'}`;
                window.history.replaceState({}, '', newPath);
            } else if (!urlCode && currentUrlCode) {
                const pathWithoutLang = currentPath.replace(/^\/[a-z]{2}(?=\/|$)/, '') || '/';
                window.history.replaceState({}, '', pathWithoutLang);
            }
        };

        const interval = setInterval(enforceLanguageUrl, 100);
        return () => clearInterval(interval);
    }, []);

    // Function to trigger the Google Translate change
    const changeLanguage = (langCode) => {
        const select = document.querySelector('.goog-te-combo');
        if (select) {
            select.value = langCode;
            select.dispatchEvent(new Event('change'));

            const lang = LANGUAGES.find(l => l.code === langCode);
            if (lang) {
                setSelectedLang(lang);
                
                const urlCode = LANGUAGE_URL_MAP[langCode];
                const currentPath = window.location.pathname;
                const pathWithoutLang = currentPath.replace(/^\/[a-z]{2}(?=\/|$)/, '');
                const newPath = urlCode ? `/${urlCode}${pathWithoutLang || '/'}` : (pathWithoutLang || '/');
                window.history.replaceState({}, '', newPath);
            }
        } else {
            console.error("Google Translate selector not found. The widget might not be loaded yet or was blocked.");
            setIsBlocked(true);
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

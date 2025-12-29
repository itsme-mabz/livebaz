import React, { useState, useEffect } from 'react'
import { replaceTranslation } from '../../utils/translationReplacer.jsx';

function Footer() {
    const [currentLang, setCurrentLang] = useState('en');

    // Detect language
    useEffect(() => {
        const checkLanguage = () => {
            const select = document.querySelector('.goog-te-combo');
            if (select) {
                setCurrentLang(select.value || 'en');
            }
        };

        checkLanguage();
        const interval = setInterval(checkLanguage, 500);
        return () => clearInterval(interval);
    }, []);

    return (
        <>
            <footer className="footer">
                <div className="wrap">
                    <div className="footer__top">
                        <div className="footer__top-left">
                            <span className="logo mb-24 mb-m-28">

                                <a href="#" className="notranslate" style={{ color: '#fff', fontSize: '24px', fontWeight: 'bold' }}>

                                    Livebaz

                                </a>
                            </span>
                            <div className="copyright copyright-text">
                                <span className="notranslate">Livebaz.com</span> - {replaceTranslation('match predictions, football stats & live results', currentLang)}. {replaceTranslation('All rights reserved', currentLang)}. {replaceTranslation('When citing materials, a reference to "livebaz.com" is required', currentLang)}.
                            </div>
                        </div>
                        <div className="copyright copyright-date">
                            <span className="notranslate">Livebaz</span> © Copyright 2025
                        </div>
                        {/* <ul className="about-project-footer fl_c_st">
                            <li className="footer__list-link">
                                <a href="#about/">{replaceTranslation('About Us', currentLang)}</a>
                            </li>
                            <li className="footer__list-link">
                                <a href="#contact/">{replaceTranslation('Contact Us', currentLang)}</a>
                            </li>
                            <li className="footer__list-link">
                                <a href="#agreement/">{replaceTranslation('Terms of Use', currentLang)}</a>
                            </li>
                            <li className="footer__list-link">
                                <a href="#authors/">{replaceTranslation('Our team', currentLang)}</a>
                            </li>
                            <li className="footer__list-link">
                                <a href="#privacy-policy/">{replaceTranslation('Privacy Policy', currentLang)}</a>
                            </li>
                        </ul> */}
                        <div className="footer__top-right fl_s_s">
                            <div className="fl">
                                {/* Removed Bookmaker review section */}
                                <div className="footer__list fl_col_st_c">
                                    <ul className="fl_col_st_c forecast-types-footer">
                                        <a href="/predictions/" className="footer__list-heading footer__list-heading-arrow">{replaceTranslation('Predictions', currentLang)}</a>

                                        <li className="footer__list-link">
                                            <a href="/math-predictions/">{replaceTranslation('Math Predictions', currentLang)}</a>
                                        </li>
                                        <li className="footer__list-link">
                                            <a href="/popular-matches/">{replaceTranslation('Popular Matches', currentLang)}</a>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                            <div className="fl">
                                {/* Removed Standings section */}
                                <div className="footer__list fl_col_st_c">
                                    <ul className="footer__list fl_col_st_st">
                                        <li className="footer__list-heading footer__list-heading-arrow">
                                            <a href="/livescore/">{replaceTranslation('Scores', currentLang)}</a>
                                        </li>
                                        <li className="footer__list-heading footer__list-heading-arrow">
                                            <a href="/competitions/">{replaceTranslation('Leagues', currentLang)}</a>
                                        </li>
                                        <li className="footer__list-heading footer__list-heading-arrow">
                                            <a href="/blogs/">{replaceTranslation('Insights', currentLang)}</a>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="footer__bottom-wrap">
                        <div className="footer__bottom fl_s_sb rounded_8">
                            <div className="footer__bottom-text-wrap fl">
                                <span className="footer__warn-sign fl_c_c"></span>
                                <div className="footer__bottom-text fl_col">
                                    <p>{replaceTranslation('The site is informational and does not provide an opportunity to participate in gambling, place bets or receive winnings. All site materials are informational. The site does not have functions for participating in gambling, placing bets or receiving winnings.', currentLang)}</p>
                                    <p>{replaceTranslation('If you feel that you or someone around you may have a problem with gambling, remember that you can always ask for help.', currentLang)}</p>
                                </div>
                            </div>
                            <div className="footer__bottom-item fl_c_c">
                                <span className="warning-18 fl_c_c"></span>
                                <a href="https://www.gamblingtherapy.org/" rel="nofollow" target="_blank">





                                    <img src="https://ratingbet.com/ratingbet_build/img/gamblingtherapy-org-white.c9ea4776.svg" data-src="https://ratingbet.com/ratingbet_build/img/gamblingtherapy-org-white.c9ea4776.svg" alt="gambling therapy" width="126" height="40" className="gambling-therapy lazyloaded" />

                                </a>
                                <a href="https://gamblersanonymous.org/" rel="nofollow" target="_blank">





                                    <img src="https://ratingbet.com/ratingbet_build/img/gamblers_anonymous_v2.6dd86f60.svg" data-src="https://ratingbet.com/ratingbet_build/img/gamblers_anonymous_v2.6dd86f60.svg" alt="gamblers anonymous" width="64" height="40" className="gamblers-anonymous lazyloaded" />

                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </footer>
        </>
    )
}

export default Footer
import React, { useState, useEffect } from 'react'
import axios from 'axios';
import './Navigation.css';
import AuthModal from '../AuthModal/AuthModal';
import { Link } from 'react-router-dom';
import { Skeleton } from '../SkeletonLoader/SkeletonLoader';

const API_KEY = import.meta.env.VITE_APIFOOTBALL_KEY || '8b638d34018a20c11ed623f266d7a7a6a5db7a451fb17038f8f47962c66db43b';

function Navigation() {
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [authMode, setAuthMode] = useState('login');
    const [allLeagues, setAllLeagues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const openLoginModal = () => {
        setAuthMode('login');
        setIsAuthModalOpen(true);
    };

    const openSignupModal = () => {
        setAuthMode('signup');
        setIsAuthModalOpen(true);
    };

    const closeAuthModal = () => {
        setIsAuthModalOpen(false);
    };

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    // Prevent body scroll when mobile menu is open
    useEffect(() => {
        if (isMobileMenuOpen) {
            document.body.classList.add('mobile-menu-open');
        } else {
            document.body.classList.remove('mobile-menu-open');
        }

        // Cleanup on unmount
        return () => {
            document.body.classList.remove('mobile-menu-open');
        };
    }, [isMobileMenuOpen]);

    // Fetch leagues from API
    useEffect(() => {
        const fetchLeagues = async () => {
            try {
                setLoading(true);
                const response = await axios.get(`https://apiv3.apifootball.com/?action=get_leagues&APIkey=${API_KEY}`);
                if (Array.isArray(response.data)) {
                    setAllLeagues(response.data);
                }
            } catch (error) {
                console.error('Error fetching leagues:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchLeagues();
    }, []);


    const LeagueItem = ({ league }) => (
        <span className="dropdown-submenu__item fl_c">
            <span className="icon-wrapper fl_c_c">
                <img
                    srcSet={`${league.league_logo} 100w`}
                    decoding="async"
                    data-srcset={`${league.league_logo} 30w`}
                    data-sizes="auto"
                    width="24"
                    height="24"
                    alt={league.league_name}
                    src={league.league_logo}
                    className="lazyload"
                />
            </span>
            <span className="ml-8 overflow-elipsis">
                <Link to={`/league/${league.league_id}`}>{league.league_name}</Link>
            </span>
        </span>
    );

    // Get first 20 leagues for display (10 per column)
    const popularLeagues = allLeagues.slice(0, 10);
    const moreLeagues = allLeagues.slice(10, 20);

    return (
        <>
            <div className="header fl_c w-full mb-8 mb-m-0">
                <div className="wrap fl_c_sb">
                    <div className="header-menu rounded_6">
                        <button type="button" className="header-menu__button" aria-label="Open main menu" onClick={toggleMobileMenu}></button>
                    </div>
                    <div className="header-center fl_c_sb w-full">
                        <span className='header-logo'>


                            <a href="/" style={{ color: '#fff', fontSize: '24px', fontWeight: 'bold' }}>

                                Livebaz

                            </a>                        </span>
                        <ul className="header-nav fl_c_sb">
                            <li className="dropdown-menu__wrapper">
                                <a href='/predictions/' className='header-nav__link fl_c '>Predictions</a>


                            </li>

                            <li className="dropdown-menu__wrapper">
                                <a href='/competitions/' className='header-nav__link fl_c nav__link-arrow-down'>Leagues</a>
                                <div className="dropdown-menu">
                                    <div className="section-title mb-12">
                                        <a href='/competitions/'>All leagues</a>
                                    </div>

                                    {loading ? (
                                        <div style={{ padding: '20px' }}>
                                            <div style={{ display: 'flex', gap: '20px' }}>
                                                <div style={{ flex: 1 }}>
                                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => (
                                                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                                            <Skeleton width="24px" height="24px" borderRadius="50%" />
                                                            <Skeleton width="150px" height="16px" />
                                                        </div>
                                                    ))}
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => (
                                                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                                            <Skeleton width="24px" height="24px" borderRadius="50%" />
                                                            <Skeleton width="150px" height="16px" />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <ul className="dropdown-submenu fl_s_s">
                                            <li className="dropdown-submenu__block">
                                                <div className="dropdown-submenu__subtitle">Popular Leagues</div>
                                                <div className="dropdown-submenu__list top-tournaments">
                                                    {popularLeagues.map((league) => (
                                                        <LeagueItem key={league.league_id} league={league} />
                                                    ))}
                                                </div>
                                            </li>

                                            <li className="dropdown-submenu__block">
                                                <div className="dropdown-submenu__subtitle">More Leagues</div>
                                                <div className="dropdown-submenu__list top-tournaments">
                                                    {moreLeagues.map((league) => (
                                                        <LeagueItem key={league.league_id} league={league} />
                                                    ))}
                                                </div>
                                            </li>
                                        </ul>
                                    )}
                                </div>

                            </li>
                            <li>
                                <a href='/math-predictions/' className='header-nav__link fl_c'>Math predictions</a>
                            </li>
                            <li className="dropdown-menu__wrapper">
                                <span className="header-nav__link fl_c nav__link-arrow-down">Football Tips</span>
                                <div className="dropdown-menu">
                                    <div className="section-title mb-12 section-title_ft">
                                        All betting tips
                                    </div>

                                    <div className="dropdown-submenu fl_s_s">
                                        <div className="dropdown-submenu__block">
                                            <div className="dropdown-submenu__subtitle">By bet type</div>
                                            <ul className="dropdown-submenu__list football-tips">
                                                <li className="dropdown-submenu__item fl_c" style={{ opacity: 0.5, cursor: 'not-allowed' }}>
                                                    <span className='overflow-elipsis' style={{ color: '#999', display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                                                        <span>Betting Tips 1x2</span>
                                                        <span style={{ fontSize: '11px', fontStyle: 'italic' }}>Coming Soon</span>
                                                    </span>
                                                </li>
                                                <li className="dropdown-submenu__item fl_c" style={{ opacity: 0.5, cursor: 'not-allowed' }}>
                                                    <span className='overflow-elipsis' style={{ color: '#999', display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                                                        <span>Over/Under 2.5 Goals</span>
                                                        <span style={{ fontSize: '11px', fontStyle: 'italic' }}>Coming Soon</span>
                                                    </span>
                                                </li>
                                                <li className="dropdown-submenu__item fl_c" style={{ opacity: 0.5, cursor: 'not-allowed' }}>
                                                    <span className='overflow-elipsis' style={{ color: '#999', display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                                                        <span>BTTS Predictions</span>
                                                        <span style={{ fontSize: '11px', fontStyle: 'italic' }}>Coming Soon</span>
                                                    </span>
                                                </li>
                                                <li className="dropdown-submenu__item fl_c" style={{ opacity: 0.5, cursor: 'not-allowed' }}>
                                                    <span className='overflow-elipsis' style={{ color: '#999', display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                                                        <span>HT/FT Prediction</span>
                                                        <span style={{ fontSize: '11px', fontStyle: 'italic' }}>Coming Soon</span>
                                                    </span>
                                                </li>
                                                <li className="dropdown-submenu__item fl_c" style={{ opacity: 0.5, cursor: 'not-allowed' }}>
                                                    <span className='overflow-elipsis' style={{ color: '#999', display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                                                        <span>Asian Handicap</span>
                                                        <span style={{ fontSize: '11px', fontStyle: 'italic' }}>Coming Soon</span>
                                                    </span>
                                                </li>
                                                <li className="dropdown-submenu__item fl_c" style={{ opacity: 0.5, cursor: 'not-allowed' }}>
                                                    <span className='overflow-elipsis' style={{ color: '#999', display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                                                        <span>Double Chance</span>
                                                        <span style={{ fontSize: '11px', fontStyle: 'italic' }}>Coming Soon</span>
                                                    </span>
                                                </li>
                                                <li className="dropdown-submenu__item fl_c" style={{ opacity: 0.5, cursor: 'not-allowed' }}>
                                                    <span className='overflow-elipsis' style={{ color: '#999', display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                                                        <span>Corners Prediction</span>
                                                        <span style={{ fontSize: '11px', fontStyle: 'italic' }}>Coming Soon</span>
                                                    </span>
                                                </li>
                                                <li className="dropdown-submenu__item fl_c" style={{ opacity: 0.5, cursor: 'not-allowed' }}>
                                                    <span className='overflow-elipsis' style={{ color: '#999', display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                                                        <span>Cards Prediction</span>
                                                        <span style={{ fontSize: '11px', fontStyle: 'italic' }}>Coming Soon</span>
                                                    </span>
                                                </li>
                                            </ul>
                                        </div>

                                    </div>
                                </div>

                            </li>
                            <li>
                                <a href='/livescore/' className='header-nav__link fl_c'>Scores</a>
                            </li>
                        </ul>


                    </div>
                    <button className="header-login fl_c js-login-button ml-2" onClick={openLoginModal}>
                        <span className="header-login__text fl_c">Log in</span>
                    </button>



                </div>
            </div>

            {/* Mobile Menu Sidebar */}
            <div className={`mobile-menu ${isMobileMenuOpen ? 'mobile-menu--open' : ''}`}>
                <div className="mobile-menu__overlay" onClick={toggleMobileMenu}></div>
                <div className="mobile-menu__content">
                    <div className="mobile-menu__header">
                        <span style={{ color: '#fff', fontSize: '20px', fontWeight: 'bold' }}>Livebaz</span>
                        <button className="mobile-menu__close" onClick={toggleMobileMenu} aria-label="Close menu">
                            ✕
                        </button>
                    </div>
                    <nav className="mobile-menu__nav">
                        <a href='/predictions/' className='mobile-menu__link' onClick={toggleMobileMenu}>
                            Predictions
                        </a>

                        <a href='/competitions/' className='mobile-menu__link' onClick={toggleMobileMenu}>
                            Leagues
                        </a>

                        <a href='/math-predictions/' className='mobile-menu__link' onClick={toggleMobileMenu}>
                            Math Predictions
                        </a>

                        <div className='mobile-menu__section'>
                            <div className='mobile-menu__section-title'>Football Tips</div>
                            <a href='#' className='mobile-menu__sublink disabled' onClick={(e) => e.preventDefault()}>
                                Betting Tips 1x2 <span className='coming-soon'>Coming Soon</span>
                            </a>
                            <a href='#' className='mobile-menu__sublink disabled' onClick={(e) => e.preventDefault()}>
                                Over/Under 2.5 <span className='coming-soon'>Coming Soon</span>
                            </a>
                            <a href='#' className='mobile-menu__sublink disabled' onClick={(e) => e.preventDefault()}>
                                BTTS Predictions <span className='coming-soon'>Coming Soon</span>
                            </a>
                            <a href='#' className='mobile-menu__sublink disabled' onClick={(e) => e.preventDefault()}>
                                HT/FT Prediction <span className='coming-soon'>Coming Soon</span>
                            </a>
                        </div>

                        <a href='/livescore/' className='mobile-menu__link' onClick={toggleMobileMenu}>
                            Scores
                        </a>

                        <div className='mobile-menu__divider'></div>

                        <button className='mobile-menu__login-btn' onClick={() => { toggleMobileMenu(); openLoginModal(); }}>
                            Log in
                        </button>
                    </nav>
                </div>
            </div>

            <AuthModal
                isOpen={isAuthModalOpen}
                onClose={closeAuthModal}
                initialMode={authMode}
            />
        </>
    )
}

export default Navigation
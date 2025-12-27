import React, { useState, useEffect } from 'react'
import axios from 'axios';
import './Navigation.css';
import AuthModal from '../AuthModal/AuthModal';
import { Link } from 'react-router-dom';
import { Skeleton } from '../SkeletonLoader/SkeletonLoader';
import { fetchPopularLeagues } from '../../Service/FootballService';
import GoogleTranslate from './GoogleTranslate';
import { IoLogInOutline } from "react-icons/io5";
import { LiaTelegramPlane } from "react-icons/lia";



const API_KEY = import.meta.env.VITE_APIFOOTBALL_KEY || '8b638d34018a20c11ed623f266d7a7a6a5db7a451fb17038f8f47962c66db43b';

function Navigation() {
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [authMode, setAuthMode] = useState('login');
    const [allLeagues, setAllLeagues] = useState([]);
    const [fetchedPopularLeagues, setFetchedPopularLeagues] = useState([]); // from backend
    const [loading, setLoading] = useState(true);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isMobileLeaguesExpanded, setIsMobileLeaguesExpanded] = useState(false);
    const [user, setUser] = useState(null);
    const [showUserDropdown, setShowUserDropdown] = useState(false);

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

    const handleLogout = () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        setUser(null);
        setShowUserDropdown(false);
        window.location.href = '/';
    };

    const toggleMobileMenu = () => {
        const newState = !isMobileMenuOpen;
        console.log('Mobile menu toggled. Current state:', isMobileMenuOpen, '-> New state:', newState);
        setIsMobileMenuOpen(newState);
    };

    // Debug: Log when menu state changes
    useEffect(() => {
        console.log('Mobile menu state changed:', isMobileMenuOpen);
    }, [isMobileMenuOpen]);

    // Check for logged in user
    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (error) {
                console.error('Error parsing user data:', error);
                localStorage.removeItem('user');
            }
        }
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showUserDropdown && !event.target.closest('.user-dropdown-container')) {
                setShowUserDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showUserDropdown]);

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
        const loadLeagues = async () => {
            try {
                setLoading(true);

                // Fetch external leagues (for "More Leagues" - existing logic)
                const response = await axios.get(`https://apiv3.apifootball.com/?action=get_leagues&APIkey=${API_KEY}`);
                if (Array.isArray(response.data)) {
                    setAllLeagues(response.data);
                }

                // Fetch popular leagues from our backend (for "Popular Leagues")
                const popularData = await fetchPopularLeagues();
                if (Array.isArray(popularData)) {
                    setFetchedPopularLeagues(popularData);
                }
            } catch (error) {
                console.error('Error fetching leagues:', error);
            } finally {
                setLoading(false);
            }
        };

        loadLeagues();
    }, []);


    const LeagueItem = ({ league }) => (
        <span className="dropdown-submenu__item fl_c">
            <span className="icon-wrapper fl_c_c">
                {league.league_logo ? (
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
                        onError={(e) => {
                            e.target.style.display = 'none';
                        }}
                    />
                ) : (
                    <div style={{ width: '24px', height: '24px', background: '#f0f0f0', borderRadius: '50%' }} />
                )}
            </span>
            <span className="ml-8 overflow-elipsis">
                <Link to={`/league/${league.league_id}`}>{league.league_name}</Link>
            </span>
        </span>
    );

    // "Popular Leagues" column now comes from backend.
    // User requested to display ONLY the backend selection.
    const popularLeagues = fetchedPopularLeagues;
    const moreLeagues = allLeagues.slice(10, 20);

    return (
        <>
            <div className="header fl_c w-full mb-8 mb-m-0" style={{ minHeight: '64px' }}>
                <div className="wrap fl_c_sb" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '100%', direction: 'ltr' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', height: '100%' }}>
                        <span className='header-logo' style={{
                            display: 'flex',
                            alignItems: 'center',
                            height: '40px'
                        }}>
                            <a href="/" style={{
                                color: '#fff',
                                fontSize: '20px',
                                fontWeight: 'bold',
                                textDecoration: 'none',
                                lineHeight: '40px',
                                display: 'flex',
                                alignItems: 'center'
                            }}>
                                Livebaz
                            </a>
                        </span>
                    </div>

                    <div className="header-center fl_c_sb w-full">
                        <span className='header-logo-desktop'>
                            <a href="/" style={{ color: '#fff', fontSize: '24px', fontWeight: 'bold' }}>
                                Livebaz
                            </a>
                        </span>
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
                            <li>
                                <a href='/popular-matches/' className='header-nav__link fl_c'>Popular Matches</a>
                            </li>
                            <li>
                                <a href='/blogs/' className='header-nav__link fl_c'>Insights</a>
                            </li>
                            {/* <li className="dropdown-menu__wrapper">
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

                            </li> */}
                            <li>
                                <a href='/livescore/' className='header-nav__link fl_c'>Scores</a>
                            </li>
                        </ul>



                    </div>

                    {/* Right side buttons - placed outside header-center */}
                    <div className="desktop-nav-buttons items-center gap-1 pl-8">
                        {user ? (
                            <div className="user-dropdown-container" style={{ position: 'relative' }}>
                                <button
                                    onClick={() => setShowUserDropdown(!showUserDropdown)}
                                    className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all duration-200 font-medium"
                                >
                                    <div style={{
                                        width: '32px',
                                        height: '32px',
                                        borderRadius: '50%',
                                        backgroundColor: '#fbbf24',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontWeight: 'bold',
                                        color: '#1f2937'
                                    }}>
                                        {user.Name ? user.Name.charAt(0).toUpperCase() : 'U'}
                                    </div>
                                    <span>{user.Name}</span>
                                    <span style={{ fontSize: '12px' }}>▼</span>
                                </button>
                                {showUserDropdown && (
                                    <div style={{
                                        position: 'absolute',
                                        top: '100%',
                                        right: 0,
                                        marginTop: '8px',
                                        backgroundColor: '#1f2937',
                                        borderRadius: '8px',
                                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                                        minWidth: '200px',
                                        zIndex: 1000,
                                        overflow: 'hidden'
                                    }}>
                                        <div style={{
                                            padding: '12px 16px',
                                            borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                                        }}>
                                            <div style={{ color: '#f3f4f6', fontWeight: '600' }}>{user.Name}</div>
                                            <div style={{ color: '#9ca3af', fontSize: '12px', marginTop: '2px' }}>{user.Email}</div>
                                        </div>
                                        <button
                                            onClick={handleLogout}
                                            style={{
                                                width: '100%',
                                                padding: '12px 16px',
                                                backgroundColor: 'transparent',
                                                color: '#f87171',
                                                border: 'none',
                                                textAlign: 'left',
                                                cursor: 'pointer',
                                                fontSize: '14px',
                                                fontWeight: '500',
                                                transition: 'background-color 0.2s'
                                            }}
                                            onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'}
                                            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                                        >
                                            Logout
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <button
                                onClick={openLoginModal}
                                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all duration-200 font-medium"
                            >
                                <IoLogInOutline size={20} className="text-lg" />
                                <span>Login</span>
                            </button>
                        )}

                        <a
                            href="https://t.me/livebaz"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-all duration-200 font-medium"
                        >
                            <LiaTelegramPlane size={20} className="text-lg" />
                            <span>Telegram</span>
                        </a>
                        {/* Google Translate Widget for Desktop */}
                        <div className="desktop-google-translate">
                            <GoogleTranslate />
                        </div>
                    </div>

                </div>
            </div>

            {/* Hamburger Menu Button - Fixed Position on Mobile */}
            <div className="header-menu">
                <button
                    className="header-menu__button"
                    onClick={toggleMobileMenu}
                    aria-label="Toggle menu"
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round">
                        <line x1="3" y1="6" x2="21" y2="6"></line>
                        <line x1="3" y1="12" x2="21" y2="12"></line>
                        <line x1="3" y1="18" x2="21" y2="18"></line>
                    </svg>
                </button>
            </div>

            {/* Mobile Menu Sidebar */}
            <div
                className={`mobile-menu ${isMobileMenuOpen ? 'mobile-menu--open' : ''}`}
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100vh',
                    zIndex: 9999,
                    pointerEvents: isMobileMenuOpen ? 'auto' : 'none',
                    opacity: isMobileMenuOpen ? 1 : 0,
                    visibility: isMobileMenuOpen ? 'visible' : 'hidden',
                    transition: 'opacity 0.3s ease, visibility 0.3s ease'
                }}
            >
                <div
                    className="mobile-menu__overlay"
                    onClick={toggleMobileMenu}
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        backgroundColor: 'rgba(0, 0, 0, 0.6)'
                    }}
                ></div>
                <div
                    className="mobile-menu__content"
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        maxWidth: '100%',
                        height: '100%',
                        backgroundColor: '#121212',
                        transform: isMobileMenuOpen ? 'translateX(0)' : 'translateX(-100%)',
                        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        overflowY: 'auto',
                        display: 'flex',
                        flexDirection: 'column'
                    }}
                >
                    <div className="mobile-menu__header" style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '20px 24px',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                        backgroundColor: '#0a0a0a',
                        position: 'sticky',
                        top: 0,
                        zIndex: 10
                    }}>
                        <span style={{ color: '#f5f5f5', fontSize: '22px', fontWeight: 'bold' }}>Livebaz</span>
                        <button
                            className="mobile-menu__close"
                            onClick={toggleMobileMenu}
                            aria-label="Close menu"
                            style={{
                                background: 'none',
                                border: 'none',
                                color: '#f5f5f5',
                                fontSize: '36px',
                                cursor: 'pointer',
                                padding: '0',
                                width: '44px',
                                height: '44px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                lineHeight: 1,
                                transition: 'all 0.2s',
                                borderRadius: '8px'
                            }}
                        >
                            ✕
                        </button>
                    </div>
                    <nav className="mobile-menu__nav" style={{
                        display: 'flex',
                        flexDirection: 'column',
                        padding: '16px 0',
                        flex: 1,
                        backgroundColor: '#121212'
                    }}>
                        {/* Google Translate Widget for Mobile */}
                        <div style={{ padding: '0 24px 16px', display: 'flex', justifyContent: 'flex-start' }}>
                            <GoogleTranslate />
                        </div>

                        <a href='/predictions/' className='mobile-menu__link' onClick={toggleMobileMenu}>
                            Predictions
                        </a>

                        <div>
                            <div
                                className='mobile-menu__link'
                                onClick={() => setIsMobileLeaguesExpanded(!isMobileLeaguesExpanded)}
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    cursor: 'pointer'
                                }}
                            >
                                <span>Leagues</span>
                                <span style={{
                                    transform: isMobileLeaguesExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                    transition: 'transform 0.3s',
                                    fontSize: '14px'
                                }}>▼</span>
                            </div>
                            {isMobileLeaguesExpanded && (
                                <div style={{
                                    backgroundColor: '#0a0a0a',
                                    padding: '12px 0',
                                    maxHeight: '300px',
                                    overflowY: 'auto'
                                }}>
                                    <a
                                        href='/competitions/'
                                        className='mobile-menu__sublink'
                                        onClick={toggleMobileMenu}
                                        style={{
                                            color: '#f5f5f5',
                                            fontWeight: '600',
                                            marginBottom: '8px'
                                        }}
                                    >
                                        All Leagues
                                    </a>
                                    <div style={{
                                        padding: '8px 24px 4px',
                                        color: '#5b89ff',
                                        fontSize: '11px',
                                        fontWeight: '700',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px'
                                    }}>
                                        Popular Leagues
                                    </div>
                                    {loading ? (
                                        <div style={{ padding: '12px 24px', color: '#999' }}>Loading leagues...</div>
                                    ) : (
                                        popularLeagues.slice(0, 10).map((league) => (
                                            <a
                                                key={league.league_id}
                                                href={`/league/${league.league_id}`}
                                                className='mobile-menu__sublink'
                                                onClick={toggleMobileMenu}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between'
                                                }}
                                            >
                                                <span>{league.league_name}</span>
                                                <div style={{
                                                    width: '20px',
                                                    height: '20px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    flexShrink: 0
                                                }}>
                                                    {league.league_logo ? (
                                                        <img
                                                            src={league.league_logo}
                                                            alt=""
                                                            style={{
                                                                width: '20px',
                                                                height: '20px',
                                                                objectFit: 'contain'
                                                            }}
                                                            onError={(e) => {
                                                                e.target.style.display = 'none';
                                                            }}
                                                        />
                                                    ) : (
                                                        <div style={{ width: '20px', height: '20px' }}></div>
                                                    )}
                                                </div>
                                            </a>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>

                        <a href='/math-predictions/' className='mobile-menu__link' onClick={toggleMobileMenu}>
                            Math Predictions
                        </a>

                        <a href='/popular-matches/' className='mobile-menu__link' onClick={toggleMobileMenu}>
                            Popular Matches
                        </a>

                        {/* <div className='mobile-menu__section'>
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
                        </div> */}

                        <a href='/livescore/' className='mobile-menu__link' onClick={toggleMobileMenu}>
                            Scores
                        </a>

                        <a href='/blogs/' className='mobile-menu__link' onClick={toggleMobileMenu}>
                            Insights
                        </a>

                        {/* Login/Logout Section */}
                        <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', marginBottom: '60px' }}>
                            {user ? (
                                <button
                                    onClick={handleLogout}
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        backgroundColor: 'rgba(248, 113, 113, 0.1)',
                                        color: '#f87171',
                                        border: '1px solid rgba(248, 113, 113, 0.3)',
                                        borderRadius: '8px',
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Logout
                                </button>
                            ) : (
                                <button
                                    onClick={() => {
                                        openLoginModal();
                                        toggleMobileMenu();
                                    }}
                                    style={{
                                        width: '100%',
                                        padding: '14px',
                                        backgroundColor: '#f5f5f5',
                                        color: '#121212',
                                        border: 'none',
                                        borderRadius: '8px',
                                        fontSize: '15px',
                                        fontWeight: '600',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Log in
                                </button>
                            )}
                        </div>
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
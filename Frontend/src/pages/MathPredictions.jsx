import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './MathPredictions.css';
import { TableSkeleton } from '../components/SkeletonLoader/SkeletonLoader';

const API_KEY = import.meta.env.VITE_APIFOOTBALL_KEY || '8b638d34018a20c11ed623f266d7a7a6a5db7a451fb17038f8f47962c66db43b';
const API_BASE_URL = 'https://apiv3.apifootball.com';


function MathPredictions() {
    const navigate = useNavigate();
    const [predictions, setPredictions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedDate, setSelectedDate] = useState('today');
    const [selectedPredictionType, setSelectedPredictionType] = useState('Math');
    const [filters, setFilters] = useState({
        matchType: 'all',
        probability: 0,
        league: null
    });
    const [leaguesByCountry, setLeaguesByCountry] = useState({});
    const [expandedCountries, setExpandedCountries] = useState(new Set());
    const [visibleCount, setVisibleCount] = useState(30);
    const [isRTL, setIsRTL] = useState(false);

    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const [mobileDropdownOpen, setMobileDropdownOpen] = useState(false);

    // Update isMobile on resize
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Detect Arabic or Persian language
    useEffect(() => {
        const checkLanguage = () => {
            const select = document.querySelector('.goog-te-combo');
            if (select) {
                setIsRTL(select.value === 'ar' || select.value === 'fa');
            }
        };

        checkLanguage();
        const interval = setInterval(checkLanguage, 500);
        return () => clearInterval(interval);
    }, []);

    // Handle match row click to navigate to detail page
    const handleMatchClick = (matchId) => {
        navigate(`/match/${matchId}`);
    };

    // Date tabs configuration
    const dateTabs = [
        { label: 'Yesterday', value: 'yesterday' },
        { label: 'Today', value: 'today' },
        { label: 'Tomorrow', value: 'tomorrow' }
    ];

    // Prediction type tabs
    const predictionTabs = [
        { label: 'Math', value: 'Math' },
        { label: '1x2', value: '1x2' },
        { label: 'Goals', value: 'Goals' },
        { label: 'BTTS', value: 'BTTS' },
        { label: 'HT/FT', value: 'HT/FT' },
        { label: 'Asian Handicap', value: 'Asian Handicap' },
        { label: 'Double chance', value: 'Double chance' },
        { label: 'Corners', value: 'Corners' },
        { label: 'Cards', value: 'Cards' }
    ];

    // Fetch predictions from API
    const fetchPredictions = async () => {
        setLoading(true);
        try {
            // Calculate date string (YYYY-MM-DD)
            let dateParam = selectedDate;
            const today = new Date();

            if (selectedDate === 'today') {
                dateParam = today.toISOString().split('T')[0];
            } else if (selectedDate === 'yesterday') {
                const yesterday = new Date(today);
                yesterday.setDate(yesterday.getDate() - 1);
                dateParam = yesterday.toISOString().split('T')[0];
            } else if (selectedDate === 'tomorrow') {
                const tomorrow = new Date(today);
                tomorrow.setDate(tomorrow.getDate() + 1);
                dateParam = tomorrow.toISOString().split('T')[0];
            }

            const params = {
                action: 'get_predictions',
                APIkey: API_KEY,
                from: dateParam,
                to: dateParam
            };

            if (filters.league) {
                params.league_id = filters.league;
            }

            const response = await axios.get(API_BASE_URL, { params });

            // The API returns an array directly, not wrapped in a success object
            const data = Array.isArray(response.data) ? response.data : [];

            // Helper function to parse probability string to number
            const parseProb = (value) => {
                if (!value) return 0;
                let num = parseFloat(value);
                if (isNaN(num)) return 0;

                // API returns probabilities in decimal format (0.59 for 59%)
                // Convert to percentage for consistency
                if (num > 0 && num <= 1) {
                    num = num * 100;
                }

                return parseFloat(num.toFixed(2));
            };

            // Helper function to calculate odds from probability
            // Ratingbet.com uses a margin factor to account for bookmaker overround
            const calcOdds = (probability) => {
                if (!probability || probability <= 0) return '-';
                // Convert to decimal if percentage (59 -> 0.59)
                const prob = probability > 1 ? probability / 100 : probability;
                // Calculate fair odds
                const fairOdds = 1 / prob;
                // Apply bookmaker margin (~6% vig)
                const marginFactor = 0.94;
                const odds = fairOdds * marginFactor;
                return odds.toFixed(2);
            };

            // Transform API response to match component expectations
            const transformedData = data.map(match => {
                // Parse all probabilities
                const probHW = parseProb(match.prob_HW);
                const probD = parseProb(match.prob_D);
                const probAW = parseProb(match.prob_AW);
                const probO = parseProb(match.prob_O);
                const probU = parseProb(match.prob_U);
                const probBTS = parseProb(match.prob_bts);

                return {
                    id: match.match_id,
                    homeTeam: match.match_hometeam_name,
                    awayTeam: match.match_awayteam_name,
                    homeScore: match.match_hometeam_score || '-',
                    awayScore: match.match_awayteam_score || '-',
                    time: match.match_time,
                    league: match.league_name,
                    league_id: match.league_id,
                    country: match.country_name,
                    leagueLogo: match.league_logo || match.team_home_badge || '',
                    homeLogo: match.team_home_badge || '',
                    awayLogo: match.team_away_badge || '',
                    status: match.match_status || 'Not Started',
                    isLive: match.match_live === '1' || match.match_status === 'Live',
                    predictions: {
                        '1x2': {
                            w1: {
                                prob: probHW,
                                odds: calcOdds(probHW)
                            },
                            draw: {
                                prob: probD,
                                odds: calcOdds(probD)
                            },
                            w2: {
                                prob: probAW,
                                odds: calcOdds(probAW)
                            }
                        },
                        goals: {
                            over: {
                                prob: probO,
                                odds: calcOdds(probO)
                            },
                            under: {
                                prob: probU,
                                odds: calcOdds(probU)
                            }
                        },
                        btts: {
                            yes: {
                                prob: probBTS,
                                odds: calcOdds(probBTS)
                            },
                            no: {
                                prob: parseFloat((100 - probBTS).toFixed(2)),
                                odds: calcOdds(100 - probBTS)
                            }
                        },
                        'double-chance': {
                            probX: match.prob_HW_D,
                            prob2: match.prob_HW_AW,
                            prob3: match.prob_AW_D
                        },
                        bestTip: (() => {
                            // Find the highest probability prediction
                            const tips = [
                                { type: 'Home Win', probability: probHW, odds: calcOdds(probHW) },
                                { type: 'Draw', probability: probD, odds: calcOdds(probD) },
                                { type: 'Away Win', probability: probAW, odds: calcOdds(probAW) },
                                { type: 'Over 2.5', probability: probO, odds: calcOdds(probO) },
                                { type: 'Under 2.5', probability: probU, odds: calcOdds(probU) },
                                { type: 'BTTS Yes', probability: probBTS, odds: calcOdds(probBTS) }
                            ];
                            return tips.reduce((best, tip) => tip.probability > best.probability ? tip : best, tips[0]);
                        })()
                    }
                };
            });

            setPredictions(transformedData);

            // Log successful data fetch
            console.log(`Fetched ${transformedData.length} predictions for ${dateParam}`);
            if (transformedData.length > 0) {
                console.log('Sample prediction:', transformedData[0]);
            }

            // Group leagues by country
            const leaguesMap = {};
            transformedData.forEach(pred => {
                if (!leaguesMap[pred.country]) {
                    leaguesMap[pred.country] = [];
                }
                const exists = leaguesMap[pred.country].find(l => l.id === pred.league_id);
                if (!exists) {
                    leaguesMap[pred.country].push({
                        id: pred.league_id,
                        name: pred.league,
                        logo: pred.leagueLogo
                    });
                }
            });

            // Sort leagues within each country
            Object.keys(leaguesMap).forEach(country => {
                leaguesMap[country].sort((a, b) => a.name.localeCompare(b.name));
            });

            setLeaguesByCountry(leaguesMap);
        } catch (error) {
            console.error('Error fetching predictions:', error);
            console.error('Error details:', error.response?.data);
            console.error('Request URL:', `${API_BASE_URL}?action=get_predictions&from=${dateParam}&to=${dateParam}`);
            setPredictions([]);
        } finally {
            setLoading(false);
        }
    };

    // Toggle country expansion
    const toggleCountry = (country) => {
        setExpandedCountries(prev => {
            const newSet = new Set(prev);
            if (newSet.has(country)) {
                newSet.delete(country);
            } else {
                newSet.add(country);
            }
            return newSet;
        });
    };

    // Fetch predictions when date or filters change
    useEffect(() => {
        fetchPredictions();
        setVisibleCount(30); // Reset visible count when date or league changes
    }, [selectedDate, filters.league]);

    // Filter predictions based on current filters
    const filteredPredictions = predictions.filter(prediction => {
        // Filter by match type
        if (filters.matchType !== 'all') {
            if (filters.matchType === 'live' && !prediction.isLive) return false;
            if (filters.matchType === 'plan' && (prediction.status !== 'Not Started' && !prediction.isLive)) return false;
            if (filters.matchType === 'finished' && prediction.status !== 'Finished') return false;
        }

        // Filter by probability
        if (filters.probability > 0) {
            const bestProb = prediction.predictions?.bestTip?.probability || 0;
            if (bestProb < filters.probability) return false;
        }

        return true;
    });

    // Format match time
    const formatMatchTime = (timeString) => {
        if (!timeString) return '-';
        return timeString;
    };

    // Format odds to remove unnecessary decimals
    const formatOdds = (value) => {
        if (!value) return '-';
        const num = parseFloat(value);
        if (isNaN(num)) return '-';

        // If the number is a whole number, don't show decimals
        return num % 1 === 0 ? Math.round(num).toString() : num.toFixed(2);
    };

    // Get column configuration based on prediction type
    const getColumnConfig = (type) => {
        switch (type) {
            case '1x2':
                return {
                    template: isMobile ? '45px 120px 1fr 1fr 1fr' : '80px 240px 1fr 1fr 1fr',
                    show1x2: true,
                    showGoals: false,
                    showBTTS: false,
                    showBest: false
                };
            case 'Goals':
                return {
                    template: isMobile ? '45px 120px 1fr 1fr' : '80px 240px 1fr 1fr',
                    show1x2: false,
                    showGoals: true,
                    showBTTS: false,
                    showBest: false
                };
            case 'BTTS':
                return {
                    template: isMobile ? '45px 120px 1fr 1fr' : '80px 240px 1fr 1fr',
                    show1x2: false,
                    showGoals: false,
                    showBTTS: true,
                    showBest: false
                };
            case 'Double chance':
                return {
                    template: isMobile ? '45px 120px 1fr 1fr 1fr' : '80px 240px 1fr 1fr 1fr',
                    show1x2: false,
                    showGoals: false,
                    showBTTS: false,
                    showBest: false,
                    showDoubleChance: true
                };
            case 'Math':
            default:
                return {
                    template: isMobile ? '45px 100px 1fr 1fr 1fr' : '70px 240px 1fr 1fr 1fr 180px',
                    show1x2: true,
                    showGoals: true,
                    showBTTS: true,
                    showBest: true
                };
        }
    };

    const columnConfig = getColumnConfig(selectedPredictionType);

    return (
        <div className="math-predictions-page">
            <div className="container-wrapper wrap">
                {/* Breadcrumbs */}
                <div className="breadcrumbs">
                    <a href="/" className="breadcrumb-link">Livebaz</a>
                    <span className="breadcrumb-separator">›</span>
                    <span className="breadcrumb-current">Math predictions</span>
                </div>

                {/* Mobile Filter Dropdown */}
                <div className="mobile-league-dropdown">
                    <div className="mobile-dropdown-header" onClick={() => setMobileDropdownOpen(!mobileDropdownOpen)}>
                        <span>Filters {filters.league ? '(1)' : ''}</span>
                        <span>{mobileDropdownOpen ? '▼' : '▶'}</span>
                    </div>
                    {mobileDropdownOpen && (
                        <div className="mobile-dropdown-content">
                            <button
                                onClick={() => setFilters({ matchType: 'all', probability: 0, league: null })}
                                style={{
                                    width: 'calc(100% - 32px)',
                                    margin: '8px 16px',
                                    padding: '8px 16px',
                                    backgroundColor: '#ff4444',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '6px',
                                    fontSize: '12px',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                }}
                            >
                                Reset Filters
                            </button>

                            {/* Match Type Section */}
                            <div className="mobile-dropdown-section-title">MATCHES</div>
                            <div className="mobile-filter-options">
                                <label className="mobile-filter-option">
                                    <input
                                        type="radio"
                                        name="mobileMatchType"
                                        checked={filters.matchType === 'all'}
                                        onChange={() => setFilters({ ...filters, matchType: 'all' })}
                                    />
                                    <span>All matches</span>
                                </label>
                                <label className="mobile-filter-option">
                                    <input
                                        type="radio"
                                        name="mobileMatchType"
                                        checked={filters.matchType === 'live'}
                                        onChange={() => setFilters({ ...filters, matchType: 'live' })}
                                    />
                                    <span>Live only</span>
                                </label>
                                <label className="mobile-filter-option">
                                    <input
                                        type="radio"
                                        name="mobileMatchType"
                                        checked={filters.matchType === 'plan'}
                                        onChange={() => setFilters({ ...filters, matchType: 'plan' })}
                                    />
                                    <span>Planned only</span>
                                </label>
                                <label className="mobile-filter-option">
                                    <input
                                        type="radio"
                                        name="mobileMatchType"
                                        checked={filters.matchType === 'finished'}
                                        onChange={() => setFilters({ ...filters, matchType: 'finished' })}
                                    />
                                    <span>Finished only</span>
                                </label>
                            </div>

                            {/* Probability Section */}
                            <div className="mobile-dropdown-section-title">PROBABILITY</div>
                            <div className="mobile-filter-options">
                                <label className="mobile-filter-option">
                                    <input
                                        type="radio"
                                        name="mobileProbability"
                                        checked={filters.probability === 0}
                                        onChange={() => setFilters({ ...filters, probability: 0 })}
                                    />
                                    <span>All outcomes</span>
                                </label>
                                <label className="mobile-filter-option">
                                    <input
                                        type="radio"
                                        name="mobileProbability"
                                        checked={filters.probability === 60}
                                        onChange={() => setFilters({ ...filters, probability: 60 })}
                                    />
                                    <span>≥ 60%</span>
                                </label>
                                <label className="mobile-filter-option">
                                    <input
                                        type="radio"
                                        name="mobileProbability"
                                        checked={filters.probability === 75}
                                        onChange={() => setFilters({ ...filters, probability: 75 })}
                                    />
                                    <span>≥ 75%</span>
                                </label>
                                <label className="mobile-filter-option">
                                    <input
                                        type="radio"
                                        name="mobileProbability"
                                        checked={filters.probability === 90}
                                        onChange={() => setFilters({ ...filters, probability: 90 })}
                                    />
                                    <span>≥ 90%</span>
                                </label>
                            </div>

                            {/* Countries & Leagues Section */}
                            <div className="mobile-dropdown-section-title">COUNTRIES & LEAGUES</div>
                            {Object.entries(leaguesByCountry).map(([country, leagues]) => (
                                <div key={country}>
                                    <div
                                        className="mobile-dropdown-section-title"
                                        style={{ background: '#222', color: '#fff', fontSize: '10px', paddingLeft: '24px' }}
                                        onClick={() => toggleCountry(country)}
                                    >
                                        {country} {expandedCountries.has(country) ? '▼' : '▶'}
                                    </div>
                                    {expandedCountries.has(country) && leagues.map(league => (
                                        <div
                                            key={league.id}
                                            className={`mobile-league-item ${filters.league === league.id ? 'selected' : ''}`}
                                            onClick={() => setFilters({ ...filters, league: league.id })}
                                        >
                                            <span className="league-name-mobile">{league.name}</span>
                                            <div className="league-logo-wrapper">
                                                {league.logo && <img src={league.logo} alt="" className="league-icon-img" />}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Main Grid Layout */}
                <div className="content-grid" style={{ direction: isRTL ? 'rtl' : 'ltr', gap: '20px' }}>
                    {/* Filters Sidebar */}
                    <aside className="filters-sidebar">
                        <div className="filters-header">
                            <h3 className="filters-title">FILTERS</h3>
                            <button
                                className="clear-filters"
                                onClick={() => setFilters({ matchType: 'all', probability: 0, league: null })}
                            >
                                <span>✕</span>
                                <span>Clear filters</span>
                            </button>
                        </div>

                        {/* Match Type Filter */}
                        <div className="filter-group">
                            <h4 className="filter-group-title">MATCHES</h4>
                            <div className="filter-options">
                                <label className="filter-option">
                                    <input
                                        type="radio"
                                        name="matchType"
                                        checked={filters.matchType === 'all'}
                                        onChange={() => setFilters({ ...filters, matchType: 'all' })}
                                    />
                                    <span className="filter-label">All matches</span>
                                </label>
                                <label className="filter-option">
                                    <input
                                        type="radio"
                                        name="matchType"
                                        checked={filters.matchType === 'live'}
                                        onChange={() => setFilters({ ...filters, matchType: 'live' })}
                                    />
                                    <span className="filter-label">Live only</span>
                                </label>
                                <label className="filter-option">
                                    <input
                                        type="radio"
                                        name="matchType"
                                        checked={filters.matchType === 'plan'}
                                        onChange={() => setFilters({ ...filters, matchType: 'plan' })}
                                    />
                                    <span className="filter-label">Planned only</span>
                                </label>
                                <label className="filter-option">
                                    <input
                                        type="radio"
                                        name="matchType"
                                        checked={filters.matchType === 'finished'}
                                        onChange={() => setFilters({ ...filters, matchType: 'finished' })}
                                    />
                                    <span className="filter-label">Finished only</span>
                                </label>
                            </div>
                        </div>

                        {/* Probability Filter */}
                        <div className="filter-group">
                            <h4 className="filter-group-title">PROBABILITY</h4>
                            <div className="filter-options">
                                <label className="filter-option">
                                    <input
                                        type="radio"
                                        name="probability"
                                        checked={filters.probability === 0}
                                        onChange={() => setFilters({ ...filters, probability: 0 })}
                                    />
                                    <span className="filter-label">All outcomes</span>
                                </label>
                                <label className="filter-option">
                                    <input
                                        type="radio"
                                        name="probability"
                                        checked={filters.probability === 60}
                                        onChange={() => setFilters({ ...filters, probability: 60 })}
                                    />
                                    <span className="filter-label">Greater than/equal to 60%</span>
                                </label>
                                <label className="filter-option">
                                    <input
                                        type="radio"
                                        name="probability"
                                        checked={filters.probability === 75}
                                        onChange={() => setFilters({ ...filters, probability: 75 })}
                                    />
                                    <span className="filter-label">Greater than/equal to 75%</span>
                                </label>
                                <label className="filter-option">
                                    <input
                                        type="radio"
                                        name="probability"
                                        checked={filters.probability === 90}
                                        onChange={() => setFilters({ ...filters, probability: 90 })}
                                    />
                                    <span className="filter-label">Greater than/equal to 90%</span>
                                </label>
                            </div>
                        </div>

                        {/* Countries & Leagues Filter */}
                        {Object.keys(leaguesByCountry).length > 0 && (
                            <div className="filter-group">
                                <h4 className="filter-group-title">COUNTRIES & LEAGUES</h4>
                                {Object.entries(leaguesByCountry).map(([country, leagues]) => (
                                    <div key={country} className="country-section">
                                        <div
                                            className="country-header"
                                            onClick={() => toggleCountry(country)}
                                        >
                                            <span className="country-name">{country}</span>
                                            <span className="expand-arrow">
                                                {expandedCountries.has(country) ? '▼' : '▶'}
                                            </span>
                                        </div>
                                        {expandedCountries.has(country) && (
                                            <div className="country-leagues">
                                                {leagues.map(league => (
                                                    <label key={league.id} className="filter-option league-option">
                                                        <input
                                                            type="radio"
                                                            name="league"
                                                            checked={filters.league === league.id}
                                                            onChange={() => setFilters({ ...filters, league: league.id })}
                                                        />
                                                        {league.logo && (
                                                            <img src={league.logo} alt="" className="league-filter-icon" />
                                                        )}
                                                        <span className="filter-label">{league.name}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </aside>

                    {/* Main Content */}
                    <main className="main-content">
                        {/* Page Header */}
                        <div className="page-header">
                            <h1 className="page-title">Mathematical Football Predictions</h1>
                        </div>

                        {/* Date Tabs */}
                        <div className="date-tabs">
                            {dateTabs.map(tab => (
                                <button
                                    key={tab.value}
                                    className={`date-tab ${selectedDate === tab.value ? 'active' : ''}`}
                                    onClick={() => setSelectedDate(tab.value)}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>





                        {/* Table Header */}
                        <div
                            className="predictions-table-header"
                            style={{ gridTemplateColumns: columnConfig.template }}
                        >
                            <div>Time</div>
                            <div>Games</div>
                            {columnConfig.show1x2 && <div className="header-with-subs">
                                <div className="main-header">1x2</div>
                            </div>}
                            {columnConfig.showGoals && <div className="header-with-subs">
                                <div className="main-header">Goals</div>
                            </div>}
                            {columnConfig.showBTTS && <div className="header-with-subs">
                                <div className="main-header">BTTS</div>
                            </div>}
                            {columnConfig.showDoubleChance && (
                                <>
                                    <div className="header-with-subs">
                                        <div className="main-header">1/X</div>
                                    </div>
                                    <div className="header-with-subs">
                                        <div className="main-header">1/2</div>
                                    </div>
                                    <div className="header-with-subs">
                                        <div className="main-header">X/2</div>
                                    </div>
                                </>
                            )}
                            {columnConfig.showBest && !isMobile && <div>Best Tip</div>}
                        </div>

                        {/* Table Body */}
                        {loading ? (
                            <TableSkeleton rows={10} />
                        ) : (
                            <div className="predictions-table-body">
                                {filteredPredictions.length === 0 ? (
                                    <div className="loading-state">No predictions available for the selected filters</div>
                                ) : (
                                    <>
                                        {filteredPredictions.slice(0, visibleCount).map(match => (
                                            <div
                                                key={match.id}
                                                className="match-row"
                                                style={{
                                                    gridTemplateColumns: columnConfig.template,
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s'
                                                }}
                                                onClick={() => handleMatchClick(match.id)}
                                            >
                                                {/* Live Indicator */}
                                                {match.isLive && (
                                                    <div className="live-indicator">
                                                        <span className="live-badge">LIVE</span>
                                                    </div>
                                                )}

                                                {/* Time */}
                                                <div className="td-time">
                                                    <div className="match-time">
                                                        {!match.isLive && match.time && (
                                                            /\s/.test(match.time) ? (
                                                                <>
                                                                    <div className="match-date-part">{match.time.split(/\s+/)[0]}</div>
                                                                    <div className="match-time-part">{match.time.split(/\s+/)[1]}</div>
                                                                </>
                                                            ) : (
                                                                match.time
                                                            )
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Game */}
                                                <div className="td-game">
                                                    <div className="league-name">
                                                        {match.leagueLogo && (
                                                            <img
                                                                src={match.leagueLogo}
                                                                alt=""
                                                                className="league-logo"
                                                                onError={(e) => e.target.style.display = 'none'}
                                                            />
                                                        )}
                                                        <span>{match.league}</span>
                                                    </div>
                                                    <div className="teams">
                                                        <div className="team-row">
                                                            <img
                                                                src={match.homeLogo || 'https://statistic-cdn.ratingbet.com/statistic/team/1f83550568b7fd4d3b2decba79fdcbac97a686d9da83b477dbfec47a7b1fe548-30-30.png'}
                                                                alt=""
                                                                className="team-logo"
                                                                onError={(e) => {
                                                                    e.target.src = 'https://statistic-cdn.ratingbet.com/statistic/team/1f83550568b7fd4d3b2decba79fdcbac97a686d9da83b477dbfec47a7b1fe548-30-30.png';
                                                                }}
                                                            />
                                                            <span className="team-name">{match.homeTeam}</span>
                                                            {match.homeScore !== '-' && (
                                                                <span className="team-score">{match.homeScore}</span>
                                                            )}
                                                        </div>
                                                        <div className="team-row">
                                                            <img
                                                                src={match.awayLogo || 'https://ratingbet.com/ratingbet_build/img/team_logo_empty.9830efe9.png'}
                                                                alt=""
                                                                className="team-logo"
                                                                onError={(e) => {
                                                                    e.target.src = 'https://ratingbet.com/ratingbet_build/img/team_logo_empty.9830efe9.png';
                                                                }}
                                                            />
                                                            <span className="team-name">{match.awayTeam}</span>
                                                            {match.awayScore !== '-' && (
                                                                <span className="team-score">{match.awayScore}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* 1x2 Predictions - Show all three */}
                                                {columnConfig.show1x2 && (
                                                    <div className="prediction-boxes">
                                                        {match.predictions?.['1x2'] && (() => {
                                                            const { w1, draw, w2 } = match.predictions['1x2'];
                                                            const maxProb = Math.max(w1.prob, draw.prob, w2.prob);
                                                            return (
                                                                <>
                                                                    <div className={`pred-box ${w1.prob === maxProb ? 'highlighted' : ''}`}>
                                                                        <div className="pred-label">W1</div>
                                                                        <div className="pred-odds">{formatOdds(w1.odds)}</div>
                                                                        <div className="pred-prob">{Math.round(w1.prob)}%</div>
                                                                    </div>
                                                                </>
                                                            );
                                                        })()}
                                                    </div>
                                                )}

                                                {/* Goals - Show all three */}
                                                {columnConfig.showGoals && (
                                                    <div className="prediction-boxes">
                                                        {match.predictions?.goals && (() => {
                                                            const { over, under } = match.predictions.goals;
                                                            const maxProb = Math.max(over.prob, under.prob);
                                                            return (
                                                                <>
                                                                    <div className={`pred-box ${over.prob === maxProb ? 'highlighted' : ''}`}>
                                                                        <div className="pred-label">O 2.5</div>
                                                                        <div className="pred-odds">{formatOdds(over.odds)}</div>
                                                                        <div className="pred-prob">{Math.round(over.prob)}%</div>
                                                                    </div>
                                                                </>
                                                            );
                                                        })()}
                                                    </div>
                                                )}

                                                {/* BTTS - Show all three */}
                                                {columnConfig.showBTTS && (
                                                    <div className="prediction-boxes">
                                                        {match.predictions?.btts && (() => {
                                                            const { yes, no } = match.predictions.btts;
                                                            const maxProb = Math.max(yes.prob, no.prob);
                                                            return (
                                                                <>
                                                                    {yes.prob ? (
                                                                        <div className={`pred-box ${yes.prob === maxProb ? 'highlighted' : ''}`}>
                                                                            <div className="pred-label">Yes</div>
                                                                            <div className="pred-odds">{formatOdds(yes.odds)}</div>
                                                                            <div className="pred-prob">{Math.round(yes.prob)}%</div>
                                                                        </div>
                                                                    ) : (
                                                                        <div className={`pred-box ${no.prob === maxProb ? 'highlighted' : ''}`}>
                                                                            <div className="pred-label">No</div>
                                                                            <div className="pred-odds">{formatOdds(no.odds)}</div>
                                                                            <div className="pred-prob">{Math.round(no.prob)}%</div>
                                                                        </div>
                                                                    )}
                                                                </>
                                                            );
                                                        })()}
                                                    </div>
                                                )}

                                                {/* Double Chance Predictions */}
                                                {columnConfig.showDoubleChance && (
                                                    <>
                                                        <div className="prediction-boxes">
                                                            <div className="pred-box">
                                                                <div className="pred-odds">{formatOdds(match.predictions?.['double-chance']?.probX)}%</div>
                                                            </div>
                                                        </div>
                                                        <div className="prediction-boxes">
                                                            <div className="pred-box">
                                                                <div className="pred-odds">{formatOdds(match.predictions?.['double-chance']?.prob2)}%</div>
                                                            </div>
                                                        </div>
                                                        <div className="prediction-boxes">
                                                            <div className="pred-box">
                                                                <div className="pred-odds">{formatOdds(match.predictions?.['double-chance']?.prob3)}%</div>
                                                            </div>
                                                        </div>
                                                    </>
                                                )}

                                                {/* Best Tip */}
                                                {columnConfig.showBest && (
                                                    <div className="td-best">
                                                        {match.predictions?.bestTip && (() => {
                                                            const { type, probability, odds } = match.predictions.bestTip;
                                                            // Parse the type to get category and value
                                                            let category = '';
                                                            let value = '';
                                                            let valueColor = '#ef4444'; // red for goals

                                                            if (type.includes('Home Win')) {
                                                                category = '1X2 :';
                                                                value = 'W1';
                                                                valueColor = '#4db8a4'; // teal
                                                            } else if (type.includes('Away Win')) {
                                                                category = '1X2 :';
                                                                value = 'W2';
                                                                valueColor = '#4db8a4'; // teal
                                                            } else if (type.includes('Draw')) {
                                                                category = '1X2 :';
                                                                value = 'X';
                                                                valueColor = '#4db8a4'; // teal
                                                            } else if (type.includes('Over')) {
                                                                category = 'Goals :';
                                                                value = 'O2.5';
                                                                valueColor = '#ef4444'; // red
                                                            } else if (type.includes('Under')) {
                                                                category = 'Goals :';
                                                                value = 'U 2.5';
                                                                valueColor = '#ef4444'; // red
                                                            } else if (type.includes('BTTS')) {
                                                                category = 'BTTS :';
                                                                value = 'Yes';
                                                                valueColor = '#8b5cf6'; // purple
                                                            }

                                                            return (
                                                                <div className="best-tip-card">
                                                                    <div>
                                                                        <div className="best-tip-type">
                                                                            {category} <span style={{ color: valueColor }}>{value}</span>
                                                                        </div>
                                                                        <div className="best-tip-probability">
                                                                            Probability {Math.round(probability)}%
                                                                        </div>
                                                                    </div>
                                                                    <div className="best-tip-odds">{formatOdds(odds)}</div>
                                                                </div>
                                                            );
                                                        })()}
                                                    </div>
                                                )}
                                            </div>
                                        ))}

                                        {/* Show More Button */}
                                        {filteredPredictions.length > visibleCount && (
                                            <div className="show-more-container">
                                                <button
                                                    className="show-more-btn"
                                                    onClick={() => setVisibleCount(prev => prev + 30)}
                                                >
                                                    Show more predictions
                                                </button>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
}

export default MathPredictions;

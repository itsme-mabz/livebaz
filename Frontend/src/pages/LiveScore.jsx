import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { fetchPopularLeagues } from '../Service/FootballService';
import { replaceTranslation } from '../utils/translationReplacer.jsx';
import { convertToLocalTime } from '../utils/timezone';
import { useTimezone } from '../context/TimezoneContext';
import './LiveScore.css';

const API_KEY = import.meta.env.VITE_APIFOOTBALL_KEY || '8b638d34018a20c11ed623f266d7a7a6a5db7a451fb17038f8f47962c66db43b';
const BASE_URL = 'https://apiv3.apifootball.com';

function LiveScore() {
    const navigate = useNavigate();
    const { currentTimezone } = useTimezone();
    const [allMatches, setAllMatches] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedLeagues, setSelectedLeagues] = useState(new Set());
    const [leaguesByCountry, setLeaguesByCountry] = useState({});
    const [topLeagues, setTopLeagues] = useState([]);
    const [popularMatches, setPopularMatches] = useState([]);
    const [expandedCountries, setExpandedCountries] = useState(new Set());
    const [selectedStatus, setSelectedStatus] = useState('all'); // 'yesterday', 'all', 'live', 'upcoming', 'finished', 'tomorrow'
    const [counts, setCounts] = useState({ yesterday: 0, all: 0, live: 0, upcoming: 0, finished: 0, tomorrow: 0 });
    const [standingsData, setStandingsData] = useState(null);
    const [visibleCount, setVisibleCount] = useState(40);
    const [isArabic, setIsArabic] = useState(false);
    const [showOdds, setShowOdds] = useState(false);
    const [mobileDropdownOpen, setMobileDropdownOpen] = useState(false);
    const [renderKey, setRenderKey] = useState(0);

    const [currentLang, setCurrentLang] = useState('en');

    // Detect Arabic or Persian language & Current Language
    useEffect(() => {
        const checkLanguage = () => {
            const select = document.querySelector('.goog-te-combo');
            if (select) {
                // Keep isArabic for layout/RTL purposes if needed elsewhere
                setIsArabic(select.value === 'ar' || select.value === 'fa');
                setCurrentLang(select.value || 'en');
            }
        };

        checkLanguage();
        const interval = setInterval(checkLanguage, 500);
        return () => clearInterval(interval);
    }, []);

    // Reset visible count when switching tabs or leagues
    useEffect(() => {
        setVisibleCount(40);
    }, [selectedStatus, selectedLeagues]);
    const [showStandingsModal, setShowStandingsModal] = useState(false);
    const [loadingStandings, setLoadingStandings] = useState(false);

    // Transform match data
    const transformMatch = (match) => {
        // API returns BST (UTC+1), convert to selected timezone
        const [hours, minutes] = match.match_time.split(':');
        // Adjust from BST to GMT (subtract 1 hour)
        const gmtTime = `${String(parseInt(hours) - 1).padStart(2, '0')}:${minutes}`;

        // Use timezone utility to convert to selected timezone
        const converted = convertToLocalTime(match.match_date, gmtTime, currentTimezone);

        return {
            id: match.match_id,
            time: converted.time,
            league: match.league_name,
            leagueId: match.league_id,
            leagueLogo: match.league_logo,
            country: match.country_name,
            homeTeam: match.match_hometeam_name,
            awayTeam: match.match_awayteam_name,
            homeScore: match.match_hometeam_score || '-',
            awayScore: match.match_awayteam_score || '-',
            homeLogo: match.team_home_badge,
            awayLogo: match.team_away_badge,
            isLive: match.match_live === '1',
            status: match.match_status,
            date: match.match_date,
            localDate: converted.date,
            // Prediction data
            probHome: match.prob_HW || null,
            probDraw: match.prob_D || null,
            probAway: match.prob_AW || null,
            probOver: match.prob_O || null,
            probUnder: match.prob_U || null,
            probBTTS: match.prob_BTTS || null
        };
    };

    // Format percentage value
    const formatPercentage = (value) => {
        if (!value || value === '0' || value === 0) return '-';
        let num = parseFloat(value);
        if (num > 0 && num < 1) num = num * 100;
        return num % 1 === 0 ? `${Math.round(num)}%` : `${num.toFixed(1)}%`;
    };

    // Calculate odds from probability
    const calculateOdds = (value) => {
        if (!value || value === '0' || value === 0) return '-';
        let num = parseFloat(value);
        if (isNaN(num) || num <= 0) return '-';
        if (num > 0 && num < 1) num = num * 100;
        if (num < 0.01) return '-';
        const odds = 100 / num;
        if (!isFinite(odds)) return '-';
        return odds.toFixed(2);
    };

    // Get date strings
    const getDates = () => {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);

        return {
            today: today.toISOString().split('T')[0],
            yesterday: yesterday.toISOString().split('T')[0],
            tomorrow: tomorrow.toISOString().split('T')[0]
        };
    };

    // Fetch matches for specific date/status
    const fetchMatches = useCallback(async () => {
        setLoading(true);
        try {
            const { today, yesterday, tomorrow } = getDates();
            let fetchDate = today;

            if (selectedStatus === 'yesterday') fetchDate = yesterday;
            else if (selectedStatus === 'tomorrow') fetchDate = tomorrow;

            let matchUrl = `${BASE_URL}/?action=get_events&from=${fetchDate}&to=${fetchDate}&APIkey=${API_KEY}`;
            if (selectedLeagues.size > 0) {
                matchUrl += `&league_id=${Array.from(selectedLeagues).join(',')}`;
            }

            // Fetch matches and predictions
            const [matchResponse, predictionResponse] = await Promise.all([
                axios.get(matchUrl),
                axios.get(`${BASE_URL}/?action=get_predictions&from=${fetchDate}&to=${fetchDate}&APIkey=${API_KEY}`)
            ]);

            if (matchResponse.data && Array.isArray(matchResponse.data)) {
                // Predictions map
                const predictionsMap = {};
                if (predictionResponse.data && Array.isArray(predictionResponse.data)) {
                    predictionResponse.data.forEach(pred => {
                        predictionsMap[pred.match_id] = pred;
                    });
                }

                // Merge and transform
                const transformed = matchResponse.data.map(match => {
                    const prediction = predictionsMap[match.match_id] || {};
                    const merged = {
                        ...match,
                        prob_HW: prediction.prob_HW,
                        prob_D: prediction.prob_D,
                        prob_AW: prediction.prob_AW,
                        prob_O: prediction.prob_O,
                        prob_U: prediction.prob_U,
                        prob_BTTS: prediction.prob_bts
                    };
                    return transformMatch(merged);
                });

                setAllMatches(transformed);

                // Update leagues for sidebar (only if today is selected, or keep it consistent)
                const leaguesMap = {};
                matchResponse.data.forEach(match => {
                    if (!leaguesMap[match.country_name]) leaguesMap[match.country_name] = [];
                    if (!leaguesMap[match.country_name].find(l => l.id === match.league_id)) {
                        leaguesMap[match.country_name].push({
                            id: match.league_id,
                            name: match.league_name,
                            logo: match.league_logo
                        });
                    }
                });
                setLeaguesByCountry(leaguesMap);

                // If we fetched TODAY, we can update All/Live/Upcoming/Finished counts
                if (fetchDate === today) {
                    const countsObj = {
                        all: transformed.length,
                        live: transformed.filter(m => getMatchStatus(m) === 'live').length,
                        upcoming: transformed.filter(m => getMatchStatus(m) === 'upcoming').length,
                        finished: transformed.filter(m => getMatchStatus(m) === 'finished').length
                    };
                    setCounts(prev => ({ ...prev, ...countsObj }));
                } else if (fetchDate === yesterday) {
                    setCounts(prev => ({ ...prev, yesterday: transformed.length }));
                } else if (fetchDate === tomorrow) {
                    setCounts(prev => ({ ...prev, tomorrow: transformed.length }));
                }
            }
        } catch (error) {
            console.error('Error fetching matches:', error);
        } finally {
            setLoading(false);
        }
    }, [selectedStatus, selectedLeagues, currentTimezone]);

    // Initial fetch for counts of other days
    useEffect(() => {
        const fetchOtherCounts = async () => {
            const { yesterday, tomorrow } = getDates();
            try {
                const [yResp, tResp] = await Promise.all([
                    axios.get(`${BASE_URL}/?action=get_events&from=${yesterday}&to=${yesterday}&APIkey=${API_KEY}`),
                    axios.get(`${BASE_URL}/?action=get_events&from=${tomorrow}&to=${tomorrow}&APIkey=${API_KEY}`)
                ]);

                setCounts(prev => ({
                    ...prev,
                    yesterday: Array.isArray(yResp.data) ? yResp.data.length : 0,
                    tomorrow: Array.isArray(tResp.data) ? tResp.data.length : 0
                }));
            } catch (e) {
                console.error("Error fetching other counts", e);
            }
        };
        fetchOtherCounts();
    }, []);

    // Helper function to determine match status
    const getMatchStatus = (match) => {
        if (match.isLive) return 'live';

        // Check if match is finished (has score and not live)
        if (match.homeScore !== '-' && match.awayScore !== '-' && !match.isLive) {
            return 'finished';
        }

        // Check status string for finished matches
        if (match.status && (
            match.status === '' ||
            match.status === 'Match Finished' ||
            match.status === 'After ET' ||
            match.status === 'After Pen.' ||
            match.status.toLowerCase().includes('finished') ||
            match.status.toLowerCase().includes('ft')
        )) {
            return 'finished';
        }

        return 'upcoming';
    };

    // Filter matches based on selected status
    const filteredMatches = allMatches.filter(match => {
        if (selectedStatus === 'yesterday' || selectedStatus === 'tomorrow' || selectedStatus === 'all') return true;
        const matchStatus = getMatchStatus(match);
        return selectedStatus === matchStatus;
    });

    // Group matches by league
    const groupedMatches = filteredMatches.reduce((acc, match) => {
        const key = `${match.country}-${match.leagueId}`;
        if (!acc[key]) {
            acc[key] = {
                country: match.country,
                league: match.league,
                leagueId: match.leagueId,
                leagueLogo: match.leagueLogo,
                matches: []
            };
        }
        acc[key].matches.push(match);
        return acc;
    }, {});

    // Sort matches within each league group by time
    Object.values(groupedMatches).forEach(group => {
        group.matches.sort((a, b) => a.time.localeCompare(b.time));
    });

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

    const toggleLeague = (leagueId) => {
        setSelectedLeagues(prev => {
            const newSet = new Set(prev);
            if (newSet.has(leagueId)) {
                newSet.delete(leagueId);
            } else {
                newSet.add(leagueId);
            }
            return newSet;
        });
    };

    const clearFilters = () => {
        setRenderKey(prev => prev + 1);
        setLoading(true);
        setTimeout(() => {
            setSelectedLeagues(new Set());
            setVisibleCount(40);
            setLoading(false);
        }, 100);
    };

    // Fetch top leagues from backend
    const fetchTopLeagues = useCallback(async () => {
        try {
            const popularData = await fetchPopularLeagues();
            if (Array.isArray(popularData)) {
                const formatted = popularData.map(l => ({
                    id: l.league_id,
                    name: l.league_name,
                    logo: l.league_logo
                }));
                if (formatted.length > 0) {
                    setTopLeagues(formatted);
                }
            }
        } catch (error) {
            console.error('Error fetching top leagues:', error);
        }
    }, []);

    // Fetch popular matches from backend
    const fetchPopularMatches = useCallback(async () => {
        try {
            const response = await axios.get('/api/v1/public/popular-items?type=match');
            if (response.data?.success && response.data.data) {
                const matchIds = response.data.data.map(item => item.item_id);
                if (matchIds.length > 0) {
                    const matchesResponse = await axios.get(`/api/v1/public/matches-by-ids?match_ids=${matchIds.join(',')}`);
                    if (matchesResponse.data?.success) {
                        setPopularMatches(matchesResponse.data.data.map(m => ({
                            id: m.match_id,
                            homeTeam: m.match_hometeam_name,
                            awayTeam: m.match_awayteam_name,
                            homeLogo: m.team_home_badge,
                            awayLogo: m.team_away_badge
                        })));
                    }
                }
            }
        } catch (error) {
            console.error('Error fetching popular matches:', error);
        }
    }, []);

    // Fetch standings for a specific league
    const fetchStandings = async (leagueId, leagueName) => {
        setLoadingStandings(true);
        setShowStandingsModal(true);
        try {
            const url = `${BASE_URL}/?action=get_standings&league_id=${leagueId}&APIkey=${API_KEY}`;
            const response = await axios.get(url);

            if (response.data && Array.isArray(response.data)) {
                setStandingsData({
                    leagueName: leagueName,
                    standings: response.data
                });
            }
        } catch (error) {
            console.error('Error fetching standings:', error);
            setStandingsData(null);
        } finally {
            setLoadingStandings(false);
        }
    };

    useEffect(() => {
        fetchTopLeagues();
        fetchPopularMatches();
    }, [fetchTopLeagues, fetchPopularMatches]);

    useEffect(() => {
        fetchMatches();
    }, [fetchMatches]);

    // Auto-switch to upcoming if no live matches on initial load
    useEffect(() => {
        if (allMatches.length > 0 && counts.live === 0 && selectedStatus === 'live') {
            if (counts.upcoming > 0) {
                setSelectedStatus('upcoming');
            } else if (counts.finished > 0) {
                setSelectedStatus('finished');
            }
        }
    }, [allMatches, counts, selectedStatus]);


    return (
        <div className="livescore-page wrap " style={{ paddingTop: '8px' }}>
            {/* Breadcrumbs */}
            <div className="breadcrumbs">
                <a href="/">Livebaz</a>
                <span>/</span>
                <span>Live Score</span>
            </div>

            {/* Mobile League Dropdown */}
            <div className="mobile-league-dropdown">
                <div className="mobile-dropdown-header" onClick={() => setMobileDropdownOpen(!mobileDropdownOpen)}>
                    <span>Filter by League {selectedLeagues.size > 0 && `(${selectedLeagues.size})`}</span>
                    <span>{mobileDropdownOpen ? '▼' : '▶'}</span>
                </div>
                {mobileDropdownOpen && (
                    <div className="mobile-dropdown-content">
                        {selectedLeagues.size > 0 && (
                            <button
                                onClick={clearFilters}
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
                        )}
                        {topLeagues.length > 0 && (() => {
                            // Filter top leagues that have matches
                            const leaguesWithMatches = topLeagues.filter(league =>
                                allMatches.some(match => match.leagueId === league.id)
                            );

                            if (leaguesWithMatches.length === 0) return null;

                            return (
                                <>
                                    <div className="mobile-dropdown-section-title">Popular Leagues</div>
                                    {leaguesWithMatches.map(league => (
                                        <div
                                            key={league.id}
                                            className={`mobile-league-item ${selectedLeagues.has(league.id) ? 'selected' : ''}`}
                                            onClick={() => toggleLeague(league.id)}
                                        >
                                            <span className="league-name-mobile">{replaceTranslation(league.name, isArabic ? 'ar' : 'fa')}</span>
                                            <div className="league-logo-wrapper">
                                                {league.logo ? (
                                                    <img src={league.logo} alt="" className="league-icon-img" />
                                                ) : (
                                                    <div className="league-logo-placeholder"></div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </>
                            );
                        })()}
                        <div className="mobile-dropdown-section-title">All Leagues</div>
                        {Object.entries(leaguesByCountry)
                            .sort(([countryA], [countryB]) => countryA.localeCompare(countryB))
                            .map(([country, leagues]) => leagues.map(league => (
                                <div
                                    key={league.id}
                                    className={`mobile-league-item ${selectedLeagues.has(league.id) ? 'selected' : ''}`}
                                    onClick={() => toggleLeague(league.id)}
                                >
                                    <span className="league-name-mobile">{replaceTranslation(league.name, isArabic ? 'ar' : 'fa')}</span>
                                    <div className="league-logo-wrapper">
                                        {league.logo ? (
                                            <img src={league.logo} alt="" className="league-icon-img" />
                                        ) : (
                                            <div className="league-logo-placeholder"></div>
                                        )}
                                    </div>
                                </div>
                            )))
                        }
                    </div>
                )}
            </div>

            <div className="livescore-container wrap" style={{ direction: isArabic ? 'rtl' : 'ltr', gap: isArabic ? '20px' : '0' }}>
                {/* Sidebar */}
                <aside className="livescore-sidebar">
                    {popularMatches.length > 0 && (
                        <div className="sidebar-section">
                            <h4 className="sidebar-title popular-matches-heading">Popular Matches</h4>
                            {popularMatches.map(match => (
                                <div
                                    key={match.id}
                                    className="sidebar-league-item"
                                    onClick={() => navigate(`/match/${match.id}`)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                                        {match.homeLogo && <img src={match.homeLogo} alt="" style={{ width: '20px', height: '20px' }} />}
                                        <span style={{ fontSize: '12px' }}>{match.homeTeam}</span>
                                    </div>
                                    <span style={{ fontSize: '10px', color: '#666' }}>vs</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, justifyContent: 'flex-end' }}>
                                        <span style={{ fontSize: '12px' }}>{match.awayTeam}</span>
                                        {match.awayLogo && <img src={match.awayLogo} alt="" style={{ width: '20px', height: '20px' }} />}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {topLeagues.length > 0 && (() => {
                        // Filter top leagues that have matches and sort alphabetically
                        const leaguesWithMatches = topLeagues
                            .filter(league => allMatches.some(match => match.leagueId === league.id))
                            .sort((a, b) => a.name.localeCompare(b.name));

                        if (leaguesWithMatches.length === 0) return null;

                        return (
                            <>
                                <div className="sidebar-header" style={{ marginTop: '20px' }}>
                                    <h3 className="sidebar-title">TOP LEAGUES</h3>

                                </div>
                                <div style={{ padding: '0 16px 8px', fontSize: '14px', color: '#666', fontWeight: '700', marginTop: '8px' }}>Popular Today</div>
                                <div className="sidebar-section">
                                    {leaguesWithMatches.map(league => (
                                        <div
                                            key={league.id}
                                            className={`sidebar-league-item ${selectedLeagues.has(league.id) ? 'selected' : ''}`}
                                            onClick={() => toggleLeague(league.id)}
                                        >
                                            {league.logo ? (
                                                <img src={league.logo} alt="" className="league-icon-img" />
                                            ) : (
                                                <span className="league-icon">⚽</span>
                                            )}
                                            <span className="league-name">{replaceTranslation(league.name, isArabic ? 'ar' : 'fa')}</span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        );
                    })()}

                    {Object.entries(leaguesByCountry)
                        .sort(([countryA], [countryB]) => countryA.localeCompare(countryB))
                        .map(([country, leagues]) => (
                            <div key={country} className="sidebar-section">
                                <h4
                                    className="sidebar-section-title clickable"
                                    onClick={() => toggleCountry(country)}
                                >
                                    {country}
                                    <span className="expand-arrow">
                                        {expandedCountries.has(country) ? '▼' : '▶'}
                                    </span>
                                </h4>
                                {expandedCountries.has(country) && (
                                    <div className="sidebar-leagues">
                                        {leagues.map(league => (
                                            <div
                                                key={league.id}
                                                className={`sidebar-league-item ${selectedLeagues.has(league.id) ? 'selected' : ''}`}
                                                onClick={() => toggleLeague(league.id)}
                                            >
                                                {league.logo ? (
                                                    <img src={league.logo} alt="" className="league-icon-img" />
                                                ) : (
                                                    <span className="league-icon">⚽</span>
                                                )}
                                                <span className="league-name">{replaceTranslation(league.name, isArabic ? 'ar' : 'fa')}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                </aside>

                {/* Main Content */}
                <main className="livescore-main">
                    {/* Header */}
                    <div className="livescore-header">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                <h1 className="livescore-title" style={{ display: 'flex', alignItems: 'center', margin: 0 }}>
                                    {replaceTranslation('Live Football Games', currentLang)}
                                </h1>

                                {/* Odds Toggle Switch */}

                            </div>
                        </div>
                        <div className="livescore-date-pills">
                            <button
                                className={`livescore-date-pill ${selectedStatus === 'all' ? 'active' : ''}`}
                                onClick={() => setSelectedStatus('all')}
                            >
                                All {counts.all}
                            </button>
                            <button
                                className={`livescore-date-pill ${selectedStatus === 'live' ? 'active' : ''}`}
                                onClick={() => setSelectedStatus('live')}
                            >
                                <span className="live-dot" style={{
                                    width: '6px',
                                    height: '6px',
                                    borderRadius: '50%',
                                    backgroundColor: selectedStatus === 'live' ? '#fff' : '#00c853',
                                    display: 'inline-block',
                                    marginRight: '6px'
                                }}></span>
                                Live {counts.live}
                            </button>
                            <button
                                className={`livescore-date-pill ${selectedStatus === 'upcoming' ? 'active' : ''}`}
                                onClick={() => setSelectedStatus('upcoming')}
                            >
                                Upcoming {counts.upcoming}
                            </button>
                            <button
                                className={`livescore-date-pill ${selectedStatus === 'finished' ? 'active' : ''}`}
                                onClick={() => setSelectedStatus('finished')}
                            >
                                Finished {counts.finished}
                            </button>
                            <button
                                className={`livescore-date-pill ${selectedStatus === 'tomorrow' ? 'active' : ''}`}
                                onClick={() => setSelectedStatus('tomorrow')}
                            >
                                Tomorrow {counts.tomorrow}
                            </button>
                            <button
                                className={`livescore-date-pill ${selectedStatus === 'yesterday' ? 'active' : ''}`}
                                onClick={() => setSelectedStatus('yesterday')}
                            >
                                Yesterday {counts.yesterday}
                            </button>
                            {selectedLeagues.size > 0 && (
                                <button
                                    onClick={clearFilters}
                                    style={{
                                        padding: '6px 12px',
                                        backgroundColor: '#ff4444',
                                        color: '#fff',
                                        border: 'none',
                                        borderRadius: '6px',
                                        fontSize: '12px',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        marginLeft: 'auto'
                                    }}
                                >
                                    Clear All
                                </button>
                            )}
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px', marginLeft: '12px' }}>
                        <span style={{ fontSize: '14px', fontWeight: '600', color: '#4b5563' }}>{replaceTranslation('Odds', currentLang)}</span>
                        <label style={{
                            position: 'relative',
                            display: 'inline-block',
                            width: '50px',
                            height: '24px',
                            cursor: 'pointer'
                        }}>
                            <input
                                type="checkbox"
                                checked={showOdds}
                                onChange={() => setShowOdds(!showOdds)}
                                style={{ opacity: 0, width: 0, height: 0 }}
                            />
                            <span style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                backgroundColor: showOdds ? '#000' : '#ccc',
                                borderRadius: '24px',
                                transition: 'background-color 0.3s'
                            }}>
                                <span style={{
                                    position: 'absolute',
                                    content: '',
                                    height: '18px',
                                    width: '18px',
                                    left: showOdds ? '29px' : '3px',
                                    bottom: '3px',
                                    backgroundColor: '#fff',
                                    borderRadius: '50%',
                                    transition: 'left 0.3s'
                                }}></span>
                            </span>
                        </label>
                    </div>

                    {/* Matches */}
                    <div className="livescore-content" key={renderKey}>
                        {loading ? (
                            <div className="loading-state">Loading matches...</div>
                        ) : filteredMatches.length === 0 ? (
                            <div className="empty-state">No {selectedStatus} matches found</div>
                        ) : (
                            <>
                                {(() => {
                                    let matchCounter = 0;
                                    return Object.values(groupedMatches)
                                        .sort((a, b) => {
                                            const topLeagueIds = topLeagues.map(l => String(l.id));
                                            const aIndex = topLeagueIds.indexOf(String(a.leagueId));
                                            const bIndex = topLeagueIds.indexOf(String(b.leagueId));
                                            if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
                                            if (aIndex !== -1) return -1;
                                            if (bIndex !== -1) return 1;
                                            const countryCompare = a.country.localeCompare(b.country);
                                            if (countryCompare !== 0) return countryCompare;
                                            return a.league.localeCompare(b.league);
                                        })
                                        .map((group, idx) => {
                                            // Handle pagination
                                            if (matchCounter >= visibleCount) return null;
                                            const remainingCapacity = visibleCount - matchCounter;
                                            const matchesToShow = group.matches.slice(0, remainingCapacity);

                                            if (matchesToShow.length === 0) return null;
                                            matchCounter += matchesToShow.length;

                                            return (
                                                <div key={`${group.leagueId}-${idx}-${renderKey}`} className="league-card" suppressHydrationWarning>
                                                    <div className="league-card-header">
                                                        <div className="league-card-title-wrapper">
                                                            {group.leagueLogo && (
                                                                <img src={group.leagueLogo} alt="" className="league-card-logo" />
                                                            )}
                                                            <h3 className="league-card-title">
                                                                {group.country.toUpperCase()}: {replaceTranslation(group.league.toUpperCase(), isArabic ? 'ar' : 'fa')}
                                                            </h3>
                                                        </div>
                                                        <button
                                                            className="standings-link"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                fetchStandings(group.leagueId, group.league);
                                                            }}
                                                        >
                                                            Standings
                                                        </button>
                                                    </div>

                                                    <div className="matches-list">
                                                        <div className="matches-header-stats">
                                                            <div className="col-time-stat">Time</div>
                                                            <div className="col-match-stat">Match</div>
                                                            <div className="col-score-stat">Score</div>
                                                            <div className="col-1-stat">1</div>
                                                            <div className="col-x-stat">X</div>
                                                            <div className="col-2-stat">2</div>
                                                        </div>

                                                        {matchesToShow.map((match) => (
                                                            <div
                                                                key={match.id}
                                                                className={`match-row-stats`}
                                                                onClick={() => navigate(`/match/${match.id}`)}
                                                            >
                                                                <div className="col-time-stat">
                                                                    {match.isLive ? (
                                                                        <div className="live-badge-new notranslate">
                                                                            <span className="live-text">Live</span>
                                                                            <span className="live-minute">{match.status}'</span>
                                                                        </div>
                                                                    ) : (
                                                                        <div className="match-time-new notranslate">{match.time}</div>
                                                                    )}
                                                                </div>

                                                                <div className="col-match-stat">
                                                                    <div className="team-row-new">
                                                                        {match.homeLogo && <img src={match.homeLogo} alt="" className="team-logo" />}
                                                                        <span className="team-name-new">{match.homeTeam}</span>
                                                                    </div>
                                                                    <div className="team-row-new">
                                                                        {match.awayLogo && <img src={match.awayLogo} alt="" className="team-logo" />}
                                                                        <span className="team-name-new">{match.awayTeam}</span>
                                                                    </div>
                                                                </div>
                                                                <div className="col-score-stat notranslate">
                                                                    <div className="score-display">
                                                                        <span className={`score-number score-home ${match.isLive ? 'live' : ''}`}>
                                                                            {match.homeScore}
                                                                        </span>
                                                                        <div className="score-divider"></div>
                                                                        <span className={`score-number score-away ${match.isLive ? 'live' : ''}`}>
                                                                            {match.awayScore}
                                                                        </span>
                                                                    </div>
                                                                </div>

                                                                <div className="col-1-stat">
                                                                    <div className="prob-item-new">
                                                                        <span className="prob-value">
                                                                            {match.probHome ? (
                                                                                <>
                                                                                    {showOdds && <span className="prob-odds">{calculateOdds(match.probHome)}</span>}
                                                                                    <span className="prob-percent">{formatPercentage(match.probHome)}</span>
                                                                                </>
                                                                            ) : '-'}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                <div className="col-x-stat">
                                                                    <div className="prob-item-new">
                                                                        <span className="prob-value">
                                                                            {match.probDraw ? (
                                                                                <>
                                                                                    {showOdds && <span className="prob-odds">{calculateOdds(match.probDraw)}</span>}
                                                                                    <span className="prob-percent">{formatPercentage(match.probDraw)}</span>
                                                                                </>
                                                                            ) : '-'}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                <div className="col-2-stat">
                                                                    <div className="prob-item-new">
                                                                        <span className="prob-value">
                                                                            {match.probAway ? (
                                                                                <>
                                                                                    {showOdds && <span className="prob-odds">{calculateOdds(match.probAway)}</span>}
                                                                                    <span className="prob-percent">{formatPercentage(match.probAway)}</span>
                                                                                </>
                                                                            ) : '-'}
                                                                        </span>
                                                                    </div>
                                                                </div>

                                                                {/* Mobile Stats Row */}
                                                                <div className="prob-row">
                                                                    <div className="prob-item">
                                                                        <span className="prob-label">1</span>
                                                                        <span className="prob-value">
                                                                            {match.probHome ? (
                                                                                <>
                                                                                    {showOdds && <span className="prob-odds">{calculateOdds(match.probHome)}</span>}
                                                                                    <span className="prob-percent">{formatPercentage(match.probHome)}</span>
                                                                                </>
                                                                            ) : '-'}
                                                                        </span>
                                                                    </div>
                                                                    <div className="prob-item">
                                                                        <span className="prob-label">X</span>
                                                                        <span className="prob-value">
                                                                            {match.probDraw ? (
                                                                                <>
                                                                                    {showOdds && <span className="prob-odds">{calculateOdds(match.probDraw)}</span>}
                                                                                    <span className="prob-percent">{formatPercentage(match.probDraw)}</span>
                                                                                </>
                                                                            ) : '-'}
                                                                        </span>
                                                                    </div>
                                                                    <div className="prob-item">
                                                                        <span className="prob-label">2</span>
                                                                        <span className="prob-value">
                                                                            {match.probAway ? (
                                                                                <>
                                                                                    {showOdds && <span className="prob-odds">{calculateOdds(match.probAway)}</span>}
                                                                                    <span className="prob-percent">{formatPercentage(match.probAway)}</span>
                                                                                </>
                                                                            ) : '-'}
                                                                        </span>
                                                                    </div>
                                                                    <div className="prob-item">
                                                                        <span className="prob-label">O/U</span>
                                                                        <span className="prob-value">
                                                                            {match.probOver ? (
                                                                                <>
                                                                                    {showOdds && <span className="prob-odds">{calculateOdds(match.probOver)}</span>}
                                                                                    <span className="prob-percent">{formatPercentage(match.probOver)}</span>
                                                                                </>
                                                                            ) : '-'}
                                                                        </span>
                                                                    </div>
                                                                    <div className="prob-item">
                                                                        <span className="prob-label">BTTS</span>
                                                                        <span className="prob-value">
                                                                            {match.probBTTS ? (
                                                                                <>
                                                                                    {showOdds && <span className="prob-odds">{calculateOdds(match.probBTTS)}</span>}
                                                                                    <span className="prob-percent">{formatPercentage(match.probBTTS)}</span>
                                                                                </>
                                                                            ) : '-'}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        });
                                })()}

                                {filteredMatches.length > visibleCount && (
                                    <div className="load-more-container" style={{ textAlign: 'center', margin: '40px 0 20px' }}>
                                        <button
                                            className="load-more-btn"
                                            onClick={() => setVisibleCount(prev => prev + 40)}
                                            style={{
                                                backgroundColor: '#000',
                                                color: '#fff',
                                                padding: '12px 40px',
                                                borderRadius: '8px',
                                                border: 'none',
                                                fontSize: '15px',
                                                fontWeight: '600',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s ease',
                                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                            }}
                                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#222'}
                                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#000'}
                                        >
                                            Load More
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </main>

            </div>

            {/* Standings Modal */}
            {showStandingsModal && (
                <div className="standings-modal-overlay" onClick={() => setShowStandingsModal(false)}>
                    <div className="standings-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="standings-modal-header">
                            <h2>{standingsData?.leagueName} - Standings</h2>
                            <button className="standings-modal-close" onClick={() => setShowStandingsModal(false)}>
                                ✕
                            </button>
                        </div>
                        <div className="standings-modal-content">
                            {loadingStandings ? (
                                <div className="standings-loading">Loading standings...</div>
                            ) : standingsData?.standings ? (
                                <table className="standings-table">
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>Team</th>
                                            <th>P</th>
                                            <th>W</th>
                                            <th>D</th>
                                            <th>L</th>
                                            <th>GF</th>
                                            <th>GA</th>
                                            <th>GD</th>
                                            <th>Pts</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {standingsData.standings.map((team, idx) => (
                                            <tr key={idx}>
                                                <td>{team.overall_league_position}</td>
                                                <td className="standings-team-cell">
                                                    {team.team_badge && (
                                                        <img src={team.team_badge} alt="" className="standings-team-logo" />
                                                    )}
                                                    <span>{team.team_name}</span>
                                                </td>
                                                <td>{team.overall_league_payed}</td>
                                                <td>{team.overall_league_W}</td>
                                                <td>{team.overall_league_D}</td>
                                                <td>{team.overall_league_L}</td>
                                                <td>{team.overall_league_GF}</td>
                                                <td>{team.overall_league_GA}</td>
                                                <td>{parseInt(team.overall_league_GF) - parseInt(team.overall_league_GA)}</td>
                                                <td><strong>{team.overall_league_PTS}</strong></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="standings-error">Failed to load standings</div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default LiveScore;

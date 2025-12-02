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
                const num = parseFloat(value);
                return isNaN(num) ? 0 : parseFloat(num.toFixed(2));
            };

            // Helper function to calculate odds from probability
            const calcOdds = (probability) => {
                if (!probability || probability <= 0) return '-';
                const odds = 100 / probability;
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
                    template: '55px 200px 1fr',
                    show1x2: true,
                    showGoals: false,
                    showBTTS: false,
                    showBest: false
                };
            case 'Goals':
                return {
                    template: '55px 200px 1fr',
                    show1x2: false,
                    showGoals: true,
                    showBTTS: false,
                    showBest: false
                };
            case 'BTTS':
                return {
                    template: '55px 200px 1fr',
                    show1x2: false,
                    showGoals: false,
                    showBTTS: true,
                    showBest: false
                };
            case 'Math':
            default:
                return {
                    template: '55px 200px 180px 120px 110px 1fr',
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

                {/* Main Grid Layout */}
                <div className="content-grid">
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
                            <div>Game</div>
                            {columnConfig.show1x2 && <div>1x2</div>}
                            {columnConfig.showGoals && <div>Goals</div>}
                            {columnConfig.showBTTS && <div>BTTS</div>}
                            {columnConfig.showBest && <div>Best Tip</div>}
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
                                                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.01)'}
                                                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
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

                                                {/* 1x2 Predictions */}
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
                                                                        <div className="pred-prob">{w1.prob}%</div>
                                                                    </div>
                                                                    <div className={`pred-box ${draw.prob === maxProb ? 'highlighted' : ''}`}>
                                                                        <div className="pred-label">X</div>
                                                                        <div className="pred-odds">{formatOdds(draw.odds)}</div>
                                                                        <div className="pred-prob">{draw.prob}%</div>
                                                                    </div>
                                                                    <div className={`pred-box ${w2.prob === maxProb ? 'highlighted' : ''}`}>
                                                                        <div className="pred-label">W2</div>
                                                                        <div className="pred-odds">{formatOdds(w2.odds)}</div>
                                                                        <div className="pred-prob">{w2.prob}%</div>
                                                                    </div>
                                                                </>
                                                            );
                                                        })()}
                                                    </div>
                                                )}

                                                {/* Goals */}
                                                {columnConfig.showGoals && (
                                                    <div className="prediction-boxes">
                                                        {match.predictions?.goals && (() => {
                                                            const { over, under } = match.predictions.goals;
                                                            const maxProb = Math.max(over.prob, under.prob);
                                                            return (
                                                                <>
                                                                    <div className={`pred-box ${under.prob === maxProb ? 'highlighted' : ''}`}>
                                                                        <div className="pred-label">U 2.5</div>
                                                                        <div className="pred-odds">{formatOdds(under.odds)}</div>
                                                                        <div className="pred-prob">{under.prob}%</div>
                                                                    </div>
                                                                    <div className={`pred-box ${over.prob === maxProb ? 'highlighted' : ''}`}>
                                                                        <div className="pred-label">O 2.5</div>
                                                                        <div className="pred-odds">{formatOdds(over.odds)}</div>
                                                                        <div className="pred-prob">{over.prob}%</div>
                                                                    </div>
                                                                </>
                                                            );
                                                        })()}
                                                    </div>
                                                )}

                                                {/* BTTS */}
                                                {columnConfig.showBTTS && (
                                                    <div className="prediction-boxes">
                                                        {match.predictions?.btts && (() => {
                                                            const { yes, no } = match.predictions.btts;
                                                            const maxProb = Math.max(yes.prob, no.prob);
                                                            return (
                                                                <>
                                                                    <div className={`pred-box ${yes.prob === maxProb ? 'highlighted' : ''}`}>
                                                                        <div className="pred-label">Yes</div>
                                                                        <div className="pred-odds">{formatOdds(yes.odds)}</div>
                                                                        <div className="pred-prob">{yes.prob}%</div>
                                                                    </div>
                                                                    <div className={`pred-box ${no.prob === maxProb ? 'highlighted' : ''}`}>
                                                                        <div className="pred-label">No</div>
                                                                        <div className="pred-odds">{formatOdds(no.odds)}</div>
                                                                        <div className="pred-prob">{no.prob}%</div>
                                                                    </div>
                                                                </>
                                                            );
                                                        })()}
                                                    </div>
                                                )}

                                                {/* Best Tip */}
                                                {columnConfig.showBest && (
                                                    <div className="td-best">
                                                        {match.predictions?.bestTip && (
                                                            <div className="best-tip-card">
                                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                                    <div><div className="best-tip-type">{match.predictions.bestTip.type}</div>
                                                                        <div className="best-tip-probability">
                                                                            <span>Win Rate:</span>
                                                                            <span>{match.predictions.bestTip.probability}%</span>
                                                                        </div></div>
                                                                    <div className="best-tip-odds">{formatOdds(match.predictions.bestTip.odds)}</div>
                                                                </div>
                                                            </div>
                                                        )}
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

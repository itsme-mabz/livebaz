import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './MathPredictions.css';

const API_BASE_URL = 'http://localhost:5000/api/v1';

function MathPredictions() {
    const [predictions, setPredictions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedDate, setSelectedDate] = useState('today');
    const [selectedPredictionType, setSelectedPredictionType] = useState('Math');
    const [filters, setFilters] = useState({
        matchType: 'all',
        probability: 0,
        league: null
    });
    const [showAllLeagues, setShowAllLeagues] = useState(false);
    const [availableLeagues, setAvailableLeagues] = useState([]);
    const [visibleCount, setVisibleCount] = useState(30);

    // Date tabs configuration
    const dateTabs = [
        { label: 'Yesterday', value: 'yesterday' },
        { label: 'Today', value: 'today' },
        { label: 'Tomorrow', value: 'tomorrow' }
    ];

    // Prediction type tabs
    const predictionTabs = [
        'Math', '1x2', 'Goals', 'BTTS', 'HT/FT',
        'Asian Handicap', 'Double chance', 'Corners', 'Cards'
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
                date: dateParam
            };

            if (filters.league) {
                params.league_id = filters.league;
            }

            const response = await axios.get(`${API_BASE_URL}/predictions`, { params });

            if (response.data.success) {
                setPredictions(response.data.data);

                // Extract unique leagues
                const leagues = [...new Set(response.data.data.map(p => ({
                    id: p.league_id,
                    name: p.league,
                    country: p.country
                }))).values()];
                setAvailableLeagues(leagues);
            }
        } catch (error) {
            console.error('Error fetching predictions:', error);
            setPredictions([]);
        } finally {
            setLoading(false);
        }
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
                    template: '55px 200px 135px 75px 75px 1fr',
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
                    <a href="/" className="breadcrumb-link">Ratingbet</a>
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

                        {/* Leagues Filter */}
                        {availableLeagues.length > 0 && (
                            <div className="filter-group">
                                <h4 className="filter-group-title">LEAGUES</h4>
                                <div className="filter-options">
                                    {availableLeagues.slice(0, showAllLeagues ? undefined : 5).map(league => (
                                        <label key={league.id} className="filter-option">
                                            <input
                                                type="radio"
                                                name="league"
                                                checked={filters.league === league.id}
                                                onChange={() => setFilters({ ...filters, league: league.id })}
                                            />
                                            <span className="filter-label">{league.name}</span>
                                        </label>
                                    ))}
                                </div>
                                {availableLeagues.length > 5 && (
                                    <button
                                        className="show-more-leagues"
                                        onClick={() => setShowAllLeagues(!showAllLeagues)}
                                    >
                                        {showAllLeagues ? 'Show less' : `Show more (${availableLeagues.length - 5})`}
                                    </button>
                                )}
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

                        {/* Prediction Type Tabs */}
                        <div className="prediction-tabs">
                            {predictionTabs.map(tab => (
                                <button
                                    key={tab}
                                    className={`prediction-tab ${selectedPredictionType === tab ? 'active' : ''}`}
                                    onClick={() => setSelectedPredictionType(tab)}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>

                        {/* Table Controls */}
                        <div className="table-controls">
                            <label className="control-checkbox">
                                <input type="checkbox" />
                                <span className="checkbox-label">Show match stats</span>
                            </label>
                            <label className="control-checkbox">
                                <input type="checkbox" />
                                <span className="checkbox-label">Show probability chart</span>
                            </label>
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
                        <div className="predictions-table-body">
                            {loading ? (
                                <div className="loading-state">Loading predictions...</div>
                            ) : filteredPredictions.length === 0 ? (
                                <div className="loading-state">No predictions available for the selected filters</div>
                            ) : (
                                <>
                                    {filteredPredictions.slice(0, visibleCount).map(match => (
                                        <div
                                            key={match.id}
                                            className="match-row"
                                            style={{ gridTemplateColumns: columnConfig.template }}
                                        >
                                            {/* Live Indicator */}
                                            {match.isLive && (
                                                <div className="live-indicator">
                                                    <span className="live-badge">LIVE</span>
                                                    <span className="live-time">{match.liveTime}</span>
                                                </div>
                                            )}

                                            {/* Time */}
                                            <div className="td-time">
                                                <div className="match-time">{formatMatchTime(match.time)}</div>
                                            </div>

                                            {/* Game */}
                                            <div className="td-game">
                                                <div className="league-name">{match.league}</div>
                                                <div className="teams">
                                                    <div className="team-row">
                                                        <span className="team-name">{match.homeTeam}</span>
                                                        {match.homeScore !== '-' && (
                                                            <span className="team-score">{match.homeScore}</span>
                                                        )}
                                                    </div>
                                                    <div className="team-row">
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
                                                                    <div className="pred-odds">{w1.odds}</div>
                                                                    <div className="pred-prob">{w1.prob}%</div>
                                                                </div>
                                                                <div className={`pred-box ${draw.prob === maxProb ? 'highlighted' : ''}`}>
                                                                    <div className="pred-label">X</div>
                                                                    <div className="pred-odds">{draw.odds}</div>
                                                                    <div className="pred-prob">{draw.prob}%</div>
                                                                </div>
                                                                <div className={`pred-box ${w2.prob === maxProb ? 'highlighted' : ''}`}>
                                                                    <div className="pred-label">W2</div>
                                                                    <div className="pred-odds">{w2.odds}</div>
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
                                                                    <div className="pred-odds">{under.odds}</div>
                                                                    <div className="pred-prob">{under.prob}%</div>
                                                                </div>
                                                                <div className={`pred-box ${over.prob === maxProb ? 'highlighted' : ''}`}>
                                                                    <div className="pred-label">O 2.5</div>
                                                                    <div className="pred-odds">{over.odds}</div>
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
                                                                    <div className="pred-odds">{yes.odds}</div>
                                                                    <div className="pred-prob">{yes.prob}%</div>
                                                                </div>
                                                                <div className={`pred-box ${no.prob === maxProb ? 'highlighted' : ''}`}>
                                                                    <div className="pred-label">No</div>
                                                                    <div className="pred-odds">{no.odds}</div>
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
                                                                <div className="best-tip-odds">{match.predictions.bestTip.odds}</div>
                                                                <button className="bet-now-btn">BET NOW</button>
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
                    </main>
                </div>
            </div>
        </div>
    );
}

export default MathPredictions;

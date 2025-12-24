import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import './LeagueDetail.css';
import { StandingsTableSkeleton, TableSkeleton } from '../components/SkeletonLoader/SkeletonLoader';

const API_KEY = import.meta.env.VITE_APIFOOTBALL_KEY || '8b638d34018a20c11ed623f266d7a7a6a5db7a451fb17038f8f47962c66db43b';

function LeagueDetail() {
    const { leagueId } = useParams();
    const [activeTab, setActiveTab] = useState('predictions');
    const [predictionType, setPredictionType] = useState('1x2');
    const [leagueInfo, setLeagueInfo] = useState(null);
    const [standings, setStandings] = useState([]);
    const [fixtures, setFixtures] = useState([]);
    const [predictions, setPredictions] = useState([]);
    const [topScorers, setTopScorers] = useState([]);
    const [teams, setTeams] = useState([]);
    const [currentRound, setCurrentRound] = useState(null);
    const [availableRounds, setAvailableRounds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showOdds, setShowOdds] = useState(false);
    const [standingsView, setStandingsView] = useState('all'); // 'all', 'home', 'away'
    const [fixturesView, setFixturesView] = useState('schedule'); // 'schedule', 'results'

    useEffect(() => {
        fetchLeagueData();
    }, [leagueId]);

    const fetchLeagueData = async () => {
        try {
            setLeagueInfo(null); // Reset to avoid showing stale data from previous league
            setStandings([]); // Reset standings
            setFixtures([]); // Reset fixtures

            console.log('Fetching data for league ID:', leagueId);

            // Fetch league info
            const leaguesResponse = await axios.get(`https://apiv3.apifootball.com/?action=get_leagues&league_id=${leagueId}&APIkey=${API_KEY}`);
            console.log('League API Response:', leaguesResponse.data);

            if (leaguesResponse.data && Array.isArray(leaguesResponse.data)) {
                // Find matching league by ID
                const matchedLeague = leaguesResponse.data.find(l => l.league_id == leagueId);

                if (matchedLeague) {
                    setLeagueInfo(matchedLeague);
                } else if (leaguesResponse.data.length > 0) {
                    // Fallback validation
                    if (leaguesResponse.data[0].league_id == leagueId) {
                        setLeagueInfo(leaguesResponse.data[0]);
                    } else {
                        console.warn(`Requested league ID ${leagueId} not found in response`);
                    }
                }
            } else {
                console.warn('No league info found for ID:', leagueId);
            }

            // Fetch standings
            const standingsResponse = await axios.get(`https://apiv3.apifootball.com/?action=get_standings&league_id=${leagueId}&APIkey=${API_KEY}`);
            setStandings(Array.isArray(standingsResponse.data) ? standingsResponse.data : []);

            // Fetch fixtures (last 30 days to next 30 days)
            const today = new Date();
            const from = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            const to = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

            const fixturesResponse = await axios.get(`https://apiv3.apifootball.com/?action=get_events&from=${from}&to=${to}&league_id=${leagueId}&APIkey=${API_KEY}`);
            const fixturesData = Array.isArray(fixturesResponse.data) ? fixturesResponse.data : [];
            setFixtures(fixturesData);

            // Extract unique rounds
            const rounds = [...new Set(fixturesData.map(f => f.match_round).filter(r => r))].sort((a, b) => {
                const numA = parseInt(a.replace(/\D/g, '')) || 0;
                const numB = parseInt(b.replace(/\D/g, '')) || 0;
                return numA - numB;
            });
            setAvailableRounds(rounds);

            // Set current round (find the round with most recent/upcoming matches)
            if (rounds.length > 0) {
                const upcomingMatch = fixturesData.find(f => f.match_status === '' || f.match_status.includes("'"));
                setCurrentRound(upcomingMatch?.match_round || rounds[rounds.length - 1]);
            }

            // Fetch predictions
            const predictionsResponse = await axios.get(`https://apiv3.apifootball.com/?action=get_predictions&from=${from}&to=${to}&league_id=${leagueId}&APIkey=${API_KEY}`);
            setPredictions(Array.isArray(predictionsResponse.data) ? predictionsResponse.data : []);

            // Fetch top scorers
            const scorersResponse = await axios.get(`https://apiv3.apifootball.com/?action=get_topscorers&league_id=${leagueId}&APIkey=${API_KEY}`);
            setTopScorers(Array.isArray(scorersResponse.data) ? scorersResponse.data : []);

            // Fetch teams
            const teamsResponse = await axios.get(`https://apiv3.apifootball.com/?action=get_teams&league_id=${leagueId}&APIkey=${API_KEY}`);
            setTeams(Array.isArray(teamsResponse.data) ? teamsResponse.data : []);

            setLoading(false);
        } catch (error) {
            console.error('Error fetching league data:', error);
            setLoading(false);
        }
    };

    const getCurrentRoundFixtures = () => {
        if (!Array.isArray(fixtures)) return [];
        return fixtures.filter(f => f.match_round === currentRound);
    };

    // Format percentage to remove unnecessary decimals
    const formatPercentage = (value) => {
        if (!value || value === '0' || value === 0) return '-';
        let num = parseFloat(value);

        // If value is between 0 and 1, it's a decimal format - convert to percentage
        if (num > 0 && num < 1) {
            num = num * 100;
        }

        // Remove unnecessary decimals
        return num % 1 === 0 ? `${Math.round(num)}%` : `${num.toFixed(1)}%`;
    };

    const getPredictionData = (match, type) => {
        const prediction = predictions.find(p => p.match_id === match.match_id);
        if (!prediction) return { prob1: '-', probX: '-', prob2: '-' };

        switch (type) {
            case '1x2':
                return {
                    prob1: formatPercentage(prediction.prob_HW),
                    probX: formatPercentage(prediction.prob_D),
                    prob2: formatPercentage(prediction.prob_AW)
                };
            case 'goals':
                return {
                    prob1: formatPercentage(prediction.prob_O),
                    probX: '-',
                    prob2: formatPercentage(prediction.prob_U)
                };
            case 'btts':
                return {
                    prob1: formatPercentage(prediction.prob_bts),
                    probX: '-',
                    prob2: formatPercentage(prediction.prob_ots)
                };
            default:
                return { prob1: '-', probX: '-', prob2: '-' };
        }
    };

    const getHighestProb = (prob1, probX, prob2) => {
        const p1 = parseFloat(prob1) || 0;
        const pX = parseFloat(probX) || 0;
        const p2 = parseFloat(prob2) || 0;
        const max = Math.max(p1, pX, p2);
        return { prob1: p1 === max, probX: pX === max, prob2: p2 === max };
    };

    if (loading) {
        return (
            <div className="league-detail-loading" style={{ padding: '40px' }}>
                <div style={{ marginBottom: '40px' }}>
                    <div style={{ height: '200px', background: '#f0f0f0', borderRadius: '12px', marginBottom: '20px' }} className="skeleton" />
                </div>
                <StandingsTableSkeleton rows={20} />
            </div>
        );
    }

    if (!leagueInfo) {
        return (
            <div className="league-detail-error">
                <p>League not found</p>
            </div>
        );
    }

    return (
        <div className="league-detail-page">
            <div className="league-detail-container">
                {/* Breadcrumbs */}
                <div className="breadcrumbs">
                    <a href="/">Livebaz</a>
                    <span>/</span>
                    <a href="/competitions">Leagues</a>
                    <span>/</span>
                    <span>{leagueInfo.league_name}</span>
                </div>

                {/* League Header */}
                <div className="league-header">
                    <div className="league-header-content">
                        <div className="league-header-info">
                            <h1 className="league-title">{leagueInfo.league_name} Predictions and Odds</h1>
                            <div className="league-meta">
                                <div className="league-meta-item">
                                    <span className="meta-label">Dates</span>
                                    <span className="meta-value">{leagueInfo.league_season || 'N/A'}</span>
                                </div>
                                <div className="league-meta-divider"></div>
                                <div className="league-meta-item">
                                    <span className="meta-label">Category</span>
                                    <span className="meta-value">{leagueInfo.country_name || 'World'}</span>
                                </div>
                                <div className="league-meta-divider"></div>
                                <div className="league-meta-item">
                                    <span className="meta-label">Participants</span>
                                    <span className="meta-value">{standings.length || '-'}</span>
                                </div>
                            </div>
                        </div>
                        <div className="league-logo">
                            {leagueInfo.league_logo && (
                                <img src={leagueInfo.league_logo} alt={leagueInfo.league_name} />
                            )}
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="league-tabs">
                        <button
                            className={`league-tab ${activeTab === 'predictions' ? 'active' : ''}`}
                            onClick={() => setActiveTab('predictions')}
                        >
                            Predictions
                        </button>
                        <button
                            className={`league-tab ${activeTab === 'fixtures' ? 'active' : ''}`}
                            onClick={() => setActiveTab('fixtures')}
                        >
                            Fixtures
                        </button>
                        <button
                            className={`league-tab ${activeTab === 'standings' ? 'active' : ''}`}
                            onClick={() => setActiveTab('standings')}
                        >
                            Standings
                        </button>
                        <button
                            className={`league-tab ${activeTab === 'topscorers' ? 'active' : ''}`}
                            onClick={() => setActiveTab('topscorers')}
                        >
                            Top Scorers
                        </button>
                        <button
                            className={`league-tab ${activeTab === 'teams' ? 'active' : ''}`}
                            onClick={() => setActiveTab('teams')}
                        >
                            Teams
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="league-content">
                    {/* Predictions Tab */}
                    {activeTab === 'predictions' && (
                        <div className="predictions-section">
                            <h2 className="section-title mb-6">PREDICTIONS FOR {leagueInfo.league_name.toUpperCase()}</h2>
                            <br />
                            {/* Prediction Type Filters - Inline Style */}
                            <div style={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: '0',
                                marginBottom: '24px',
                                borderBottom: '1px solid #e5e7eb',

                            }}>
                                <button
                                    onClick={() => setPredictionType('1x2')}
                                    style={{
                                        padding: '12px 24px',
                                        background: predictionType === '1x2' ? '#1f2937' : 'transparent',
                                        color: predictionType === '1x2' ? '#fff' : '#4b5563',
                                        border: 'none',
                                        fontWeight: '600',
                                        fontSize: '14px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        borderBottom: predictionType === '1x2' ? '3px solid #3b82f6' : '3px solid transparent',
                                        borderRadius: '12px 12px 0 0'
                                    }}
                                >
                                    1X2
                                </button>
                                <button
                                    onClick={() => setPredictionType('goals')}
                                    style={{
                                        padding: '12px 24px',
                                        background: predictionType === 'goals' ? '#1f2937' : 'transparent',
                                        color: predictionType === 'goals' ? '#fff' : '#4b5563',
                                        border: 'none',
                                        fontWeight: '600',
                                        fontSize: '14px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        borderBottom: predictionType === 'goals' ? '3px solid #3b82f6' : '3px solid transparent',
                                        borderRadius: '12px 12px 0 0'
                                    }}
                                >
                                    Total Goals
                                </button>
                                <button
                                    onClick={() => setPredictionType('1x2-first-half')}
                                    style={{
                                        padding: '12px 24px',
                                        background: predictionType === '1x2-first-half' ? '#1f2937' : 'transparent',
                                        color: predictionType === '1x2-first-half' ? '#fff' : '#4b5563',
                                        border: 'none',
                                        fontWeight: '600',
                                        fontSize: '14px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        borderBottom: predictionType === '1x2-first-half' ? '3px solid #3b82f6' : '3px solid transparent',
                                        borderRadius: '12px 12px 0 0'
                                    }}
                                >
                                    1X2 First Half
                                </button>
                                <button
                                    onClick={() => setPredictionType('btts')}
                                    style={{
                                        padding: '12px 24px',
                                        background: predictionType === 'btts' ? '#1f2937' : 'transparent',
                                        color: predictionType === 'btts' ? '#fff' : '#4b5563',
                                        border: 'none',
                                        fontWeight: '600',
                                        fontSize: '14px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        borderBottom: predictionType === 'btts' ? '3px solid #3b82f6' : '3px solid transparent',
                                        borderRadius: '12px 12px 0 0'
                                    }}
                                >
                                    Both Teams To Score
                                </button>
                                <button
                                    onClick={() => setPredictionType('correct-score')}
                                    style={{
                                        padding: '12px 24px',
                                        background: predictionType === 'correct-score' ? '#1f2937' : 'transparent',
                                        color: predictionType === 'correct-score' ? '#fff' : '#4b5563',
                                        border: 'none',
                                        fontWeight: '600',
                                        fontSize: '14px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        borderBottom: predictionType === 'correct-score' ? '3px solid #3b82f6' : '3px solid transparent',
                                        borderRadius: '12px 12px 0 0'
                                    }}
                                >
                                    Correct Score
                                </button>
                                <button
                                    onClick={() => setPredictionType('double-chance')}
                                    style={{
                                        padding: '12px 24px',
                                        background: predictionType === 'double-chance' ? '#1f2937' : 'transparent',
                                        color: predictionType === 'double-chance' ? '#fff' : '#4b5563',
                                        border: 'none',
                                        fontWeight: '600',
                                        fontSize: '14px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        borderBottom: predictionType === 'double-chance' ? '3px solid #3b82f6' : '3px solid transparent',
                                        borderRadius: '12px 12px 0 0'
                                    }}
                                >
                                    Double Chance
                                </button>
                                {/* Round Selector - Dropdown */}
                                {availableRounds.length > 0 && (
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'center',
                                    }}>
                                        <select
                                            value={currentRound || ''}
                                            onChange={(e) => setCurrentRound(e.target.value)}
                                            style={{
                                                padding: '12px 24px',
                                                background: predictionType === 'double-chance' ? '#1f2937' : 'transparent',
                                                color: predictionType === 'double-chance' ? '#fff' : '#4b5563',
                                                border: 'none',
                                                fontWeight: '600',
                                                fontSize: '14px',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s',
                                                borderBottom: predictionType === 'double-chance' ? '3px solid #3b82f6' : '3px solid transparent',
                                                borderRadius: '12px 12px 0 0'
                                            }}
                                            onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                                            onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                                        >
                                            {availableRounds.map((round) => (
                                                <option key={round} value={round}>
                                                    {leagueInfo.league_name} - {round}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </div>





                            {/* Matches Table */}
                            <div className="matches-table">
                                <div className="matches-header">
                                    <div className="header-time">Time</div>
                                    <div className="header-match">Match</div>
                                    <div className="header-predictions">
                                        <span>1</span>
                                        <span>X</span>
                                        <span>2</span>
                                    </div>
                                </div>

                                {getCurrentRoundFixtures().map(match => {
                                    const predData = getPredictionData(match, predictionType);
                                    const highest = getHighestProb(predData.prob1, predData.probX, predData.prob2);
                                    console.log(match);
                                    return (
                                        <Link to={`/match/${match.match_id}`} key={match.match_id} className="match-row" style={{ textDecoration: 'none', color: 'inherit' }}>
                                            {/* make this match time left aligned */}
                                            <div className="match-time" style={{ textAlign: 'left' }}>
                                                <div className="match-date">{new Date(match.match_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                                                <div className="match-hour">{match.match_time}</div>
                                            </div>
                                            <div className="match-teams">
                                                <div className="match-score">
                                                    {/* we need to display the scores as well but on end of the column.. like right of it */}
                                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                                        <img style={{ marginRight: '10px', width: '20px', height: '20px' }} src={match.team_home_badge} alt={match.match_hometeam_name} />
                                                        <span style={{ fontSize: '13px', fontWeight: '600' }}>{match.match_hometeam_name || '-'}</span>
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                                        <img style={{ marginRight: '10px', width: '20px', height: '20px' }} src={match.team_away_badge} alt={match.match_awayteam_name} />
                                                        <span style={{ fontSize: '13px', fontWeight: '600' }}>{match.match_awayteam_name || '-'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="match-predictions">
                                                <span className={`pred-value ${highest.prob1 ? 'highest' : ''}`}>{predData.prob1}</span>
                                                {predData.probX !== '-' && <span className={`pred-value ${highest.probX ? 'highest' : ''}`}>{predData.probX}</span>}
                                                <span className={`pred-value ${highest.prob2 ? 'highest' : ''}`}>{predData.prob2}</span>
                                            </div>
                                        </Link>
                                    );
                                })}

                                {getCurrentRoundFixtures().length === 0 && (
                                    <div className="no-matches">
                                        <p>No matches available for this round</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Fixtures Tab */}
                    {activeTab === 'fixtures' && (
                        <div className="fixtures-section">
                            <div className="flex justify-between items-start mb-6">
                                <h2 className="section-title">{leagueInfo.league_name.toUpperCase()} FIXTURES</h2>
                                <div className="flex items-center gap-4">
                                    <span className="text-sm font-semibold text-gray-700">Season {leagueInfo.league_season || '2025/2026'}</span>
                                    <span className="text-sm font-semibold text-gray-900">{leagueInfo.league_name}</span>
                                </div>
                            </div>

                            {/* Schedule/Results Toggle */}
                            <div className="flex gap-2 mb-6">
                                <button
                                    className={`px-6 py-2 rounded-lg font-medium transition ${fixturesView === 'schedule' ? 'bg-white border-2 border-gray-300 text-gray-900' : 'bg-gray-100 text-gray-600'}`}
                                    onClick={() => setFixturesView('schedule')}
                                >
                                    Schedule
                                </button>
                                <button
                                    className={`px-6 py-2 rounded-lg font-medium transition ${fixturesView === 'results' ? 'bg-white border-2 border-gray-300 text-gray-900' : 'bg-gray-100 text-gray-600'}`}
                                    onClick={() => setFixturesView('results')}
                                >
                                    Results
                                </button>
                            </div>

                            {/* Group fixtures by rounds */}
                            {availableRounds.map(round => {
                                const roundFixtures = fixtures.filter(f => f.match_round === round);

                                // Filter based on view
                                const filteredFixtures = roundFixtures.filter(match => {
                                    if (fixturesView === 'schedule') {
                                        return !match.match_status || match.match_status === '' || match.match_status === 'Scheduled';
                                    } else {
                                        return match.match_status && match.match_status !== '' && match.match_status !== 'Scheduled';
                                    }
                                });

                                if (filteredFixtures.length === 0) return null;

                                return (
                                    <div key={round} className="mb-6">
                                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-2 flex justify-between items-center">
                                            <h3 className="text-base font-bold text-gray-900">{leagueInfo.league_name} {round}</h3>
                                            <button className="text-gray-500 hover:text-gray-700">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                                </svg>
                                            </button>
                                        </div>

                                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                                            {/* Table Header */}
                                            <div className="grid grid-cols-[180px_1fr_80px] gap-4 p-4 bg-gray-50 border-b border-gray-200">
                                                <div className="text-xs font-semibold text-gray-600 uppercase">Time</div>
                                                <div className="text-xs font-semibold text-gray-600 uppercase">Match</div>
                                                <div></div>
                                            </div>

                                            {/* Fixtures List */}
                                            {filteredFixtures.map(match => (
                                                <Link
                                                    to={`/match/${match.match_id}`}
                                                    key={match.match_id}
                                                    className="grid grid-cols-[180px_1fr_80px] gap-4 p-4 border-b border-gray-100 hover:bg-gray-50 transition items-center no-underline text-gray-900"
                                                >
                                                    {/* Time */}
                                                    <div className="flex flex-col text-sm">
                                                        <span className="font-semibold text-gray-700">
                                                            {new Date(match.match_date).toLocaleDateString('en-GB', {
                                                                day: '2-digit',
                                                                month: 'short',
                                                                year: 'numeric'
                                                            })}
                                                        </span>
                                                        <span className="text-gray-500 text-xs">{match.match_time}</span>
                                                    </div>

                                                    {/* Teams */}
                                                    <div className="flex flex-col gap-2">
                                                        <div className="flex items-center gap-2">
                                                            {match.team_home_badge && (
                                                                <img
                                                                    src={match.team_home_badge}
                                                                    alt={match.match_hometeam_name}
                                                                    className="w-5 h-5 object-contain"
                                                                />
                                                            )}
                                                            <span className="font-medium text-sm">{match.match_hometeam_name}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            {match.team_away_badge && (
                                                                <img
                                                                    src={match.team_away_badge}
                                                                    alt={match.match_awayteam_name}
                                                                    className="w-5 h-5 object-contain"
                                                                />
                                                            )}
                                                            <span className="font-medium text-sm">{match.match_awayteam_name}</span>
                                                        </div>
                                                    </div>

                                                    {/* Score/Status */}
                                                    <div className="flex flex-col gap-2 items-end">
                                                        <span className="text-gray-400 font-bold">
                                                            {match.match_hometeam_score || '–'}
                                                        </span>
                                                        <span className="text-gray-400 font-bold">
                                                            {match.match_awayteam_score || '–'}
                                                        </span>
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}

                            {fixtures.length === 0 && (
                                <div className="text-center py-12 text-gray-500">
                                    <p>No fixtures available</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Standings Tab */}
                    {activeTab === 'standings' && (
                        <div className="standings-section">
                            <h2 className="section-title mb-4">STANDINGS {leagueInfo.league_name.toUpperCase()}</h2>

                            {/* View Tabs */}
                            <div className="flex gap-2 mb-6">
                                <button
                                    className={`px-4 py-2 rounded-lg font-medium transition ${standingsView === 'all' ? 'bg-white border-2 border-gray-300' : 'bg-gray-100 text-gray-700'}`}
                                    onClick={() => setStandingsView('all')}
                                >
                                    All games
                                </button>
                                <button
                                    className={`px-4 py-2 rounded-lg font-medium transition ${standingsView === 'home' ? 'bg-white border-2 border-gray-300' : 'bg-gray-100 text-gray-700'}`}
                                    onClick={() => setStandingsView('home')}
                                >
                                    Home
                                </button>
                                <button
                                    className={`px-4 py-2 rounded-lg font-medium transition ${standingsView === 'away' ? 'bg-white border-2 border-gray-300' : 'bg-gray-100 text-gray-700'}`}
                                    onClick={() => setStandingsView('away')}
                                >
                                    Away
                                </button>
                            </div>

                            {Array.isArray(standings) && standings.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm border-collapse">
                                        <thead>
                                            <tr className="border-b-2 border-gray-200 bg-gray-50 text-left">
                                                <th className="p-2 font-semibold">№</th>
                                                <th className="p-2 font-semibold sticky left-0 bg-gray-50">Team</th>
                                                <th className="p-2 font-semibold text-center">MP</th>
                                                <th className="p-2 font-semibold text-center">W</th>
                                                <th className="p-2 font-semibold text-center">D</th>
                                                <th className="p-2 font-semibold text-center">L</th>
                                                <th className="p-2 font-semibold text-center">Goals</th>
                                                <th className="p-2 font-semibold text-center">Diff</th>
                                                <th className="p-2 font-semibold text-center font-bold">Pt</th>
                                                <th className="p-2 font-semibold text-center">Form</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {standings.map((team, index) => {
                                                // Determine which stats to show based on view
                                                const stats = standingsView === 'home' ? {
                                                    position: team.home_league_position,
                                                    played: team.home_league_payed,
                                                    wins: team.home_league_W,
                                                    draws: team.home_league_D,
                                                    losses: team.home_league_L,
                                                    gf: team.home_league_GF,
                                                    ga: team.home_league_GA,
                                                    pts: team.home_league_PTS
                                                } : standingsView === 'away' ? {
                                                    position: team.away_league_position,
                                                    played: team.away_league_payed,
                                                    wins: team.away_league_W,
                                                    draws: team.away_league_D,
                                                    losses: team.away_league_L,
                                                    gf: team.away_league_GF,
                                                    ga: team.away_league_GA,
                                                    pts: team.away_league_PTS
                                                } : {
                                                    position: team.overall_league_position,
                                                    played: team.overall_league_payed,
                                                    wins: team.overall_league_W,
                                                    draws: team.overall_league_D,
                                                    losses: team.overall_league_L,
                                                    gf: team.overall_league_GF,
                                                    ga: team.overall_league_GA,
                                                    pts: team.overall_league_PTS
                                                };

                                                const diff = parseInt(stats.gf || 0) - parseInt(stats.ga || 0);
                                                const promotionClass = team.overall_promotion && team.overall_promotion.toLowerCase().includes('promotion') ? 'border-l-4 border-l-green-500' : '';

                                                return (
                                                    <tr key={team.team_id || index} className={`border-b border-gray-100 hover:bg-gray-50 ${promotionClass}`}>
                                                        <td className="p-2 text-gray-600">{stats.position}</td>
                                                        <td className="p-2 sticky left-0 bg-white hover:bg-gray-50">
                                                            <div className="flex items-center gap-2">
                                                                {team.team_badge && <img src={team.team_badge} alt={team.team_name} className="w-5 h-5 object-contain" />}
                                                                <span className="font-medium">{team.team_name}</span>
                                                            </div>
                                                        </td>
                                                        <td className="p-2 text-center">{stats.played}</td>
                                                        <td className="p-2 text-center">{stats.wins}</td>
                                                        <td className="p-2 text-center">{stats.draws}</td>
                                                        <td className="p-2 text-center">{stats.losses}</td>
                                                        <td className="p-2 text-center">{stats.gf}:{stats.ga}</td>
                                                        <td className="p-2 text-center">{diff > 0 ? '+' : ''}{diff}</td>
                                                        <td className="p-2 text-center font-bold">{stats.pts}</td>
                                                        <td className="p-2">
                                                            {/* Form badges - would need last 5 matches data */}
                                                            <div className="flex gap-0.5 justify-center">
                                                                {[...Array(5)].map((_, i) => (
                                                                    <div key={i} className="w-5 h-5 rounded-sm bg-gray-200 flex items-center justify-center text-xs">
                                                                        -
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="no-data">
                                    <p>No standings available for this league</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Top Scorers Tab */}
                    {activeTab === 'topscorers' && (
                        <div className="scorers-section">
                            <h2 className="section-title">TOP SCORERS</h2>
                            <div className="scorers-table">
                                <div className="scorers-header">
                                    <span className="rank">#</span>
                                    <span className="player">Player</span>
                                    <span className="team">Team</span>
                                    <span className="goals">Goals</span>
                                    <span className="assists">Assists</span>
                                    <span className="penalties">Pen</span>
                                </div>
                                {topScorers.map((scorer, index) => (
                                    <div key={index} className="scorer-row">
                                        <span className="rank">{index + 1}</span>
                                        <span className="player">
                                            {scorer.player_name}
                                        </span>
                                        <span className="team">{scorer.team_name}</span>
                                        <span className="goals">{scorer.goals}</span>
                                        <span className="assists">{scorer.assists || 0}</span>
                                        <span className="penalties">{scorer.penalty_goals || 0}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Teams Tab */}
                    {activeTab === 'teams' && (
                        <div className="teams-section">
                            <h2 className="section-title">TEAMS</h2>
                            <div className="teams-grid">
                                {teams.map((team) => (
                                    <div key={team.team_key} className="team-card">
                                        <div className="team-card-logo">
                                            <img src={team.team_badge} alt={team.team_name} />
                                        </div>
                                        <h3 className="team-card-name">{team.team_name}</h3>

                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default LeagueDetail;

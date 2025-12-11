import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import './MatchDetail.css';
import { MatchDetailSkeleton } from '../components/SkeletonLoader/SkeletonLoader';

const API_KEY = import.meta.env.VITE_APIFOOTBALL_KEY || '8b638d34018a20c11ed623f266d7a7a6a5db7a451fb17038f8f47962c66db43b';

function MatchDetail() {
    const { matchId } = useParams();
    const [activeTab, setActiveTab] = useState('overview');
    const [matchData, setMatchData] = useState(null);
    const [h2h, setH2H] = useState([]);
    const [predictions, setPredictions] = useState(null);
    const [odds, setOdds] = useState([]);
    const [standings, setStandings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showScorers, setShowScorers] = useState(false);
    const [homeTeamForm, setHomeTeamForm] = useState([]);
    const [awayTeamForm, setAwayTeamForm] = useState([]);

    useEffect(() => {
        fetchMatchData();
    }, [matchId]);

    // Fetch team form (last 5 matches)
    const fetchTeamForm = async (teamId, teamName) => {
        try {
            const today = new Date();
            const twoMonthsAgo = new Date(today);
            twoMonthsAgo.setMonth(today.getMonth() - 2);

            const fromDate = twoMonthsAgo.toISOString().split('T')[0];
            const toDate = today.toISOString().split('T')[0];

            const response = await axios.get(
                `https://apiv3.apifootball.com/?action=get_events&team_id=${teamId}&from=${fromDate}&to=${toDate}&APIkey=${API_KEY}`
            );

            if (response.data && Array.isArray(response.data)) {
                console.log(`\n=== FORM DATA for ${teamName} (ID: ${teamId}) ===`);
                console.log(`Total matches found: ${response.data.length}`);

                // Filter only finished matches and sort by date (most recent first)
                const finishedMatches = response.data
                    .filter(match => match.match_status === 'Finished')
                    .sort((a, b) => new Date(b.match_date) - new Date(a.match_date))
                    .slice(0, 5);

                console.log(`Finished matches (last 5):`, finishedMatches.length);

                // Calculate form (W/D/L) for each match
                const form = finishedMatches.map(match => {
                    const isHome = match.match_hometeam_id === teamId;
                    const teamScore = isHome ? parseInt(match.match_hometeam_score) : parseInt(match.match_awayteam_score);
                    const opponentScore = isHome ? parseInt(match.match_awayteam_score) : parseInt(match.match_hometeam_score);

                    let result = 'D';
                    if (teamScore > opponentScore) result = 'W';
                    if (teamScore < opponentScore) result = 'L';

                    console.log(`${match.match_date} | ${match.match_hometeam_name} ${match.match_hometeam_score}-${match.match_awayteam_score} ${match.match_awayteam_name} | Result: ${result}`);

                    return result;
                });

                console.log(`Form: ${form.join('')}`);
                console.log(`==============================\n`);

                return form;
            }
            return [];
        } catch (error) {
            console.error(`Error fetching form for team ${teamName}:`, error);
            return [];
        }
    };

    const fetchMatchData = async () => {
        try {
            setLoading(true);

            // Fetch match details (events, lineups, stats)
            const matchResponse = await axios.get(`https://apiv3.apifootball.com/?action=get_events&match_id=${matchId}&APIkey=${API_KEY}`);
            console.log('Match API Response:', matchResponse.data);
            if (matchResponse.data && matchResponse.data.length > 0) {
                const match = matchResponse.data[0];
                console.log('Match Data:', {
                    league_id: match.league_id,
                    league_name: match.league_name,
                    home_team: match.match_hometeam_name,
                    away_team: match.match_awayteam_name
                });
                setMatchData(match);

                // Fetch H2H if teams are available
                if (match.match_hometeam_id && match.match_awayteam_id) {
                    const h2hResponse = await axios.get(`https://apiv3.apifootball.com/?action=get_H2H&firstTeamId=${match.match_hometeam_id}&secondTeamId=${match.match_awayteam_id}&APIkey=${API_KEY}`);
                    setH2H(h2hResponse.data?.firstTeam_VS_secondTeam || []);

                    // Fetch team forms
                    const homeForm = await fetchTeamForm(match.match_hometeam_id, match.match_hometeam_name);
                    const awayForm = await fetchTeamForm(match.match_awayteam_id, match.match_awayteam_name);
                    setHomeTeamForm(homeForm);
                    setAwayTeamForm(awayForm);
                }

                // Fetch standings for the league - only if league_id exists and is valid
                if (match.league_id && match.league_id !== '0' && parseInt(match.league_id) > 0) {
                    try {
                        const standingsResponse = await axios.get(`https://apiv3.apifootball.com/?action=get_standings&league_id=${match.league_id}&APIkey=${API_KEY}`);
                        console.log('Standings API Response for league', match.league_id, ':', standingsResponse.data);
                        console.log('Home Team ID:', match.match_hometeam_id);
                        console.log('Away Team ID:', match.match_awayteam_id);

                        if (standingsResponse.data && Array.isArray(standingsResponse.data) && standingsResponse.data.length > 0) {
                            setStandings(standingsResponse.data);
                            console.log('Standings set:', standingsResponse.data.length, 'teams');
                        } else if (standingsResponse.data && standingsResponse.data.error) {
                            console.warn('Standings API error:', standingsResponse.data.message);
                        } else {
                            console.warn('No standings data available for league:', match.league_id);
                        }
                    } catch (err) {
                        console.error('Error fetching standings:', err);
                    }
                } else {
                    console.warn('Invalid or missing league_id:', match.league_id, '- Cannot fetch standings');
                }

                // Fetch predictions for this match
                try {
                    const predictionsResponse = await axios.get(`https://apiv3.apifootball.com/?action=get_predictions&match_id=${matchId}&APIkey=${API_KEY}`);
                    if (predictionsResponse.data && predictionsResponse.data.length > 0) {
                        setPredictions(predictionsResponse.data[0]);
                    }
                } catch (err) {
                    console.error('Error fetching predictions:', err);
                }

                // Fetch odds for this match
                try {
                    const oddsResponse = await axios.get(`https://apiv3.apifootball.com/?action=get_odds&match_id=${matchId}&APIkey=${API_KEY}`);
                    if (oddsResponse.data && Array.isArray(oddsResponse.data)) {
                        setOdds(oddsResponse.data);
                    }
                } catch (err) {
                    console.error('Error fetching odds:', err);
                }
            }

            setLoading(false);
        } catch (error) {
            console.error('Error fetching match data:', error);
            setLoading(false);
        }
    };

    if (loading) return <MatchDetailSkeleton />;
    if (!matchData) return <div className="match-error">Match not found</div>;

    // Helper function to get team position from standings
    const getTeamPosition = (teamId) => {
        const teamStanding = standings.find(standing => standing.team_id === teamId);
        return teamStanding ? `${teamStanding.overall_league_position} place` : 'N/A';
    };

    return (
        <div className="match-detail-page">
            <div className="match-detail-container">
                {/* Breadcrumbs */}
                <div className="breadcrumbs">
                    <a href="/">Livebaz</a>
                    <span>/</span>
                    <a href="/competitions">Leagues</a>
                    <span>/</span>
                    <a href={`/league/${matchData.league_id}`}>{matchData.league_name}</a>
                    <span>/</span>
                    <span>{matchData.match_hometeam_name} vs {matchData.match_awayteam_name}</span>
                </div>

                {/* Match Header */}
                <div className="match-header" style={{ backgroundImage: `url('https://ratingbet.com/ratingbet_build/img/rb_field_max.de674330.svg')` }}>
                    <div className="match-header-league">
                        {matchData.league_name} • {matchData.match_round || 'Round'}
                    </div>
                    <div className="match-header-content">
                        <div className="team home">
                            <img src={matchData.team_home_badge} alt={matchData.match_hometeam_name} className="team-logo" />
                            <div className="team-info">
                                <h2>{matchData.match_hometeam_name}</h2>
                                <div className="team-form">
                                    {homeTeamForm.length > 0 ? (
                                        homeTeamForm.map((result, index) => (
                                            <span key={index} className={`form-badge ${result.toLowerCase()}`}>
                                                {result}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="form-loading">Loading...</span>
                                    )}
                                </div>
                                <div className="team-standing">{getTeamPosition(matchData.match_hometeam_id)}</div>
                            </div>
                        </div>

                        <div className="score-board">
                            <div className="match-meta-top">
                                {new Date(matchData.match_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}, {matchData.match_time}
                            </div>
                            <div className="score-display-detail">
                                <span className="score score-home" style={{ color: '#fff' }}>{matchData.match_hometeam_score} : {matchData.match_awayteam_score}</span>
                            </div>
                            <div className="match-status">{matchData.match_status}</div>
                            {matchData.goalscorer && matchData.goalscorer.length > 0 && (
                                <div className="scorers-list">
                                    <div
                                        className="scorers-title clickable"
                                        onClick={() => setShowScorers(!showScorers)}
                                    >
                                        <span>Goal Scorers</span>
                                        <span className="expand-arrow">{showScorers ? '▼' : '▶'}</span>
                                    </div>
                                    {showScorers && (
                                        <div className="scorers-content">
                                            {matchData.goalscorer.map((goal, idx) => (
                                                <div key={idx} className="scorer-item">
                                                    {goal.home_scorer ? (
                                                        <div className="scorer-card home">
                                                            <span className="scorer-icon">⚽</span>
                                                            <div className="scorer-info">
                                                                <span className="scorer-name">{goal.home_scorer}</span>
                                                                <span className="scorer-time">{goal.time}'</span>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="scorer-card empty"></div>
                                                    )}
                                                    {goal.away_scorer ? (
                                                        <div className="scorer-card away">
                                                            <div className="scorer-info">
                                                                <span className="scorer-name">{goal.away_scorer}</span>
                                                                <span className="scorer-time">{goal.time}'</span>
                                                            </div>
                                                            <span className="scorer-icon">⚽</span>
                                                        </div>
                                                    ) : (
                                                        <div className="scorer-card empty"></div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="team away">
                            <div className="team-info">
                                <h2>{matchData.match_awayteam_name}</h2>
                                <div className="team-form">
                                    {awayTeamForm.length > 0 ? (
                                        awayTeamForm.map((result, index) => (
                                            <span key={index} className={`form-badge ${result.toLowerCase()}`}>
                                                {result}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="form-loading">Loading...</span>
                                    )}
                                </div>
                                <div className="team-standing">{getTeamPosition(matchData.match_awayteam_id)}</div>
                            </div>
                            <img src={matchData.team_away_badge} alt={matchData.match_awayteam_name} className="team-logo" />
                        </div>
                    </div>
                    <div className="match-tabs-nav">
                        <button className={`nav-tab ${activeTab === 'stats' ? 'active' : ''}`} onClick={() => setActiveTab('stats')}>Stats</button>
                        <button className={`nav-tab ${activeTab === 'predictions' ? 'active' : ''}`} onClick={() => setActiveTab('predictions')}>Predictions</button>
                        <button className={`nav-tab ${activeTab === 'odds' ? 'active' : ''}`} onClick={() => setActiveTab('odds')}>Odds</button>
                        <button className={`nav-tab ${activeTab === 'lineups' ? 'active' : ''}`} onClick={() => setActiveTab('lineups')}>Lineups</button>
                        <button className={`nav-tab ${activeTab === 'h2h' ? 'active' : ''}`} onClick={() => setActiveTab('h2h')}>H2H</button>
                    </div>
                </div>

                {/* Tabs */}

                {/* Content */}
                <div className="match-content">
                    {(activeTab === 'overview' || activeTab === 'stats') && (
                        <div className="stats-section">
                            <div className="section-header">
                                <img src={matchData.team_home_badge} alt="Home" width="24" />
                                <h3>{matchData.match_hometeam_name} vs {matchData.match_awayteam_name} Match Stats</h3>
                                <img src={matchData.team_away_badge} alt="Away" width="24" />
                            </div>

                            {matchData.statistics && matchData.statistics.length > 0 ? (
                                <div className="stats-comparison">
                                    {(() => {
                                        // Filter out stats with no data (both 0 or empty) and remove duplicates
                                        const seenStats = new Set();
                                        const filteredStats = matchData.statistics.filter(stat => {
                                            const homeVal = parseInt(stat.home) || 0;
                                            const awayVal = parseInt(stat.away) || 0;
                                            const hasData = homeVal > 0 || awayVal > 0;
                                            const isDuplicate = seenStats.has(stat.type);

                                            if (hasData && !isDuplicate) {
                                                seenStats.add(stat.type);
                                                return true;
                                            }
                                            return false;
                                        });

                                        return filteredStats.length > 0 ? filteredStats.map((stat, index) => {
                                            const homeVal = parseInt(stat.home) || 0;
                                            const awayVal = parseInt(stat.away) || 0;
                                            const total = homeVal + awayVal;
                                            const homePercent = total > 0 ? (homeVal / total) * 100 : 0;
                                            const awayPercent = total > 0 ? (awayVal / total) * 100 : 0;

                                            return (
                                                <div key={index} className="stat-row-new">
                                                    <div className="stat-val home">{stat.home}</div>
                                                    <div className="stat-bars">
                                                        <div className="stat-label-center">{stat.type}</div>
                                                        <div className="bars-container">
                                                            <div className="bar-wrapper home">
                                                                <div className="bar" style={{ width: `${homePercent}%` }}></div>
                                                            </div>
                                                            <div className="bar-wrapper away">
                                                                <div className="bar" style={{ width: `${awayPercent}%` }}></div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="stat-val away">{stat.away}</div>
                                                </div>
                                            );
                                        }) : <div className="no-data">No statistics available</div>;
                                    })()}
                                </div>
                            ) : (
                                <div className="no-data">No statistics available</div>
                            )}
                        </div>
                    )}

                    {activeTab === 'predictions' && (
                        <div className="predictions-section">
                            <div className="section-header">
                                <img src={matchData.team_home_badge} alt="Home" width="24" />
                                <h3>Match Predictions</h3>
                                <img src={matchData.team_away_badge} alt="Away" width="24" />
                            </div>
                            {predictions ? (
                                <div className="predictions-content">
                                    <div className="prediction-category">
                                        <h4>Match Result (1X2)</h4>
                                        <div className="prediction-row">
                                            <div className="prediction-item">
                                                <span className="prediction-label">Home Win (1)</span>
                                                <span className="prediction-value">{predictions.prob_HW || '-'}%</span>
                                            </div>
                                            <div className="prediction-item">
                                                <span className="prediction-label">Draw (X)</span>
                                                <span className="prediction-value">{predictions.prob_D || '-'}%</span>
                                            </div>
                                            <div className="prediction-item">
                                                <span className="prediction-label">Away Win (2)</span>
                                                <span className="prediction-value">{predictions.prob_AW || '-'}%</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="prediction-category">
                                        <h4>Over/Under 2.5 Goals</h4>
                                        <div className="prediction-row">
                                            <div className="prediction-item">
                                                <span className="prediction-label">Over 2.5</span>
                                                <span className="prediction-value">{predictions.prob_O || '-'}%</span>
                                            </div>
                                            <div className="prediction-item">
                                                <span className="prediction-label">Under 2.5</span>
                                                <span className="prediction-value">{predictions.prob_U || '-'}%</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="prediction-category">
                                        <h4>Both Teams To Score (BTTS)</h4>
                                        <div className="prediction-row">
                                            <div className="prediction-item">
                                                <span className="prediction-label">Yes</span>
                                                <span className="prediction-value">{predictions.prob_bts || predictions.prob_BTTS || '-'}%</span>
                                            </div>
                                            <div className="prediction-item">
                                                <span className="prediction-label">No</span>
                                                <span className="prediction-value">{predictions.prob_ots || '-'}%</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="no-data">No predictions available for this match</div>
                            )}
                        </div>
                    )}

                    {activeTab === 'odds' && (
                        <div className="odds-section">
                            <div className="section-header">
                                <img src={matchData.team_home_badge} alt="Home" width="24" />
                                <h3>Betting Odds</h3>
                                <img src={matchData.team_away_badge} alt="Away" width="24" />
                            </div>
                            {odds && odds.length > 0 ? (
                                <div className="odds-content">
                                    {odds.map((bookmaker, index) => (
                                        <div key={index} className="bookmaker-card">
                                            <h4 className="bookmaker-name">{bookmaker.odd_bookmakers}</h4>
                                            <div className="odds-grid">
                                                {bookmaker.odd_1 && (
                                                    <div className="odds-category">
                                                        <h5>Match Result (1X2)</h5>
                                                        <div className="odds-row">
                                                            <div className="odds-item">
                                                                <span className="odds-label">Home (1)</span>
                                                                <span className="odds-value">{bookmaker.odd_1}</span>
                                                            </div>
                                                            <div className="odds-item">
                                                                <span className="odds-label">Draw (X)</span>
                                                                <span className="odds-value">{bookmaker.odd_x || bookmaker.odd_X}</span>
                                                            </div>
                                                            <div className="odds-item">
                                                                <span className="odds-label">Away (2)</span>
                                                                <span className="odds-value">{bookmaker.odd_2}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                                {(bookmaker['o+2.5'] || bookmaker['u+2.5']) && (
                                                    <div className="odds-category">
                                                        <h5>Over/Under 2.5</h5>
                                                        <div className="odds-row">
                                                            <div className="odds-item">
                                                                <span className="odds-label">Over 2.5</span>
                                                                <span className="odds-value">{bookmaker['o+2.5'] || '-'}</span>
                                                            </div>
                                                            <div className="odds-item">
                                                                <span className="odds-label">Under 2.5</span>
                                                                <span className="odds-value">{bookmaker['u+2.5'] || '-'}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                                {(bookmaker.bts_yes || bookmaker.bts_no) && (
                                                    <div className="odds-category">
                                                        <h5>Both Teams To Score</h5>
                                                        <div className="odds-row">
                                                            <div className="odds-item">
                                                                <span className="odds-label">Yes</span>
                                                                <span className="odds-value">{bookmaker.bts_yes || '-'}</span>
                                                            </div>
                                                            <div className="odds-item">
                                                                <span className="odds-label">No</span>
                                                                <span className="odds-value">{bookmaker.bts_no || '-'}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="no-data">No odds available for this match</div>
                            )}
                        </div>
                    )}

                    {activeTab === 'lineups' && (
                        <div className="lineups-section">
                            {matchData.lineup?.home?.starting_lineups || matchData.lineup?.away?.starting_lineups ? (
                                <>
                                    {/* Formation Headers */}
                                    <div className="formation-headers">
                                        <div className="team-formation">
                                            <img src={matchData.team_home_badge} alt="Home" className="formation-badge" />
                                            <span>{matchData.match_hometeam_name}</span>
                                            <span className="formation-text">{matchData.lineup?.home?.starting_lineups?.[0]?.lineup_position || 'N/A'}</span>
                                        </div>
                                        <div className="team-formation">
                                            <img src={matchData.team_away_badge} alt="Away" className="formation-badge" />
                                            <span>{matchData.match_awayteam_name}</span>
                                            <span className="formation-text">{matchData.lineup?.away?.starting_lineups?.[0]?.lineup_position || 'N/A'}</span>
                                        </div>
                                    </div>

                                    {/* Football Field */}
                                    <div className="football-field">
                                        {/* Home Team (Left Side) */}
                                        <div className="field-half home-half">
                                            {matchData.lineup?.home?.starting_lineups?.map((player, i) => {
                                                const position = player.lineup_position || '';
                                                let positionClass = 'midfielder';
                                                let topPercent = 50;

                                                // Determine position type and placement
                                                if (position.toLowerCase().includes('goalkeeper') || position.toLowerCase().includes('gk')) {
                                                    positionClass = 'goalkeeper';
                                                    topPercent = 50;
                                                } else if (position.toLowerCase().includes('defender') || position.toLowerCase().includes('back')) {
                                                    positionClass = 'defender';
                                                    topPercent = 20 + (i % 4) * 20;
                                                } else if (position.toLowerCase().includes('midfielder') || position.toLowerCase().includes('midfield')) {
                                                    positionClass = 'midfielder';
                                                    topPercent = 15 + (i % 4) * 23;
                                                } else if (position.toLowerCase().includes('forward') || position.toLowerCase().includes('attacker') || position.toLowerCase().includes('striker')) {
                                                    positionClass = 'forward';
                                                    topPercent = 20 + (i % 3) * 30;
                                                }

                                                return (
                                                    <div
                                                        key={i}
                                                        className={`field-player ${positionClass}`}
                                                        style={{ top: `${topPercent}%` }}
                                                    >
                                                        <div className="player-avatar">
                                                            <div className="player-jersey-number">{player.lineup_number}</div>
                                                        </div>
                                                        <div className="player-field-name">{player.lineup_player}</div>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Away Team (Right Side) */}
                                        <div className="field-half away-half">
                                            {matchData.lineup?.away?.starting_lineups?.map((player, i) => {
                                                const position = player.lineup_position || '';
                                                let positionClass = 'midfielder';
                                                let topPercent = 50;

                                                // Determine position type and placement
                                                if (position.toLowerCase().includes('goalkeeper') || position.toLowerCase().includes('gk')) {
                                                    positionClass = 'goalkeeper';
                                                    topPercent = 50;
                                                } else if (position.toLowerCase().includes('defender') || position.toLowerCase().includes('back')) {
                                                    positionClass = 'defender';
                                                    topPercent = 20 + (i % 4) * 20;
                                                } else if (position.toLowerCase().includes('midfielder') || position.toLowerCase().includes('midfield')) {
                                                    positionClass = 'midfielder';
                                                    topPercent = 15 + (i % 4) * 23;
                                                } else if (position.toLowerCase().includes('forward') || position.toLowerCase().includes('attacker') || position.toLowerCase().includes('striker')) {
                                                    positionClass = 'forward';
                                                    topPercent = 20 + (i % 3) * 30;
                                                }

                                                return (
                                                    <div
                                                        key={i}
                                                        className={`field-player ${positionClass}`}
                                                        style={{ top: `${topPercent}%` }}
                                                    >
                                                        <div className="player-avatar">
                                                            <div className="player-jersey-number">{player.lineup_number}</div>
                                                        </div>
                                                        <div className="player-field-name">{player.lineup_player}</div>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Center Line */}
                                        <div className="center-line"></div>
                                        <div className="center-circle"></div>
                                    </div>

                                    {/* Substitutes Section */}
                                    <div className="substitutes-section">
                                        {matchData.lineup?.home?.substitutes && (
                                            <div className="substitutes-column">
                                                <h4 className="subs-title">{matchData.match_hometeam_name} - Substitutes</h4>
                                                <div className="subs-list">
                                                    {matchData.lineup.home.substitutes.map((player, i) => (
                                                        <div key={i} className="sub-player">
                                                            <span className="sub-number">{player.lineup_number}</span>
                                                            <span className="sub-name">{player.lineup_player}</span>
                                                            <span className="sub-pos">{player.lineup_position}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {matchData.lineup?.away?.substitutes && (
                                            <div className="substitutes-column">
                                                <h4 className="subs-title">{matchData.match_awayteam_name} - Substitutes</h4>
                                                <div className="subs-list">
                                                    {matchData.lineup.away.substitutes.map((player, i) => (
                                                        <div key={i} className="sub-player">
                                                            <span className="sub-number">{player.lineup_number}</span>
                                                            <span className="sub-name">{player.lineup_player}</span>
                                                            <span className="sub-pos">{player.lineup_position}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <div className="no-data">Lineup information not available</div>
                            )}
                        </div>
                    )}

                    {activeTab === 'h2h' && (
                        <div className="h2h-section">
                            <h3>Head to Head</h3>
                            <div className="h2h-list">
                                {h2h.map((match, index) => (
                                    <div key={index} className="h2h-card">
                                        <div className="date">{match.match_date}</div>
                                        <div className="teams">
                                            <span>{match.match_hometeam_name}</span>
                                            <span className="score">{match.match_hometeam_score} - {match.match_awayteam_score}</span>
                                            <span>{match.match_awayteam_name}</span>
                                        </div>
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

export default MatchDetail;

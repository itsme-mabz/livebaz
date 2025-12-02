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

    useEffect(() => {
        fetchLeagueData();
    }, [leagueId]);

    const fetchLeagueData = async () => {
        try {
            setLoading(true);

            // Fetch league info
            const leaguesResponse = await axios.get(`https://apiv3.apifootball.com/?action=get_leagues&league_id=${leagueId}&APIkey=${API_KEY}`);
            if (leaguesResponse.data && leaguesResponse.data.length > 0) {
                setLeagueInfo(leaguesResponse.data[0]);
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
                            <h2 className="section-title">PREDICTIONS FOR {leagueInfo.league_name.toUpperCase()}</h2>



                            {/* Round Selector */}
                            {availableRounds.length > 0 && (
                                <div className="round-selector">
                                    <button
                                        className="round-nav-btn"
                                        onClick={() => {
                                            const currentIndex = availableRounds.indexOf(currentRound);
                                            if (currentIndex > 0) {
                                                setCurrentRound(availableRounds[currentIndex - 1]);
                                            }
                                        }}
                                        disabled={availableRounds.indexOf(currentRound) === 0}
                                    >
                                        ◄
                                    </button>
                                    <span className="current-round">
                                        {leagueInfo.league_name} - {currentRound || 'Round'}
                                    </span>
                                    <button
                                        className="round-nav-btn"
                                        onClick={() => {
                                            const currentIndex = availableRounds.indexOf(currentRound);
                                            if (currentIndex < availableRounds.length - 1) {
                                                setCurrentRound(availableRounds[currentIndex + 1]);
                                            }
                                        }}
                                        disabled={availableRounds.indexOf(currentRound) === availableRounds.length - 1}
                                    >
                                        ►
                                    </button>
                                </div>
                            )}

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
                                                        <span className="score-home">{match.match_hometeam_name || '-'}</span>
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                                        <img style={{ marginRight: '10px', width: '20px', height: '20px' }} src={match.team_away_badge} alt={match.match_awayteam_name} />
                                                        <span className="score-away">{match.match_awayteam_name || '-'}</span>
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
                            <h2 className="section-title">FIXTURES & RESULTS</h2>
                            {/* Similar structure to predictions but without prediction percentages */}
                            <div className="fixtures-list">
                                {fixtures.map(match => (
                                    <div key={match.match_id} className="fixture-card">
                                        <div className="fixture-date">{match.match_date} - {match.match_time}</div>
                                        <div className="fixture-teams">
                                            <div className="fixture-team">
                                                {match.team_home_badge && <img src={match.team_home_badge} alt={match.match_hometeam_name} />}
                                                <span>{match.match_hometeam_name}</span>
                                            </div>
                                            <div className="fixture-score">
                                                {match.match_hometeam_score || '0'} - {match.match_awayteam_score || '0'}
                                            </div>
                                            <div className="fixture-team">
                                                {match.team_away_badge && <img src={match.team_away_badge} alt={match.match_awayteam_name} />}
                                                <span>{match.match_awayteam_name}</span>
                                            </div>
                                        </div>
                                        <div className="fixture-status">{match.match_status || 'Scheduled'}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Standings Tab */}
                    {activeTab === 'standings' && (
                        <div className="standings-section">
                            <h2 className="section-title">LEAGUE STANDINGS</h2>
                            {Array.isArray(standings) && standings.length > 0 ? (
                                <div className="standings-table">
                                    <div className="standings-header">
                                        <span className="pos">#</span>
                                        <span className="team">Team</span>
                                        <span className="stat">P</span>
                                        <span className="stat">W</span>
                                        <span className="stat">D</span>
                                        <span className="stat">L</span>
                                        <span className="stat">GF</span>
                                        <span className="stat">GA</span>
                                        <span className="stat">GD</span>
                                        <span className="stat pts">Pts</span>
                                    </div>
                                    {standings.map((team, index) => (
                                        <div key={team.team_id || index} className={`standings-row ${team.overall_promotion ? 'promotion' : ''}`}>
                                            <span className="pos">{team.overall_league_position}</span>
                                            <span className="team">
                                                {team.team_badge && <img src={team.team_badge} alt={team.team_name} />}
                                                {team.team_name}
                                            </span>
                                            <span className="stat">{team.overall_league_payed}</span>
                                            <span className="stat">{team.overall_league_W}</span>
                                            <span className="stat">{team.overall_league_D}</span>
                                            <span className="stat">{team.overall_league_L}</span>
                                            <span className="stat">{team.overall_league_GF}</span>
                                            <span className="stat">{team.overall_league_GA}</span>
                                            <span className="stat">{parseInt(team.overall_league_GF) - parseInt(team.overall_league_GA)}</span>
                                            <span className="stat pts">{team.overall_league_PTS}</span>
                                        </div>
                                    ))}
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

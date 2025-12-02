import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import './PredictionDetail.css';
import { MatchDetailSkeleton } from '../components/SkeletonLoader/SkeletonLoader';

const API_KEY = import.meta.env.VITE_APIFOOTBALL_KEY || '8b638d34018a20c11ed623f266d7a7a6a5db7a451fb17038f8f47962c66db43b';
const API_BASE = 'https://apiv3.apifootball.com';

function PredictionDetail() {
    const { matchId } = useParams();
    const [loading, setLoading] = useState(true);
    const [matchData, setMatchData] = useState(null);
    const [predictions, setPredictions] = useState(null);
    const [h2h, setH2H] = useState([]);
    const [standings, setStandings] = useState({ home: null, away: null });
    const [topScorers, setTopScorers] = useState([]);

    useEffect(() => {
        fetchAllData();
    }, [matchId]);

    const fetchAllData = async () => {
        try {
            setLoading(true);

            const matchResponse = await axios.get(`${API_BASE}/?action=get_events&match_id=${matchId}&APIkey=${API_KEY}`);
            if (matchResponse.data && matchResponse.data.length > 0) {
                const match = matchResponse.data[0];
                setMatchData(match);

                const predResponse = await axios.get(`${API_BASE}/?action=get_predictions&match_id=${matchId}&APIkey=${API_KEY}`);
                if (predResponse.data && predResponse.data.length > 0) {
                    setPredictions(predResponse.data[0]);
                }

                if (match.match_hometeam_id && match.match_awayteam_id) {
                    const h2hResponse = await axios.get(`${API_BASE}/?action=get_H2H&firstTeamId=${match.match_hometeam_id}&secondTeamId=${match.match_awayteam_id}&APIkey=${API_KEY}`);
                    setH2H(h2hResponse.data?.firstTeam_VS_secondTeam || []);
                }

                if (match.league_id) {
                    const standingsResponse = await axios.get(`${API_BASE}/?action=get_standings&league_id=${match.league_id}&APIkey=${API_KEY}`);
                    const allStandings = standingsResponse.data || [];
                    const homeStanding = allStandings.find(s => s.team_id === match.match_hometeam_id);
                    const awayStanding = allStandings.find(s => s.team_id === match.match_awayteam_id);
                    setStandings({ home: homeStanding, away: awayStanding });

                    const scorersResponse = await axios.get(`${API_BASE}/?action=get_topscorers&league_id=${match.league_id}&APIkey=${API_KEY}`);
                    setTopScorers(scorersResponse.data?.slice(0, 10) || []);
                }
            }

            setLoading(false);
        } catch (error) {
            console.error('Error fetching prediction details:', error);
            setLoading(false);
        }
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

    // Format odds to remove unnecessary decimals
    const formatOdds = (value) => {
        if (!value) return '-';
        const num = parseFloat(value);
        if (isNaN(num)) return '-';

        // If the number is a whole number, don't show decimals
        return num % 1 === 0 ? Math.round(num).toString() : num.toFixed(2);
    };

    // Calculate odds from probability
    const calculateOddsFromProb = (probability) => {
        if (!probability || probability === '0' || probability === 0) return '-';
        let num = parseFloat(probability);

        // If value is between 0 and 1, convert to percentage
        if (num > 0 && num < 1) {
            num = num * 100;
        }

        if (num <= 0 || num > 100) return '-';

        // Odds = 100 / probability
        const odds = 100 / num;
        return formatOdds(odds);
    };

    const getBestPrediction = () => {
        if (!predictions) return null;

        const tips = [
            { type: 'Home Win (1)', prob: parseFloat(predictions.prob_HW) || 0, odds: calculateOddsFromProb(predictions.prob_HW) },
            { type: 'Draw (X)', prob: parseFloat(predictions.prob_D) || 0, odds: calculateOddsFromProb(predictions.prob_D) },
            { type: 'Away Win (2)', prob: parseFloat(predictions.prob_AW) || 0, odds: calculateOddsFromProb(predictions.prob_AW) },
            { type: 'Over 2.5 Goals', prob: parseFloat(predictions.prob_O) || 0, odds: calculateOddsFromProb(predictions.prob_O) },
            { type: 'Under 2.5 Goals', prob: parseFloat(predictions.prob_U) || 0, odds: calculateOddsFromProb(predictions.prob_U) },
            { type: 'BTTS Yes', prob: parseFloat(predictions.prob_bts) || 0, odds: calculateOddsFromProb(predictions.prob_bts) },
        ];

        return tips.sort((a, b) => b.prob - a.prob)[0];
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    if (loading) return <MatchDetailSkeleton />;
    if (!matchData) return <div className="error-message">Match not found</div>;

    const bestTip = getBestPrediction();
    const isLive = matchData.match_status && matchData.match_status !== '';

    return (
        <div className="prediction-detail-page-new">
            <div className="container-new">
                {/* Breadcrumbs */}
                <div className="breadcrumbs-new">
                    <Link to="/">Livebaz</Link>
                    <span>/</span>
                    <Link to="/predictions">Predictions</Link>
                    <span>/</span>
                    <Link to="/predictions/football">Football</Link>
                    <span>/</span>
                    <span>{matchData.league_name}</span>
                </div>

                {/* Page Title */}
                <h1 className="page-title-new">
                    {matchData.match_hometeam_name} vs {matchData.match_awayteam_name}: Prediction, Preview, lineups, tips and odds on {formatDate(matchData.match_date)}
                </h1>



                {/* Hero Image with Team Badges */}
                <div className="hero-section">
                    <div className="hero-background">
                        <div className="team-badge-container left">
                            <img src={matchData.team_home_badge} alt={matchData.match_hometeam_name} className="team-badge-hero" />
                        </div>
                        <div className="vs-divider">VS</div>
                        <div className="team-badge-container right">
                            <img src={matchData.team_away_badge} alt={matchData.match_awayteam_name} className="team-badge-hero" />
                        </div>
                    </div>

                    {/* Prediction Table Below Hero */}
                    {predictions && (
                        <div className="prediction-table">
                            <div className="prediction-header">Math prediction</div>
                            <div className="prediction-row">
                                <div className="team-cell home">
                                    <img src={matchData.team_home_badge} alt={matchData.match_hometeam_name} />
                                    <span>{matchData.match_hometeam_name}</span>
                                </div>
                                <div className="odds-cell">-</div>
                                <div className="prediction-columns">
                                    <div className="pred-column">
                                        <div className="pred-header">1</div>
                                        <div className="pred-odds highlighted">{calculateOddsFromProb(predictions.prob_HW)}</div>
                                        <div className="pred-prob">{formatPercentage(predictions.prob_HW)}</div>
                                    </div>
                                    <div className="pred-column">
                                        <div className="pred-header">X</div>
                                        <div className="pred-odds">{calculateOddsFromProb(predictions.prob_D)}</div>
                                        <div className="pred-prob">{formatPercentage(predictions.prob_D)}</div>
                                    </div>
                                    <div className="pred-column">
                                        <div className="pred-header">2</div>
                                        <div className="pred-odds">{calculateOddsFromProb(predictions.prob_AW)}</div>
                                        <div className="pred-prob">{formatPercentage(predictions.prob_AW)}</div>
                                    </div>
                                </div>
                                <div className="best-pick">
                                    {bestTip && `${bestTip.type.split(' ')[0]} ${bestTip.odds}`}
                                </div>
                            </div>
                            <div className="prediction-row away-row">
                                <div className="team-cell away">
                                    <img src={matchData.team_away_badge} alt={matchData.match_awayteam_name} />
                                    <span>{matchData.match_awayteam_name}</span>
                                </div>
                                <div className="odds-cell">-</div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Match Info Cards */}
                <div className="match-info-cards">
                    <div className="info-card">
                        <div className="info-label">Tournament</div>
                        <div className="info-value">
                            <img src={matchData.country_logo || matchData.league_logo} alt="" className="league-flag" />
                            {matchData.league_name}
                        </div>
                    </div>
                    <div className="info-card">
                        <div className="info-label">Venue</div>
                        <div className="info-value">{matchData.match_stadium || 'Stadium TBD'}</div>
                    </div>
                    <div className="info-card">
                        <div className="info-label">Date & kick-off time</div>
                        <div className="info-value">Today, {matchData.match_time}</div>
                    </div>
                </div>

                {/* Our Pick Section */}
                {bestTip && (
                    <div className="our-pick-section">
                        <div className="our-pick-badge">⚡ Our Pick</div>
                        <div className="our-pick-content">
                            <div className="pick-details">
                                <div className="pick-label">Game Prediction</div>
                                <div className="pick-value">{bestTip.type}</div>
                            </div>
                            <div className="pick-odds">{bestTip.odds}</div>
                            <button className="make-bet-btn">Make a bet →</button>
                        </div>
                    </div>
                )}

                {/* Introduction Text */}
                <div className="content-section">
                    <div className="intro-text">
                        <p>
                            In the <strong>{matchData.match_round || 'upcoming round'} of {matchData.league_name}</strong>, a match between {matchData.match_hometeam_name} and {matchData.match_awayteam_name} will take place on {formatDate(matchData.match_date)}. The two teams will compete for leadership in the current league table.
                        </p>
                    </div>

                    <h2 className="section-heading">Our Prediction for {matchData.match_hometeam_name} vs {matchData.match_awayteam_name}</h2>

                    {/* All Predictions */}
                    {predictions && (
                        <div className="all-predictions-grid">
                            <div className="prediction-card">
                                <h3>Match Result (1X2)</h3>
                                <div className="pred-options">
                                    <div className="pred-option">
                                        <span className="option-label">Home Win (1)</span>
                                        <span className="option-prob">{formatPercentage(predictions.prob_HW)}</span>
                                        <span className="option-odds">{calculateOddsFromProb(predictions.prob_HW)}</span>
                                    </div>
                                    <div className="pred-option">
                                        <span className="option-label">Draw (X)</span>
                                        <span className="option-prob">{formatPercentage(predictions.prob_D)}</span>
                                        <span className="option-odds">{calculateOddsFromProb(predictions.prob_D)}</span>
                                    </div>
                                    <div className="pred-option">
                                        <span className="option-label">Away Win (2)</span>
                                        <span className="option-prob">{formatPercentage(predictions.prob_AW)}</span>
                                        <span className="option-odds">{calculateOddsFromProb(predictions.prob_AW)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="prediction-card">
                                <h3>Goals Over/Under 2.5</h3>
                                <div className="pred-options">
                                    <div className="pred-option">
                                        <span className="option-label">Over 2.5</span>
                                        <span className="option-prob">{formatPercentage(predictions.prob_O)}</span>
                                        <span className="option-odds">{calculateOddsFromProb(predictions.prob_O)}</span>
                                    </div>
                                    <div className="pred-option">
                                        <span className="option-label">Under 2.5</span>
                                        <span className="option-prob">{formatPercentage(predictions.prob_U)}</span>
                                        <span className="option-odds">{calculateOddsFromProb(predictions.prob_U)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="prediction-card">
                                <h3>Both Teams To Score</h3>
                                <div className="pred-options">
                                    <div className="pred-option">
                                        <span className="option-label">Yes</span>
                                        <span className="option-prob">{formatPercentage(predictions.prob_bts)}</span>
                                        <span className="option-odds">{calculateOddsFromProb(predictions.prob_bts)}</span>
                                    </div>
                                    <div className="pred-option">
                                        <span className="option-label">No</span>
                                        <span className="option-prob">{formatPercentage(predictions.prob_ots)}</span>
                                        <span className="option-odds">{calculateOddsFromProb(predictions.prob_ots)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Head to Head */}
                    {h2h && h2h.length > 0 && (
                        <div className="h2h-section-new">
                            <h2 className="section-heading">Head-to-Head History</h2>
                            <div className="h2h-matches-grid">
                                {h2h.slice(0, 5).map((match, idx) => (
                                    <div key={idx} className="h2h-match-card">
                                        <div className="h2h-date">{formatDate(match.match_date)}</div>
                                        <div className="h2h-result">
                                            <span className="h2h-team">{match.match_hometeam_name}</span>
                                            <span className="h2h-score">{match.match_hometeam_score} - {match.match_awayteam_score}</span>
                                            <span className="h2h-team">{match.match_awayteam_name}</span>
                                        </div>
                                        <div className="h2h-competition">{match.league_name}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* League Standings */}
                    {(standings.home || standings.away) && (
                        <div className="standings-section-new">
                            <h2 className="section-heading">Current League Standings</h2>
                            <div className="standings-comparison">
                                {standings.home && (
                                    <div className="standing-card">
                                        <div className="standing-position">#{standings.home.overall_league_position}</div>
                                        <div className="standing-team">{matchData.match_hometeam_name}</div>
                                        <div className="standing-stats">
                                            <span>Pts: {standings.home.overall_league_PTS}</span>
                                            <span>W: {standings.home.overall_league_W}</span>
                                            <span>D: {standings.home.overall_league_D}</span>
                                            <span>L: {standings.home.overall_league_L}</span>
                                        </div>
                                    </div>
                                )}
                                {standings.away && (
                                    <div className="standing-card">
                                        <div className="standing-position">#{standings.away.overall_league_position}</div>
                                        <div className="standing-team">{matchData.match_awayteam_name}</div>
                                        <div className="standing-stats">
                                            <span>Pts: {standings.away.overall_league_PTS}</span>
                                            <span>W: {standings.away.overall_league_W}</span>
                                            <span>D: {standings.away.overall_league_D}</span>
                                            <span>L: {standings.away.overall_league_L}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Top Scorers */}
                    {topScorers && topScorers.length > 0 && (
                        <div className="scorers-section-new">
                            <h2 className="section-heading">League Top Scorers</h2>
                            <div className="scorers-grid">
                                {topScorers.slice(0, 10).map((scorer, idx) => (
                                    <div key={idx} className="scorer-card">
                                        <div className="scorer-rank">#{idx + 1}</div>
                                        <div className="scorer-info">
                                            <div className="scorer-name">{scorer.player_name}</div>
                                            <div className="scorer-team">{scorer.team_name}</div>
                                        </div>
                                        <div className="scorer-goals">{scorer.goals || scorer.player_goals} ⚽</div>
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

export default PredictionDetail;

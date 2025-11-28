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
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMatchData();
    }, [matchId]);

    const fetchMatchData = async () => {
        try {
            setLoading(true);

            // Fetch match details (events, lineups, stats)
            const matchResponse = await axios.get(`https://apiv3.apifootball.com/?action=get_events&match_id=${matchId}&APIkey=${API_KEY}`);
            if (matchResponse.data && matchResponse.data.length > 0) {
                const match = matchResponse.data[0];
                setMatchData(match);

                // Fetch H2H if teams are available
                if (match.match_hometeam_id && match.match_awayteam_id) {
                    const h2hResponse = await axios.get(`https://apiv3.apifootball.com/?action=get_H2H&firstTeamId=${match.match_hometeam_id}&secondTeamId=${match.match_awayteam_id}&APIkey=${API_KEY}`);
                    setH2H(h2hResponse.data?.firstTeam_VS_secondTeam || []);
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
                                    {/* Placeholder for form - API doesn't provide this directly in match details usually, would need separate fetch or mock */}
                                    <span className="form-badge w">W</span>
                                    <span className="form-badge w">W</span>
                                    <span className="form-badge w">W</span>
                                    <span className="form-badge d">D</span>
                                    <span className="form-badge w">W</span>
                                </div>
                                <div className="team-standing">1 place</div>
                            </div>
                        </div>

                        <div className="score-board">
                            <div className="match-meta-top">
                                {new Date(matchData.match_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}, {matchData.match_time}
                            </div>
                            <div className="score-display">
                                <span className="score">{matchData.match_hometeam_score}</span>
                                <span className="divider">:</span>
                                <span className="score">{matchData.match_awayteam_score}</span>
                            </div>
                            <div className="match-status">{matchData.match_status}</div>
                            <div className="scorers-list">
                                {matchData.goalscorer?.map((goal, idx) => (
                                    <div key={idx} className="scorer-item">
                                        {goal.home_scorer && <span className="home-scorer">{goal.home_scorer} {goal.time}'</span>}
                                        {goal.away_scorer && <span className="away-scorer">{goal.away_scorer} {goal.time}'</span>}
                                    </div>
                                ))}
                                <br />
                            </div>
                        </div>

                        <div className="team away">
                            <div className="team-info">
                                <h2>{matchData.match_awayteam_name}</h2>
                                <div className="team-form">
                                    <span className="form-badge w">W</span>
                                    <span className="form-badge w">W</span>
                                    <span className="form-badge w">W</span>
                                    <span className="form-badge d">D</span>
                                    <span className="form-badge w">W</span>
                                </div>
                                <div className="team-standing">3 place</div>
                            </div>
                            <img src={matchData.team_away_badge} alt={matchData.match_awayteam_name} className="team-logo" />
                        </div>
                    </div>
                    <div className="match-tabs-nav">
                        <button className={`nav-tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>Match</button>
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
                                    {matchData.statistics.map((stat, index) => {
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
                                    })}
                                </div>
                            ) : (
                                <div className="no-data">No statistics available</div>
                            )}
                        </div>
                    )}

                    {activeTab === 'lineups' && (
                        <div className="lineups-section">
                            <div className="lineups-grid">
                                <div className="lineup-column">
                                    <h3>{matchData.match_hometeam_name}</h3>
                                    <div className="lineup-list">
                                        {matchData.lineup?.home?.starting_lineups?.map((player, i) => (
                                            <div key={i} className="player-row">
                                                <span className="number">{player.lineup_number}</span>
                                                <span className="name">{player.lineup_player}</span>
                                                <span className="pos">{player.lineup_position}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="lineup-column">
                                    <h3>{matchData.match_awayteam_name}</h3>
                                    <div className="lineup-list">
                                        {matchData.lineup?.away?.starting_lineups?.map((player, i) => (
                                            <div key={i} className="player-row">
                                                <span className="number">{player.lineup_number}</span>
                                                <span className="name">{player.lineup_player}</span>
                                                <span className="pos">{player.lineup_position}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
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

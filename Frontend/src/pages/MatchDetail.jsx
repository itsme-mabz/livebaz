import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import './MatchDetail.css';
import { MatchDetailSkeleton } from '../components/SkeletonLoader/SkeletonLoader';

const API_KEY = import.meta.env.VITE_APIFOOTBALL_KEY || '8b638d34018a20c11ed623f266d7a7a6a5db7a451fb17038f8f47962c66db43b';

function MatchDetail() {
    const { matchId } = useParams();
    const [activeTab, setActiveTab] = useState('stats');
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

    // Scroll to section function
    const scrollToSection = (sectionId) => {
        const element = document.getElementById(sectionId);
        if (element) {
            const offset = 150; // Offset for sticky header
            const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
            const offsetPosition = elementPosition - offset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
            setActiveTab(sectionId);
        }
    };

    // Scroll spy to update active tab based on scroll position
    useEffect(() => {
        const handleScroll = () => {
            const sections = ['stats', 'predictions', 'odds', 'lineups', 'h2h'];
            const scrollPosition = window.scrollY + 150;

            for (const sectionId of sections) {
                const element = document.getElementById(sectionId);
                if (element) {
                    const offsetTop = element.offsetTop;
                    const offsetBottom = offsetTop + element.offsetHeight;

                    if (scrollPosition >= offsetTop && scrollPosition < offsetBottom) {
                        setActiveTab(sectionId);
                        break;
                    }
                }
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

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
                    try {
                        console.log(`Fetching H2H for Home: ${match.match_hometeam_id} vs Away: ${match.match_awayteam_id}`);
                        const h2hResponse = await axios.get(`https://apiv3.apifootball.com/?action=get_H2H&firstTeamId=${match.match_hometeam_id}&secondTeamId=${match.match_awayteam_id}&APIkey=${API_KEY}`);
                        console.log('H2H Full Response:', h2hResponse.data);

                        if (h2hResponse.data?.firstTeam_VS_secondTeam) {
                            console.log(`Found ${h2hResponse.data.firstTeam_VS_secondTeam.length} H2H matches`);
                            setH2H(h2hResponse.data.firstTeam_VS_secondTeam);
                        } else {
                            console.warn('H2H data missing firstTeam_VS_secondTeam field:', h2hResponse.data);
                            setH2H([]);
                        }
                    } catch (error) {
                        console.error('Error fetching H2H data:', error);
                    }

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
                            <img src={matchData.team_home_badge} alt={matchData.match_hometeam_name} className="team-logo-header" />
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
                        </div>

                        <div className="team away">
                            <img src={matchData.team_away_badge} alt={matchData.match_awayteam_name} className="team-logo-header" />
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

                        </div>
                    </div>
                </div>

                {/* Tabs Navigation - Sticky */}
                <div className="match-tabs-nav">
                    <button className={`nav-tab ${activeTab === 'stats' ? 'active' : ''}`} onClick={() => scrollToSection('stats')}>Match</button>
                    <button className={`nav-tab ${activeTab === 'predictions' ? 'active' : ''}`} onClick={() => scrollToSection('predictions')}>Predictions</button>
                    <button className={`nav-tab ${activeTab === 'odds' ? 'active' : ''}`} onClick={() => scrollToSection('odds')}>Odds</button>
                    <button className={`nav-tab ${activeTab === 'lineups' ? 'active' : ''}`} onClick={() => scrollToSection('lineups')}>Lineups</button>
                    <button className={`nav-tab ${activeTab === 'h2h' ? 'active' : ''}`} onClick={() => scrollToSection('h2h')}>H2H</button>
                </div>

                {/* Content */}
                <div className="match-content">
                    <div id="stats" className="stats-section">
                        <div className="section-header">
                            <img src={matchData.team_home_badge} alt="Home" width="24" />
                            <h3>{matchData.match_hometeam_name} vs {matchData.match_awayteam_name}</h3>
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

                                        // Determine which value is higher for highlighting
                                        const homeIsHigher = homeVal > awayVal;
                                        const awayIsHigher = awayVal > homeVal;

                                        return (
                                            <div key={index} className="stat-row-new">
                                                <div className={`stat-val ${homeIsHigher ? 'highlight' : ''}`}>{stat.home}</div>
                                                <div className="stat-bars-container">
                                                    <div className="bar-home-wrapper">
                                                        <div className="bar home-bar" style={{ width: `${homePercent}%` }}></div>
                                                    </div>
                                                    <div className="stat-label">{stat.type}</div>
                                                    <div className="bar-away-wrapper">
                                                        <div className="bar away-bar" style={{ width: `${awayPercent}%` }}></div>
                                                    </div>
                                                </div>
                                                <div className={`stat-val ${awayIsHigher ? 'highlight' : ''}`}>{stat.away}</div>
                                            </div>
                                        );
                                    }) : <div className="no-data">No statistics available</div>;
                                })()}
                            </div>
                        ) : (
                            <div className="no-data">No statistics available</div>
                        )}
                    </div>

                    <div id="predictions" className="predictions-section">
                        <div className="section-header">
                            <img src={matchData.team_home_badge} alt="Home" width="24" />
                            <h3> Match Predictions</h3>
                            <img src={matchData.team_away_badge} alt="Away" width="24" />
                        </div>
                        {predictions ? (
                            <div className="predictions-cards-grid">
                                {/* Full-time result */}
                                <div className="prediction-card">
                                    <h4 className="prediction-card-title">Full-time result</h4>
                                    <div className="prediction-circles">
                                        <div className="circle-item">
                                            <span className="circle-label">Home</span>
                                            <div className="circle-progress">
                                                <svg className="progress-ring" width="85" height="85">
                                                    <circle className="progress-ring-circle-bg" cx="42.5" cy="42.5" r="37" />
                                                    <circle
                                                        className="progress-ring-circle"
                                                        cx="42.5"
                                                        cy="42.5"
                                                        r="37"
                                                        style={{ strokeDashoffset: 232.5 - (232.5 * (predictions.prob_HW || 0)) / 100 }}
                                                    />
                                                </svg>
                                                <span className="circle-percentage">{predictions.prob_HW || 0}%</span>
                                            </div>
                                            <div className={`odd-badge ${(predictions.prob_HW || 0) >= Math.max(predictions.prob_D || 0, predictions.prob_AW || 0) ? 'highest' : ''}`}>
                                                1.59
                                            </div>
                                        </div>
                                        <div className="circle-item">
                                            <span className="circle-label">Draw</span>
                                            <div className="circle-progress">
                                                <svg className="progress-ring" width="85" height="85">
                                                    <circle className="progress-ring-circle-bg" cx="42.5" cy="42.5" r="37" />
                                                    <circle
                                                        className="progress-ring-circle"
                                                        cx="42.5"
                                                        cy="42.5"
                                                        r="37"
                                                        style={{ strokeDashoffset: 232.5 - (232.5 * (predictions.prob_D || 0)) / 100 }}
                                                    />
                                                </svg>
                                                <span className="circle-percentage">{predictions.prob_D || 0}%</span>
                                            </div>
                                            <div className={`odd-badge ${(predictions.prob_D || 0) >= Math.max(predictions.prob_HW || 0, predictions.prob_AW || 0) ? 'highest' : ''}`}>
                                                3.22
                                            </div>
                                        </div>
                                        <div className="circle-item">
                                            <span className="circle-label">Away</span>
                                            <div className="circle-progress">
                                                <svg className="progress-ring" width="85" height="85">
                                                    <circle className="progress-ring-circle-bg" cx="42.5" cy="42.5" r="37" />
                                                    <circle
                                                        className="progress-ring-circle"
                                                        cx="42.5"
                                                        cy="42.5"
                                                        r="37"
                                                        style={{ strokeDashoffset: 232.5 - (232.5 * (predictions.prob_AW || 0)) / 100 }}
                                                    />
                                                </svg>
                                                <span className="circle-percentage">{predictions.prob_AW || 0}%</span>
                                            </div>
                                            <div className={`odd-badge ${(predictions.prob_AW || 0) >= Math.max(predictions.prob_HW || 0, predictions.prob_D || 0) ? 'highest' : ''}`}>
                                                6.26
                                            </div>
                                        </div>
                                    </div>
                                    <div className="prediction-footer">
                                        <div className="footer-info">
                                            <span className="footer-label">W1</span>
                                            <span className="footer-rate">Win rate {predictions.prob_HW || 0}%</span>
                                        </div>
                                        <span className="footer-odd">1.59</span>
                                    </div>
                                </div>

                                {/* Both teams to score */}
                                <div className="prediction-card">
                                    <h4 className="prediction-card-title">Both teams to score</h4>
                                    <div className="prediction-circles">
                                        <div className="circle-item">
                                            <span className="circle-label">Yes</span>
                                            <div className="circle-progress">
                                                <svg className="progress-ring" width="85" height="85">
                                                    <circle className="progress-ring-circle-bg" cx="42.5" cy="42.5" r="37" />
                                                    <circle
                                                        className="progress-ring-circle"
                                                        cx="42.5"
                                                        cy="42.5"
                                                        r="37"
                                                        style={{ strokeDashoffset: 232.5 - (232.5 * (predictions.prob_bts || predictions.prob_BTTS || 0)) / 100 }}
                                                    />
                                                </svg>
                                                <span className="circle-percentage">{predictions.prob_bts || predictions.prob_BTTS || 0}%</span>
                                            </div>
                                            <div className={`odd-badge ${(predictions.prob_bts || predictions.prob_BTTS || 0) >= (predictions.prob_ots || 0) ? 'highest' : ''}`}>
                                                2.50
                                            </div>
                                        </div>
                                        <div className="circle-item">
                                            <span className="circle-label">No</span>
                                            <div className="circle-progress">
                                                <svg className="progress-ring" width="85" height="85">
                                                    <circle className="progress-ring-circle-bg" cx="42.5" cy="42.5" r="37" />
                                                    <circle
                                                        className="progress-ring-circle"
                                                        cx="42.5"
                                                        cy="42.5"
                                                        r="37"
                                                        style={{ strokeDashoffset: 232.5 - (232.5 * (predictions.prob_ots || 0)) / 100 }}
                                                    />
                                                </svg>
                                                <span className="circle-percentage">{predictions.prob_ots || 0}%</span>
                                            </div>
                                            <div className={`odd-badge ${(predictions.prob_ots || 0) >= (predictions.prob_bts || predictions.prob_BTTS || 0) ? 'highest' : ''}`}>
                                                1.46
                                            </div>
                                        </div>
                                    </div>
                                    <div className="prediction-footer">
                                        <div className="footer-info">
                                            <span className="footer-label">BTTS: No</span>
                                            <span className="footer-rate">Win rate {predictions.prob_ots || 0}%</span>
                                        </div>
                                        <span className="footer-odd">1.46</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="no-data">No predictions available for this match</div>
                        )}
                    </div>

                    <div id="odds" className="odds-section">
                        <div className=" odds-header">
                            <img src={matchData.team_home_badge} alt="Home" width="24" />
                            <h3>Betting Odds</h3>
                            <img src={matchData.team_away_badge} alt="Away" width="24" />
                        </div>
                        {odds && odds.length > 0 ? (
                            <div className="odds-table-container">
                                <table className="odds-table">
                                    <thead>
                                        <tr>
                                            <th>BM</th>
                                            <th>1</th>
                                            <th>X</th>
                                            <th>2</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(() => {
                                            // Calculate highest odds for each column
                                            const highest1 = Math.max(...odds.map(b => parseFloat(b.odd_1) || 0));
                                            const highestX = Math.max(...odds.map(b => parseFloat(b.odd_x || b.odd_X) || 0));
                                            const highest2 = Math.max(...odds.map(b => parseFloat(b.odd_2) || 0));

                                            return odds.map((bookmaker, index) => {
                                                const odd1 = parseFloat(bookmaker.odd_1) || 0;
                                                const oddX = parseFloat(bookmaker.odd_x || bookmaker.odd_X) || 0;
                                                const odd2 = parseFloat(bookmaker.odd_2) || 0;

                                                return (
                                                    <tr key={index}>
                                                        <td className="bookmaker-cell">
                                                            <div className="bookmaker-info">
                                                                <div className="bookmaker-logo">{bookmaker.odd_bookmakers.substring(0, 2).toUpperCase()}</div>
                                                                <span>{bookmaker.odd_bookmakers}</span>
                                                            </div>
                                                        </td>
                                                        <td className={odd1 === highest1 ? 'highlight' : ''}>{bookmaker.odd_1 || '-'}</td>
                                                        <td className={oddX === highestX ? 'highlight' : ''}>{bookmaker.odd_x || bookmaker.odd_X || '-'}</td>
                                                        <td className={odd2 === highest2 ? 'highlight' : ''}>{bookmaker.odd_2 || '-'}</td>
                                                    </tr>
                                                );
                                            });
                                        })()}
                                    </tbody>
                                    <tfoot>
                                        <tr className="average-row">
                                            <td>Average</td>

                                            <td>{(odds.reduce((sum, b) => sum + (parseFloat(b.odd_1) || 0), 0) / odds.length).toFixed(2)}</td>
                                            <td>{(odds.reduce((sum, b) => sum + (parseFloat(b.odd_x || b.odd_X) || 0), 0) / odds.length).toFixed(2)}</td>
                                            <td>{(odds.reduce((sum, b) => sum + (parseFloat(b.odd_2) || 0), 0) / odds.length).toFixed(2)}</td>
                                        </tr>
                                        <tr className="highest-row">
                                            <td>Highest</td>

                                            <td>{Math.max(...odds.map(b => parseFloat(b.odd_1) || 0)).toFixed(2)}</td>
                                            <td>{Math.max(...odds.map(b => parseFloat(b.odd_x || b.odd_X) || 0)).toFixed(2)}</td>
                                            <td>{Math.max(...odds.map(b => parseFloat(b.odd_2) || 0)).toFixed(2)}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        ) : (
                            <div className="no-data">No odds available for this match</div>
                        )}
                    </div>

                    <div id="lineups" className="lineups-section">
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


                            </>
                        ) : (
                            <div className="no-data">Lineup information not available</div>
                        )}
                    </div>

                    <div id="h2h" className="h2h-section">
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
                </div>
            </div>
        </div>
    );
}

export default MatchDetail;

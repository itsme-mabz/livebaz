import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './LiveScore.css';

const API_KEY = import.meta.env.VITE_APIFOOTBALL_KEY || '8b638d34018a20c11ed623f266d7a7a6a5db7a451fb17038f8f47962c66db43b';
const BASE_URL = 'https://apiv3.apifootball.com';

function LiveScore() {
    const navigate = useNavigate();
    const [allMatches, setAllMatches] = useState([]);
    const [matchCounts, setMatchCounts] = useState({});
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [loading, setLoading] = useState(false);
    const [selectedLeagues, setSelectedLeagues] = useState(new Set());
    const [leaguesByCountry, setLeaguesByCountry] = useState({});
    const [topLeagues, setTopLeagues] = useState([]);
    const [expandedCountries, setExpandedCountries] = useState(new Set());
    const [showLiveOnly, setShowLiveOnly] = useState(false);
    const [standingsData, setStandingsData] = useState(null);
    const [showStandingsModal, setShowStandingsModal] = useState(false);
    const [loadingStandings, setLoadingStandings] = useState(false);
    const socketRef = useRef(null);

    // Transform match data
    const transformMatch = (match) => ({
        id: match.match_id,
        time: match.match_time,
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
        // Prediction data
        probHome: match.prob_HW || null,
        probDraw: match.prob_D || null,
        probAway: match.prob_AW || null,
        probOver: match.prob_O || null,
        probUnder: match.prob_U || null,
        probBTTS: match.prob_BTTS || null
    });

    // Format percentage value - handle both decimal (0-1) and percentage (0-100) formats
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

    // Calculate odds from probability
    const calculateOdds = (value) => {
        if (!value || value === '0' || value === 0) return '-';
        let num = parseFloat(value);

        // Check if num is valid
        if (isNaN(num) || num <= 0) return '-';

        // If value is between 0 and 1, it's already a decimal probability
        if (num > 0 && num < 1) {
            num = num * 100;
        }

        // If probability is too small (less than 0.01%), odds would be too high
        if (num < 0.01) return '-';

        // Odds = 100 / probability
        const odds = 100 / num;

        // Check if odds is a valid number and not infinity
        if (!isFinite(odds)) return '-';

        return odds.toFixed(2);
    };

    // Format both odds and percentage together
    const formatOddsAndPercentage = (value) => {
        if (!value || value === '0' || value === 0) return '-';
        const odds = calculateOdds(value);
        const percentage = formatPercentage(value);
        return { odds, percentage };
    };

    // Get date pills with match counts
    const getDatePills = () => {
        const pills = [];
        const today = new Date();
        for (let i = -2; i <= 2; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() + i);
            pills.push(date);
        }
        return pills;
    };

    const datePills = getDatePills();

    // Get date label
    const getDateLabel = (date) => {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const dateStr = date.toISOString().split('T')[0];
        const count = matchCounts[dateStr] || 0;

        if (date.toDateString() === today.toDateString()) {
            return `Today ${count}`;
        } else if (date.toDateString() === tomorrow.toDateString()) {
            return `Tomorrow ${count}`;
        } else if (date.toDateString() === yesterday.toDateString()) {
            return `Yesterday`;
        } else {
            const options = { day: 'numeric', month: 'short' };
            return date.toLocaleDateString('en-US', options);
        }
    };

    // Check if same day
    const isSameDay = (date1, date2) => {
        return date1.toISOString().split('T')[0] === date2.toISOString().split('T')[0];
    };

    // Fetch match counts for all dates
    const fetchMatchCounts = useCallback(async () => {
        try {
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - 2);
            const endDate = new Date();
            endDate.setDate(endDate.getDate() + 2);

            const url = `${BASE_URL}/?action=get_events&from=${startDate.toISOString().split('T')[0]}&to=${endDate.toISOString().split('T')[0]}&APIkey=${API_KEY}`;
            const response = await axios.get(url);

            if (response.data && Array.isArray(response.data)) {
                const counts = {};
                response.data.forEach(match => {
                    const date = match.match_date;
                    counts[date] = (counts[date] || 0) + 1;
                });
                setMatchCounts(counts);
            }
        } catch (error) {
            console.error('Error fetching match counts:', error);
        }
    }, []);

    // Fetch matches for selected date
    const fetchMatches = useCallback(async () => {
        setLoading(true);
        try {
            const dateStr = selectedDate.toISOString().split('T')[0];
            let matchUrl = `${BASE_URL}/?action=get_events&from=${dateStr}&to=${dateStr}&APIkey=${API_KEY}`;

            if (selectedLeagues.size > 0) {
                matchUrl += `&league_id=${Array.from(selectedLeagues).join(',')}`;
            }

            // Fetch both matches and predictions in parallel
            const [matchResponse, predictionResponse] = await Promise.all([
                axios.get(matchUrl),
                axios.get(`${BASE_URL}/?action=get_predictions&from=${dateStr}&to=${dateStr}&APIkey=${API_KEY}`)
            ]);

            if (matchResponse.data && Array.isArray(matchResponse.data)) {
                // Create a map of predictions by match_id for quick lookup
                const predictionsMap = {};
                if (predictionResponse.data && Array.isArray(predictionResponse.data)) {
                    predictionResponse.data.forEach(pred => {
                        predictionsMap[pred.match_id] = pred;
                    });
                }

                // Merge match data with predictions
                const matchesWithPredictions = matchResponse.data.map(match => {
                    const prediction = predictionsMap[match.match_id] || {};
                    return {
                        ...match,
                        prob_HW: prediction.prob_HW,
                        prob_D: prediction.prob_D,
                        prob_AW: prediction.prob_AW,
                        prob_O: prediction.prob_O,
                        prob_U: prediction.prob_U,
                        // BTTS is returned as prob_bts (lowercase) in the API
                        prob_BTTS: prediction.prob_bts
                    };
                });

                const transformed = matchesWithPredictions.map(transformMatch);
                setAllMatches(transformed);

                // Group leagues by country
                const leaguesMap = {};
                matchResponse.data.forEach(match => {
                    if (!leaguesMap[match.country_name]) {
                        leaguesMap[match.country_name] = [];
                    }
                    const exists = leaguesMap[match.country_name].find(l => l.id === match.league_id);
                    if (!exists) {
                        leaguesMap[match.country_name].push({
                            id: match.league_id,
                            name: match.league_name,
                            logo: match.league_logo
                        });
                    }
                });

                Object.keys(leaguesMap).forEach(country => {
                    leaguesMap[country].sort((a, b) => a.name.localeCompare(b.name));
                });

                setLeaguesByCountry(leaguesMap);
            }
        } catch (error) {
            console.error('Error fetching matches:', error);
        } finally {
            setLoading(false);
        }
    }, [selectedDate, selectedLeagues]);

    // Filter matches based on live toggle
    const filteredMatches = showLiveOnly
        ? allMatches.filter(match => match.isLive)
        : allMatches;

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
        setSelectedLeagues(new Set());
    };

    // Fetch top leagues dynamically
    const fetchTopLeagues = useCallback(async () => {
        try {
            const today = new Date();
            const dateStr = today.toISOString().split('T')[0];
            const url = `${BASE_URL}/?action=get_events&from=${dateStr}&to=${dateStr}&APIkey=${API_KEY}`;
            const response = await axios.get(url);

            if (response.data && Array.isArray(response.data)) {
                // Count matches per league
                const leagueCounts = {};
                response.data.forEach(match => {
                    if (!leagueCounts[match.league_id]) {
                        leagueCounts[match.league_id] = {
                            id: match.league_id,
                            name: match.league_name,
                            logo: match.league_logo,
                            count: 0
                        };
                    }
                    leagueCounts[match.league_id].count++;
                });

                // Get top 5 leagues by match count
                const topLeaguesList = Object.values(leagueCounts)
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 5);

                setTopLeagues(topLeaguesList);
            }
        } catch (error) {
            console.error('Error fetching top leagues:', error);
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
        fetchMatchCounts();
        fetchTopLeagues();
    }, [fetchMatchCounts, fetchTopLeagues]);

    useEffect(() => {
        fetchMatches();
    }, [fetchMatches]);

    // Count live matches for today
    const todayStr = new Date().toISOString().split('T')[0];
    const liveCount = allMatches.filter(m => m.isLive && m.date === todayStr).length;

    return (
        <div className="livescore-page wrap " style={{ paddingTop: '8px' }}>
            {/* Breadcrumbs */}
            <div className="breadcrumbs">
                <a href="/">Livebaz</a>
                <span>/</span>
                <span>Live Score</span>
            </div>

            <div className="livescore-container wrap">
                {/* Sidebar */}
                <aside className="livescore-sidebar">
                    <div className="sidebar-header">
                        <h3 className="sidebar-title">TOP LEAGUES</h3>
                        <button
                            className="clear-filters-btn"
                            onClick={clearFilters}
                            style={{ opacity: selectedLeagues.size > 0 ? 1 : 0.5, cursor: selectedLeagues.size > 0 ? 'pointer' : 'not-allowed' }}
                            disabled={selectedLeagues.size === 0}
                        >
                            Clear All
                        </button>
                    </div>

                    {topLeagues.length > 0 && (
                        <div className="sidebar-section">
                            <h4 className="sidebar-section-title">Popular Today</h4>
                            {topLeagues.map(league => (
                                <div
                                    key={league.id}
                                    className="sidebar-league-item"
                                    onClick={() => toggleLeague(league.id)}
                                >
                                    {league.logo ? (
                                        <img src={league.logo} alt="" className="league-icon-img" />
                                    ) : (
                                        <span className="league-icon">⚽</span>
                                    )}
                                    <span className="league-name">{league.name}</span>
                                </div>
                            ))}
                        </div>
                    )}

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
                                            className="sidebar-league-item"
                                            onClick={() => toggleLeague(league.id)}
                                        >
                                            {league.logo ? (
                                                <img src={league.logo} alt="" className="league-icon-img" />
                                            ) : (
                                                <span className="league-icon">⚽</span>
                                            )}
                                            <span className="league-name">{league.name}</span>
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
                        <h1 className="livescore-title">Football Games Today</h1>
                        <div className="livescore-date-pills">
                            {datePills.map((date, index) => (
                                <button
                                    key={index}
                                    className={`livescore-date-pill ${isSameDay(date, selectedDate) ? 'active' : ''}`}
                                    onClick={() => {
                                        setSelectedDate(date);
                                        setShowLiveOnly(false);
                                    }}
                                >
                                    {getDateLabel(date)}
                                </button>
                            ))}
                            {liveCount > 0 && isSameDay(selectedDate, new Date()) && (
                                <button
                                    className={`livescore-date-pill live-filter-pill ${showLiveOnly ? 'active' : ''}`}
                                    onClick={() => setShowLiveOnly(!showLiveOnly)}
                                >
                                    <span className="live-dot"></span>
                                    Live {liveCount}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Matches */}
                    <div className="livescore-content">
                        {loading ? (
                            <div className="loading-state">Loading matches...</div>
                        ) : Object.keys(groupedMatches).length === 0 ? (
                            <div className="empty-state">No matches found for this date</div>
                        ) : (
                            Object.values(groupedMatches)
                                .sort((a, b) => {
                                    const countryCompare = a.country.localeCompare(b.country);
                                    if (countryCompare !== 0) return countryCompare;
                                    return a.league.localeCompare(b.league);
                                })
                                .map((group, idx) => (
                                <div key={idx} className="league-card">
                                    <div className="league-card-header">
                                        <div className="league-card-title-wrapper">
                                            {group.leagueLogo && (
                                                <img src={group.leagueLogo} alt="" className="league-card-logo" />
                                            )}
                                            <h3 className="league-card-title">
                                                {group.country.toUpperCase()}: {group.league.toUpperCase()}
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
                                            <div className="col-result-stat" title="Match Result: Home Win (1) / Draw (X) / Away Win (2)">1X2</div>
                                            <div className="col-goals-stat" title="Over/Under 2.5 Goals">O/U 2.5</div>
                                            <div className="col-btts-stat" title="Both Teams To Score">BTTS</div>
                                            <div className="col-score-stat">Score</div>
                                        </div>

                                        {group.matches.map((match) => (
                                            <div
                                                key={match.id}
                                                className={`match-row-stats ${match.isLive ? 'live-match-row' : ''}`}
                                                onClick={() => navigate(`/match/${match.id}`)}
                                            >
                                                <div className="col-time-stat">
                                                    {match.isLive ? (
                                                        <div className="live-badge-new">
                                                            <span className="live-text">Live</span>
                                                            <span className="live-minute">{match.status}'</span>
                                                        </div>
                                                    ) : (
                                                        <div className="match-time-new">{match.time}</div>
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

                                                <div className="col-result-stat">
                                                    <div className="prob-row">
                                                        <div className="prob-item">
                                                            <span className="prob-label">1</span>
                                                            <span className="prob-value">
                                                                {match.probHome ? (
                                                                    <>
                                                                        <span className="prob-odds">{calculateOdds(match.probHome)}</span>
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
                                                                        <span className="prob-odds">{calculateOdds(match.probDraw)}</span>
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
                                                                        <span className="prob-odds">{calculateOdds(match.probAway)}</span>
                                                                        <span className="prob-percent">{formatPercentage(match.probAway)}</span>
                                                                    </>
                                                                ) : '-'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="col-goals-stat">
                                                    <div className="prob-row">
                                                        <div className="prob-item">
                                                            <span className="prob-label">O</span>
                                                            <span className="prob-value">
                                                                {match.probOver ? (
                                                                    <>
                                                                        <span className="prob-odds">{calculateOdds(match.probOver)}</span>
                                                                        <span className="prob-percent">{formatPercentage(match.probOver)}</span>
                                                                    </>
                                                                ) : '-'}
                                                            </span>
                                                        </div>
                                                        <div className="prob-item">
                                                            <span className="prob-label">U</span>
                                                            <span className="prob-value">
                                                                {match.probUnder ? (
                                                                    <>
                                                                        <span className="prob-odds">{calculateOdds(match.probUnder)}</span>
                                                                        <span className="prob-percent">{formatPercentage(match.probUnder)}</span>
                                                                    </>
                                                                ) : '-'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="col-btts-stat">
                                                    <div className="prob-single">
                                                        {match.probBTTS ? (
                                                            <span className="prob-value-large">
                                                                <span className="prob-odds-large">{calculateOdds(match.probBTTS)}</span>
                                                                <span className="prob-percent-large">{formatPercentage(match.probBTTS)}</span>
                                                            </span>
                                                        ) : (
                                                            <span className="prob-value-large">-</span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="col-score-stat">
                                                    <div className="score-display">
                                                        <span className={`score-number ${match.isLive ? 'live' : ''}`}>
                                                            {match.homeScore}
                                                        </span>
                                                        <span className={`score-number ${match.isLive ? 'live' : ''}`}>
                                                            {match.awayScore}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))
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

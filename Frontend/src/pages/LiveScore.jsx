import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './LiveScore.css';
import { LiveScoreTableSkeleton } from '../components/SkeletonLoader/SkeletonLoader';

const API_KEY = import.meta.env.VITE_APIFOOTBALL_KEY || '8b638d34018a20c11ed623f266d7a7a6a5db7a451fb17038f8f47962c66db43b';

// Comprehensive timezone list
const TIMEZONES = [
    { label: 'Iran (UTC+3:30)', value: '+03:30' },
    { label: 'Pakistan (UTC+5)', value: '+05:00' },
    { label: 'India (UTC+5:30)', value: '+05:30' },
    { label: 'UAE (UTC+4)', value: '+04:00' },
    { label: 'Saudi Arabia (UTC+3)', value: '+03:00' },
    { label: 'Turkey (UTC+3)', value: '+03:00' },
    { label: 'Egypt (UTC+2)', value: '+02:00' },
    { label: 'South Africa (UTC+2)', value: '+02:00' },
    { label: 'UK (UTC+0)', value: '+00:00' },
    { label: 'Portugal (UTC+0)', value: '+00:00' },
    { label: 'Europe/Berlin (UTC+1)', value: '+01:00' },
    { label: 'France (UTC+1)', value: '+01:00' },
    { label: 'Spain (UTC+1)', value: '+01:00' },
    { label: 'Italy (UTC+1)', value: '+01:00' },
    { label: 'Greece (UTC+2)', value: '+02:00' },
    { label: 'Russia/Moscow (UTC+3)', value: '+03:00' },
    { label: 'China (UTC+8)', value: '+08:00' },
    { label: 'Japan (UTC+9)', value: '+09:00' },
    { label: 'Australia/Sydney (UTC+11)', value: '+11:00' },
    { label: 'New Zealand (UTC+13)', value: '+13:00' },
    { label: 'US East (UTC-5)', value: '-05:00' },
    { label: 'US Central (UTC-6)', value: '-06:00' },
    { label: 'US Mountain (UTC-7)', value: '-07:00' },
    { label: 'US West (UTC-8)', value: '-08:00' },
    { label: 'Brazil (UTC-3)', value: '-03:00' },
    { label: 'Argentina (UTC-3)', value: '-03:00' },
    { label: 'Mexico (UTC-6)', value: '-06:00' }
];

function LiveScore() {
    const [matches, setMatches] = useState([]);
    const [visibleCount, setVisibleCount] = useState(30);
    const [connectionStatus, setConnectionStatus] = useState('Disconnected');
    const socketRef = useRef(null);

    // Filter states
    const [selectedTimezone, setSelectedTimezone] = useState('+03:30');
    const [selectedCountries, setSelectedCountries] = useState(new Set());
    const [selectedLeagues, setSelectedLeagues] = useState(new Set());
    const [matchIdFilter, setMatchIdFilter] = useState('');
    const [showAllCountries, setShowAllCountries] = useState(false);
    const [showAllLeagues, setShowAllLeagues] = useState(false);

    // Available options (populated from API data)
    const [availableCountries, setAvailableCountries] = useState([]);
    const [availableLeagues, setAvailableLeagues] = useState([]);

    // Transform WebSocket data to component format
    const transformMatch = (match) => {
        return {
            id: match.match_id,
            time: match.match_time,
            league: match.league_name,
            leagueId: match.league_id,
            country: match.country_name,
            countryId: match.country_id,
            homeTeam: match.match_hometeam_name,
            awayTeam: match.match_awayteam_name,
            homeScore: match.match_hometeam_score || '-',
            awayScore: match.match_awayteam_score || '-',
            isLive: match.match_live === '1',
            liveTime: match.match_status,
            status: match.match_status,
            date: match.match_date
        };
    };

    // Fetch countries and leagues from API on mount
    useEffect(() => {
        const fetchCountriesAndLeagues = async () => {
            try {
                // Fetch countries
                const countriesResponse = await axios.get(`https://apiv3.apifootball.com/?action=get_countries&APIkey=${API_KEY}`);
                if (Array.isArray(countriesResponse.data)) {
                    const countries = countriesResponse.data.map(c => ({
                        id: c.country_id,
                        name: c.country_name,
                        logo: c.country_logo
                    })).sort((a, b) => a.name.localeCompare(b.name));
                    setAvailableCountries(countries);
                }

                // Fetch leagues - we'll get them from events API with a broad date range
                const today = new Date();
                const from = new Date(today);
                from.setDate(from.getDate() - 1); // Yesterday
                const to = new Date(today);
                to.setDate(to.getDate() + 7); // Next week

                const leaguesResponse = await axios.get(`https://apiv3.apifootball.com/?action=get_events&from=${from.toISOString().split('T')[0]}&to=${to.toISOString().split('T')[0]}&APIkey=${API_KEY}`);
                if (Array.isArray(leaguesResponse.data)) {
                    const leagues = [...new Map(
                        leaguesResponse.data.map(m => [m.league_id, {
                            id: m.league_id,
                            name: m.league_name,
                            country: m.country_name
                        }])
                    ).values()].sort((a, b) => a.name.localeCompare(b.name));
                    setAvailableLeagues(leagues);
                }
            } catch (error) {
                console.error('Error fetching countries and leagues:', error);
            }
        };

        fetchCountriesAndLeagues();
    }, []);

    // WebSocket connection with filters
    useEffect(() => {
        const connectWebSocket = () => {
            if (socketRef.current?.readyState === WebSocket.OPEN) {
                socketRef.current.close();
            }

            setConnectionStatus('Connecting');
            console.log('Connecting to WebSocket...');

            // Build WebSocket URL with filters
            let wsUrl = `wss://wss.apifootball.com/livescore?APIkey=${API_KEY}&timezone=${selectedTimezone}`;

            // Add country filter if selected
            if (selectedCountries.size > 0) {
                const countryIds = Array.from(selectedCountries).join(',');
                wsUrl += `&country_id=${countryIds}`;
            }

            // Add league filter if selected
            if (selectedLeagues.size > 0) {
                const leagueIds = Array.from(selectedLeagues).join(',');
                wsUrl += `&league_id=${leagueIds}`;
            }

            // Add match ID filter if provided
            if (matchIdFilter.trim()) {
                wsUrl += `&match_id=${matchIdFilter.trim()}`;
            }

            console.log('WebSocket URL:', wsUrl);

            const socket = new WebSocket(wsUrl);
            socketRef.current = socket;

            socket.onopen = () => {
                setConnectionStatus('Connected');
                console.log('WebSocket Connected');
            };

            socket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    console.log('Received data:', data);

                    if (Array.isArray(data) && data.length > 0) {
                        const transformedMatches = data.map(transformMatch);
                        setMatches(transformedMatches);
                    } else {
                        setMatches([]);
                    }
                } catch (error) {
                    console.error('Error parsing WebSocket data:', error);
                }
            };

            socket.onerror = (error) => {
                console.error('WebSocket error:', error);
                setConnectionStatus('Error');
            };

            socket.onclose = () => {
                console.log('WebSocket disconnected. Reconnecting in 5 seconds...');
                setConnectionStatus('Disconnected');
                socketRef.current = null;
                setTimeout(connectWebSocket, 5000);
            };
        };

        connectWebSocket();

        return () => {
            if (socketRef.current) {
                socketRef.current.close();
                socketRef.current = null;
            }
        };
    }, [selectedTimezone, selectedCountries, selectedLeagues, matchIdFilter]);

    // Handle country filter toggle
    const toggleCountry = (countryId) => {
        setSelectedCountries(prev => {
            const newSet = new Set(prev);
            if (newSet.has(countryId)) {
                newSet.delete(countryId);
            } else {
                newSet.add(countryId);
            }
            return newSet;
        });
    };

    // Handle league filter toggle
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

    // Clear all filters
    const clearAllFilters = () => {
        setSelectedCountries(new Set());
        setSelectedLeagues(new Set());
        setMatchIdFilter('');
    };

    const hasActiveFilters = selectedCountries.size > 0 || selectedLeagues.size > 0 || matchIdFilter.trim();

    return (
        <div className="live-score-page">
            <div className="container-wrapper wrap">
                {/* Breadcrumbs */}
                <div className="breadcrumbs">
                    <a href="/" className="breadcrumb-link">Livebaz</a>
                    <span className="breadcrumb-separator">›</span>
                    <span className="breadcrumb-current">Live Scores</span>
                </div>

                {/* Main Grid Layout */}
                <div className="content-grid">
                    {/* Filters Sidebar */}
                    <aside className="filters-sidebar">
                        <div className="filters-header">
                            <h3 className="filters-title">FILTERS</h3>
                            {hasActiveFilters && (
                                <button
                                    className="clear-filters"
                                    onClick={clearAllFilters}
                                >
                                    <span>✕</span>
                                    <span>Clear</span>
                                </button>
                            )}
                        </div>



                        {/* Timezone Filter */}
                        <div className="filter-group">
                            <h4 className="filter-group-title">TIMEZONE</h4>
                            <select
                                value={selectedTimezone}
                                onChange={(e) => setSelectedTimezone(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    borderRadius: '4px',
                                    border: '1px solid #d0d0d0',
                                    fontSize: '13px',
                                    cursor: 'pointer'
                                }}
                            >
                                {TIMEZONES.map(tz => (
                                    <option key={tz.value} value={tz.value}>
                                        {tz.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Match ID Filter */}
                        <div className="filter-group">
                            <h4 className="filter-group-title">MATCH ID</h4>
                            <input
                                type="text"
                                placeholder="Enter match ID..."
                                value={matchIdFilter}
                                onChange={(e) => setMatchIdFilter(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    borderRadius: '4px',
                                    border: '1px solid #d0d0d0',
                                    fontSize: '13px'
                                }}
                            />
                        </div>

                        {/* Countries Filter */}
                        {availableCountries.length > 0 && (
                            <div className="filter-group">
                                <h4 className="filter-group-title">COUNTRIES</h4>
                                <div className="filter-options">
                                    {availableCountries.slice(0, showAllCountries ? undefined : 10).map(country => (
                                        <label key={country.id} className="filter-option">
                                            <input
                                                type="checkbox"
                                                checked={selectedCountries.has(country.id)}
                                                onChange={() => toggleCountry(country.id)}
                                            />
                                            <span className="filter-label">{country.name}</span>
                                        </label>
                                    ))}
                                </div>
                                {availableCountries.length > 10 && (
                                    <button
                                        className="show-more-leagues"
                                        onClick={() => setShowAllCountries(!showAllCountries)}
                                    >
                                        {showAllCountries ? 'Show less' : `Show more (${availableCountries.length - 10})`}
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Leagues Filter */}
                        {availableLeagues.length > 0 && (
                            <div className="filter-group">
                                <h4 className="filter-group-title">LEAGUES</h4>
                                <div className="filter-options">
                                    {availableLeagues.slice(0, showAllLeagues ? undefined : 10).map(league => (
                                        <label key={league.id} className="filter-option">
                                            <input
                                                type="checkbox"
                                                checked={selectedLeagues.has(league.id)}
                                                onChange={() => toggleLeague(league.id)}
                                            />
                                            <span className="filter-label">{league.name}</span>
                                        </label>
                                    ))}
                                </div>
                                {availableLeagues.length > 10 && (
                                    <button
                                        className="show-more-leagues"
                                        onClick={() => setShowAllLeagues(!showAllLeagues)}
                                    >
                                        {showAllLeagues ? 'Show less' : `Show more (${availableLeagues.length - 10})`}
                                    </button>
                                )}
                            </div>
                        )}
                    </aside>

                    {/* Main Content */}
                    <main className="main-content">
                        {/* Page Header */}
                        <div className="page-header" style={{ padding: '30px 24px' }}>
                            <h1 className="page-title">Football Live Scores</h1>
                        </div>

                        {/* Table Controls */}
                        <div className="table-controls" style={{ justifyContent: 'space-between', padding: '14px 24px' }}>
                            <div style={{ fontSize: '13px', color: '#666' }}>
                                {matches.length} {matches.length === 1 ? 'match' : 'matches'}
                            </div>
                            <div style={{ fontSize: '12px', color: '#999' }}>
                                Timezone: {TIMEZONES.find(tz => tz.value === selectedTimezone)?.label}
                            </div>
                        </div>

                        {/* Table Header */}
                        <div
                            className="predictions-table-header"
                            style={{ gridTemplateColumns: '55px 1fr 80px' }}
                        >
                            <div>Time</div>
                            <div>Match</div>
                            <div style={{ textAlign: 'center' }}>Score</div>
                        </div>

                        {/* Table Body */}
                        {connectionStatus === 'Connecting' ? (
                            <LiveScoreTableSkeleton rows={15} />
                        ) : (
                            <div className="predictions-table-body">
                                {matches.length === 0 ? (
                                    <div className="loading-state">
                                        {connectionStatus === 'Connected'
                                            ? 'No live matches at the moment'
                                            : 'Waiting for connection...'}
                                    </div>
                                ) : (
                                <>
                                    {matches.slice(0, visibleCount).map(match => (
                                        <div
                                            key={match.id}
                                            className="match-row"
                                            style={{ gridTemplateColumns: '55px 1fr 80px' }}
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
                                                <div className="match-time">{match.time}</div>
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

                                            {/* Score */}
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '18px',
                                                fontWeight: '700',
                                                color: match.isLive ? '#f44336' : '#333'
                                            }}>
                                                {match.homeScore} - {match.awayScore}
                                            </div>
                                        </div>
                                    ))}

                                    {/* Show More Button */}
                                    {matches.length > visibleCount && (
                                        <div className="show-more-container">
                                            <button
                                                className="show-more-btn"
                                                onClick={() => setVisibleCount(prev => prev + 30)}
                                            >
                                                Show more matches
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

export default LiveScore;
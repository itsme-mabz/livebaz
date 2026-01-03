import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import './MatchDetail.css';
import { MatchDetailSkeleton } from '../components/SkeletonLoader/SkeletonLoader';
import { convertToLocalTime } from '../utils/timezone';
import { replaceTranslation } from '../utils/translationReplacer.jsx';
import { useTimezone } from '../context/TimezoneContext';




function MatchDetail() {
    const { matchId, lang } = useParams();
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
    const [playerImages, setPlayerImages] = useState({});
    const [commentary, setCommentary] = useState([]);
    const [statistics, setStatistics] = useState(null);
    const [commentaryOpen, setCommentaryOpen] = useState(false);
    const [timelineOpen, setTimelineOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [currentLang, setCurrentLang] = useState('en');
    const { currentTimezone } = useTimezone();

    // Detect language from Google Translate widget
    useEffect(() => {
        const checkLanguage = () => {
            const select = document.querySelector('.goog-te-combo');
            if (select) {
                setCurrentLang(select.value || 'en');
            }
        };

        checkLanguage();
        const interval = setInterval(checkLanguage, 500);
        return () => clearInterval(interval);
    }, []);



    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
        };

        // Initial check
        handleResize();

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        fetchMatchData();
    }, [matchId, currentTimezone]);

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
                `/api/v1/football-events/get-events?team_id=${teamId}&from=${fromDate}&to=${toDate}`
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

    // Fetch player images for lineup
    const fetchPlayerImages = async (lineup) => {
        const images = {};
        const allPlayers = [
            ...(lineup?.home?.starting_lineups || []),
            ...(lineup?.away?.starting_lineups || [])
        ];

        console.log('Fetching images for', allPlayers.length, 'players...');

        // Fetch player images in batches to avoid too many simultaneous requests
        for (const player of allPlayers) {
            try {
                const response = await axios.get(
                    `/api/v1/football-events/get-players?player_id=${player.player_key}`
                );

                if (response.data && response.data.length > 0) {
                    const playerData = response.data[0];
                    if (playerData.player_image) {
                        images[player.player_key] = playerData.player_image;
                        console.log(`✓ Got image for ${player.lineup_player}:`, playerData.player_image);
                    }
                }
            } catch (error) {
                console.error(`Error fetching image for player ${player.lineup_player}:`, error);
            }
        }

        console.log('Total player images fetched:', Object.keys(images).length);
        setPlayerImages(images);
    };

    const fetchMatchData = async () => {
        try {
            setLoading(true);

            // Fetch match details (events, lineups, stats)
            const matchResponse = await axios.get(`/api/v1/football-events/get-events?match_id=${matchId}`);
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

                // Fetch player images if lineup exists
                if (match.lineup) {
                    fetchPlayerImages(match.lineup);
                }

                // Fetch H2H if teams are available
                if (match.match_hometeam_id && match.match_awayteam_id) {
                    try {
                        console.log(`Fetching H2H for Home: ${match.match_hometeam_id} vs Away: ${match.match_awayteam_id}`);
                        const h2hResponse = await axios.get(`/api/v1/football-events/get-h2h?firstTeamId=${match.match_hometeam_id}&secondTeamId=${match.match_awayteam_id}`);
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
                        const standingsResponse = await axios.get(`/api/v1/football-events/get-standings?league_id=${match.league_id}`);
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
                    const predictionsResponse = await axios.get(`/api/v1/football-events/get-predictions?match_id=${matchId}`);
                    if (predictionsResponse.data && predictionsResponse.data.length > 0) {
                        setPredictions(predictionsResponse.data[0]);
                    }
                } catch (err) {
                    console.error('Error fetching predictions:', err);
                }

                // Fetch odds for this match
                try {
                    const oddsResponse = await axios.get(`/api/v1/football-events/get-odds?match_id=${matchId}`);
                    if (oddsResponse.data && Array.isArray(oddsResponse.data)) {
                        setOdds(oddsResponse.data);
                    }
                } catch (err) {
                    console.error('Error fetching odds:', err);
                }

                // Fetch Commentary
                try {
                    const commentaryResponse = await axios.get(`/api/v1/football-events/get-commentary?match_id=${matchId}`);
                    if (commentaryResponse.data && commentaryResponse.data[matchId]) {
                        setCommentary(commentaryResponse.data[matchId].live_comments || []);
                    }
                } catch (err) {
                    console.error('Error fetching commentary:', err);
                }

                // Fetch Advanced Statistics
                try {
                    const statsResponse = await axios.get(`/api/v1/football-events/get-statistics?match_id=${matchId}`);
                    if (statsResponse.data && statsResponse.data[matchId]) {
                        setStatistics(statsResponse.data[matchId]);
                    }
                } catch (err) {
                    console.error('Error fetching statistics:', err);
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
        return teamStanding ? `${teamStanding.overall_league_position} ${replaceTranslation('place', currentLang)}` : 'N/A';
    };

    // Helper functions to get average odds from odds array
    const getAverageOdd1 = () => {
        if (!odds || odds.length === 0) return 'N/A';
        const avg = odds.reduce((sum, b) => sum + (parseFloat(b.odd_1) || 0), 0) / odds.length;
        return avg > 0 ? avg.toFixed(2) : 'N/A';
    };

    const getAverageOddX = () => {
        if (!odds || odds.length === 0) return 'N/A';
        const avg = odds.reduce((sum, b) => sum + (parseFloat(b.odd_x || b.odd_X) || 0), 0) / odds.length;
        return avg > 0 ? avg.toFixed(2) : 'N/A';
    };

    const getAverageOdd2 = () => {
        if (!odds || odds.length === 0) return 'N/A';
        const avg = odds.reduce((sum, b) => sum + (parseFloat(b.odd_2) || 0), 0) / odds.length;
        return avg > 0 ? avg.toFixed(2) : 'N/A';
    };

    // Helper function to get BTTS odds (Both Teams To Score)
    const getBTTSOdds = () => {
        if (!odds || odds.length === 0) return { yes: 'N/A', no: 'N/A' };

        // Look for BTTS odds in the odds array
        let bttsYesSum = 0;
        let bttsNoSum = 0;
        let bttsYesCount = 0;
        let bttsNoCount = 0;

        odds.forEach(bookie => {
            // Check for BTTS markets in the odds response
            // The API uses 'bts_yes' and 'bts_no'
            if (bookie.bts_yes) {
                bttsYesSum += parseFloat(bookie.bts_yes);
                bttsYesCount++;
            }
            if (bookie.bts_no) {
                bttsNoSum += parseFloat(bookie.bts_no);
                bttsNoCount++;
            }
        });

        if (bttsYesCount > 0 && bttsNoCount > 0) {
            return {
                yes: (bttsYesSum / bttsYesCount).toFixed(2),
                no: (bttsNoSum / bttsNoCount).toFixed(2)
            };
        }

        // Return N/A if no specific BTTS odds found
        return {
            yes: 'N/A',
            no: 'N/A'
        };
    };

    // Helper function to parse formation string from lineup data
    const getFormationString = (players) => {
        if (!players || players.length === 0) return 'N/A';

        const positionGroups = groupPlayersByPosition(players);
        const defenders = positionGroups.defenders.length;
        const midfielders = positionGroups.midfielders.length;
        const forwards = positionGroups.forwards.length;

        return `${defenders}-${midfielders}-${forwards}`;
    };

    // Helper function to group players by position
    // lineup_position is a number: 1=GK, 2-5=Defenders, 6-8=Midfielders, 9-11=Forwards
    // FALLBACK: If all positions are 0, use index-based positioning (1st=GK, 2-5=DEF, 6-8=MID, 9-11=FWD)
    const groupPlayersByPosition = (players) => {
        const groups = {
            goalkeeper: [],
            defenders: [],
            midfielders: [],
            forwards: []
        };

        // Check if all positions are 0 (API limitation)
        const allPositionsZero = players.every(p => parseInt(p.lineup_position) === 0);

        players.forEach((player, index) => {
            let posNum = parseInt(player.lineup_position);

            // FALLBACK: If position is 0, assign based on array index (assuming standard formation)
            if (allPositionsZero || posNum === 0) {
                // Use index to assign position: 0=GK, 1-4=DEF, 5-7=MID, 8-10=FWD
                if (index === 0) {
                    posNum = 1; // First player is goalkeeper
                } else if (index >= 1 && index <= 4) {
                    posNum = 2; // Next 4 are defenders
                } else if (index >= 5 && index <= 7) {
                    posNum = 6; // Next 3 are midfielders
                } else if (index >= 8 && index <= 10) {
                    posNum = 9; // Last 3 are forwards
                }
            }

            if (posNum === 1) {
                groups.goalkeeper.push(player);
            } else if (posNum >= 2 && posNum <= 5) {
                groups.defenders.push(player);
            } else if (posNum >= 6 && posNum <= 8) {
                groups.midfielders.push(player);
            } else if (posNum >= 9 && posNum <= 11) {
                groups.forwards.push(player);
            }
        });

        return groups;
    };


    // Mobile detection




    // Helper function to render lineup with proper formation
    const renderLineup = (players, side) => {
        if (!players || players.length === 0) return null;

        const groups = groupPlayersByPosition(players);

        // Define positions based on orientation
        // Desktop: Horizontal field (Left/Right)
        // Mobile: Vertical field (Top/Bottom)

        // Desktop Positions (X-axis %)
        const desktopPositions = side === 'home' ? {
            goalkeeper: 10,
            defenders: 30,
            midfielders: 55,
            forwards: 80
        } : {
            goalkeeper: 90,
            defenders: 70,
            midfielders: 45,
            forwards: 20
        };

        // Mobile Positions (Y-axis %)
        // Home plays Top -> Bottom
        // Away plays Bottom -> Top
        const mobilePositions = side === 'home' ? {
            goalkeeper: 10,
            defenders: 36,
            midfielders: 60,
            forwards: 82
        } : {
            goalkeeper: 90,
            defenders: 64,
            midfielders: 40,
            forwards: 18
        };

        const renderPlayerGroup = (playerList, lineType, positionKey) => {
            const count = playerList.length;
            if (count === 0) return null;

            // Spacing for distribution along the line (Transverse axis)
            const spacing = 100 / (count + 1);

            return playerList.map((player, index) => {
                const distributionPos = spacing * (index + 1);

                // Determine coordinates based on mobile/desktop
                let style = {};
                if (isMobile) {
                    // Vertical Setup
                    // Top (Y) is the line position (depth)
                    // Left (X) is the distribution (width)
                    style = {
                        top: `${mobilePositions[positionKey]}%`,
                        left: `${distributionPos}%`,
                        transform: 'translate(-50%, -50%)'
                    };
                } else {
                    // Horizontal Setup
                    // Left (X) is the line position (depth)
                    // Top (Y) is the distribution (height) - constrained to 80% to avoid edges
                    // Note: original code used 10 + 80/(n+1) logic
                    const desktopDistribution = 10 + (80 / (count + 1)) * (index + 1);
                    style = {
                        left: `${desktopPositions[positionKey]}%`,
                        top: `${desktopDistribution}%`,
                        transform: 'translate(-50%, -50%)'
                    };
                }

                const playerImageUrl = playerImages[player.player_key];
                const hasImage = playerImageUrl && playerImageUrl !== '';

                return (
                    <div
                        key={player.lineup_number}
                        className={`field-player ${lineType}`}
                        style={style}
                    >
                        <div className="player-avatar">
                            {hasImage ? (
                                <img
                                    src={playerImageUrl}
                                    alt={player.lineup_player}
                                    className="player-photo"
                                    onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.nextSibling.style.display = 'flex';
                                    }}
                                />
                            ) : (
                                <div className="player-jersey-number">{player.lineup_number}</div>
                            )}
                        </div>
                        <div className="player-field-name">{player.lineup_player}</div>
                    </div>
                );
            });
        };

        return (
            <>
                {renderPlayerGroup(groups.goalkeeper, 'goalkeeper', 'goalkeeper')}
                {renderPlayerGroup(groups.defenders, 'defender', 'defenders')}
                {renderPlayerGroup(groups.midfielders, 'midfielder', 'midfielders')}
                {renderPlayerGroup(groups.forwards, 'forward', 'forwards')}
            </>
        );
    };

    return (
        <div className="match-detail-page">
            <div className="match-detail-container">
                {/* Breadcrumbs */}
                <div className="breadcrumbs">
                    <a href="/">{replaceTranslation('Livebaz', currentLang)}</a>
                    <span>/</span>
                    <a href="/competitions">{replaceTranslation('Leagues', currentLang)}</a>
                    <span>/</span>
                    <a href={`/league/${matchData.league_id}`}>{replaceTranslation(matchData.league_name, currentLang)}</a>
                    <span>/</span>
                    <span>{matchData.match_hometeam_name} {replaceTranslation('vs', currentLang)} {matchData.match_awayteam_name}</span>
                </div>

                {/* Match Header */}
                <div className="match-header" style={{ backgroundImage: `url('https://ratingbet.com/ratingbet_build/img/rb_field_max.de674330.svg')` }}>
                    <div className="match-header-league">
                        {matchData.league_name} • {matchData.match_round || replaceTranslation('Round', currentLang)}
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
                                        <span className="form-loading">{replaceTranslation('Loading...', currentLang)}</span>
                                    )}
                                </div>
                                <div className="team-standing">{getTeamPosition(matchData.match_hometeam_id)}</div>
                            </div>
                        </div>

                        <div className="score-board">
                            <div className="match-meta-top">
                                {(() => {
                                    const [hours, minutes] = matchData.match_time.split(':');
                                    const gmtTime = `${String(parseInt(hours) - 1).padStart(2, '0')}:${minutes}`;
                                    const converted = convertToLocalTime(matchData.match_date, gmtTime, currentTimezone);
                                    return `${converted.date}, ${converted.time}`;
                                })()}
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
                                        <span className="form-loading">{replaceTranslation('Loading...', currentLang)}</span>
                                    )}
                                </div>
                                <div className="team-standing">{getTeamPosition(matchData.match_awayteam_id)}</div>
                            </div>

                        </div>
                    </div>
                </div>

                {/* Tabs Navigation - Sticky */}
                <div className="match-tabs-nav">
                    <button className="nav-tab timeline-btn" onClick={() => setTimelineOpen(true)}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                        </svg>
                        {replaceTranslation('Timeline', currentLang)}
                    </button>
                    <button className={`nav-tab ${activeTab === 'stats' ? 'active' : ''}`} onClick={() => scrollToSection('stats')}>{replaceTranslation('Stats', currentLang)}</button>
                    <button className={`nav-tab ${activeTab === 'predictions' ? 'active' : ''}`} onClick={() => scrollToSection('predictions')}>{replaceTranslation('Predictions', currentLang)}</button>
                    <button className={`nav-tab ${activeTab === 'odds' ? 'active' : ''}`} onClick={() => scrollToSection('odds')}>{replaceTranslation('Odds', currentLang)}</button>
                    <button className={`nav-tab ${activeTab === 'lineups' ? 'active' : ''}`} onClick={() => scrollToSection('lineups')}>{replaceTranslation('Lineups', currentLang)}</button>
                    <button className={`nav-tab ${activeTab === 'h2h' ? 'active' : ''}`} onClick={() => scrollToSection('h2h')}>{replaceTranslation('H2H', currentLang)}</button>
                </div>

                {/* Content */}
                <div className="match-content">
                    {/* Timeline section moved to popup modal */}


                    {/* Match Info Section */}
                    <div className="match-info-extra">
                        <div className="info-card">
                            <div className="info-item">
                                <span className="label">{replaceTranslation('Stadium', currentLang)}:</span>
                                <span className="value">{matchData.match_stadium || 'N/A'}</span>
                            </div>
                            <div className="info-item">
                                <span className="label">{replaceTranslation('Referee', currentLang)}:</span>
                                <span className="value">{matchData.match_referee || 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                    <div id="stats" className="stats-section">
                        <div className="section-header">
                            <img src={matchData.team_home_badge} alt="Home" width="24" />
                            <h3>{replaceTranslation('Team Statistics', currentLang)}</h3>
                            <img src={matchData.team_away_badge} alt="Away" width="24" />
                        </div>

                        {/* Use statistics state if available, otherwise matchData.statistics */}
                        {(statistics?.statistics || matchData.statistics) && (statistics?.statistics || matchData.statistics).length > 0 ? (
                            <div className="stats-comparison">
                                {(() => {
                                    const statsToRender = statistics?.statistics || matchData.statistics;
                                    // Filter out stats with no data (both 0 or empty) and remove duplicates
                                    const seenStats = new Set();
                                    const filteredStats = statsToRender.filter(stat => {
                                        const homeVal = parseInt(stat.home) || 0;
                                        const awayVal = parseInt(stat.away) || 0;
                                        const hasData = homeVal > 0 || awayVal > 0 || stat.home.includes('%');
                                        const isDuplicate = seenStats.has(stat.type);

                                        if (hasData && !isDuplicate) {
                                            seenStats.add(stat.type);
                                            return true;
                                        }
                                        return false;
                                    });

                                    return filteredStats.length > 0 ? filteredStats.map((stat, index) => {
                                        const homeVal = parseFloat(stat.home) || 0;
                                        const awayVal = parseFloat(stat.away) || 0;
                                        const total = homeVal + awayVal;
                                        const homePercent = total > 0 ? (homeVal / total) * 100 : (stat.home.includes('%') ? parseFloat(stat.home) : 0);
                                        const awayPercent = total > 0 ? (awayVal / total) * 100 : (stat.away.includes('%') ? parseFloat(stat.away) : 0);

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
                                                    <div className="stat-label">{replaceTranslation(stat.type, currentLang)}</div>
                                                    <div className="bar-away-wrapper">
                                                        <div className="bar away-bar" style={{ width: `${awayPercent}%` }}></div>
                                                    </div>
                                                </div>
                                                <div className={`stat-val ${awayIsHigher ? 'highlight' : ''}`}>{stat.away}</div>
                                            </div>
                                        );
                                    }) : <div className="no-data">{replaceTranslation('No statistics available', currentLang)}</div>;
                                })()}
                            </div>
                        ) : (
                            <div className="no-data">{replaceTranslation('No statistics available', currentLang)}</div>
                        )}

                        {/* Player Statistics if available */}
                        {statistics?.player_statistics && statistics.player_statistics.length > 0 && (
                            <div className="player-stats-section mt-8">
                                <div className="section-header">
                                    <h3>{replaceTranslation('Player Statistics', currentLang)}</h3>
                                </div>
                                <div className="player-stats-table-wrapper overflow-x-auto">
                                    <table className="player-stats-table w-full">
                                        <thead>
                                            <tr>
                                                <th className="text-left">{replaceTranslation('Player', currentLang)}</th>
                                                <th>{replaceTranslation('Mins', currentLang)}</th>
                                                <th>{replaceTranslation('Rating', currentLang)}</th>
                                                <th>{replaceTranslation('Shots', currentLang)}</th>
                                                <th>{replaceTranslation('Goals', currentLang)}</th>
                                                <th>{replaceTranslation('Passes', currentLang)}</th>
                                                <th>{replaceTranslation('Acc.', currentLang)}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {statistics.player_statistics.map((player, idx) => (
                                                <tr key={idx}>
                                                    <td className="text-left">
                                                        <span className={`team-indicator ${player.team_name}`}></span>
                                                        {player.player_name}
                                                    </td>
                                                    <td>{player.player_minutes_played}</td>
                                                    <td className="rating-cell">
                                                        <span className={`rating-badge ${parseFloat(player.player_rating) >= 7 ? 'high' : parseFloat(player.player_rating) >= 6 ? 'mid' : 'low'}`}>
                                                            {player.player_rating}
                                                        </span>
                                                    </td>
                                                    <td>{player.player_shots_total}</td>
                                                    <td>{player.player_goals}</td>
                                                    <td>{player.player_passes}</td>
                                                    <td>{(player.player_passes_acc / player.player_passes * 100).toFixed(0)}%</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>

                    <div id="predictions" className="predictions-section match-detail">
                        <div className="section-header">
                            <img src={matchData.team_home_badge} alt="Home" width="24" />
                            <h3> {replaceTranslation('Match Predictions', currentLang)}</h3>
                            <img src={matchData.team_away_badge} alt="Away" width="24" />
                        </div>
                        {predictions ? (
                            <div className="predictions-cards-grid">
                                {/* Full-time result */}
                                <div className="prediction-card">
                                    <h4 className="prediction-card-title">{replaceTranslation('Full-time result', currentLang)}</h4>
                                    <div className="prediction-circles">
                                        <div className="circle-item">
                                            <span className="circle-label">{replaceTranslation('Home', currentLang)}</span>
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
                                                {getAverageOdd1()}
                                            </div>
                                        </div>
                                        <div className="circle-item">
                                            <span className="circle-label">{replaceTranslation('Draw', currentLang)}</span>
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
                                                {getAverageOddX()}
                                            </div>
                                        </div>
                                        <div className="circle-item">
                                            <span className="circle-label">{replaceTranslation('Away', currentLang)}</span>
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
                                                {getAverageOdd2()}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="prediction-footer">
                                        <div className="footer-info">
                                            <span className="footer-label">{replaceTranslation('W1', currentLang)}</span>
                                            <span className="footer-rate">{replaceTranslation('Win rate', currentLang)} {predictions.prob_HW || 0}%</span>
                                        </div>
                                        <span className="footer-odd">{getAverageOdd1()}</span>
                                    </div>
                                </div>

                                {/* Both teams to score */}
                                <div className="prediction-card">
                                    <h4 className="prediction-card-title">{replaceTranslation('Both teams to score', currentLang)}</h4>
                                    <div className="prediction-circles">
                                        <div className="circle-item">
                                            <span className="circle-label">{replaceTranslation('Yes', currentLang)}</span>
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
                                                {getBTTSOdds().yes}
                                            </div>
                                        </div>
                                        <div className="circle-item">
                                            <span className="circle-label">{replaceTranslation('No', currentLang)}</span>
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
                                                {getBTTSOdds().no}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="prediction-footer">
                                        <div className="footer-info">
                                            <span className="footer-label">{replaceTranslation('BTTS', currentLang)}: {(predictions.prob_bts || predictions.prob_BTTS || 0) >= (predictions.prob_ots || 0) ? replaceTranslation('Yes', currentLang) : replaceTranslation('No', currentLang)}</span>
                                            <span className="footer-rate">{replaceTranslation('Win rate', currentLang)} {Math.max(predictions.prob_bts || predictions.prob_BTTS || 0, predictions.prob_ots || 0)}%</span>
                                        </div>
                                        <span className="footer-odd">{(predictions.prob_bts || predictions.prob_BTTS || 0) >= (predictions.prob_ots || 0) ? getBTTSOdds().yes : getBTTSOdds().no}</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="no-data">{replaceTranslation('No predictions available for this match', currentLang)}</div>
                        )}
                    </div>

                    <div id="odds" className="odds-section">
                        <div className=" odds-header">
                            <img src={matchData.team_home_badge} alt="Home" width="24" />
                            <h3>{replaceTranslation('Betting Odds', currentLang)}</h3>
                            <img src={matchData.team_away_badge} alt="Away" width="24" />
                        </div>
                        {odds && odds.length > 0 ? (
                            <div className="odds-table-container">
                                <table className="odds-table">
                                    <thead>
                                        <tr>
                                            <th>{replaceTranslation('BM', currentLang)}</th>
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
                                            <td>{replaceTranslation('Average', currentLang)}</td>

                                            <td>{(odds.reduce((sum, b) => sum + (parseFloat(b.odd_1) || 0), 0) / odds.length).toFixed(2)}</td>
                                            <td>{(odds.reduce((sum, b) => sum + (parseFloat(b.odd_x || b.odd_X) || 0), 0) / odds.length).toFixed(2)}</td>
                                            <td>{(odds.reduce((sum, b) => sum + (parseFloat(b.odd_2) || 0), 0) / odds.length).toFixed(2)}</td>
                                        </tr>
                                        <tr className="highest-row">
                                            <td>{replaceTranslation('Highest', currentLang)}</td>

                                            <td>{Math.max(...odds.map(b => parseFloat(b.odd_1) || 0)).toFixed(2)}</td>
                                            <td>{Math.max(...odds.map(b => parseFloat(b.odd_x || b.odd_X) || 0)).toFixed(2)}</td>
                                            <td>{Math.max(...odds.map(b => parseFloat(b.odd_2) || 0)).toFixed(2)}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        ) : (
                            <div className="no-data">{replaceTranslation('No odds available for this match', currentLang)}</div>
                        )}
                    </div>

                    <div id="lineups" className="lineups-section">
                        {((matchData.lineup?.home?.starting_lineups && matchData.lineup.home.starting_lineups.length > 0) ||
                            (matchData.lineup?.away?.starting_lineups && matchData.lineup.away.starting_lineups.length > 0)) ? (
                            <>

                                {/* Formation Headers */}
                                <div className="formation-headers">
                                    <div className="team-formation">
                                        <img src={matchData.team_home_badge} alt="Home" className="formation-badge" />
                                        <span>{matchData.match_hometeam_name}</span>
                                        <span className="formation-text">
                                            {(() => {
                                                const homeLineup = matchData.lineup?.home?.starting_lineups || [];
                                                return getFormationString(homeLineup);
                                            })()}
                                        </span>
                                    </div>
                                    <div className="team-formation">
                                        <img src={matchData.team_away_badge} alt="Away" className="formation-badge" />
                                        <span>{matchData.match_awayteam_name}</span>
                                        <span className="formation-text">
                                            {(() => {
                                                const awayLineup = matchData.lineup?.away?.starting_lineups || [];
                                                return getFormationString(awayLineup);
                                            })()}
                                        </span>
                                    </div>
                                </div>

                                {/* Football Field */}
                                <div className="football-field">
                                    {/* Home Team (Left Side) */}
                                    <div className="field-half home-half">
                                        {renderLineup(matchData.lineup?.home?.starting_lineups || [], 'home')}
                                    </div>

                                    {/* Away Team (Right Side) */}
                                    <div className="field-half away-half">
                                        {renderLineup(matchData.lineup?.away?.starting_lineups || [], 'away')}
                                    </div>

                                    {/* Center Line */}
                                    <div className="center-line"></div>
                                    <div className="center-circle"></div>
                                </div>


                            </>
                        ) : (
                            <div className="no-data">{replaceTranslation('Lineup information not available', currentLang)}</div>
                        )}
                    </div>

                    <div id="h2h" className="h2h-section">
                        <h3 className="text-center text-xl font-bold mb-6">
                            {matchData.match_hometeam_name} VS {matchData.match_awayteam_name} <span className="text-blue-600">{replaceTranslation('HEAD TO HEAD HISTORY', currentLang)}</span>
                        </h3>

                        {h2h && h2h.length > 0 ? (
                            <>
                                {/* Summary Statistics */}
                                <div className="mb-6">
                                    <p className="text-sm text-gray-600 mb-4">{replaceTranslation('Recent H2H Games', currentLang)} - {h2h.length}</p>

                                    {/* Win/Draw/Win Stats */}
                                    <div className="flex items-center justify-between gap-2 md:gap-8 mb-4">
                                        <div className="flex flex-col md:flex-row items-center gap-1 md:gap-3">
                                            <img src={matchData.team_home_badge} alt="Home" className="w-8 h-8 md:w-12 md:h-12 object-contain" />
                                            <span className="font-semibold text-[10px] md:text-sm text-center">{matchData.match_hometeam_name}</span>
                                        </div>

                                        <div className="flex gap-2 md:gap-8 text-center">
                                            {(() => {
                                                const homeWins = h2h.filter(m =>
                                                    (m.match_hometeam_name === matchData.match_hometeam_name && parseInt(m.match_hometeam_score) > parseInt(m.match_awayteam_score)) ||
                                                    (m.match_awayteam_name === matchData.match_hometeam_name && parseInt(m.match_awayteam_score) > parseInt(m.match_hometeam_score))
                                                ).length;
                                                const draws = h2h.filter(m => parseInt(m.match_hometeam_score) === parseInt(m.match_awayteam_score)).length;
                                                const awayWins = h2h.filter(m =>
                                                    (m.match_hometeam_name === matchData.match_awayteam_name && parseInt(m.match_hometeam_score) > parseInt(m.match_awayteam_score)) ||
                                                    (m.match_awayteam_name === matchData.match_awayteam_name && parseInt(m.match_awayteam_score) > parseInt(m.match_hometeam_score))
                                                ).length;
                                                const total = h2h.length;
                                                const homeWinPct = Math.round((homeWins / total) * 100);
                                                const drawPct = Math.round((draws / total) * 100);
                                                const awayWinPct = Math.round((awayWins / total) * 100);

                                                return (
                                                    <>
                                                        <div>
                                                            <div className="text-lg md:text-3xl font-bold">{homeWins}</div>
                                                            <div className="text-[9px] md:text-xs text-gray-500">{replaceTranslation('win', currentLang)}</div>
                                                            <div className="text-[10px] md:text-sm font-semibold mt-1">{homeWinPct}%</div>
                                                        </div>
                                                        <div>
                                                            <div className="text-lg md:text-3xl font-bold">{draws}</div>
                                                            <div className="text-[9px] md:text-xs text-gray-500">{replaceTranslation('draw', currentLang)}</div>
                                                            <div className="text-[10px] md:text-sm font-semibold mt-1">{drawPct}%</div>
                                                        </div>
                                                        <div>
                                                            <div className="text-lg md:text-3xl font-bold">{awayWins}</div>
                                                            <div className="text-[9px] md:text-xs text-gray-500">{replaceTranslation('wins', currentLang)}</div>
                                                            <div className="text-[10px] md:text-sm font-semibold mt-1 bg-yellow-400 px-2 py-1 rounded">{awayWinPct}%</div>
                                                        </div>
                                                    </>
                                                );
                                            })()}
                                        </div>

                                        <div className="flex flex-col md:flex-row items-center gap-1 md:gap-3">
                                            <span className="font-semibold text-[10px] md:text-sm text-center order-2 md:order-1">{matchData.match_awayteam_name}</span>
                                            <img src={matchData.team_away_badge} alt="Away" className="w-8 h-8 md:w-12 md:h-12 object-contain order-1 md:order-2" />
                                        </div>
                                    </div>

                                    {/* Win Percentage Bar */}
                                    <div className="flex h-2 rounded-full overflow-hidden mb-4">
                                        {(() => {
                                            const homeWins = h2h.filter(m =>
                                                (m.match_hometeam_name === matchData.match_hometeam_name && parseInt(m.match_hometeam_score) > parseInt(m.match_awayteam_score)) ||
                                                (m.match_awayteam_name === matchData.match_hometeam_name && parseInt(m.match_awayteam_score) > parseInt(m.match_hometeam_score))
                                            ).length;
                                            const draws = h2h.filter(m => parseInt(m.match_hometeam_score) === parseInt(m.match_awayteam_score)).length;
                                            const awayWins = h2h.length - homeWins - draws;
                                            const total = h2h.length;

                                            return (
                                                <>
                                                    <div className="bg-blue-500" style={{ width: `${(homeWins / total) * 100}%` }}></div>
                                                    <div className="bg-gray-400" style={{ width: `${(draws / total) * 100}%` }}></div>
                                                    <div className="bg-blue-600" style={{ width: `${(awayWins / total) * 100}%` }}></div>
                                                </>
                                            );
                                        })()}
                                    </div>

                                    {/* Summary Text */}
                                    <p className="text-sm text-gray-600 text-center">
                                        {(() => {
                                            const homeWins = h2h.filter(m =>
                                                (m.match_hometeam_name === matchData.match_hometeam_name && parseInt(m.match_hometeam_score) > parseInt(m.match_awayteam_score)) ||
                                                (m.match_awayteam_name === matchData.match_hometeam_name && parseInt(m.match_awayteam_score) > parseInt(m.match_hometeam_score))
                                            ).length;
                                            const draws = h2h.filter(m => parseInt(m.match_hometeam_score) === parseInt(m.match_awayteam_score)).length;
                                            const awayWins = h2h.length - homeWins - draws;

                                            return `${replaceTranslation('In the last', currentLang)} ${h2h.length} ${replaceTranslation('encounter(s)', currentLang)}, ${matchData.match_hometeam_name} ${replaceTranslation('won', currentLang)} ${homeWins} ${replaceTranslation('time(s)', currentLang)}, ${matchData.match_awayteam_name} ${replaceTranslation('have', currentLang)} ${awayWins} ${replaceTranslation('win(s)', currentLang)}, ${replaceTranslation('and', currentLang)} ${draws} ${replaceTranslation('ended in a draw', currentLang)}.`;
                                        })()}
                                    </p>
                                </div>

                                {/* Goals Statistics */}
                                <div className="grid grid-cols-3 gap-2 md:gap-4 mb-6">
                                    {(() => {
                                        const over15 = h2h.filter(m => (parseInt(m.match_hometeam_score) + parseInt(m.match_awayteam_score)) > 1.5).length;
                                        const over25 = h2h.filter(m => (parseInt(m.match_hometeam_score) + parseInt(m.match_awayteam_score)) > 2.5).length;
                                        const over35 = h2h.filter(m => (parseInt(m.match_hometeam_score) + parseInt(m.match_awayteam_score)) > 3.5).length;
                                        const total = h2h.length;

                                        return (
                                            <>
                                                <div>
                                                    <div className="text-[10px] md:text-xs text-gray-600 mb-1">{replaceTranslation('Over 1.5', currentLang)}</div>
                                                    <div className="text-lg md:text-2xl font-bold mb-2">{Math.round((over15 / total) * 100)}%</div>
                                                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                                        <div className="h-full bg-blue-500" style={{ width: `${(over15 / total) * 100}%` }}></div>
                                                    </div>
                                                    <div className="text-[10px] md:text-xs text-gray-500 mt-1">{over15}/{total}</div>
                                                </div>
                                                <div>
                                                    <div className="text-[10px] md:text-xs text-gray-600 mb-1">{replaceTranslation('Over 2.5', currentLang)}</div>
                                                    <div className="text-lg md:text-2xl font-bold mb-2">{Math.round((over25 / total) * 100)}%</div>
                                                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                                        <div className="h-full bg-blue-500" style={{ width: `${(over25 / total) * 100}%` }}></div>
                                                    </div>
                                                    <div className="text-[10px] md:text-xs text-gray-500 mt-1">{over25}/{total}</div>
                                                </div>
                                                <div>
                                                    <div className="text-[10px] md:text-xs text-gray-600 mb-1">{replaceTranslation('Over 3.5', currentLang)}</div>
                                                    <div className="text-lg md:text-2xl font-bold mb-2">{Math.round((over35 / total) * 100)}%</div>
                                                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                                        <div className="h-full bg-blue-500" style={{ width: `${(over35 / total) * 100}%` }}></div>
                                                    </div>
                                                    <div className="text-[10px] md:text-xs text-gray-500 mt-1">{over35}/{total}</div>
                                                </div>
                                            </>
                                        );
                                    })()}
                                </div>

                                {/* BTTS & Clean Sheets */}
                                <div className="grid grid-cols-3 gap-2 md:gap-4 mb-8">
                                    {(() => {
                                        const btts = h2h.filter(m => parseInt(m.match_hometeam_score) > 0 && parseInt(m.match_awayteam_score) > 0).length;
                                        const homeClean = h2h.filter(m =>
                                            (m.match_hometeam_name === matchData.match_hometeam_name && parseInt(m.match_awayteam_score) === 0) ||
                                            (m.match_awayteam_name === matchData.match_hometeam_name && parseInt(m.match_hometeam_score) === 0)
                                        ).length;
                                        const awayClean = h2h.filter(m =>
                                            (m.match_hometeam_name === matchData.match_awayteam_name && parseInt(m.match_awayteam_score) === 0) ||
                                            (m.match_awayteam_name === matchData.match_awayteam_name && parseInt(m.match_hometeam_score) === 0)
                                        ).length;
                                        const total = h2h.length;

                                        return (
                                            <>
                                                <div>
                                                    <div className="text-[10px] md:text-xs text-gray-600 mb-1">{replaceTranslation('BTTS', currentLang)}</div>
                                                    <div className="text-lg md:text-2xl font-bold mb-2">{Math.round((btts / total) * 100)}%</div>
                                                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                                        <div className="h-full bg-blue-500" style={{ width: `${(btts / total) * 100}%` }}></div>
                                                    </div>
                                                    <div className="text-[10px] md:text-xs text-gray-500 mt-1">{btts}/{total}</div>
                                                </div>
                                                <div>
                                                    <div className="text-[10px] md:text-xs text-gray-600 mb-1">{replaceTranslation('Clean Sheets', currentLang)}</div>
                                                    <div className="text-lg md:text-2xl font-bold mb-2">{Math.round((homeClean / total) * 100)}%</div>
                                                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                                        <div className="h-full bg-blue-500" style={{ width: `${(homeClean / total) * 100}%` }}></div>
                                                    </div>
                                                    <div className="text-[10px] md:text-xs text-gray-500 mt-1">{matchData.match_hometeam_name}</div>
                                                </div>
                                                <div>
                                                    <div className="text-[10px] md:text-xs text-gray-600 mb-1">{replaceTranslation('Clean Sheets', currentLang)}</div>
                                                    <div className="text-lg md:text-2xl font-bold mb-2">{Math.round((awayClean / total) * 100)}%</div>
                                                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                                        <div className="h-full bg-blue-500" style={{ width: `${(awayClean / total) * 100}%` }}></div>
                                                    </div>
                                                    <div className="text-[10px] md:text-xs text-gray-500 mt-1">{matchData.match_awayteam_name}</div>
                                                </div>
                                            </>
                                        );
                                    })()}
                                </div>

                                {/* Recent Matches List */}
                                <div className="space-y-3">
                                    {h2h.map((match, index) => (
                                        <div key={index} className="bg-gray-50 rounded-lg p-2 md:p-4 flex items-center justify-between hover:bg-gray-100 transition gap-2">
                                            <div className="w-14 md:w-auto text-[10px] md:text-sm text-gray-600 flex-shrink-0">
                                                <div className="font-semibold">
                                                    {(() => {
                                                        const [hours, minutes] = match.match_time.split(':');
                                                        const gmtTime = `${String(parseInt(hours) - 1).padStart(2, '0')}:${minutes}`;
                                                        const converted = convertToLocalTime(match.match_date, gmtTime, currentTimezone);
                                                        return converted.date;
                                                    })()}
                                                </div>
                                                <div className="text-[9px] md:text-xs">
                                                    {(() => {
                                                        const [hours, minutes] = match.match_time.split(':');
                                                        const gmtTime = `${String(parseInt(hours) - 1).padStart(2, '0')}:${minutes}`;
                                                        const converted = convertToLocalTime(match.match_date, gmtTime, currentTimezone);
                                                        return converted.time;
                                                    })()}
                                                </div>
                                            </div>

                                            <div className="flex-1 mx-2 md:mx-6 min-w-0">
                                                <div className="text-[9px] md:text-xs text-blue-600 font-semibold mb-1 md:mb-2 line-clamp-1">{match.league_name}</div>
                                                <div className="flex items-center justify-between gap-2 md:gap-4">
                                                    <div className="flex items-center gap-1 md:gap-2 flex-1 min-w-0">
                                                        <img src={match.team_home_badge} alt={match.match_hometeam_name} className="w-4 h-4 md:w-6 md:h-6 object-contain flex-shrink-0" />
                                                        <span className="text-[10px] md:text-sm font-medium truncate">{match.match_hometeam_name}</span>
                                                    </div>
                                                    <div className="flex gap-1 md:gap-2 text-base md:text-2xl font-bold flex-shrink-0">
                                                        <span>{match.match_hometeam_score}</span>
                                                        <span className="text-gray-400">-</span>
                                                        <span>{match.match_awayteam_score}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1 md:gap-2 flex-1 justify-end min-w-0">
                                                        <span className="text-[10px] md:text-sm font-medium truncate text-right">{match.match_awayteam_name}</span>
                                                        <img src={match.team_away_badge} alt={match.match_awayteam_name} className="w-4 h-4 md:w-6 md:h-6 object-contain flex-shrink-0" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <div className="no-data">{replaceTranslation('No head-to-head data available', currentLang)}</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Timeline Modal Popup */}
            {timelineOpen && (
                <div className="timeline-modal-overlay" onClick={() => setTimelineOpen(false)}>
                    <div className="timeline-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="timeline-modal-header">
                            <h2>{replaceTranslation('Match Timeline', currentLang)}</h2>
                            <button className="timeline-close-btn" onClick={() => setTimelineOpen(false)}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M18 6L6 18M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="timeline-modal-content">
                            {(() => {
                                const events = [];

                                // Process Highlights/Goals
                                if (matchData.goalscorer) {
                                    matchData.goalscorer.forEach(goal => {
                                        events.push({
                                            time: parseInt(goal.time) || 0,
                                            type: 'goal',
                                            team: goal.home_scorer ? 'home' : 'away',
                                            player: goal.home_scorer || goal.away_scorer,
                                            assist: goal.home_assist || goal.away_assist,
                                            score: goal.score,
                                            info: goal.info,
                                            scoreInfoTime: goal.score_info_time
                                        });
                                    });
                                }

                                // Process Cards
                                if (matchData.cards) {
                                    matchData.cards.forEach(card => {
                                        events.push({
                                            time: parseInt(card.time) || 0,
                                            type: 'card',
                                            team: card.home_fault ? 'home' : 'away',
                                            player: card.home_fault || card.away_fault,
                                            cardType: card.card,
                                            info: card.info,
                                            scoreInfoTime: card.score_info_time
                                        });
                                    });
                                }

                                // Process Substitutions
                                if (matchData.substitutions) {
                                    if (matchData.substitutions.home) {
                                        matchData.substitutions.home.forEach(sub => {
                                            const players = sub.substitution.split('|');
                                            events.push({
                                                time: parseInt(sub.time) || 0,
                                                type: 'substitution',
                                                team: 'home',
                                                playerOut: players[0]?.trim(),
                                                playerIn: players[1]?.trim()
                                            });
                                        });
                                    }
                                    if (matchData.substitutions.away) {
                                        matchData.substitutions.away.forEach(sub => {
                                            const players = sub.substitution.split('|');
                                            events.push({
                                                time: parseInt(sub.time) || 0,
                                                type: 'substitution',
                                                team: 'away',
                                                playerOut: players[0]?.trim(),
                                                playerIn: players[1]?.trim()
                                            });
                                        });
                                    }
                                }

                                // Sort by time
                                events.sort((a, b) => a.time - b.time);

                                if (events.length === 0) return <div className="no-data">{replaceTranslation('No timeline events recorded', currentLang)}</div>;

                                return (
                                    <div className="timeline-container-new">
                                        <div className="timeline-line"></div>
                                        {events.map((event, index) => (
                                            <div key={index} className={`timeline-event-new ${event.team}`}>
                                                <div className="event-time-badge">{event.time}'</div>
                                                <div className="event-content-wrapper">
                                                    <div className="event-icon-new">
                                                        {event.type === 'goal' && (
                                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                                                <circle cx="12" cy="12" r="10" fill="white" stroke="currentColor" strokeWidth="1.5" />
                                                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
                                                                <path d="M12 6L9.5 9.5L6 10l4 4.5L9 19l3-2 3 2-1-4.5L18 10l-3.5-.5z" />
                                                            </svg>
                                                        )}
                                                        {event.type === 'card' && (
                                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                                                <rect x="6" y="4" width="12" height="16" rx="1" fill={event.cardType.includes('yellow') ? '#FDD835' : '#E53935'} />
                                                            </svg>
                                                        )}
                                                        {event.type === 'substitution' && (
                                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <path d="M7 16V4M7 4L3 8M7 4l4 4" />
                                                                <path d="M17 8v12m0 0l4-4m-4 4l-4-4" />
                                                            </svg>
                                                        )}
                                                    </div>
                                                    <div className="event-details-new">
                                                        {event.type === 'goal' && (
                                                            <div className="goal-event">
                                                                <div className="event-header">
                                                                    <img src={event.team === 'home' ? matchData.team_home_badge : matchData.team_away_badge} alt="" className="event-team-logo" />
                                                                    <span className="event-type-label">{replaceTranslation('Goal', currentLang)}</span>
                                                                    <span className="event-score">{event.score}</span>
                                                                </div>
                                                                <div className="event-player-info">
                                                                    <span className="player-name-new">{event.player}</span>
                                                                    {event.assist && <span className="assist-info">{replaceTranslation('Assisted by', currentLang)} {event.assist}</span>}
                                                                </div>
                                                            </div>
                                                        )}
                                                        {event.type === 'card' && (
                                                            <div className="card-event">
                                                                <div className="event-header">
                                                                    <img src={event.team === 'home' ? matchData.team_home_badge : matchData.team_away_badge} alt="" className="event-team-logo" />
                                                                    <span className="event-type-label">{event.cardType}</span>
                                                                </div>
                                                                <div className="event-player-info">
                                                                    <span className="player-name-new">{event.player}</span>
                                                                </div>
                                                            </div>
                                                        )}
                                                        {event.type === 'substitution' && (
                                                            <div className="sub-event">
                                                                <div className="event-header">
                                                                    <img src={event.team === 'home' ? matchData.team_home_badge : matchData.team_away_badge} alt="" className="event-team-logo" />
                                                                    <span className="event-type-label">{replaceTranslation('Substitution', currentLang)}</span>
                                                                </div>
                                                                <div className="sub-details">
                                                                    <div className="sub-player out">
                                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#e53935" strokeWidth="2">
                                                                            <path d="M7 7l10 10M7 17L17 7" />
                                                                        </svg>
                                                                        <span>{event.playerOut}</span>
                                                                    </div>
                                                                    <div className="sub-player in">
                                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00bfa5" strokeWidth="2">
                                                                            <path d="M7 13l5 5m0 0l5-5m-5 5V6" />
                                                                        </svg>
                                                                        <span>{event.playerIn}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                </div>
            )}

            {/* Floating Commentary Chat Box */}
            <div className={`commentary-chatbox ${commentaryOpen ? 'open' : ''}`}>
                <div className="chatbox-header" onClick={() => setCommentaryOpen(!commentaryOpen)}>
                    <div className="chatbox-title">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                        <span>{replaceTranslation('Live Commentary', currentLang)}</span>
                        {commentary && commentary.length > 0 && (
                            <span className="comment-count">{commentary.length}</span>
                        )}
                    </div>
                    <button className="chatbox-toggle">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            {commentaryOpen ? (
                                <path d="M19 9l-7 7-7-7" />
                            ) : (
                                <path d="M5 15l7-7 7 7" />
                            )}
                        </svg>
                    </button>
                </div>
                {commentaryOpen && (
                    <div className="chatbox-content">
                        {commentary && commentary.length > 0 ? (
                            <div className="commentary-messages">
                                {commentary.map((comment, index) => (
                                    <div key={index} className="commentary-message">
                                        <div className="message-time">{comment.time}</div>
                                        <div className="message-text">{comment.text}</div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="no-commentary">{replaceTranslation('No live commentary available', currentLang)}</div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default MatchDetail;

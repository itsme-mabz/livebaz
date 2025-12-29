import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './LiveScore.css';
import { convertToLocalTime } from '../utils/timezone';
import { replaceTranslation } from '../utils/translationReplacer.jsx';

function PopularMatches() {
    const navigate = useNavigate();
    const [allMatches, setAllMatches] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [counts, setCounts] = useState({ all: 0, live: 0, upcoming: 0, finished: 0 });
    const [visibleCount, setVisibleCount] = useState(40);
    const [currentLang, setCurrentLang] = useState('en');
    const [isArabic, setIsArabic] = useState(false);

    // Detect Language
    useEffect(() => {
        const checkLanguage = () => {
            const select = document.querySelector('.goog-te-combo');
            if (select) {
                setIsArabic(select.value === 'ar' || select.value === 'fa');
                setCurrentLang(select.value || 'en');
            }
        };

        checkLanguage();
        const interval = setInterval(checkLanguage, 500);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        setVisibleCount(40);
    }, [selectedStatus]);

    const transformMatch = (match) => {
        // API returns BST (UTC+1), convert to local timezone
        const [hours, minutes] = match.match_time.split(':');
        const utcDate = new Date(`${match.match_date}T${String(parseInt(hours) - 1).padStart(2, '0')}:${minutes}:00Z`);
        const localTime = utcDate.toLocaleTimeString('en-GB', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
        const localDate = utcDate.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });

        return {
            id: match.match_id,
            time: localTime,
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
            localDate: localDate,
            probHome: match.prob_HW || null,
            probDraw: match.prob_D || null,
            probAway: match.prob_AW || null,
            probOver: match.prob_O || null,
            probUnder: match.prob_U || null,
            probBTTS: match.prob_BTTS || null
        };
    };

    const formatPercentage = (value) => {
        if (!value || value === '0' || value === 0) return '-';
        let num = parseFloat(value);
        if (num > 0 && num < 1) num = num * 100;
        return num % 1 === 0 ? `${Math.round(num)}%` : `${num.toFixed(1)}%`;
    };

    const calculateOdds = (value) => {
        if (!value || value === '0' || value === 0) return '-';
        let num = parseFloat(value);
        if (isNaN(num) || num <= 0) return '-';
        if (num > 0 && num < 1) num = num * 100;
        if (num < 0.01) return '-';
        const odds = 100 / num;
        if (!isFinite(odds)) return '-';
        return odds.toFixed(2);
    };

    const fetchMatches = useCallback(async () => {
        setLoading(true);
        try {
            const popularResponse = await axios.get('/api/v1/public/popular-items?type=match');

            if (popularResponse.data && popularResponse.data.success) {
                const popularMatches = popularResponse.data.data;
                const matchIds = popularMatches.map(item => item.item_id);

                if (matchIds.length > 0) {
                    const today = new Date().toISOString().split('T')[0];
                    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
                    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

                    const [matchesResponse, todayPreds, yesterdayPreds, tomorrowPreds] = await Promise.all([
                        axios.get(`/api/v1/public/matches-by-ids?match_ids=${matchIds.join(',')}`),
                        axios.get(`/api/v1/predictions?from=${today}&to=${today}`).catch(() => ({ data: { success: false, data: [] } })),
                        axios.get(`/api/v1/predictions?from=${yesterday}&to=${yesterday}`).catch(() => ({ data: { success: false, data: [] } })),
                        axios.get(`/api/v1/predictions?from=${tomorrow}&to=${tomorrow}`).catch(() => ({ data: { success: false, data: [] } }))
                    ]);

                    if (matchesResponse.data && matchesResponse.data.success) {
                        const allPredictions = [
                            ...(todayPreds.data?.data || []),
                            ...(yesterdayPreds.data?.data || []),
                            ...(tomorrowPreds.data?.data || [])
                        ];

                        const predictionsMap = {};
                        allPredictions.forEach(pred => {
                            predictionsMap[pred.id] = pred.predictions;
                        });

                        const transformed = matchesResponse.data.data.map(match => {
                            const prediction = predictionsMap[match.match_id];
                            return transformMatch({
                                ...match,
                                prob_HW: prediction?.['1x2']?.w1?.prob,
                                prob_D: prediction?.['1x2']?.draw?.prob,
                                prob_AW: prediction?.['1x2']?.w2?.prob,
                                prob_O: prediction?.goals?.over?.prob,
                                prob_U: prediction?.goals?.under?.prob,
                                prob_BTTS: prediction?.btts?.yes?.prob
                            });
                        });

                        setAllMatches(transformed);

                        const countsObj = {
                            all: transformed.length,
                            live: transformed.filter(m => getMatchStatus(m) === 'live').length,
                            upcoming: transformed.filter(m => getMatchStatus(m) === 'upcoming').length,
                            finished: transformed.filter(m => getMatchStatus(m) === 'finished').length
                        };
                        setCounts(countsObj);
                    }
                }
            }
        } catch (error) {
            console.error('Error fetching matches:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    const getMatchStatus = (match) => {
        if (match.isLive) return 'live';
        if (match.homeScore !== '-' && match.awayScore !== '-' && !match.isLive) {
            return 'finished';
        }
        if (match.status && (
            match.status === '' ||
            match.status === 'Match Finished' ||
            match.status === 'After ET' ||
            match.status === 'After Pen.' ||
            match.status.toLowerCase().includes('finished') ||
            match.status.toLowerCase().includes('ft')
        )) {
            return 'finished';
        }
        return 'upcoming';
    };

    const filteredMatches = allMatches.filter(match => {
        if (selectedStatus === 'all') return true;
        const matchStatus = getMatchStatus(match);
        return selectedStatus === matchStatus;
    });

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

    Object.values(groupedMatches).forEach(group => {
        group.matches.sort((a, b) => a.time.localeCompare(b.time));
    });

    useEffect(() => {
        fetchMatches();
    }, [fetchMatches]);

    return (
        <div className="livescore-page wrap" style={{ paddingTop: '8px' }}>


            <div style={{ direction: isArabic ? 'rtl' : 'ltr', maxWidth: '1200px', margin: '0 auto' }}>
                <main className="livescore-main" style={{ width: '100%' }}>
                    <div className="livescore-header">
                        <h1 className="livescore-title" style={{ display: 'flex', alignItems: 'center' }}>
                            {replaceTranslation('Popular Matches', currentLang)}
                        </h1>
                        <div className="livescore-date-pills">
                            <button
                                className={`livescore-date-pill ${selectedStatus === 'all' ? 'active' : ''}`}
                                onClick={() => setSelectedStatus('all')}
                            >
                                {replaceTranslation('All', currentLang)} {counts.all}
                            </button>
                            <button
                                className={`livescore-date-pill ${selectedStatus === 'live' ? 'active' : ''}`}
                                onClick={() => setSelectedStatus('live')}
                            >
                                <span className="live-dot" style={{
                                    width: '6px',
                                    height: '6px',
                                    borderRadius: '50%',
                                    backgroundColor: selectedStatus === 'live' ? '#fff' : '#00c853',
                                    display: 'inline-block',
                                    marginRight: '6px'
                                }}></span>
                                {replaceTranslation('Live', currentLang)} {counts.live}
                            </button>
                            <button
                                className={`livescore-date-pill ${selectedStatus === 'upcoming' ? 'active' : ''}`}
                                onClick={() => setSelectedStatus('upcoming')}
                            >
                                {replaceTranslation('Upcoming', currentLang)} {counts.upcoming}
                            </button>
                            <button
                                className={`livescore-date-pill ${selectedStatus === 'finished' ? 'active' : ''}`}
                                onClick={() => setSelectedStatus('finished')}
                            >
                                {replaceTranslation('Finished', currentLang)} {counts.finished}
                            </button>
                        </div>
                    </div>

                    <div className="livescore-content">
                        {loading ? (
                            <div className="loading-state">{replaceTranslation('Loading matches...', currentLang)}</div>
                        ) : filteredMatches.length === 0 ? (
                            <div className="empty-state">No {selectedStatus} matches found</div>
                        ) : (
                            <>
                                {(() => {
                                    let matchCounter = 0;
                                    return Object.values(groupedMatches)
                                        .sort((a, b) => {
                                            const countryA = a.country || '';
                                            const countryB = b.country || '';
                                            const countryCompare = countryA.localeCompare(countryB);
                                            if (countryCompare !== 0) return countryCompare;
                                            const leagueA = a.league || '';
                                            const leagueB = b.league || '';
                                            return leagueA.localeCompare(leagueB);
                                        })
                                        .map((group, idx) => {
                                            if (matchCounter >= visibleCount) return null;
                                            const remainingCapacity = visibleCount - matchCounter;
                                            const matchesToShow = group.matches.slice(0, remainingCapacity);

                                            if (matchesToShow.length === 0) return null;
                                            matchCounter += matchesToShow.length;

                                            return (
                                                <div key={`league-${idx}-${group.leagueId}`} className="league-card">
                                                    <div className="league-card-header">
                                                        <div className="league-card-title-wrapper">
                                                            {group.leagueLogo && (
                                                                <img src={group.leagueLogo} alt="" className="league-card-logo" />
                                                            )}
                                                            <h3 className="league-card-title">
                                                                {group.country.toUpperCase()}: {group.league.toUpperCase()}
                                                            </h3>
                                                        </div>
                                                    </div>

                                                    <div className="matches-list">
                                                        <div className="matches-header-stats">
                                                            <div className="col-time-stat">Time</div>
                                                            <div className="col-match-stat">Match</div>
                                                            <div className="col-score-stat">Score</div>
                                                            <div className="col-1-stat">1</div>
                                                            <div className="col-x-stat">X</div>
                                                            <div className="col-2-stat">2</div>
                                                        </div>

                                                        {matchesToShow.map((match) => (
                                                            <div
                                                                key={match.id}
                                                                className={`match-row-stats`}
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
                                                                <div className="col-score-stat">
                                                                    <div className="score-display">
                                                                        <span className={`score-number score-home ${match.isLive ? 'live' : ''}`}>
                                                                            {match.homeScore}
                                                                        </span>
                                                                        <div className="score-divider"></div>
                                                                        <span className={`score-number score-away ${match.isLive ? 'live' : ''}`}>
                                                                            {match.awayScore}
                                                                        </span>
                                                                    </div>
                                                                </div>

                                                                <div className="col-1-stat">
                                                                    <div className="prob-item-new">
                                                                        <span className="prob-value">
                                                                            {match.probHome ? (
                                                                                <>
                                                                                    <span className="prob-odds">{calculateOdds(match.probHome)}</span>
                                                                                    <span className="prob-percent">{formatPercentage(match.probHome)}</span>
                                                                                </>
                                                                            ) : '-'}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                <div className="col-x-stat">
                                                                    <div className="prob-item-new">
                                                                        <span className="prob-value">
                                                                            {match.probDraw ? (
                                                                                <>
                                                                                    <span className="prob-odds">{calculateOdds(match.probDraw)}</span>
                                                                                    <span className="prob-percent">{formatPercentage(match.probDraw)}</span>
                                                                                </>
                                                                            ) : '-'}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                <div className="col-2-stat">
                                                                    <div className="prob-item-new">
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
                                                                    <div className="prob-item">
                                                                        <span className="prob-label">O/U</span>
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
                                                                        <span className="prob-label">BTTS</span>
                                                                        <span className="prob-value">
                                                                            {match.probBTTS ? (
                                                                                <>
                                                                                    <span className="prob-odds">{calculateOdds(match.probBTTS)}</span>
                                                                                    <span className="prob-percent">{formatPercentage(match.probBTTS)}</span>
                                                                                </>
                                                                            ) : '-'}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        });
                                })()}

                                {filteredMatches.length > visibleCount && (
                                    <div className="load-more-container" style={{ textAlign: 'center', margin: '40px 0 20px' }}>
                                        <button
                                            className="load-more-btn"
                                            onClick={() => setVisibleCount(prev => prev + 40)}
                                            style={{
                                                backgroundColor: '#000',
                                                color: '#fff',
                                                padding: '12px 40px',
                                                borderRadius: '8px',
                                                border: 'none',
                                                fontSize: '15px',
                                                fontWeight: '600',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s ease',
                                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                            }}
                                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#222'}
                                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#000'}
                                        >
                                            {replaceTranslation('Load More', currentLang)}
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}

export default PopularMatches;

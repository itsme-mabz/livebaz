import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import './LeagueDetail.css';
import { StandingsTableSkeleton, TableSkeleton } from '../components/SkeletonLoader/SkeletonLoader';
import { replaceTranslation, getTranslation } from '../utils/translationReplacer.jsx';
import { useTimezone } from '../context/TimezoneContext';
import { convertToLocalTime } from '../utils/timezone';



function LeagueDetail() {
    const { leagueId, lang } = useParams();
    const { currentTimezone } = useTimezone();
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
    const [currentLang, setCurrentLang] = useState(lang || 'en');

    // Detect language from URL or Google Translate
    useEffect(() => {
        if (lang) {
            setCurrentLang(lang);
        }

        const checkLanguage = () => {
            const select = document.querySelector('.goog-te-combo');
            if (select && !lang) {
                setCurrentLang(select.value || 'en');
            }
        };

        checkLanguage();
        const interval = setInterval(checkLanguage, 500);
        return () => clearInterval(interval);
    }, [lang]);

    useEffect(() => {
        fetchLeagueData();
    }, [leagueId, currentTimezone]);

    const fetchLeagueData = async () => {
        try {
            setLeagueInfo(null); // Reset to avoid showing stale data from previous league
            setStandings([]); // Reset standings
            setFixtures([]); // Reset fixtures

            console.log('Fetching data for league ID:', leagueId);

            // Fetch league info
            const leaguesResponse = await axios.get(`/api/v1/football-events/get-leagues?league_id=${leagueId}`);
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
            const standingsResponse = await axios.get(`/api/v1/football-events/get-standings?league_id=${leagueId}`);
            setStandings(Array.isArray(standingsResponse.data) ? standingsResponse.data : []);

            // Fetch fixtures (last 30 days to next 30 days)
            const today = new Date();
            const from = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            const to = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

            const fixturesResponse = await axios.get(`/api/v1/football-events/get-events?from=${from}&to=${to}&league_id=${leagueId}`);
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
            const predictionsResponse = await axios.get(`/api/v1/football-events/get-predictions?from=${from}&to=${to}&league_id=${leagueId}`);
            setPredictions(Array.isArray(predictionsResponse.data) ? predictionsResponse.data : []);

            // Fetch top scorers
            const scorersResponse = await axios.get(`/api/v1/football-events/get-topscorers?league_id=${leagueId}`);
            setTopScorers(Array.isArray(scorersResponse.data) ? scorersResponse.data : []);

            // Fetch teams
            const teamsResponse = await axios.get(`/api/v1/football-events/get-teams?league_id=${leagueId}`);
            setTeams(Array.isArray(teamsResponse.data) ? teamsResponse.data : []);

            setLoading(false);
        } catch (error) {
            console.error('Error fetching league data:', error);
            setLoading(false);
        }
    };

    // Convert match time to selected timezone
    const getMatchTime = (date, time) => {
        if (!date || !time) return time;
        const [hours, minutes] = time.split(':');
        const gmtTime = `${String(parseInt(hours) - 1).padStart(2, '0')}:${minutes}`;
        const converted = convertToLocalTime(date, gmtTime, currentTimezone);
        return converted.time;
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

    const getExpectedScore = (homeId, awayId) => {
        if (!standings || standings.length === 0) return '-';
        const homeTeam = standings.find(s => String(s.team_id) === String(homeId));
        const awayTeam = standings.find(s => String(s.team_id) === String(awayId));

        if (!homeTeam || !awayTeam || !homeTeam.overall_league_payed || homeTeam.overall_league_payed === '0' || !awayTeam.overall_league_payed || awayTeam.overall_league_payed === '0') return '-';

        const hPayed = parseInt(homeTeam.overall_league_payed);
        const aPayed = parseInt(awayTeam.overall_league_payed);

        const hScoredAvg = parseInt(homeTeam.overall_league_GF) / hPayed;
        const hConcededAvg = parseInt(homeTeam.overall_league_GA) / hPayed;
        const aScoredAvg = parseInt(awayTeam.overall_league_GF) / aPayed;
        const aConcededAvg = parseInt(awayTeam.overall_league_GA) / aPayed;

        const hExp = (hScoredAvg + aConcededAvg) / 2;
        const aExp = (aScoredAvg + hConcededAvg) / 2;

        return { hExp, aExp, score: `${Math.round(hExp)}-${Math.round(aExp)}` };
    };

    const poisson = (k, lambda) => {
        const factorial = (n) => {
            let res = 1;
            for (let i = 2; i <= n; i++) res *= i;
            return res;
        };
        return (Math.pow(lambda, k) * Math.exp(-lambda)) / factorial(k);
    };

    const renderPredValue = (value, isHighest, isActual = false, oddsValue = null) => {
        if (typeof value === 'string' && value.includes('-') && value !== '-') {
            return (
                <div className={`pred-value ${isHighest ? 'highest' : ''}`} style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: '4px 12px',
                    minHeight: '44px'
                }}>
                    <span style={{ fontSize: '13px', color: isActual ? '#2563eb' : 'inherit', fontWeight: isActual ? '700' : 'inherit' }}>{value.split('-')[0]}</span>
                    <div style={{ height: '1px', width: '100%', backgroundColor: 'rgba(0,0,0,0.05)' }}></div>
                    <span style={{ fontSize: '13px', color: isActual ? '#2563eb' : 'inherit', fontWeight: isActual ? '700' : 'inherit' }}>{value.split('-')[1]}</span>
                </div>
            );
        }
        return (
            <span className={`pred-value ${isHighest ? 'highest' : ''}`} style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                gap: '4px'
            }}>
                <span style={{ color: isActual && value !== '-' ? '#2563eb' : undefined, fontWeight: isActual && value !== '-' ? '700' : undefined }}>{value}</span>
                {showOdds && oddsValue && oddsValue !== '-' && (
                    <span style={{ fontSize: '11px', color: '#666', fontWeight: '500' }}>({oddsValue})</span>
                )}
            </span>
        );
    };

    const getPredictionData = (match, type) => {
        const prediction = predictions.find(p => p.match_id === match.match_id);
        if (!prediction) return { prob1: '-', probX: '-', prob2: '-', odds1: '-', oddsX: '-', odds2: '-' };

        switch (type) {
            case '1x2':
                return {
                    prob1: formatPercentage(prediction.prob_HW),
                    probX: formatPercentage(prediction.prob_D),
                    prob2: formatPercentage(prediction.prob_AW),
                    odds1: calculateOdds(prediction.prob_HW),
                    oddsX: calculateOdds(prediction.prob_D),
                    odds2: calculateOdds(prediction.prob_AW)
                };
            case 'goals':
                const expG = getExpectedScore(match.match_hometeam_id, match.match_awayteam_id);
                const scoreTextG = typeof expG === 'object' ? `${expG.hExp.toFixed(1)}-${expG.aExp.toFixed(1)}` : '-';
                return {
                    prob1: formatPercentage(prediction.prob_O),
                    probX: scoreTextG,
                    prob2: formatPercentage(prediction.prob_U),
                    odds1: calculateOdds(prediction.prob_O),
                    oddsX: '-',
                    odds2: calculateOdds(prediction.prob_U)
                };
            case 'btts':
                const expB = getExpectedScore(match.match_hometeam_id, match.match_awayteam_id);
                const scoreTextB = typeof expB === 'object' ? `${expB.hExp.toFixed(1)}-${expB.aExp.toFixed(1)}` : '-';
                return {
                    prob1: formatPercentage(prediction.prob_bts),
                    probX: scoreTextB,
                    prob2: formatPercentage(prediction.prob_ots),
                    odds1: calculateOdds(prediction.prob_bts),
                    oddsX: '-',
                    odds2: calculateOdds(prediction.prob_ots)
                };
            case 'correct-score':
                const expCS = getExpectedScore(match.match_hometeam_id, match.match_awayteam_id);
                if (typeof expCS !== 'object') return { prob1: '-', probX: '-', prob2: '-', odds1: '-', oddsX: '-', odds2: '-' };

                const hScore = Math.round(expCS.hExp);
                const aScore = Math.round(expCS.aExp);
                const prob = (poisson(hScore, expCS.hExp) * poisson(aScore, expCS.aExp) * 100).toFixed(1);
                const actual = (match.match_hometeam_score !== null && match.match_hometeam_score !== '')
                    ? `${match.match_hometeam_score}-${match.match_awayteam_score}`
                    : '-';

                return {
                    prob1: expCS.score,
                    probX: `${prob}%`,
                    prob2: actual,
                    odds1: '-',
                    oddsX: calculateOdds(prob),
                    odds2: '-'
                };
            case 'double-chance':
                const expDC = getExpectedScore(match.match_hometeam_id, match.match_awayteam_id);
                const scoreDC = typeof expDC === 'object' ? expDC.score : '-';
                return {
                    prob1: scoreDC,
                    probX: formatPercentage(prediction.prob_HW_D),
                    prob2: formatPercentage(prediction.prob_HW_AW),
                    prob3: formatPercentage(prediction.prob_AW_D),
                    odds1: '-',
                    oddsX: calculateOdds(prediction.prob_HW_D),
                    odds2: calculateOdds(prediction.prob_HW_AW),
                    odds3: calculateOdds(prediction.prob_AW_D)
                };
            case '1x2-first-half':
                const expHT = getExpectedScore(match.match_hometeam_id, match.match_awayteam_id);
                if (typeof expHT !== 'object') return { prob1: '-', probX: '-', prob2: '-', odds1: '-', oddsX: '-', odds2: '-' };

                // Scale expected goals to 1st half (approx 45% of total goals)
                const hExpHT = expHT.hExp * 0.45;
                const aExpHT = expHT.aExp * 0.45;

                let hProbHT = 0, dProbHT = 0, aProbHT = 0;
                // Sum Poisson probabilities for 1st half outcomes
                for (let i = 0; i <= 5; i++) {
                    for (let j = 0; j <= 5; j++) {
                        const prob = poisson(i, hExpHT) * poisson(j, aExpHT);
                        if (i > j) hProbHT += prob;
                        else if (i === j) dProbHT += prob;
                        else aProbHT += prob;
                    }
                }

                const actualHT = (match.match_hometeam_halftime_score !== null && match.match_hometeam_halftime_score !== '')
                    ? `${match.match_hometeam_halftime_score}-${match.match_awayteam_halftime_score}`
                    : '-';

                return {
                    prob1: formatPercentage(hProbHT * 100),
                    probX: formatPercentage(dProbHT * 100),
                    prob2: formatPercentage(aProbHT * 100),
                    actualHT: actualHT,
                    odds1: calculateOdds(hProbHT * 100),
                    oddsX: calculateOdds(dProbHT * 100),
                    odds2: calculateOdds(aProbHT * 100)
                };
            default:
                return { prob1: '-', probX: '-', prob2: '-', odds1: '-', oddsX: '-', odds2: '-' };
        }
    };

    const getHighestProb = (prob1, probX, prob2, prob3) => {
        const p1 = prob1 !== '-' ? parseFloat(prob1) : 0;
        const pX = probX !== '-' ? parseFloat(probX) : 0;
        const p2 = prob2 !== '-' ? parseFloat(prob2) : 0;
        const p3 = prob3 !== '-' ? parseFloat(prob3) : 0;

        if (predictionType === 'double-chance') {
            const max = Math.max(pX, p2, p3);
            if (max === 0) return {};
            return { probX: pX === max, prob2: p2 === max, prob3: p3 === max };
        }

        if (predictionType === 'correct-score') {
            return { probX: true }; // Highlight the chance
        }

        if (predictionType === 'btts' || predictionType === 'goals') {
            // Only compare prob1 and prob2 for these types (Yes/No or Over/Under)
            if (p1 >= p2) return { prob1: true };
            return { prob2: true };
        }

        // For 1x2 and 1x2 First Half, compare all three
        if (p1 >= pX && p1 >= p2) return { prob1: true };
        if (pX >= p1 && pX >= p2) return { probX: true };
        return { prob2: true };
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
                <p>{replaceTranslation('League not found', currentLang)}</p>
            </div>
        );
    }

    return (
        <div className="league-detail-page">
            <div className="league-detail-container">
                {/* Breadcrumbs */}
                <div className="breadcrumbs-wrapper">
                    <div className="breadcrumbs">
                        <a href="/">Livebaz</a>
                        <span>/</span>
                        <a href="/competitions">Leagues</a>
                        <span>/</span>
                        <span>{replaceTranslation(leagueInfo.league_name, currentLang)}</span>
                    </div>
                </div>

                {/* League Header */}
                <div className="league-header">
                    <div className="league-header-content">
                        <div className="league-header-info">
                            <h1 className="league-title">{replaceTranslation(leagueInfo.league_name, currentLang)} {replaceTranslation('Predictions and Odds', currentLang)}</h1>
                            <div className="league-meta">
                                <div className="league-meta-item">
                                    <span className="meta-label">{replaceTranslation('Dates', currentLang)}</span>
                                    <span className="meta-value">{leagueInfo.league_season || 'N/A'}</span>
                                </div>
                                <div className="league-meta-divider"></div>
                                <div className="league-meta-item">
                                    <span className="meta-label">{replaceTranslation('Category', currentLang)}</span>
                                    <span className="meta-value">{leagueInfo.country_name || 'World'}</span>
                                </div>
                                <div className="league-meta-divider"></div>
                                <div className="league-meta-item">
                                    <span className="meta-label">{replaceTranslation('Participants', currentLang)}</span>
                                    <span className="meta-value">{standings.length || '-'}</span>
                                </div>
                            </div>
                        </div>
                        <div className="league-logo">
                            {leagueInfo.league_logo && (
                                <img src={leagueInfo.league_logo} alt={getTranslation(leagueInfo.league_name, currentLang)} />
                            )}
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="league-tabs">
                        <button
                            className={`league-tab ${activeTab === 'predictions' ? 'active' : ''}`}
                            onClick={() => setActiveTab('predictions')}
                        >
                            {replaceTranslation('Predictions', currentLang)}
                        </button>
                        <button
                            className={`league-tab ${activeTab === 'fixtures' ? 'active' : ''}`}
                            onClick={() => setActiveTab('fixtures')}
                        >
                            {replaceTranslation('Fixtures', currentLang)}
                        </button>
                        <button
                            className={`league-tab ${activeTab === 'standings' ? 'active' : ''}`}
                            onClick={() => setActiveTab('standings')}
                        >
                            {replaceTranslation('Standings', currentLang)}
                        </button>
                        <button
                            className={`league-tab ${activeTab === 'topscorers' ? 'active' : ''}`}
                            onClick={() => setActiveTab('topscorers')}
                        >
                            {replaceTranslation('Top Scorers', currentLang)}
                        </button>
                        <button
                            className={`league-tab ${activeTab === 'teams' ? 'active' : ''}`}
                            onClick={() => setActiveTab('teams')}
                        >
                            {replaceTranslation('Teams', currentLang)}
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="league-content">
                    {/* Predictions Tab */}
                    {activeTab === 'predictions' && (
                        <div className="predictions-section">
                            <h2 className="section-title mb-6">{replaceTranslation('PREDICTIONS FOR', currentLang)} <span style={{ textTransform: 'uppercase' }}>{replaceTranslation(leagueInfo.league_name, currentLang)}</span></h2>
                            <br />
                            {/* Prediction Type Filters - Inline Style */}
                            <div className="prediction-type-tabs" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0' }}>
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
                                        {replaceTranslation('1X2', currentLang)}
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
                                        {replaceTranslation('Total Goals', currentLang)}
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
                                        {replaceTranslation('1X2 First Half', currentLang)}
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
                                        {replaceTranslation('Both Teams To Score', currentLang)}
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
                                        {replaceTranslation('Correct Score', currentLang)}
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
                                        {replaceTranslation('Double Chance', currentLang)}
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
                                                    background: 'transparent',
                                                    color: '#4b5563',
                                                    border: 'none',
                                                    fontWeight: '600',
                                                    fontSize: '14px',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s',
                                                    borderBottom: '3px solid #e5e7eb',
                                                    borderRadius: '12px 12px 0 0'
                                                }}
                                                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                                                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                                            >
                                                {availableRounds.map((round) => (
                                                    <option key={round} value={round}>
                                                        {getTranslation(leagueInfo.league_name, currentLang)} - {round}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Odds Toggle Switch */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                                <span style={{ fontSize: '14px', fontWeight: '600', color: '#4b5563' }}>{replaceTranslation('Odds', currentLang)}</span>
                                <label style={{
                                    position: 'relative',
                                    display: 'inline-block',
                                    width: '50px',
                                    height: '24px',
                                    cursor: 'pointer'
                                }}>
                                    <input
                                        type="checkbox"
                                        checked={showOdds}
                                        onChange={() => setShowOdds(!showOdds)}
                                        style={{ opacity: 0, width: 0, height: 0 }}
                                    />
                                    <span style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        bottom: 0,
                                        backgroundColor: showOdds ? '#000' : '#ccc',
                                        borderRadius: '24px',
                                        transition: 'background-color 0.3s'
                                    }}>
                                        <span style={{
                                            position: 'absolute',
                                            content: '',
                                            height: '18px',
                                            width: '18px',
                                            left: showOdds ? '29px' : '3px',
                                            bottom: '3px',
                                            backgroundColor: '#fff',
                                            borderRadius: '50%',
                                            transition: 'left 0.3s'
                                        }}></span>
                                    </span>
                                </label>
                            </div>





                            {/* Matches Table */}
                            <div className="matches-table">
                                <div className="matches-header">
                                    <div className="header-time">{replaceTranslation('Time', currentLang)}</div>
                                    <div className="header-match">{replaceTranslation('Match', currentLang)}</div>
                                    <div className="header-predictions" style={{
                                        display: 'grid',
                                        gridTemplateColumns: predictionType === '1x2-first-half' ? 'repeat(4, 1fr)' : (predictionType === 'goals' || predictionType === 'btts') ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
                                        gap: '10px'
                                    }}>
                                        {predictionType === 'btts' ? (
                                            <>
                                                <span>{replaceTranslation('YES', currentLang)}</span>
                                                <span>{replaceTranslation('NO', currentLang)}</span>
                                            </>
                                        ) : predictionType === 'goals' ? (
                                            <>
                                                <span>{replaceTranslation('OVER 2.5', currentLang)}</span>
                                                <span>{replaceTranslation('UNDER 2.5', currentLang)}</span>
                                            </>
                                        ) : predictionType === 'correct-score' ? (
                                            <>
                                                <span>{replaceTranslation('PRED.', currentLang)}</span>
                                                <span>{replaceTranslation('CHANCE', currentLang)}</span>
                                                <span>{replaceTranslation('ACTUAL', currentLang)}</span>
                                            </>
                                        ) : predictionType === '1x2-first-half' ? (
                                            <>
                                                <span>{replaceTranslation('1 HT', currentLang)}</span>
                                                <span>{replaceTranslation('X HT', currentLang)}</span>
                                                <span>{replaceTranslation('2 HT', currentLang)}</span>
                                                <span>{replaceTranslation('ACTUAL HT', currentLang)}</span>
                                            </>
                                        ) : predictionType === 'double-chance' ? (
                                            <>
                                                <span>{replaceTranslation('1/X', currentLang)}</span>
                                                <span>{replaceTranslation('1/2', currentLang)}</span>
                                                <span>{replaceTranslation('X/2', currentLang)}</span>
                                            </>
                                        ) : (
                                            <>
                                                <span>{replaceTranslation('1', currentLang)}</span>
                                                <span>{replaceTranslation('X', currentLang)}</span>
                                                <span>{replaceTranslation('2', currentLang)}</span>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {getCurrentRoundFixtures().map(match => {
                                    const predData = getPredictionData(match, predictionType);
                                    const highest = getHighestProb(predData.prob1, predData.probX, predData.prob2, predData.prob3);

                                    return (
                                        <Link to={`/match/${match.match_id}`} key={match.match_id} className="match-row" style={{ textDecoration: 'none', color: 'inherit' }}>
                                            {/* make this match time left aligned */}
                                            <div className="match-time" style={{ textAlign: 'left' }}>
                                                <div className="match-date">{new Date(match.match_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                                                <div className="match-hour">{getMatchTime(match.match_date, match.match_time)}</div>
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
                                            <div className="match-predictions" style={{
                                                alignItems: 'center',
                                                display: 'grid',
                                                gridTemplateColumns: predictionType === '1x2-first-half' ? 'repeat(4, 1fr)' : (predictionType === 'goals' || predictionType === 'btts') ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
                                                gap: '10px'
                                            }}>
                                                {predictionType !== 'double-chance' && renderPredValue(predData.prob1, highest.prob1, false, predData.odds1)}
                                                {(predictionType !== 'goals' && predictionType !== 'btts') && renderPredValue(predData.probX, highest.probX, false, predData.oddsX)}
                                                {renderPredValue(predData.prob2, highest.prob2, predictionType === 'correct-score', predData.odds2)}
                                                {predictionType === 'double-chance' && renderPredValue(predData.prob3, highest.prob3, false, predData.odds3)}
                                                {predictionType === '1x2-first-half' && renderPredValue(predData.actualHT, false, true)}
                                            </div>
                                        </Link>
                                    );
                                })}

                                {getCurrentRoundFixtures().length === 0 && (
                                    <div className="no-matches">
                                        <p>{replaceTranslation('No matches available for this round', currentLang)}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Fixtures Tab */}
                    {activeTab === 'fixtures' && (
                        <div className="fixtures-section">
                            <div className="flex justify-between items-start mb-6">
                                <h2 className="section-title"><span style={{ textTransform: 'uppercase' }}>{replaceTranslation(leagueInfo.league_name, currentLang)}</span> {replaceTranslation('FIXTURES', currentLang)}</h2>
                                <div className="flex items-center gap-4">
                                    <span className="text-sm font-semibold text-gray-700">Season {leagueInfo.league_season || '2025/2026'}</span>
                                    <span className="text-sm font-semibold text-gray-900">{replaceTranslation(leagueInfo.league_name, currentLang)}</span>
                                </div>
                            </div>

                            {/* Schedule/Results Toggle */}
                            <div className="flex gap-2 mb-6">
                                <button
                                    className={`px-6 py-2 rounded-lg font-medium transition ${fixturesView === 'schedule' ? 'bg-white border-2 border-gray-300 text-gray-900' : 'bg-gray-100 text-gray-600'}`}
                                    onClick={() => setFixturesView('schedule')}
                                >
                                    {replaceTranslation('Schedule', currentLang)}
                                </button>
                                <button
                                    className={`px-6 py-2 rounded-lg font-medium transition ${fixturesView === 'results' ? 'bg-white border-2 border-gray-300 text-gray-900' : 'bg-gray-100 text-gray-600'}`}
                                    onClick={() => setFixturesView('results')}
                                >
                                    {replaceTranslation('Results', currentLang)}
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
                                            <h3 className="text-base font-bold text-gray-900">{replaceTranslation(leagueInfo.league_name, currentLang)} {round}</h3>
                                            <button className="text-gray-500 hover:text-gray-700">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                                </svg>
                                            </button>
                                        </div>

                                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                                            {/* Table Header */}
                                            <div className="grid grid-cols-[180px_1fr_80px] gap-4 p-4 bg-gray-50 border-b border-gray-200">
                                                <div className="text-xs font-semibold text-gray-600 uppercase">{replaceTranslation('Time', currentLang)}</div>
                                                <div className="text-xs font-semibold text-gray-600 uppercase">{replaceTranslation('Match', currentLang)}</div>
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
                                                        <span className="text-gray-500 text-xs">{getMatchTime(match.match_date, match.match_time)}</span>
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
                                    <p>{replaceTranslation('No fixtures available', currentLang)}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Standings Tab */}
                    {activeTab === 'standings' && (
                        <div className="standings-section">
                            <h2 className="section-title mb-4">{replaceTranslation('STANDINGS', currentLang)} <span style={{ textTransform: 'uppercase' }}>{replaceTranslation(leagueInfo.league_name, currentLang)}</span></h2>

                            {/* View Tabs */}
                            <div className="flex gap-2 mb-6">
                                <button
                                    className={`px-4 py-2 rounded-lg font-medium transition ${standingsView === 'all' ? 'bg-white border-2 border-gray-300' : 'bg-gray-100 text-gray-700'}`}
                                    onClick={() => setStandingsView('all')}
                                >
                                    {replaceTranslation('All games', currentLang)}
                                </button>
                                <button
                                    className={`px-4 py-2 rounded-lg font-medium transition ${standingsView === 'home' ? 'bg-white border-2 border-gray-300' : 'bg-gray-100 text-gray-700'}`}
                                    onClick={() => setStandingsView('home')}
                                >
                                    {replaceTranslation('Home', currentLang)}
                                </button>
                                <button
                                    className={`px-4 py-2 rounded-lg font-medium transition ${standingsView === 'away' ? 'bg-white border-2 border-gray-300' : 'bg-gray-100 text-gray-700'}`}
                                    onClick={() => setStandingsView('away')}
                                >
                                    {replaceTranslation('Away', currentLang)}
                                </button>
                            </div>

                            {Array.isArray(standings) && standings.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm border-collapse">
                                        <thead>
                                            <tr className="border-b-2 border-gray-200 bg-gray-50 text-left">
                                                <th className="p-2 font-semibold">№</th>
                                                <th className="p-2 font-semibold sticky left-0 bg-gray-50">{replaceTranslation('Team', currentLang)}</th>
                                                <th className="p-2 font-semibold text-center">MP</th>
                                                <th className="p-2 font-semibold text-center">W</th>
                                                <th className="p-2 font-semibold text-center">D</th>
                                                <th className="p-2 font-semibold text-center">L</th>
                                                <th className="p-2 font-semibold text-center">{replaceTranslation('Goals', currentLang)}</th>
                                                <th className="p-2 font-semibold text-center">{replaceTranslation('Diff', currentLang)}</th>
                                                <th className="p-2 font-semibold text-center font-bold">Pt</th>
                                                <th className="p-2 font-semibold text-center">{replaceTranslation('Form', currentLang)}</th>
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
                                    <p>{replaceTranslation('No standings available for this league', currentLang)}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Top Scorers Tab */}
                    {activeTab === 'topscorers' && (
                        <div className="scorers-section">
                            <h2 className="section-title">{replaceTranslation('TOP SCORERS', currentLang)}</h2>
                            <div className="scorers-table">
                                <div className="scorers-header">
                                    <span className="rank">#</span>
                                    <span className="player">{replaceTranslation('Player', currentLang)}</span>
                                    <span className="team">{replaceTranslation('Team', currentLang)}</span>
                                    <span className="goals">{replaceTranslation('Goals', currentLang)}</span>
                                    <span className="assists">{replaceTranslation('Assists', currentLang)}</span>
                                    <span className="penalties">{replaceTranslation('Pen', currentLang)}</span>
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
                            <h2 className="section-title">{replaceTranslation('TEAMS', currentLang)}</h2>
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

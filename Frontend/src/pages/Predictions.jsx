import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './MathPredictions.css';
import { PredictionsPageSkeleton } from '../components/SkeletonLoader/SkeletonLoader';
import { fetchTrendingBlogs } from '../Service/BlogService';


const API_KEY = import.meta.env.VITE_APIFOOTBALL_KEY || '8b638d34018a20c11ed623f266d7a7a6a5db7a451fb17038f8f47962c66db43b';
const BASE_URL = 'https://apiv3.apifootball.com';

function Predictions() {
    const navigate = useNavigate();
    const [predictions, setPredictions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedDate, setSelectedDate] = useState('today');
    const [selectedSport, setSelectedSport] = useState('all');
    const [trendingBlogs, setTrendingBlogs] = useState([]);
    const [blogsLoading, setBlogsLoading] = useState(false);

    // Date tabs configuration
    const dateTabs = [
        { label: 'All Predictions', value: 'all' },
        { label: 'Today', value: 'today' },
        { label: 'Tomorrow', value: 'tomorrow' }
    ];

    // Fetch predictions from API
    const fetchPredictions = async () => {
        setLoading(true);
        try {
            // Calculate date string (YYYY-MM-DD)
            let fromDate, toDate;
            const today = new Date();

            if (selectedDate === 'today') {
                fromDate = today.toISOString().split('T')[0];
                toDate = fromDate;
            } else if (selectedDate === 'tomorrow') {
                const tomorrow = new Date(today);
                tomorrow.setDate(tomorrow.getDate() + 1);
                fromDate = tomorrow.toISOString().split('T')[0];
                toDate = fromDate;
            } else if (selectedDate === 'all') {
                // For "all", fetch next 7 days of predictions
                fromDate = today.toISOString().split('T')[0];
                const nextWeek = new Date(today);
                nextWeek.setDate(nextWeek.getDate() + 7);
                toDate = nextWeek.toISOString().split('T')[0];
            }

            const params = {
                action: 'get_predictions',
                APIkey: API_KEY,
                from: fromDate,
                to: toDate
            };

            const response = await axios.get(BASE_URL, { params });

            // The API returns an array directly, not wrapped in a success object
            const data = Array.isArray(response.data) ? response.data : [];

            // Helper function to parse probability string to number
            const parseProb = (value) => {
                const num = parseFloat(value);
                return isNaN(num) ? 0 : parseFloat(num.toFixed(2));
            };

            // Helper function to calculate odds from probability
            const calcOdds = (probability) => {
                if (!probability || probability <= 0) return '-';
                const odds = 100 / probability;
                return odds.toFixed(2);
            };

            // Transform API response to match component expectations
            const transformedData = data.map(match => {
                // Parse all probabilities
                const probHW = parseProb(match.prob_HW);
                const probD = parseProb(match.prob_D);
                const probAW = parseProb(match.prob_AW);
                const probO = parseProb(match.prob_O);
                const probU = parseProb(match.prob_U);
                const probBTS = parseProb(match.prob_bts);

                return {
                    id: match.match_id,
                    homeTeam: match.match_hometeam_name,
                    awayTeam: match.match_awayteam_name,
                    homeTeamBadge: match.team_home_badge || '',
                    awayTeamBadge: match.team_away_badge || '',
                    time: match.match_time,
                    league: match.league_name,
                    league_id: match.league_id,
                    country: match.country_name,
                    status: match.match_status || 'Not Started',
                    isLive: match.match_live === '1' || match.match_status === 'Live',
                    predictions: {
                        '1x2': {
                            w1: {
                                prob: probHW,
                                odds: calcOdds(probHW)
                            },
                            draw: {
                                prob: probD,
                                odds: calcOdds(probD)
                            },
                            w2: {
                                prob: probAW,
                                odds: calcOdds(probAW)
                            }
                        },
                        goals: {
                            over: {
                                prob: probO,
                                odds: calcOdds(probO)
                            },
                            under: {
                                prob: probU,
                                odds: calcOdds(probU)
                            }
                        },
                        btts: {
                            yes: {
                                prob: probBTS,
                                odds: calcOdds(probBTS)
                            },
                            no: {
                                prob: parseFloat((100 - probBTS).toFixed(2)),
                                odds: calcOdds(100 - probBTS)
                            }
                        },
                        bestTip: (() => {
                            // Find the highest probability prediction
                            const tips = [
                                { type: 'Home Win', probability: probHW, odds: calcOdds(probHW) },
                                { type: 'Draw', probability: probD, odds: calcOdds(probD) },
                                { type: 'Away Win', probability: probAW, odds: calcOdds(probAW) },
                                { type: 'Over 2.5', probability: probO, odds: calcOdds(probO) },
                                { type: 'Under 2.5', probability: probU, odds: calcOdds(probU) },
                                { type: 'BTTS Yes', probability: probBTS, odds: calcOdds(probBTS) }
                            ];
                            return tips.reduce((best, tip) => tip.probability > best.probability ? tip : best, tips[0]);
                        })()
                    }
                };
            });

            setPredictions(transformedData);

            // Log successful data fetch
            console.log(`Fetched ${transformedData.length} predictions from ${fromDate} to ${toDate}`);
            if (transformedData.length > 0) {
                console.log('Sample prediction:', transformedData[0]);
            }
        } catch (error) {
            console.error('Error fetching predictions:', error);
            console.error('Error details:', error.response?.data);
            setPredictions([]);
        } finally {
            setLoading(false);
        }
    };

    // Fetch trending blogs
    const loadTrendingBlogs = async () => {
        setBlogsLoading(true);
        try {
            const blogs = await fetchTrendingBlogs(10);
            setTrendingBlogs(blogs);
        } catch (error) {
            console.error('Error fetching trending blogs:', error);
        } finally {
            setBlogsLoading(false);
        }
    };

    // Fetch predictions when date changes
    useEffect(() => {
        fetchPredictions();
    }, [selectedDate]);

    // Fetch trending blogs on mount
    useEffect(() => {
        loadTrendingBlogs();
    }, []);

    // Format match time
    const formatMatchTime = (timeString) => {
        if (!timeString) return '-';
        return timeString;
    };

    // Get best prediction tip
    const getBestTip = (prediction) => {
        if (!prediction?.predictions?.bestTip) return null;
        return prediction.predictions.bestTip;
    };

    // Format date for blog
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    return (
        <main className="forecast-page">
            <div className="wrap">
                <div className="breadcrumbs fl_c">
                    <a href="/" className="breadcrumbs-point fl_c">Livebaz</a>
                    <span className="breadcrumbs-last fl_c">
                        Predictions
                    </span>
                </div>
                <article>
                    <div className="container container_70x30" style={{ direction: 'ltr' }}>
                        <div className="container-main">
                            <section className="forecasts forecast-small">
                                <h1 className="page-title">All Sports Predictions for Today</h1>
                                <div className="forecasts__header fl">
                                    <div className="date-setting fl_c">
                                        {dateTabs.map(tab => (
                                            <button key={tab.value}>
                                                <span
                                                    onClick={() => setSelectedDate(tab.value)}
                                                    className={`date-setting__link ${selectedDate === tab.value ? 'current' : ''}`}
                                                >
                                                    {tab.label}
                                                </span>
                                            </button>
                                        ))}
                                    </div>

                                </div>

                                <div className="forecasts__wrapper">
                                    {loading ? (
                                        <PredictionsPageSkeleton />
                                    ) : predictions.length === 0 ? (
                                        <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
                                            No predictions available
                                        </div>
                                    ) : (
                                        predictions.map((prediction) => {
                                            const bestTip = getBestTip(prediction);
                                            return (
                                                <span
                                                    key={prediction.id}
                                                    className="forecast-item"
                                                    style={{
                                                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s'
                                                    }}
                                                    onClick={() => navigate(`/match/${prediction.id}`)}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.transform = 'scale(1.02)';
                                                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.transform = 'scale(1)';
                                                        e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
                                                    }}
                                                >
                                                    {prediction.isLive && (
                                                        <span className="popular-icon">LIVE</span>
                                                    )}
                                                    <span className="forecast-item__top fl">
                                                        <div style={{
                                                            width: '100%',
                                                            height: '140px',
                                                            background: 'linear-gradient(135deg, #1a1a1a 0%, #4a4a4a 50%, #fbbf24 100%)',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'space-around',
                                                            color: 'white',
                                                            padding: '20px',
                                                            borderRadius: '8px 8px 0 0'
                                                        }}>
                                                            <div style={{ textAlign: 'center', flex: 1 }}>
                                                                {prediction.homeTeamBadge && (
                                                                    <img
                                                                        src={prediction.homeTeamBadge}
                                                                        alt={prediction.homeTeam}
                                                                        style={{
                                                                            width: '60px',
                                                                            height: '60px',
                                                                            objectFit: 'contain',
                                                                            marginBottom: '8px',
                                                                            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
                                                                        }}
                                                                    />
                                                                )}
                                                                <div style={{ fontSize: '14px', fontWeight: '600' }}>
                                                                    {prediction.homeTeam}
                                                                </div>
                                                            </div>
                                                            <div style={{ fontSize: '24px', fontWeight: 'bold', padding: '0 10px' }}>
                                                                VS
                                                            </div>
                                                            <div style={{ textAlign: 'center', flex: 1 }}>
                                                                {prediction.awayTeamBadge && (
                                                                    <img
                                                                        src={prediction.awayTeamBadge}
                                                                        alt={prediction.awayTeam}
                                                                        style={{
                                                                            width: '60px',
                                                                            height: '60px',
                                                                            objectFit: 'contain',
                                                                            marginBottom: '8px',
                                                                            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
                                                                        }}
                                                                    />
                                                                )}
                                                                <div style={{ fontSize: '14px', fontWeight: '600' }}>
                                                                    {prediction.awayTeam}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </span>

                                                    <span className="forecast-item__bottom fl" style={{ marginTop: '16px' }}>
                                                        <span className="news-item__text-m">
                                                            <span className="info">
                                                                <span className="tag">
                                                                    Football
                                                                </span>
                                                                <span className="time">{formatMatchTime(prediction.time)}</span>
                                                            </span>
                                                        </span>
                                                        <a href={`/prediction/${prediction.id}`} className="forecast-item__info" style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}>
                                                            <div style={{ marginBottom: '8px', fontWeight: '600' }}>
                                                                {prediction.homeTeam} vs {prediction.awayTeam}
                                                            </div>
                                                            {bestTip && (
                                                                <div style={{ fontSize: '13px', color: '#666' }}>
                                                                    <strong>Best Tip:</strong> {bestTip.type} ({bestTip.probability}%)
                                                                </div>
                                                            )}
                                                            <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                                                                1X2: {prediction.predictions?.['1x2']?.w1?.prob}% / {prediction.predictions?.['1x2']?.draw?.prob}% / {prediction.predictions?.['1x2']?.w2?.prob}%
                                                            </div>
                                                        </a>
                                                        <a href={`/football/${prediction.league?.toLowerCase().replace(/\s+/g, '-')}/`}
                                                            className="tournament mb-12">
                                                            {prediction.league}
                                                        </a>
                                                    </span>
                                                </span>
                                            );
                                        })
                                    )}
                                </div>
                            </section>
                        </div>

                        {/* Blog Sidebar */}
                        <aside className="container-sidebar">
                            <div style={{
                                background: '#fff',
                                borderRadius: '8px',
                                padding: '24px 20px',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                                position: 'sticky',
                                top: '80px'
                            }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    marginBottom: '24px'
                                }}>
                                    <div style={{
                                        width: '4px',
                                        height: '24px',
                                        background: 'linear-gradient(to bottom, #4169e1, #ff6b6b)',
                                        borderRadius: '2px'
                                    }}></div>
                                    <h2 style={{
                                        fontSize: '18px',
                                        fontWeight: '700',
                                        color: '#1a1a1a',
                                        margin: 0,
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px'
                                    }}>
                                        Latest Predictions
                                    </h2>
                                </div>

                                {blogsLoading ? (
                                    <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                                        Loading...
                                    </div>
                                ) : trendingBlogs.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '20px', color: '#999', fontSize: '14px' }}>
                                        No predictions available
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                                        {trendingBlogs.map((blog, index) => (
                                            <div
                                                key={blog.id}
                                                onClick={() => navigate(`/blog/${blog.slug}`)}
                                                style={{
                                                    cursor: 'pointer',
                                                    padding: '16px 0',
                                                    borderBottom: index < trendingBlogs.length - 1 ? '1px solid #f0f0f0' : 'none',
                                                    transition: 'all 0.2s'
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.backgroundColor = '#f8f9fa';
                                                    e.currentTarget.style.paddingLeft = '8px';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.backgroundColor = 'transparent';
                                                    e.currentTarget.style.paddingLeft = '0';
                                                }}
                                            >
                                                <div style={{
                                                    fontSize: '11px',
                                                    fontWeight: '700',
                                                    color: '#4169e1',
                                                    marginBottom: '6px',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.5px'
                                                }}>
                                                    {blog.category || 'FOOTBALL'} • {formatDate(blog.published_at || blog.createdAt)}
                                                </div>
                                                <h3 style={{
                                                    fontSize: '13px',
                                                    fontWeight: '400',
                                                    color: '#1a1a1a',
                                                    margin: 0,
                                                    lineHeight: '1.5',
                                                    display: '-webkit-box',
                                                    WebkitLineClamp: 3,
                                                    WebkitBoxOrient: 'vertical',
                                                    overflow: 'hidden'
                                                }}>
                                                    {blog.title}
                                                </h3>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </aside>
                    </div>
                </article>
            </div>
        </main>
    );
}

export default Predictions;
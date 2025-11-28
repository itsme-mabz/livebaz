import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './MathPredictions.css';
import { PredictionsPageSkeleton } from '../components/SkeletonLoader/SkeletonLoader';

const API_BASE_URL = '/api/v1';

function Predictions() {
    const [predictions, setPredictions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedDate, setSelectedDate] = useState('today');
    const [selectedSport, setSelectedSport] = useState('all');

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
            let dateParam = null;
            const today = new Date();

            if (selectedDate === 'today') {
                dateParam = today.toISOString().split('T')[0];
            } else if (selectedDate === 'tomorrow') {
                const tomorrow = new Date(today);
                tomorrow.setDate(tomorrow.getDate() + 1);
                dateParam = tomorrow.toISOString().split('T')[0];
            }

            const params = dateParam ? { date: dateParam } : {};

            const response = await axios.get(`${API_BASE_URL}/predictions`, { params });

            if (response.data.success) {
                setPredictions(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching predictions:', error);
            setPredictions([]);
        } finally {
            setLoading(false);
        }
    };

    // Fetch predictions when date changes
    useEffect(() => {
        fetchPredictions();
    }, [selectedDate]);

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
                    <div className="container container_70x30">
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
                                                <span key={prediction.id} className="forecast-item" style={{ boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)' }}>
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
                    </div>
                </article>
            </div>
        </main>
    );
}

export default Predictions;
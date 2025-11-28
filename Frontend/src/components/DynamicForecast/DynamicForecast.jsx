// components/DynamicForecast/DynamicForecast.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { webSocketService } from '../WebSocketService/WebsocketService';
import { realTimePredictions, formatMatchData } from '../../Service/FootballService';
import { PredictionsPageSkeleton } from '../SkeletonLoader/SkeletonLoader';
import '../../CSS/DynamicForecast/DynamicForecast.css'

const DynamicForecasts = ({ dateFilter = 'today' }) => {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Start WebSocket connection
    webSocketService.connect();

    // Subscribe to WebSocket events for live updates
    const unsubscribeWebSocket = webSocketService.subscribe('forecasts-component', (type, data) => {
      if (type === 'liveData') {
        handleLiveData(data);
      }
    });

    return () => {
      unsubscribeWebSocket();
      webSocketService.unsubscribe('forecasts-component');
      realTimePredictions.stopPolling();
    };
  }, []);

  useEffect(() => {
    startRealTimePredictions();
  }, [dateFilter]);

  const startRealTimePredictions = useCallback(() => {
    setLoading(true);
    const today = new Date();
    let fromDate, toDate;

    if (dateFilter === 'today') {
      fromDate = formatDate(today);
      toDate = formatDate(today);
    } else if (dateFilter === 'tomorrow') {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      fromDate = formatDate(tomorrow);
      toDate = formatDate(tomorrow);
    } else {
      // For 'all', fetch predictions for the next 7 days
      fromDate = formatDate(today);
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);
      toDate = formatDate(nextWeek);
    }

    // Subscribe to prediction updates
    const unsubscribePredictions = realTimePredictions.subscribe(
      'forecasts-component',
      (type, data) => {
        if (type === 'predictionsUpdate') {
          const formattedPredictions = data.predictions.map(formatMatchData).slice(0, 5);
          setPredictions(formattedPredictions);
          setLoading(false);
        }
      }
    );

    // Start polling
    realTimePredictions.startPolling(fromDate, toDate);

    return unsubscribePredictions;
  }, [dateFilter]);

  const handleLiveData = (liveData) => {
    setPredictions(prev => prev.map(pred => {
      if (pred.id === liveData.match_id) {
        return {
          ...pred,
          liveScore: {
            home: liveData.match_hometeam_score,
            away: liveData.match_awayteam_score,
            status: liveData.match_status
          }
        };
      }
      return pred;
    }));
  };

  const formatDate = (date) => {
    return date.toISOString().split('T')[0];
  };

  // Show loading state with skeleton
  if (loading) {
    return <PredictionsPageSkeleton />;
  }

  // Display real data using your exact HTML structure
  return (
    <>
      <div class="forecasts__wrapper">
        {predictions.map((prediction) => (
          <span key={prediction.id} class="forecast-item" style={{ boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)' }}>
            {prediction.liveScore && (
              <span className="popular-icon">LIVE</span>
            )}
            <span class="forecast-item__top fl">
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
                  {prediction.homeTeamLogo && (
                    <img
                      src={prediction.homeTeamLogo}
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
                  {prediction.awayTeamLogo && (
                    <img
                      src={prediction.awayTeamLogo}
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

            <span class="forecast-item__bottom fl" style={{ marginTop: '16px' }}>
              <span class="news-item__text-m">
                <span class="info">
                  <span class="tag">Football</span>
                  <span class="time">{prediction.date}</span>
                </span>
              </span>
              <a
                href={`/prediction/${prediction.id}`}
                class="forecast-item__info"
                style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}
              >
                <div style={{ marginBottom: '8px', fontWeight: '600' }}>
                  {prediction.homeTeam} vs {prediction.awayTeam}
                </div>
                {prediction.bestPrediction && (
                  <div style={{ fontSize: '13px', color: '#666' }}>
                    <strong>Best Tip:</strong> {prediction.bestPrediction}
                  </div>
                )}
                {prediction.probabilities && (
                  <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                    1X2: {prediction.probabilities.home}% / {prediction.probabilities.draw}% / {prediction.probabilities.away}%
                  </div>
                )}
              </a>
              <a
                href={`/football/${prediction.league?.toLowerCase().replace(/\s+/g, '-')}/`}
                class="tournament mb-12"
              >
                {prediction.league}
              </a>
            </span>
          </span>
        ))}
      </div>

      <a href="/predictions/" className="button show-more-button" style={{
        display: 'inline-block',
        marginTop: '24px',
        textAlign: 'center'
      }}>
        <span className="button__text button-arrow">Show More Predictions</span>
      </a>
    </>
  );
};

export default DynamicForecasts;
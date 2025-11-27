// components/DynamicForecast/DynamicForecast.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { webSocketService } from '../WebSocketService/WebsocketService';
import { realTimePredictions, formatMatchData } from '../../Service/FootballService';

const DynamicForecasts = () => {
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
  }, []);

  const startRealTimePredictions = useCallback(() => {
    const today = new Date();
    const fromDate = formatDate(today);
    const toDate = formatDate(today);

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
  }, []);

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
    return (
      <div class="forecasts__wrapper">
        {[...Array(5)].map((_, index) => (
          <span key={index} class="forecast-item">
            <span class="forecast-item__top fl">
              <div style={{
                width: '360px',
                height: '140px',
                background: '#f0f0f0',
                borderRadius: '4px'
              }}></div>
            </span>
            <span class="forecast-item__bottom fl">
              <span class="news-item__text-m">
                <span class="info">
                  <span class="tag">Football</span>
                  <span class="time">Loading...</span>
                </span>
              </span>
              <div style={{
                height: '20px',
                background: '#f0f0f0',
                borderRadius: '3px',
                marginBottom: '8px'
              }}></div>
              <div style={{
                height: '16px',
                background: '#f0f0f0',
                borderRadius: '3px',
                width: '120px'
              }}></div>
            </span>
          </span>
        ))}
      </div>
    );
  }

  // Display real data using your exact HTML structure
  return (
    <div class="forecasts__wrapper">
      {predictions.map((prediction) => (
        <span key={prediction.id} class="forecast-item">
          <span class="forecast-item__top fl">
            <img
              srcset={`https://cdn.ratingbet.com/ratingbet/20251124/placeholder-${prediction.homeTeamSlug}-vs-${prediction.awayTeamSlug}-550-345.webp 550w`}
              sizes="550px"
              decoding="async"
              width="360"
              height="140"
              alt={prediction.predictionTitle}
              src={`https://cdn.ratingbet.com/ratingbet/20251124/placeholder-${prediction.homeTeamSlug}-vs-${prediction.awayTeamSlug}-550-345.webp`}
              onError={(e) => {
                // Fallback image if dynamic image fails
                e.target.src = "https://cdn.ratingbet.com/ratingbet/20251124/1d0417df57f8e4ff0d4fb5b46f413c2dce16dcb30f42ab22bf9f360e9e8383a7-550-345.webp";
              }}
            />
          </span>

          <span class="forecast-item__bottom fl">
            <span class="news-item__text-m">
              <span class="info">
                <span class="tag">Football</span>
                <span class="time">{prediction.date}</span>
                {prediction.liveScore && (
                  <span style={{
                    marginLeft: '8px',
                    background: '#ff4444',
                    color: 'white',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>
                    LIVE {prediction.liveScore.home}-{prediction.liveScore.away}
                  </span>
                )}
              </span>
            </span>
            <a
              href={`/predictions/${prediction.homeTeamSlug}-vs-${prediction.awayTeamSlug}-prediction-match-preview-betting-odds-and-tips`}
              class="forecast-item__info"
            >
              {prediction.predictionTitle}
            </a>
            <a
              href={`/football/${prediction.league.toLowerCase().replace(/\s+/g, '-')}/`}
              class="tournament mb-12"
            >
              {prediction.league}
            </a>
          </span>
        </span>
      ))}
    </div>
  );
};

export default DynamicForecasts;
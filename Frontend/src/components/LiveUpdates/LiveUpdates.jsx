import React, { useState, useEffect, useCallback } from 'react';
import { realTimePredictions, formatMatchData, fetchPredictions } from '../../Service/FootballService';
import { webSocketService } from '../WebSocketService/WebsocketService';

const LiveUpdate = () => {
  const [matches, setMatches] = useState([]);
  const [liveMatches, setLiveMatches] = useState([]);
  const [selectedDate, setSelectedDate] = useState('today');
  const [loading, setLoading] = useState(false);

  // Format date for API
  const getFormattedDate = (dateType) => {
    const today = new Date();
    const date = new Date();
    
    switch (dateType) {
      case 'yesterday':
        date.setDate(today.getDate() - 1);
        break;
      case 'tomorrow':
        date.setDate(today.getDate() + 1);
        break;
      case 'today':
      default:
        date.setDate(today.getDate());
        break;
    }
    
    return date.toISOString().split('T')[0]; // YYYY-MM-DD
  };

  // Fetch predictions data
  const fetchMatchData = useCallback(async (dateType) => {
    setLoading(true);
    try {
      const from = getFormattedDate(dateType);
      const to = from; // Same day
      
      const predictions = await fetchPredictions(from, to);
      const formattedMatches = predictions
        .map(prediction => formatMatchData(prediction))
        .filter(match => match !== null);
      
      setMatches(formattedMatches);
    } catch (error) {
      console.error('Error fetching match data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle date selection
  const handleDateChange = (dateType) => {
    setSelectedDate(dateType);
    fetchMatchData(dateType);
  };

  // Initialize real-time predictions
  useEffect(() => {
    const from = getFormattedDate(selectedDate);
    const to = from;
    
    realTimePredictions.startPolling(from, to);
    
    const unsubscribe = realTimePredictions.subscribe('matches-component', (type, data) => {
      if (type === 'predictionsUpdate') {
        const formattedMatches = data.predictions
          .map(prediction => formatMatchData(prediction))
          .filter(match => match !== null);
        
        setMatches(formattedMatches);
      }
    });

    return () => {
      realTimePredictions.unsubscribe('matches-component');
      realTimePredictions.stopPolling();
      unsubscribe();
    };
  }, [selectedDate]);

  // Initialize WebSocket for live matches
  useEffect(() => {
    webSocketService.connect();
    
    const unsubscribe = webSocketService.subscribe('matches-component', (type, data) => {
      if (type === 'liveData') {
        // Process live match data from WebSocket
        if (data && Array.isArray(data)) {
          const liveGames = data.filter(match => 
            match.match_status === 'Live' || match.match_status === 'HT'
          ).map(match => ({
            id: match.match_id,
            homeTeam: match.match_hometeam_name,
            awayTeam: match.match_awayteam_name,
            homeScore: match.match_hometeam_score,
            awayScore: match.match_awayteam_score,
            minute: match.match_time,
            status: match.match_status,
            league: match.league_name
          }));
          
          setLiveMatches(liveGames);
        }
      }
    });

    return () => {
      webSocketService.unsubscribe('matches-component');
      unsubscribe();
    };
  }, []);

  // Combine scheduled matches with live data
  const getDisplayMatches = () => {
    if (selectedDate === 'today') {
      // Merge API predictions with live WebSocket data
      return matches.map(match => {
        const liveMatch = liveMatches.find(live => live.id === match.id);
        if (liveMatch) {
          return {
            ...match,
            status: 'Live',
            minute: liveMatch.minute,
            homeScore: liveMatch.homeScore,
            awayScore: liveMatch.awayScore
          };
        }
        return match;
      });
    }
    return matches;
  };

  // Render match item
  const renderMatchItem = (match) => {
    const isLive = match.status === 'Live' || match.status === 'HT';
    const isPlanned = !match.homeScore && !match.awayScore && !isLive;
    const matchTime = isLive ? `${match.minute}'` : match.date;
    
    return (
      <div key={match.id} className="match-item__wrapper">
        <div
          data-href={`/football/match/${match.homeTeamSlug}-vs-${match.awayTeamSlug}/`}
          className={`match-item fl_c ${isLive ? 'live-match' : 'planned-match'}`}
        >
          <span className="match-item__top">
            <span className="match-item__time fl_c">{matchTime}</span>
          </span>
          
          <span className="match-item__team match-item__team-1 fl_c">
            <span className="team-name d-bl">{match.homeTeam}</span>
            <span className="team-logo">
              <img
                src={match.homeTeamLogo || '/ratingbet_build/img/team_logo_empty.9830efe9.png'}
                width="28"
                height="28"
                alt={match.homeTeam}
                className="lazyload"
                onError={(e) => {
                  e.target.src = '/ratingbet_build/img/team_logo_empty.9830efe9.png';
                }}
              />
            </span>
          </span>
          
          <span className="match-item__scores fl">
            <span className="main-score">
              <span className="score fl">
                <span>{isLive ? match.homeScore : (isPlanned ? '-' : '0')}</span>
              </span>
              <span className="score-colon fl">:</span>
              <span className="score fl">
                <span>{isLive ? match.awayScore : (isPlanned ? '-' : '0')}</span>
              </span>
            </span>
          </span>
          
          <span className="match-item__team match-item__team-2 fl_c">
            <span className="team-logo">
              <img
                src={match.awayTeamLogo || '/ratingbet_build/img/team_logo_empty.9830efe9.png'}
                width="28"
                height="28"
                alt={match.awayTeam}
                className="lazyload"
                onError={(e) => {
                  e.target.src = '/ratingbet_build/img/team_logo_empty.9830efe9.png';
                }}
              />
            </span>
            <span className="team-name d-bl">{match.awayTeam}</span>
          </span>
        </div>

        {/* Prediction link for matches with predictions */}
        {match.probabilities && (
          <a
            href={`/predictions/${match.homeTeamSlug}-vs-${match.awayTeamSlug}-prediction/`}
            className="forecast-tab"
          >
            Prediction
          </a>
        )}
      </div>
    );
  };

  const displayMatches = getDisplayMatches();

  return (
    <div className="match-center__wrapper">
      <section className="match-center__header">
        <div className="section-title">Scores</div>
        <div className="match-center__header-wrap fl_c">
          <ul className="date-setting fl_c">
            <li>
              <span
                className={`date-setting__link date-setting__link_matches ${selectedDate === 'live' ? 'current' : ''}`}
                onClick={() => handleDateChange('live')}
              >
                Live games
              </span>
            </li>
            <li>
              <span
                className={`date-setting__link date-setting__link_matches ${selectedDate === 'yesterday' ? 'current' : ''}`}
                onClick={() => handleDateChange('yesterday')}
              >
                Yesterday
              </span>
            </li>
            <li>
              <span
                className={`date-setting__link date-setting__link_matches ${selectedDate === 'today' ? 'current' : ''}`}
                onClick={() => handleDateChange('today')}
              >
                Today
              </span>
            </li>
            <li>
              <span
                className={`date-setting__link date-setting__link_matches ${selectedDate === 'tomorrow' ? 'current' : ''}`}
                onClick={() => handleDateChange('tomorrow')}
              >
                Tomorrow
              </span>
            </li>
          </ul>
          
          <div className="calendar fl">
            <label htmlFor="calendar" className="calendar-button fl_c_c" aria-label="calendar">
              <input
                id="calendar"
                type="text"
                className="datepicker js-datepicker"
                readOnly
              />
              <span className="calendar-text fl_c">Calendar</span>
            </label>
          </div>
        </div>
      </section>

      <div className="match-center__container">
        {loading ? (
          <div className="loading">Loading matches...</div>
        ) : displayMatches.length > 0 ? (
          displayMatches.map(renderMatchItem)
        ) : (
          <div className="no-matches">No matches found for selected date</div>
        )}
      </div>
    </div>
  );
};

export default LiveUpdate;
// Service/FootballService.js
const API_KEY = '8b638d34018a20c11ed623f266d7a7a6a5db7a451fb17038f8f47962c66db43b';

// Basic prediction fetching
export const fetchPredictions = async (from, to, leagueId = null) => {
  try {
    let url = `https://apiv3.apifootball.com/?action=get_predictions&from=${from}&to=${to}&APIkey=${API_KEY}`;
    
    if (leagueId) {
      url += `&league_id=${leagueId}`;
    }

    const response = await fetch(url);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching predictions:', error);
    return [];
  }
};

// Format match data
export const formatMatchData = (prediction) => {
  if (!prediction) return null;
  
  const formatTeamName = (name) => {
    return (name || '').toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]/g, '');
  };

  const homeTeamSlug = formatTeamName(prediction.match_hometeam_name);
  const awayTeamSlug = formatTeamName(prediction.match_awayteam_name);
  
  const predictionTitle = `${prediction.match_hometeam_name} vs ${prediction.match_awayteam_name} prediction: Match preview, betting odds and tips`;
  
  const matchDate = new Date(`${prediction.match_date} ${prediction.match_time}`);
  const formattedDate = matchDate.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return {
    id: prediction.match_id,
    homeTeam: prediction.match_hometeam_name,
    awayTeam: prediction.match_awayteam_name,
    league: prediction.league_name,
    country: prediction.country_name,
    date: formattedDate,
    matchDate: prediction.match_date,
    matchTime: prediction.match_time,
    status: prediction.match_status,
    predictionTitle: predictionTitle,
    homeTeamSlug: homeTeamSlug,
    awayTeamSlug: awayTeamSlug,
    probabilities: {
      homeWin: prediction.prob_HW,
      draw: prediction.prob_D,
      awayWin: prediction.prob_AW,
      over25: prediction.prob_O,
      under25: prediction.prob_U,
      btts: prediction.prob_bts
    }
  };
};

// RealTimePredictions class
export class RealTimePredictions {
  constructor() {
    this.predictions = new Map();
    this.subscribers = new Map();
    this.pollInterval = null;
    this.pollFrequency = 60000; // 1 minute
  }

  startPolling(from, to, leagueId = null) {
    this.stopPolling();
    
    // Initial load
    this.fetchAndNotify(from, to, leagueId);
    
    // Set up polling
    this.pollInterval = setInterval(() => {
      this.fetchAndNotify(from, to, leagueId);
    }, this.pollFrequency);
  }

  stopPolling() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  async fetchAndNotify(from, to, leagueId) {
    try {
      const newPredictions = await this.fetchPredictions(from, to, leagueId);
      const changes = this.detectChanges(newPredictions);
      
      if (changes.length > 0 || this.predictions.size === 0) {
        this.notifySubscribers('predictionsUpdate', {
          predictions: newPredictions,
          changes: changes,
          timestamp: new Date().toISOString()
        });
      }

      this.predictions = new Map(newPredictions.map(pred => [pred.match_id, pred]));

    } catch (error) {
      console.error('Error fetching predictions:', error);
      this.notifySubscribers('error', { error: error.message });
    }
  }

  async fetchPredictions(from, to, leagueId) {
    let url = `https://apiv3.apifootball.com/?action=get_predictions&from=${from}&to=${to}&APIkey=${API_KEY}`;
    
    if (leagueId) {
      url += `&league_id=${leagueId}`;
    }

    const response = await fetch(url);
    const data = await response.json();
    return data || [];
  }

  detectChanges(newPredictions) {
    const changes = [];
    
    newPredictions.forEach(newPred => {
      const oldPred = this.predictions.get(newPred.match_id);
      
      if (!oldPred) {
        changes.push({ type: 'new', match: newPred });
      } else {
        const probChanges = this.checkProbabilityChanges(oldPred, newPred);
        if (probChanges.length > 0) {
          changes.push({ 
            type: 'probabilitiesUpdated', 
            match: newPred, 
            changes: probChanges 
          });
        }
      }
    });

    return changes;
  }

  checkProbabilityChanges(oldPred, newPred) {
    const changes = [];
    const probabilityFields = ['prob_HW', 'prob_D', 'prob_AW', 'prob_O', 'prob_U', 'prob_bts'];
    
    probabilityFields.forEach(field => {
      if (oldPred[field] !== newPred[field]) {
        changes.push({
          field,
          oldValue: oldPred[field],
          newValue: newPred[field],
          difference: Math.abs(parseFloat(oldPred[field]) - parseFloat(newPred[field]))
        });
      }
    });

    return changes;
  }

  subscribe(id, callback) {
    this.subscribers.set(id, callback);
    return () => this.unsubscribe(id);
  }

  unsubscribe(id) {
    this.subscribers.delete(id);
  }

  notifySubscribers(type, data) {
    this.subscribers.forEach((callback) => {
      try {
        callback(type, data);
      } catch (error) {
        console.error('Error in subscriber callback:', error);
      }
    });
  }
}

// Create and export singleton instance
export const realTimePredictions = new RealTimePredictions();
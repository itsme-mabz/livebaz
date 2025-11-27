// Service/FootballService.js
const API_KEY = '8b638d34018a20c11ed623f266d7a7a6a5db7a451fb17038f8f47962c66db43b';

// Helper: format date YYYY-MM-DD
const formatDate = (date) => date.toISOString().split('T')[0];

// Fetch team logos
const fetchTeamLogos = async (matches) => {
  const teamLogos = {};
  const uniqueTeamIds = new Set();

  matches.forEach(match => {
    if (match.match_hometeam_id) uniqueTeamIds.add(match.match_hometeam_id);
    if (match.match_awayteam_id) uniqueTeamIds.add(match.match_awayteam_id);
  });

  try {
    const teamIds = Array.from(uniqueTeamIds).join('-');
    if (teamIds) {
      const res = await fetch(`https://apiv3.apifootball.com/?action=get_teams&team_id=${teamIds}&APIkey=${API_KEY}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        data.forEach(team => {
          if (team.team_logo) teamLogos[team.team_key] = team.team_logo;
        });
      }
    }
  } catch (err) {
    console.warn('Failed fetching team logos', err);
  }

  return teamLogos;
};

// ===================== LIVE MATCHES =====================

// Fetch live matches - CORRECTED VERSION
export const fetchLiveMatches = async () => {
  try {
    const response = await fetch(`https://apiv3.apifootball.com/?action=get_live_odds_commnets&APIkey=${API_KEY}`);
    const liveData = await response.json();

    if (liveData && typeof liveData === 'object') {
      // Get team logos for live matches
      const matchesArray = Object.values(liveData);
      const teamLogos = await fetchTeamLogos(matchesArray);
      
      return matchesArray.map(match => ({
        ...match,
        status: 'Live',
        source: 'live',
        homeTeamLogo: teamLogos[match.match_hometeam_id] || null,
        awayTeamLogo: teamLogos[match.match_awayteam_id] || null
      }));
    }

    return [];
  } catch (error) {
    console.error('Error fetching live matches:', error);
    return [];
  }
};

// RealTimeLiveMatches class to poll live matches
export class RealTimeLiveMatches {
  constructor() {
    this.liveMatches = new Map();
    this.subscribers = new Map();
    this.pollInterval = null;
    this.pollFrequency = 30000; // poll every 30 seconds
  }

  startPolling() {
    this.stopPolling();
    this.fetchAndNotify();
    this.pollInterval = setInterval(() => this.fetchAndNotify(), this.pollFrequency);
  }

  stopPolling() {
    if (this.pollInterval) clearInterval(this.pollInterval);
    this.pollInterval = null;
  }

  async fetchAndNotify() {
    try {
      const liveMatches = await fetchLiveMatches();
      const changes = this.detectChanges(liveMatches);

      if (changes.length > 0 || this.liveMatches.size === 0) {
        this.notifySubscribers('liveUpdate', { liveMatches, changes, timestamp: new Date().toISOString() });
      }

      this.liveMatches = new Map(liveMatches.map(match => [match.match_id, match]));
    } catch (error) {
      console.error('Error fetching live matches:', error);
      this.notifySubscribers('error', { error: error.message });
    }
  }

  detectChanges(newMatches) {
    const changes = [];
    newMatches.forEach(match => {
      const oldMatch = this.liveMatches.get(match.match_id);
      if (!oldMatch) changes.push({ type: 'new', match });
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
    this.subscribers.forEach(cb => {
      try { cb(type, data); } 
      catch (e) { console.error(e); }
    });
  }
}

export const realTimeLiveMatches = new RealTimeLiveMatches();

// ===================== PREDICTIONS =====================

// Fetch predictions
export const fetchPredictions = async (from, to, leagueId = null) => {
  try {
    let url = `https://apiv3.apifootball.com/?action=get_predictions&from=${from}&to=${to}&APIkey=${API_KEY}`;
    if (leagueId) url += `&league_id=${leagueId}`;

    const response = await fetch(url);
    const data = await response.json();
    return data || [];
  } catch (error) {
    console.error('Error fetching predictions:', error);
    return [];
  }
};

// Format match data for predictions
export const formatMatchData = (prediction) => {
  if (!prediction) return null;

  const formatTeamName = (name) => (name || '').toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
  const homeTeamSlug = formatTeamName(prediction.match_hometeam_name);
  const awayTeamSlug = formatTeamName(prediction.match_awayteam_name);

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
    homeScore: prediction.match_hometeam_score,
    awayScore: prediction.match_awayteam_score,
    league: prediction.league_name,
    country: prediction.country_name,
    date: formattedDate,
    matchDate: prediction.match_date,
    matchTime: prediction.match_time,
    status: prediction.match_status,
    predictionTitle: `${prediction.match_hometeam_name} vs ${prediction.match_awayteam_name} prediction: Match preview, betting odds and tips`,
    homeTeamSlug,
    awayTeamSlug,
    homeTeamLogo: null,
    awayTeamLogo: null,
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
    this.fetchAndNotify(from, to, leagueId);
    this.pollInterval = setInterval(() => this.fetchAndNotify(from, to, leagueId), this.pollFrequency);
  }

  stopPolling() {
    if (this.pollInterval) clearInterval(this.pollInterval);
    this.pollInterval = null;
  }

  async fetchAndNotify(from, to, leagueId) {
    try {
      const newPredictions = await this.fetchPredictions(from, to, leagueId);
      const changes = this.detectChanges(newPredictions);

      if (changes.length > 0 || this.predictions.size === 0) {
        this.notifySubscribers('predictionsUpdate', {
          predictions: newPredictions,
          changes,
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
    if (leagueId) url += `&league_id=${leagueId}`;
    const response = await fetch(url);
    const data = await response.json();
    return data || [];
  }

  detectChanges(newPredictions) {
    const changes = [];
    newPredictions.forEach(newPred => {
      const oldPred = this.predictions.get(newPred.match_id);
      if (!oldPred) changes.push({ type: 'new', match: newPred });
      else {
        const probChanges = this.checkProbabilityChanges(oldPred, newPred);
        if (probChanges.length > 0) changes.push({ type: 'probabilitiesUpdated', match: newPred, changes: probChanges });
      }
    });
    return changes;
  }

  checkProbabilityChanges(oldPred, newPred) {
    const changes = [];
    const fields = ['prob_HW', 'prob_D', 'prob_AW', 'prob_O', 'prob_U', 'prob_bts'];
    fields.forEach(field => {
      if (oldPred[field] !== newPred[field]) {
        changes.push({ field, oldValue: oldPred[field], newValue: newPred[field], difference: Math.abs(parseFloat(oldPred[field]) - parseFloat(newPred[field])) });
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
    this.subscribers.forEach(cb => {
      try { cb(type, data); } catch(e) { console.error(e); }
    });
  }
}

export const realTimePredictions = new RealTimePredictions();
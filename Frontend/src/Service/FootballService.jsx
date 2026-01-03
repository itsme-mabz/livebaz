// Service/FootballService.js


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
      const res = await fetch(`/api/v1/football-events/get-teams?team_id=${teamIds}`);
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

// Fetch popular items from local backend
export const fetchPopularLeagues = async () => {
  try {
    const response = await fetch('/api/v1/public/popular-items?type=league');
    const data = await response.json();

    console.log('🔍 Raw API response:', data);

    if (data.success && Array.isArray(data.data)) {
      const leagues = data.data.map(item => {
        // Parse item_data if it's a string
        let leagueData = item.item_data;
        if (typeof leagueData === 'string') {
          try {
            leagueData = JSON.parse(leagueData);
          } catch (e) {
            console.error('Failed to parse item_data:', e);
            leagueData = {};
          }
        }

        const league = {
          league_id: item.item_id,
          league_name: item.item_name,
          league_logo: leagueData.logo || leagueData.league_logo || '',
          country: leagueData.country || '',
        };
        console.log(`📊 League: ${league.league_name}, Logo: ${league.league_logo}`);
        return league;
      });
      return leagues;
    }
    return [];
  } catch (error) {
    console.error('Error fetching popular leagues:', error);
    return [];
  }
};

// ===================== LIVE MATCHES =====================

// Fetch live matches - CORRECTED VERSION
export const fetchLiveMatches = async () => {
  try {
    const response = await fetch(`/api/v1/football-events/get-live-odds`);
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
    let url = `/api/v1/football-events/get-predictions?from=${from}&to=${to}`;
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

  // Determine best prediction based on highest probability
  const probabilities = {
    homeWin: parseFloat(prediction.prob_HW) || 0,
    draw: parseFloat(prediction.prob_D) || 0,
    awayWin: parseFloat(prediction.prob_AW) || 0,
    over25: parseFloat(prediction.prob_O) || 0,
    under25: parseFloat(prediction.prob_U) || 0,
    btts: parseFloat(prediction.prob_bts) || 0
  };

  const tips = [
    { type: 'Home Win', prob: probabilities.homeWin },
    { type: 'Draw', prob: probabilities.draw },
    { type: 'Away Win', prob: probabilities.awayWin },
    { type: 'Over 2.5', prob: probabilities.over25 },
    { type: 'Under 2.5', prob: probabilities.under25 },
    { type: 'BTTS Yes', prob: probabilities.btts }
  ];

  const bestTip = tips.sort((a, b) => b.prob - a.prob)[0];

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
    homeTeamLogo: prediction.team_home_badge || null,
    awayTeamLogo: prediction.team_away_badge || null,
    bestPrediction: `${bestTip.type} (${bestTip.prob}%)`,
    probabilities: {
      home: probabilities.homeWin,
      draw: probabilities.draw,
      away: probabilities.awayWin,
      over25: probabilities.over25,
      under25: probabilities.under25,
      btts: probabilities.btts
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
    let url = `/api/v1/football-events/get-predictions?from=${from}&to=${to}`;
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
      try { cb(type, data); } catch (e) { console.error(e); }
    });
  }
}

export const realTimePredictions = new RealTimePredictions();
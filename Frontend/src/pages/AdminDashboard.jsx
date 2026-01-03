import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function AdminDashboard({ initialTab = 'matches' }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(initialTab); // 'matches' or 'leagues'
  const [popularItems, setPopularItems] = useState([]);
  const [allItems, setAllItems] = useState([]); // All matches/leagues from API
  const [filteredItems, setFilteredItems] = useState([]); // Filtered results
  const [searchQuery, setSearchQuery] = useState('');
  const [searchDate, setSearchDate] = useState(new Date().toISOString().split('T')[0]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Update active tab if initialTab prop changes (e.g. navigation)
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    // Check if user is logged in and is admin
    const adminUser = localStorage.getItem('adminUser');
    const token = localStorage.getItem('token'); // changed from adminToken to token to match AdminLogin

    if (!adminUser || !token) {
      navigate('/admin/login');
      return;
    }

    const parsedUser = JSON.parse(adminUser);
    if (!parsedUser.is_admin) {
      navigate('/admin/login');
      return;
    }

    setUser(parsedUser);
    fetchPopularItems();
    // fetchAllItems(); // Load only when needed
  }, [navigate]);

  useEffect(() => {
    if (user) {
      setAllItems([]); // Clear previous items
      setFilteredItems([]);
      fetchPopularItems();
      // Auto-load leagues when tab is 'leagues', or matches when 'matches'
      // The user specifically complained about leagues not loading, so we ensure it loads.
      // We can just call fetchAllItems() for both to provide a better UX.
      fetchAllItems();
    }
  }, [activeTab, user]); // Added user dependency to ensure it runs after user is set

  const fetchPopularItems = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `/api/v1/admin/popular-items?type=${activeTab === 'matches' ? 'match' : 'league'}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true
        }
      );

      if (response.data.success) {
        setPopularItems(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching popular items:', error);
      if (error.response?.status === 401) {
        navigate('/admin/login');
      }
    }
  };

  // Fetch all matches or leagues from API
  const fetchAllItems = async () => {
    setLoadingItems(true);
    try {
      let url;

      if (activeTab === 'matches') {
        url = `/api/v1/football-events/get-events?from=${searchDate}&to=${searchDate}`;
      } else {
        url = `/api/v1/football-events/get-leagues`;
      }

      const response = await axios.get(url, {
        withCredentials: true
      });

      // Data is returned as a raw array from the football-events API
      const data = Array.isArray(response.data) ? response.data : [];

      if (activeTab === 'matches') {
        const formattedMatches = data.map(match => ({
          match_id: match.match_id,
          home_team: match.match_hometeam_name,
          away_team: match.match_awayteam_name,
          league: match.league_name,
          date: match.match_date,
          time: match.match_time,
          home_logo: match.team_home_badge,
          away_logo: match.team_away_badge,
          league_id: match.league_id
        }));
        setAllItems(formattedMatches);
        setFilteredItems(formattedMatches);
      } else {
        const formattedLeagues = data.map(league => ({
          league_id: league.league_id,
          league_name: league.league_name,
          country: league.country_name,
          logo: league.league_logo || league.logo || ''
        }));

        // Sort alphabetically
        formattedLeagues.sort((a, b) => {
          const countryCompare = (a.country || '').localeCompare(b.country || '');
          if (countryCompare !== 0) return countryCompare;
          return (a.league_name || '').localeCompare(b.league_name || '');
        });

        setAllItems(formattedLeagues);
        setFilteredItems(formattedLeagues);
      }
    } catch (error) {
      console.error('Error fetching items:', error);
      alert('Error loading items. Please try again.');
    } finally {
      setLoadingItems(false);
    }
  };

  // Filter items on the frontend based on search query
  const handleSearch = (query) => {
    setSearchQuery(query);

    if (!query.trim()) {
      setFilteredItems(allItems); // Show all if search is empty
      return;
    }

    const lowerQuery = query.toLowerCase();

    if (activeTab === 'matches') {
      const filtered = allItems.filter(match =>
        match.home_team.toLowerCase().includes(lowerQuery) ||
        match.away_team.toLowerCase().includes(lowerQuery) ||
        match.league.toLowerCase().includes(lowerQuery)
      );
      setFilteredItems(filtered);
    } else {
      const filtered = allItems.filter(league =>
        league.league_name.toLowerCase().includes(lowerQuery) ||
        league.country.toLowerCase().includes(lowerQuery)
      );
      setFilteredItems(filtered);
    }
  };

  const addPopularItem = async (item) => {
    try {
      const token = localStorage.getItem('token');

      // Ensure logo is properly included in item_data
      let itemData = { ...item };
      if (activeTab === 'leagues' && item.logo) {
        itemData.league_logo = item.logo; // Add both fields for compatibility
      }

      const payload = {
        type: activeTab === 'matches' ? 'match' : 'league',
        item_id: activeTab === 'matches' ? item.match_id : item.league_id,
        item_name: activeTab === 'matches'
          ? `${item.home_team} vs ${item.away_team}`
          : item.league_name,
        item_data: itemData,
        priority: 0
      };

      const response = await axios.post(
        `/api/v1/admin/popular-items`,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true
        }
      );

      if (response.data.success) {
        fetchPopularItems();
        // Remove from filtered items
        setFilteredItems(filteredItems.filter(i =>
          activeTab === 'matches' ? i.match_id !== item.match_id : i.league_id !== item.league_id
        ));
      }
    } catch (error) {
      console.error('Error adding popular item:', error);
      alert(error.response?.data?.message || 'Error adding item. Please try again.');
    }
  };

  const removePopularItem = async (id) => {
    if (!confirm('Are you sure you want to remove this item?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(
        `/api/v1/admin/popular-items/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true
        }
      );

      if (response.data.success) {
        fetchPopularItems();
      }
    } catch (error) {
      console.error('Error removing popular item:', error);
      alert('Error removing item. Please try again.');
    }
  };

  const updatePriority = async (id, newPriority) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `/api/v1/admin/popular-items/${id}`,
        { priority: parseInt(newPriority) },
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true
        }
      );

      fetchPopularItems();
    } catch (error) {
      console.error('Error updating priority:', error);
    }
  };

  const toggleActive = async (id, currentStatus) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `/api/v1/admin/popular-items/${id}`,
        { is_active: !currentStatus },
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true
        }
      );

      fetchPopularItems();
    } catch (error) {
      console.error('Error toggling active status:', error);
    }
  };

  return (
    <div style={{ padding: '28px 32px', maxWidth: '1400px' }}>

      {/* Header */}
      <div style={{
        marginBottom: '24px'
      }}>
        <h1 style={{
          margin: 0,
          fontSize: '22px',
          fontWeight: '600',
          color: '#1a1a1a'
        }}>
          Dashboard
        </h1>
        <p style={{
          margin: '4px 0 0',
          fontSize: '13px',
          color: '#666'
        }}>
          Manage popular matches and leagues
        </p>
      </div>

      {/* Tabs */}
      <div style={{ marginBottom: '24px', borderBottom: '1px solid #e0e0e0' }}>
        <button
          onClick={() => {
            setActiveTab('matches');
            setAllItems([]);
            setFilteredItems([]);
            setSearchQuery('');
          }}
          style={{
            padding: '12px 24px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'matches' ? '2px solid #ffc107' : '2px solid transparent',
            color: activeTab === 'matches' ? '#1a1a1a' : '#666',
            fontWeight: '500',
            fontSize: '14px',
            cursor: 'pointer',
            marginRight: '20px'
          }}
        >
          Popular Matches
        </button>
        <button
          onClick={() => {
            setActiveTab('leagues');
            setAllItems([]);
            setFilteredItems([]);
            setSearchQuery('');
          }}
          style={{
            padding: '12px 24px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'leagues' ? '2px solid #ffc107' : '2px solid transparent',
            color: activeTab === 'leagues' ? '#1a1a1a' : '#666',
            fontWeight: '500',
            fontSize: '14px',
            cursor: 'pointer'
          }}
        >
          Popular Leagues
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>

        {/* Left Column: Current Popular Items */}
        <div style={{
          background: '#fff',
          border: '1px solid #e0e0e0',
          borderRadius: '8px',
          padding: '24px'
        }}>
          <h2 style={{
            margin: '0 0 20px',
            fontSize: '16px',
            fontWeight: '600',
            color: '#1a1a1a'
          }}>
            Active {activeTab === 'matches' ? 'Matches' : 'Leagues'} ({popularItems.length})
          </h2>

          {popularItems.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#999', fontSize: '13px' }}>
              No items selected yet. Add some from the search panel.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {popularItems.map((item) => (
                <div key={item.id} style={{
                  padding: '16px',
                  background: item.is_active ? '#fff' : '#fafafa',
                  border: '1px solid #e0e0e0',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  opacity: item.is_active ? 1 : 0.7
                }}>
                  <div style={{ flex: 1 }}>
                    {activeTab === 'matches' && item.item_data ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '500' }}>
                        {(item.item_data.home_team || item.item_data.match_hometeam_name) ? (
                          <>
                            <span style={{ color: '#333' }}>{item.item_data.home_team || item.item_data.match_hometeam_name}</span>
                            <span style={{ color: '#999', fontSize: '12px' }}>vs</span>
                            <span style={{ color: '#333' }}>{item.item_data.away_team || item.item_data.match_awayteam_name}</span>
                          </>
                        ) : (
                          <span style={{ color: '#333' }}>{item.item_name}</span>
                        )}
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '500', color: '#333' }}>
                        {item.item_data?.logo || item.item_data?.league_logo ? (
                          <img
                            src={item.item_data.logo || item.item_data.league_logo}
                            alt=""
                            style={{ width: '20px', height: '20px', objectFit: 'contain' }}
                            onError={(e) => {
                              e.target.style.display = 'none';
                              console.error('Failed to load logo:', item.item_data.logo || item.item_data.league_logo);
                            }}
                          />
                        ) : (
                          <span style={{ fontSize: '10px', color: '#f44336' }}>❌ No logo</span>
                        )}
                        {item.item_name}
                      </div>
                    )}
                    <div style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>
                      Priority: {item.priority}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="number"
                      value={item.priority}
                      onChange={(e) => updatePriority(item.id, e.target.value)}
                      style={{
                        width: '50px',
                        padding: '6px',
                        border: '1px solid #d0d0d0',
                        borderRadius: '4px',
                        fontSize: '13px'
                      }}
                    />
                    <button
                      onClick={() => toggleActive(item.id, item.is_active)}
                      style={{
                        padding: '6px 12px',
                        background: item.is_active ? '#e8f5e9' : '#f5f5f5',
                        color: item.is_active ? '#2e7d32' : '#666',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '12px',
                        cursor: 'pointer',
                        fontWeight: '500'
                      }}
                    >
                      {item.is_active ? 'Active' : 'Hidden'}
                    </button>
                    <button
                      onClick={() => removePopularItem(item.id)}
                      style={{
                        padding: '6px 12px',
                        background: '#ffe5e5',
                        color: '#d32f2f',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '12px',
                        cursor: 'pointer',
                        fontWeight: '500'
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Search & Add */}
        <div style={{
          background: '#fff',
          border: '1px solid #e0e0e0',
          borderRadius: '8px',
          padding: '24px'
        }}>
          <h2 style={{
            margin: '0 0 20px',
            fontSize: '16px',
            fontWeight: '600',
            color: '#1a1a1a'
          }}>
            Add New {activeTab === 'matches' ? 'Match' : 'League'}
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Match specific controls */}
            {activeTab === 'matches' && (
              <div style={{ display: 'flex', gap: '12px' }}>
                <input
                  type="date"
                  value={searchDate}
                  onChange={(e) => setSearchDate(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    border: '1px solid #d0d0d0',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
                <button
                  onClick={fetchAllItems}
                  disabled={loadingItems}
                  style={{
                    padding: '10px 20px',
                    background: '#ffc107',
                    border: 'none',
                    borderRadius: '6px',
                    color: '#000',
                    fontWeight: '500',
                    cursor: loadingItems ? 'wait' : 'pointer'
                  }}
                >
                  {loadingItems ? 'Loading...' : 'Fetch'}
                </button>
              </div>
            )}

            {/* Search Input */}
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              disabled={allItems.length === 0}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #d0d0d0',
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />

            {/* Results List */}
            <div style={{
              marginTop: '10px',
              border: '1px solid #f0f0f0',
              borderRadius: '6px',
              maxHeight: '400px',
              overflowY: 'auto'
            }}>
              {loadingItems ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#999', fontSize: '13px' }}>
                  Loading data...
                </div>
              ) : filteredItems.length > 0 ? (
                <div>
                  {filteredItems.map((item) => (
                    <div key={activeTab === 'matches' ? item.match_id : item.league_id} style={{
                      padding: '12px 16px',
                      borderBottom: '1px solid #f0f0f0',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: '#fff'
                    }}>
                      <div style={{ fontSize: '13px', color: '#333' }}>
                        {activeTab === 'matches' ? (
                          <>
                            <div style={{ fontWeight: '500', marginBottom: '4px' }}>
                              {item.home_team} vs {item.away_team}
                            </div>
                            <div style={{ color: '#999', fontSize: '12px' }}>
                              {item.league} • {item.time}
                            </div>
                          </>
                        ) : (
                          <>
                            <div style={{ fontWeight: '500', marginBottom: '4px' }}>
                              {item.league_name}
                            </div>
                            <div style={{ color: '#999', fontSize: '12px' }}>
                              {item.country}
                            </div>
                          </>
                        )}
                      </div>
                      <button
                        onClick={() => addPopularItem(item)}
                        style={{
                          padding: '6px 14px',
                          background: '#f5f5f5',
                          border: '1px solid #e0e0e0',
                          borderRadius: '4px',
                          color: '#333',
                          fontSize: '12px',
                          fontWeight: '500',
                          cursor: 'pointer'
                        }}
                      >
                        Add
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '30px', textAlign: 'center', color: '#999', fontSize: '13px' }}>
                  {allItems.length === 0
                    ? (activeTab === 'matches' ? 'Select a date and click Fetch' : 'Click "Popular Leagues" tab to load leagues')
                    : 'No results found'}
                </div>
              )}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}

export default AdminDashboard;

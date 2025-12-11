import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './AdminDashboard.css';

const API_URL = '';

function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('matches'); // 'matches' or 'leagues'
  const [popularItems, setPopularItems] = useState([]);
  const [allItems, setAllItems] = useState([]); // All matches/leagues from API
  const [filteredItems, setFilteredItems] = useState([]); // Filtered results
  const [searchQuery, setSearchQuery] = useState('');
  const [searchDate, setSearchDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [loadingItems, setLoadingItems] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check if user is logged in and is admin
    const adminUser = localStorage.getItem('adminUser');
    const token = localStorage.getItem('adminToken');

    if (!adminUser || !token) {
      navigate('/admin/login');
      return;
    }

    const parsedUser = JSON.parse(adminUser);
    if (!parsedUser.is_admin) {
      alert('Access denied. Admin privileges required.');
      navigate('/admin/login');
      return;
    }

    setUser(parsedUser);
    fetchPopularItems();
    fetchAllItems(); // Load all items when tab changes
  }, [navigate, activeTab]);

  const fetchPopularItems = async () => {
    try {
      const token = localStorage.getItem('adminToken');
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
      const token = localStorage.getItem('adminToken');
      let url;

      if (activeTab === 'matches') {
        url = `/api/v1/admin/search/matches?date=${searchDate}`;
      } else {
        url = `/api/v1/admin/search/leagues`;
      }

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true
      });

      if (response.data.success) {
        setAllItems(response.data.data);
        setFilteredItems(response.data.data); // Initially show all
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
      const token = localStorage.getItem('adminToken');
      const payload = {
        type: activeTab === 'matches' ? 'match' : 'league',
        item_id: activeTab === 'matches' ? item.match_id : item.league_id,
        item_name: activeTab === 'matches'
          ? `${item.home_team} vs ${item.away_team}`
          : item.league_name,
        item_data: item,
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
        alert('Item added to popular list!');
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
      const token = localStorage.getItem('adminToken');
      const response = await axios.delete(
        `/api/v1/admin/popular-items/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true
        }
      );

      if (response.data.success) {
        alert('Item removed successfully!');
        fetchPopularItems();
      }
    } catch (error) {
      console.error('Error removing popular item:', error);
      alert('Error removing item. Please try again.');
    }
  };

  const updatePriority = async (id, newPriority) => {
    try {
      const token = localStorage.getItem('adminToken');
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
      alert('Error updating priority.');
    }
  };

  const toggleActive = async (id, currentStatus) => {
    try {
      const token = localStorage.getItem('adminToken');
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
      alert('Error updating status.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    navigate('/admin/login');
  };

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1>Admin Panel</h1>
        <div className="admin-user-info">
          <span>Welcome, {user?.Name}</span>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </div>

      <div className="admin-container">
        <div className="admin-tabs">
          <button
            className={`tab-btn ${activeTab === 'matches' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('matches');
              setAllItems([]);
              setFilteredItems([]);
              setSearchQuery('');
            }}
          >
            Popular Matches
          </button>
          <button
            className={`tab-btn ${activeTab === 'leagues' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('leagues');
              setAllItems([]);
              setFilteredItems([]);
              setSearchQuery('');
            }}
          >
            Popular Leagues
          </button>
        </div>

        <div className="admin-content">
          {/* Search Section */}
          <div className="search-section">
            <h2>Add New {activeTab === 'matches' ? 'Match' : 'League'}</h2>

            {activeTab === 'matches' && (
              <div className="date-selector">
                <label>Select Date:</label>
                <input
                  type="date"
                  value={searchDate}
                  onChange={(e) => {
                    setSearchDate(e.target.value);
                    setSearchQuery('');
                  }}
                  className="date-input"
                />
                <button
                  onClick={fetchAllItems}
                  disabled={loadingItems}
                  className="load-btn"
                >
                  {loadingItems ? 'Loading...' : 'Load Matches'}
                </button>
              </div>
            )}

            <div className="search-form">
              <input
                type="text"
                placeholder={`Search from ${allItems.length} ${activeTab}...`}
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="search-input"
                disabled={allItems.length === 0}
              />
              <span className="search-info">
                {loadingItems ? 'Loading...' : `${filteredItems.length} results`}
              </span>
            </div>

            {filteredItems.length > 0 && (
              <div className="search-results">
                <h3>Available {activeTab === 'matches' ? 'Matches' : 'Leagues'} ({filteredItems.length})</h3>
                <div className="results-list">
                  {filteredItems.map((item, index) => (
                    <div key={index} className="result-item">
                      {activeTab === 'matches' ? (
                        <div className="match-result">
                          <div className="match-info">
                            <img src={item.home_logo} alt="" className="team-logo-small" />
                            <span className="team-names">
                              {item.home_team} vs {item.away_team}
                            </span>
                            <img src={item.away_logo} alt="" className="team-logo-small" />
                          </div>
                          <div className="match-details">
                            <span>{item.league}</span>
                            <span>{item.date} {item.time}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="league-result">
                          <img src={item.logo} alt="" className="league-logo-small" />
                          <div className="league-info">
                            <span className="league-name">{item.league_name}</span>
                            <span className="league-country">{item.country}</span>
                          </div>
                        </div>
                      )}
                      <button
                        onClick={() => addPopularItem(item)}
                        className="add-btn"
                      >
                        Add
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!loadingItems && allItems.length === 0 && (
              <div className="empty-search">
                <p>
                  {activeTab === 'matches'
                    ? 'Select a date and click "Load Matches" to see available matches'
                    : 'Loading leagues...'}
                </p>
              </div>
            )}
          </div>

          {/* Popular Items List */}
          <div className="popular-items-section">
            <h2>Current Popular {activeTab === 'matches' ? 'Matches' : 'Leagues'} ({popularItems.length})</h2>
            {popularItems.length === 0 ? (
              <p className="empty-message">No popular items yet. Search and add some!</p>
            ) : (
              <div className="popular-items-list">
                {popularItems.map((item) => (
                  <div key={item.id} className={`popular-item ${!item.is_active ? 'inactive' : ''}`}>
                    <div className="item-content">
                      {activeTab === 'matches' && item.item_data ? (
                        <div className="match-display">
                          <img src={item.item_data.home_logo} alt="" className="team-logo-small" />
                          <span className="item-name">{item.item_name}</span>
                          <img src={item.item_data.away_logo} alt="" className="team-logo-small" />
                        </div>
                      ) : (
                        <div className="league-display">
                          {item.item_data?.logo && (
                            <img src={item.item_data.logo} alt="" className="league-logo-small" />
                          )}
                          <span className="item-name">{item.item_name}</span>
                        </div>
                      )}
                    </div>
                    <div className="item-controls">
                      <label>
                        Priority:
                        <input
                          type="number"
                          value={item.priority}
                          onChange={(e) => updatePriority(item.id, e.target.value)}
                          className="priority-input"
                        />
                      </label>
                      <button
                        onClick={() => toggleActive(item.id, item.is_active)}
                        className={`toggle-btn ${item.is_active ? 'active' : 'inactive'}`}
                      >
                        {item.is_active ? 'Active' : 'Inactive'}
                      </button>
                      <button
                        onClick={() => removePopularItem(item.id)}
                        className="remove-btn"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;

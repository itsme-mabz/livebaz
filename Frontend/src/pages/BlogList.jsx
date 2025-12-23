import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchBlogs, fetchCategories } from '../Service/BlogService';

function BlogList() {
  const navigate = useNavigate();
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadBlogs();
    loadCategories();
  }, [currentPage, selectedCategory, searchQuery]);

  const loadBlogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchBlogs({
        page: currentPage,
        limit: 12,
        category: selectedCategory,
        search: searchQuery
      });

      setBlogs(data.data);
      setTotalPages(data.totalPages);
    } catch (err) {
      console.error('Error loading blogs:', err);
      setError('Failed to load blogs. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await fetchCategories();
      setCategories(data);
    } catch (err) {
      console.error('Error loading categories:', err);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleBlogClick = (slug) => {
    navigate(`/blog/${slug}`);
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    setCurrentPage(1);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    loadBlogs();
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Icon components
  const UserIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
      <circle cx="12" cy="7" r="4"></circle>
    </svg>
  );

  const EyeIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
      <circle cx="12" cy="12" r="3"></circle>
    </svg>
  );

  if (loading && blogs.length === 0) {
    return (
      <div className="livescore-page wrap" style={{ paddingTop: '20px', background: '#f8f9fa' }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '400px',
          color: '#333'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '4px solid #e0e0e0',
            borderTopColor: '#ffc107',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginBottom: '20px'
          }}></div>
          <p style={{ fontSize: '18px' }}>Loading blogs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="livescore-page wrap" style={{ paddingTop: '20px', background: '#f8f9fa', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '40px', paddingTop: '20px' }}>
        <h1 style={{ fontSize: '36px', fontWeight: '700', color: '#1a1a1a', marginBottom: '10px' }}>
          Predictions Blog
        </h1>
        <p style={{ fontSize: '16px', color: '#666' }}>
          Expert analysis, match predictions, and betting tips
        </p>
      </div>

      {/* Search & Filters */}
      <div style={{ marginBottom: '40px' }}>
        {/* Search */}
        <form onSubmit={handleSearch} style={{
          display: 'flex',
          gap: '10px',
          marginBottom: '20px',
          maxWidth: '600px',
          marginLeft: 'auto',
          marginRight: 'auto'
        }}>
          <input
            type="text"
            placeholder="Search blogs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
              padding: '12px 20px',
              background: '#fff',
              border: '1px solid #ddd',
              borderRadius: '8px',
              color: '#333',
              fontSize: '15px'
            }}
          />
          <button
            type="submit"
            style={{
              padding: '12px 30px',
              background: '#ffc107',
              border: 'none',
              borderRadius: '8px',
              color: '#000',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s'
            }}
          >
            Search
          </button>
        </form>

        {/* Categories */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            onClick={() => handleCategoryChange('')}
            style={{
              padding: '8px 20px',
              background: selectedCategory === '' ? '#ffc107' : '#fff',
              border: '1px solid ' + (selectedCategory === '' ? '#ffc107' : '#ddd'),
              borderRadius: '20px',
              color: selectedCategory === '' ? '#000' : '#333',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: selectedCategory === '' ? '600' : '400',
              transition: 'all 0.3s'
            }}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.category}
              onClick={() => handleCategoryChange(cat.category)}
              style={{
                padding: '8px 20px',
                background: selectedCategory === cat.category ? '#ffc107' : '#fff',
                border: '1px solid ' + (selectedCategory === cat.category ? '#ffc107' : '#ddd'),
                borderRadius: '20px',
                color: selectedCategory === cat.category ? '#000' : '#333',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: selectedCategory === cat.category ? '600' : '400',
                transition: 'all 0.3s'
              }}
            >
              {cat.category} ({cat.count})
            </button>
          ))}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          background: '#fff3cd',
          border: '1px solid #ffc107',
          borderRadius: '12px',
          color: '#856404',
          marginBottom: '40px'
        }}>
          <p style={{ marginBottom: '15px' }}>{error}</p>
          <button
            onClick={loadBlogs}
            style={{
              padding: '10px 25px',
              background: '#ffc107',
              border: 'none',
              borderRadius: '8px',
              color: '#000',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Blog Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: '24px',
        marginBottom: '40px'
      }}>
        {blogs.map((blog) => (
          <div
            key={blog.id}
            onClick={() => handleBlogClick(blog.slug)}
            style={{
              background: '#fff',
              border: '1px solid #e0e0e0',
              borderRadius: '12px',
              overflow: 'hidden',
              cursor: 'pointer',
              transition: 'all 0.3s',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.borderColor = '#ffc107';
              e.currentTarget.style.boxShadow = '0 8px 20px rgba(255, 193, 7, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = '#e0e0e0';
              e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
            }}
          >
            {blog.featured_image && (
              <div style={{ position: 'relative', height: '200px', overflow: 'hidden' }}>
                <img
                  src={blog.featured_image}
                  alt={blog.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                {blog.category && (
                  <span style={{
                    position: 'absolute',
                    top: '15px',
                    left: '15px',
                    padding: '6px 12px',
                    background: '#ffc107',
                    color: '#000',
                    borderRadius: '20px',
                    fontSize: '13px',
                    fontWeight: '600'
                  }}>
                    {blog.category}
                  </span>
                )}
              </div>
            )}
            <div style={{ padding: '20px' }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '700',
                color: '#1a1a1a',
                marginBottom: '12px',
                lineHeight: '1.4',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
              }}>
                {blog.title}
              </h3>
              {blog.excerpt && (
                <p style={{
                  color: '#666',
                  fontSize: '14px',
                  lineHeight: '1.6',
                  marginBottom: '15px',
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}>
                  {blog.excerpt}
                </p>
              )}
              <div style={{
                display: 'flex',
                gap: '15px',
                alignItems: 'center',
                fontSize: '13px',
                color: '#999',
                paddingTop: '15px',
                borderTop: '1px solid #f0f0f0'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <UserIcon />
                  <span>{blog.author_name || blog.author?.Name || 'Admin'}</span>
                </div>
                <div>{formatDate(blog.published_at || blog.createdAt)}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <EyeIcon />
                  <span>{blog.view_count || 0}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* No Results */}
      {blogs.length === 0 && !loading && (
        <div style={{ textAlign: 'center', padding: '80px 20px', color: '#999', fontSize: '18px' }}>
          <p>No blogs found. Try adjusting your filters.</p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', marginTop: '60px', paddingBottom: '40px' }}>
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            style={{
              padding: '10px 20px',
              background: '#fff',
              border: '1px solid #ddd',
              borderRadius: '8px',
              color: currentPage === 1 ? '#ccc' : '#333',
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
              opacity: currentPage === 1 ? 0.5 : 1
            }}
          >
            Previous
          </button>
          <div style={{ display: 'flex', gap: '5px' }}>
            {[...Array(totalPages)].map((_, index) => {
              const page = index + 1;
              if (
                page === 1 ||
                page === totalPages ||
                (page >= currentPage - 1 && page <= currentPage + 1)
              ) {
                return (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    style={{
                      padding: '8px 14px',
                      background: currentPage === page ? '#ffc107' : '#fff',
                      border: '1px solid ' + (currentPage === page ? '#ffc107' : '#ddd'),
                      borderRadius: '6px',
                      color: currentPage === page ? '#000' : '#333',
                      cursor: 'pointer',
                      fontWeight: currentPage === page ? '600' : '400'
                    }}
                  >
                    {page}
                  </button>
                );
              } else if (page === currentPage - 2 || page === currentPage + 2) {
                return <span key={page} style={{ color: '#999', padding: '0 5px' }}>...</span>;
              }
              return null;
            })}
          </div>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            style={{
              padding: '10px 20px',
              background: '#fff',
              border: '1px solid #ddd',
              borderRadius: '8px',
              color: currentPage === totalPages ? '#ccc' : '#333',
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
              opacity: currentPage === totalPages ? 0.5 : 1
            }}
          >
            Next
          </button>
        </div>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default BlogList;

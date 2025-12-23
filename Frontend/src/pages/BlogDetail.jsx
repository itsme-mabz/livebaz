import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { fetchBlogBySlug, fetchTrendingBlogs } from '../Service/BlogService';

function BlogDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [blog, setBlog] = useState(null);
  const [latestBlogs, setLatestBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Icon components
  const EyeIcon = ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
      <circle cx="12" cy="12" r="3"></circle>
    </svg>
  );

  const CheckIcon = ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
  );

  useEffect(() => {
    loadBlogData();
  }, [slug]);

  const loadBlogData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch blog content
      const blogData = await fetchBlogBySlug(slug);
      setBlog(blogData);

      // Fetch latest blogs for sidebar
      const latest = await fetchTrendingBlogs(8);
      setLatestBlogs(latest);
    } catch (err) {
      console.error('Error loading blog:', err);
      setError('Failed to load blog. It may have been removed or the URL is incorrect.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatShortDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const renderContent = (content) => {
    if (!content) return null;

    // If content is JSON (structured content)
    if (typeof content === 'object') {
      return (
        <div>
          {content.sections?.map((section, index) => (
            <div key={index} style={{ marginBottom: '30px' }}>
              {section.title && <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1a1a1a', marginBottom: '15px' }}>{section.title}</h2>}
              {section.content && <div dangerouslySetInnerHTML={{ __html: section.content }} />}
              {section.list && (
                <ul style={{ listStyle: 'disc', paddingLeft: '25px', color: '#333', lineHeight: '1.8' }}>
                  {section.list.map((item, i) => (
                    <li key={i} style={{ marginBottom: '8px' }}>{item}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      );
    }

    // If content is HTML string
    return <div dangerouslySetInnerHTML={{ __html: content }} />;
  };

  if (loading) {
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
          <p style={{ fontSize: '18px' }}>Loading blog...</p>
        </div>
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div className="livescore-page wrap" style={{ paddingTop: '20px', background: '#f8f9fa' }}>
        <div style={{ textAlign: 'center', padding: '80px 20px' }}>
          <h2 style={{ fontSize: '28px', fontWeight: '700', color: '#1a1a1a', marginBottom: '15px' }}>Blog Not Found</h2>
          <p style={{ color: '#666', marginBottom: '30px' }}>{error || 'The blog you are looking for does not exist.'}</p>
          <button
            onClick={() => navigate('/blogs')}
            style={{
              padding: '12px 25px',
              background: '#ffc107',
              border: 'none',
              borderRadius: '8px',
              color: '#000',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Back to Blogs
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="livescore-page wrap" style={{ paddingTop: '20px', background: '#f8f9fa', minHeight: '100vh' }}>
      {/* Breadcrumb */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '14px',
        color: '#666',
        marginBottom: '20px',
        flexWrap: 'wrap'
      }}>
        <Link to="/" style={{ color: '#666', textDecoration: 'none' }}>Home</Link>
        <span>&gt;</span>
        <Link to="/blogs" style={{ color: '#666', textDecoration: 'none' }}>Blogs</Link>
        {blog.category && (
          <>
            <span>&gt;</span>
            <Link to={`/blogs?category=${blog.category}`} style={{ color: '#666', textDecoration: 'none' }}>
              {blog.category}
            </Link>
          </>
        )}
        <span>&gt;</span>
        <span style={{ color: '#999', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {blog.title}
        </span>
      </div>

      {/* Main Layout - 2 columns */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '30px', alignItems: 'start' }}>
        {/* Main Content */}
        <div>
          {/* Article Header */}
          <div style={{
            background: '#fff',
            padding: '30px',
            borderRadius: '12px',
            marginBottom: '20px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
          }}>
            <h1 style={{ fontSize: '32px', fontWeight: '700', color: '#1a1a1a', marginBottom: '20px', lineHeight: '1.3' }}>
              {blog.title}
            </h1>

            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '15px', paddingBottom: '20px', borderBottom: '1px solid #e0e0e0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: '#ffc107',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#000',
                  fontWeight: '700',
                  fontSize: '20px'
                }}>
                  {(blog.author_name || blog.author?.Name || 'A').charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: '600', color: '#1a1a1a' }}>
                    {blog.author_name || blog.author?.Name || 'Admin'}
                  </div>
                  <div style={{ fontSize: '14px', color: '#999' }}>
                    {formatDate(blog.published_at || blog.createdAt)}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', fontSize: '14px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#666' }}>
                  <EyeIcon size={16} />
                  <span>{blog.view_count || 0}</span>
                </span>
                {blog.category && (
                  <span style={{
                    padding: '6px 12px',
                    background: '#ffc107',
                    color: '#000',
                    borderRadius: '20px',
                    fontWeight: '600',
                    fontSize: '13px'
                  }}>
                    {blog.category}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Featured Image */}
          {blog.featured_image && (
            <div style={{ marginBottom: '20px', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
              <img
                src={blog.featured_image}
                alt={blog.title}
                style={{ width: '100%', height: 'auto', display: 'block' }}
              />
            </div>
          )}

          {/* Excerpt */}
          {blog.excerpt && (
            <div style={{
              background: '#fff',
              padding: '20px',
              borderLeft: '4px solid #ffc107',
              borderRadius: '0 8px 8px 0',
              marginBottom: '20px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
            }}>
              <p style={{ fontSize: '16px', color: '#555', fontStyle: 'italic', lineHeight: '1.6', margin: 0 }}>
                {blog.excerpt}
              </p>
            </div>
          )}

          {/* Article Content */}
          <div style={{
            background: '#fff',
            padding: '30px',
            borderRadius: '12px',
            marginBottom: '20px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
          }}>
            <div style={{ color: '#333', lineHeight: '1.8', fontSize: '16px' }}>
              {renderContent(blog.content)}
            </div>
          </div>

          {/* Tags */}
          {blog.tags && blog.tags.length > 0 && (
            <div style={{
              background: '#fff',
              padding: '20px',
              borderRadius: '12px',
              marginBottom: '20px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1a1a1a', marginBottom: '12px' }}>Tags:</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {blog.tags.map((tag, index) => (
                  <span
                    key={index}
                    style={{
                      padding: '6px 14px',
                      background: '#f8f9fa',
                      border: '1px solid #e0e0e0',
                      borderRadius: '20px',
                      fontSize: '14px',
                      color: '#555',
                      cursor: 'pointer'
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Author Card */}
          {blog.metadata?.author_stats && (
            <div style={{
              background: 'linear-gradient(135deg, #fff 0%, #f8f9fa 100%)',
              padding: '25px',
              border: '1px solid #e0e0e0',
              borderRadius: '12px',
              marginBottom: '20px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: '#ffc107',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#000',
                  fontWeight: '700',
                  fontSize: '28px'
                }}>
                  {(blog.author_name || blog.author?.Name || 'A').charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#1a1a1a', marginBottom: '4px' }}>
                    {blog.author_name || blog.author?.Name || 'Admin'}
                  </h3>
                  <p style={{ color: '#666', fontSize: '14px' }}>Sports Betting Expert</p>
                </div>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
                gap: '15px'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>Win Rate</div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', color: '#22c55e', fontWeight: '600' }}>
                    <CheckIcon size={14} />
                    <span>{blog.metadata.author_stats.win_rate || '0'}</span>
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>Avg. Coef</div>
                  <div style={{ color: '#1a1a1a', fontWeight: '600' }}>
                    {blog.metadata.author_stats.avg_coef || '0'}
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>Yield</div>
                  <div style={{ color: '#1a1a1a', fontWeight: '600' }}>
                    {blog.metadata.author_stats.yield || '0'}
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>Active tips</div>
                  <div style={{ color: '#1a1a1a', fontWeight: '600' }}>
                    {blog.metadata.author_stats.active_tips || '0'}
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>Form</div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                    {blog.metadata.author_stats.form?.map((result, i) => (
                      <span
                        key={i}
                        style={{
                          width: '24px',
                          height: '24px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '700',
                          background: result === 'W' ? '#22c55e' : result === 'L' ? '#ef4444' : '#94a3b8',
                          color: '#fff'
                        }}
                      >
                        {result}
                      </span>
                    )) || <span style={{ color: '#999' }}>-</span>}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar - Latest Predictions */}
        <div style={{ position: 'sticky', top: '20px' }}>
          <div style={{
            background: '#fff',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1a1a1a', marginBottom: '20px', paddingBottom: '12px', borderBottom: '2px solid #ffc107' }}>
              Latest Predictions
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {latestBlogs.map((latestBlog) => (
                <div
                  key={latestBlog.id}
                  onClick={() => navigate(`/blog/${latestBlog.slug}`)}
                  style={{
                    cursor: 'pointer',
                    paddingBottom: '15px',
                    borderBottom: '1px solid #f0f0f0',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#f8f9fa';
                    e.currentTarget.style.padding = '10px';
                    e.currentTarget.style.margin = '-10px';
                    e.currentTarget.style.borderRadius = '8px';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.padding = '0';
                    e.currentTarget.style.margin = '0';
                    e.currentTarget.style.borderRadius = '0';
                  }}
                >
                  {latestBlog.category && (
                    <div style={{ fontSize: '11px', color: '#ffc107', fontWeight: '600', marginBottom: '6px', textTransform: 'uppercase' }}>
                      {latestBlog.category}
                    </div>
                  )}
                  <h4 style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#1a1a1a',
                    marginBottom: '6px',
                    lineHeight: '1.4',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {latestBlog.title}
                  </h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', color: '#999' }}>
                    <span>{formatShortDate(latestBlog.published_at || latestBlog.createdAt)}</span>
                    <span>•</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <EyeIcon size={12} />
                      <span>{latestBlog.view_count || 0}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => navigate('/blogs')}
              style={{
                width: '100%',
                marginTop: '20px',
                padding: '12px',
                background: '#ffc107',
                border: 'none',
                borderRadius: '8px',
                color: '#000',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#ffca2c'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#ffc107'}
            >
              View All Predictions →
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @media (max-width: 1024px) {
          .livescore-page > div[style*="grid-template-columns"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

export default BlogDetail;

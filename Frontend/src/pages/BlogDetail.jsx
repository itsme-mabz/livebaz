import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { fetchBlogBySlug, fetchTrendingBlogs, fetchComments, postComment, deleteComment } from '../Service/BlogService';
import AuthModal from '../components/AuthModal/AuthModal';
import { replaceTranslation } from '../utils/translationReplacer.jsx';
import './BlogDetail.css';

function BlogDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [currentLang, setCurrentLang] = useState('en');

  useEffect(() => {
    const checkLanguage = () => {
      const select = document.querySelector('.goog-te-combo');
      if (select) {
        setCurrentLang(select.value || 'en');
      }
    };

    const intervalId = setInterval(checkLanguage, 500);
    return () => clearInterval(intervalId);
  }, []);

  const [blog, setBlog] = useState(null);
  const [latestBlogs, setLatestBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');

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
    loadUser();
  }, [slug]);

  const isTokenExpired = (token) => {
    if (!token) return true;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiryTime = payload.exp * 1000;
      const currentTime = Date.now();
      const isExpired = expiryTime < currentTime;

      console.log('[TOKEN CHECK]', {
        expiryTime: new Date(expiryTime),
        currentTime: new Date(currentTime),
        isExpired
      });

      return isExpired;
    } catch (error) {
      console.error('[TOKEN CHECK] Error parsing token:', error);
      return true;
    }
  };

  const loadUser = () => {
    // Check if user is logged in
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('user');

    if (token && userData) {
      // Check if token is expired
      if (isTokenExpired(token)) {
        console.log('Token expired, clearing storage');
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        setUser(null);
        return;
      }

      try {
        setUser(JSON.parse(userData));
      } catch (e) {
        setUser(null);
      }
    }
  };

  const openLoginModal = () => {
    setAuthMode('login');
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
    // Reload user data after modal closes (in case they logged in)
    setTimeout(() => {
      loadUser();
      if (blog?.id) {
        fetchComments(blog.id).then(setComments);
      }
    }, 500);
  };

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

      // Fetch comments
      if (blogData.id) {
        const commentsData = await fetchComments(blogData.id);
        setComments(commentsData);
      }
    } catch (err) {
      console.error('Error loading blog:', err);
      setError('Failed to load blog. It may have been removed or the URL is incorrect.');
    } finally {
      setLoading(false);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      openLoginModal();
      return;
    }

    if (!commentText.trim()) {
      alert('Please enter a comment');
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem('authToken');
      const userData = JSON.parse(localStorage.getItem('user'));

      console.log('[COMMENT SUBMIT] Token exists:', !!token);
      console.log('[COMMENT SUBMIT] Token:', token);

      if (!token) {
        alert('Please login again.');
        openLoginModal();
        return;
      }

      console.log('[COMMENT SUBMIT] Posting comment...');
      const newComment = await postComment(blog.id, {
        content: commentText,
        userName: userData?.Name || user.Name || 'User'
      }, token);
      console.log('[COMMENT SUBMIT] Success:', newComment);
      setComments([newComment, ...comments]);
      setCommentText('');
    } catch (err) {
      console.error('[COMMENT SUBMIT] Error:', err);

      // If token error, clear and prompt login
      if (err.message && (err.message.includes('expired') || err.message.includes('Invalid token'))) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        setUser(null);
        alert('Please login again.');
        openLoginModal();
      } else {
        alert(err.message || 'Failed to post comment. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!confirm('Are you sure you want to delete this comment?')) {
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      await deleteComment(blog.id, commentId, token);
      setComments(comments.filter(c => c.id !== commentId));
    } catch (err) {
      console.error('Error deleting comment:', err);
      alert('Failed to delete comment. Please try again.');
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
        <div className="blog-article-content">
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
    return <div className="blog-article-content" dangerouslySetInnerHTML={{ __html: content }} />;
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
          <p style={{ fontSize: '18px' }}>{replaceTranslation('Loading blog...', currentLang)}</p>
        </div>
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div className="livescore-page wrap" style={{ paddingTop: '20px', background: '#f8f9fa' }}>
        <div style={{ textAlign: 'center', padding: '80px 20px' }}>
          <h2 style={{ fontSize: '28px', fontWeight: '700', color: '#1a1a1a', marginBottom: '15px' }}>{replaceTranslation('Blog Not Found', currentLang)}</h2>
          <p style={{ color: '#666', marginBottom: '30px' }}>{error || replaceTranslation('The blog you are looking for does not exist.', currentLang)}</p>
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
            {replaceTranslation('Back to Blogs', currentLang)}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="livescore-page wrap" style={{ paddingTop: '20px', background: '#f8f9fa', minHeight: '100vh' }}>
      {/* Breadcrumb */}
      <div className="blog-breadcrumb" style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '14px',
        color: '#666',
        marginBottom: '20px',
        flexWrap: 'wrap'
      }}>
        <Link to="/" style={{ color: '#666', textDecoration: 'none' }}>{replaceTranslation('Home', currentLang)}</Link>
        <span>&gt;</span>
        <Link to="/blogs" style={{ color: '#666', textDecoration: 'none' }}>{replaceTranslation('Blogs', currentLang)}</Link>
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
      <div className="blog-main-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '30px', alignItems: 'start' }}>
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
          {blog.tags && (Array.isArray(blog.tags) ? blog.tags.length > 0 : typeof blog.tags === 'string' && blog.tags.length > 0) && (
            <div style={{
              background: '#fff',
              padding: '20px',
              borderRadius: '12px',
              marginBottom: '20px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1a1a1a', marginBottom: '12px' }}>{replaceTranslation('Tags:', currentLang)}</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {(Array.isArray(blog.tags)
                  ? blog.tags
                  : (typeof blog.tags === 'string' ? blog.tags.split(',').map(t => t.trim()) : [])
                ).map((tag, index) => (
                  <span
                    key={index}
                    onClick={() => navigate(`/blogs?tag=${tag}`)}
                    style={{
                      padding: '6px 14px',
                      background: '#f8f9fa',
                      border: '1px solid #e0e0e0',
                      borderRadius: '20px',
                      fontSize: '14px',
                      color: '#555',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = '#ffc107';
                      e.target.style.color = '#000';
                      e.target.style.borderColor = '#ffc107';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = '#f8f9fa';
                      e.target.style.color = '#555';
                      e.target.style.borderColor = '#e0e0e0';
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
                  <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>{replaceTranslation('Win Rate', currentLang)}</div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', color: '#22c55e', fontWeight: '600' }}>
                    <CheckIcon size={14} />
                    <span>{blog.metadata.author_stats.win_rate || '0'}</span>
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>{replaceTranslation('Avg. Coef', currentLang)}</div>
                  <div style={{ color: '#1a1a1a', fontWeight: '600' }}>
                    {blog.metadata.author_stats.avg_coef || '0'}
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>{replaceTranslation('Yield', currentLang)}</div>
                  <div style={{ color: '#1a1a1a', fontWeight: '600' }}>
                    {blog.metadata.author_stats.yield || '0'}
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>{replaceTranslation('Active tips', currentLang)}</div>
                  <div style={{ color: '#1a1a1a', fontWeight: '600' }}>
                    {blog.metadata.author_stats.active_tips || '0'}
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>{replaceTranslation('Form', currentLang)}</div>
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

          {/* Comments Section */}
          <div style={{
            background: '#fff',
            padding: '30px',
            borderRadius: '12px',
            marginBottom: '20px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
          }}>
            <h3 style={{ fontSize: '22px', fontWeight: '700', color: '#1a1a1a', marginBottom: '20px', paddingBottom: '15px', borderBottom: '2px solid #ffc107' }}>
              {replaceTranslation('Comments', currentLang)} ({comments.length})
            </h3>

            {/* Comment Form */}
            {user ? (
              <form onSubmit={handleCommentSubmit} style={{ marginBottom: '30px' }}>
                <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    background: '#ffc107',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#000',
                    fontWeight: '700',
                    fontSize: '18px',
                    flexShrink: 0
                  }}>
                    {(user.Name || user.name)?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <textarea
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Share your thoughts..."
                      disabled={submitting}
                      style={{
                        width: '100%',
                        minHeight: '100px',
                        padding: '12px 16px',
                        border: '2px solid #e0e0e0',
                        borderRadius: '8px',
                        fontSize: '15px',
                        color: '#333',
                        resize: 'vertical',
                        fontFamily: 'inherit',
                        transition: 'border-color 0.2s'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#ffc107'}
                      onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                    />
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                      <button
                        type="submit"
                        disabled={submitting || !commentText.trim()}
                        style={{
                          padding: '10px 24px',
                          background: submitting || !commentText.trim() ? '#ccc' : '#ffc107',
                          border: 'none',
                          borderRadius: '6px',
                          color: '#000',
                          fontWeight: '600',
                          fontSize: '14px',
                          cursor: submitting || !commentText.trim() ? 'not-allowed' : 'pointer',
                          transition: 'all 0.2s'
                        }}
                      >
                        {submitting ? replaceTranslation('Posting...', currentLang) : replaceTranslation('Post Comment', currentLang)}
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            ) : (
              <div style={{
                padding: '20px',
                background: '#f8f9fa',
                borderRadius: '8px',
                marginBottom: '30px',
                textAlign: 'center',
                border: '1px dashed #e0e0e0'
              }}>
                <p style={{ color: '#666', marginBottom: '12px' }}>{replaceTranslation('Please log in to leave a comment', currentLang)}</p>
                <button
                  onClick={openLoginModal}
                  style={{
                    padding: '10px 24px',
                    background: '#ffc107',
                    border: 'none',
                    borderRadius: '6px',
                    color: '#000',
                    fontWeight: '600',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  {replaceTranslation('Log In', currentLang)}
                </button>
              </div>
            )}

            {/* Comments List */}
            {comments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#999' }}>
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ margin: '0 auto 16px' }}>
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
                <p style={{ fontSize: '16px' }}>{replaceTranslation('No comments yet. Be the first to share your thoughts!', currentLang)}</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {comments.map((comment) => (
                  <div key={comment.id} style={{
                    padding: '16px',
                    background: '#f8f9fa',
                    borderRadius: '8px',
                    border: '1px solid #e8e8e8'
                  }}>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <div style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '50%',
                        background: '#ffc107',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#000',
                        fontWeight: '700',
                        fontSize: '18px',
                        flexShrink: 0
                      }}>
                        {(comment.user_name || comment.user?.name || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                          <div>
                            <div style={{ fontWeight: '600', color: '#1a1a1a', marginBottom: '2px' }}>
                              {comment.user_name || comment.user?.name || 'Anonymous'}
                            </div>
                            <div style={{ fontSize: '13px', color: '#999' }}>
                              {formatDate(comment.created_at || comment.createdAt)}
                            </div>
                          </div>
                          {user && (user.id === comment.user_id || user.role === 'admin') && (
                            <button
                              onClick={() => handleDeleteComment(comment.id)}
                              style={{
                                padding: '4px 10px',
                                background: 'transparent',
                                border: '1px solid #ef4444',
                                borderRadius: '4px',
                                color: '#ef4444',
                                fontSize: '12px',
                                cursor: 'pointer',
                                fontWeight: '600',
                                transition: 'all 0.2s'
                              }}
                              onMouseEnter={(e) => {
                                e.target.style.background = '#ef4444';
                                e.target.style.color = '#fff';
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.background = 'transparent';
                                e.target.style.color = '#ef4444';
                              }}
                            >
                              {replaceTranslation('Delete', currentLang)}
                            </button>
                          )}
                        </div>
                        <p style={{ color: '#333', lineHeight: '1.6', margin: 0, fontSize: '15px' }}>
                          {comment.content}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
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
              {replaceTranslation('Latest Predictions', currentLang)}
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
              {replaceTranslation('View All Predictions', currentLang)} →
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
          .blog-main-grid {
             padding: 0 16px;
          }
          .blog-breadcrumb {
             padding: 0 16px;
          }
        }
      `}</style>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={closeAuthModal}
        initialMode={authMode}
      />
    </div>
  );
}

export default BlogDetail;

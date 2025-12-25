import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Editor } from '@tinymce/tinymce-react';
import { fetchAllBlogsAdmin, createBlog, updateBlog, deleteBlog } from '../Service/BlogService';

function BlogAdmin() {
  const navigate = useNavigate();
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBlog, setEditingBlog] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    category: '',
    featured_image: '',
    tags: '',
    is_published: false,
    priority: 0
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    loadBlogs();
  }, []);

  const loadBlogs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token') || getCookie('token');

      if (!token) {
        navigate('/admin/login');
        return;
      }

      const data = await fetchAllBlogsAdmin({}, token);
      setBlogs(data.data);
    } catch (err) {
      console.error('Error loading blogs:', err);
      if (err.message.includes('401') || err.message.includes('403')) {
        navigate('/admin/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token') || getCookie('token');

      const blogData = {
        ...formData,
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : [],
        // Ensure priority is set (defaulting to 0 if not present, though state init handles it)
        priority: formData.priority || 0
      };

      if (editingBlog) {
        await updateBlog(editingBlog.id, blogData, token);
      } else {
        await createBlog(blogData, token);
      }

      setShowForm(false);
      setEditingBlog(null);
      resetForm();
      loadBlogs();
    } catch (err) {
      console.error('Error saving blog:', err);
      alert('Failed to save insight: ' + err.message);
    }
  };

  const handleEdit = (blog) => {
    setEditingBlog(blog);
    setFormData({
      title: blog.title,
      slug: blog.slug,
      content: blog.content,
      excerpt: blog.excerpt || '',
      category: blog.category || '',
      featured_image: blog.featured_image || '',
      tags: blog.tags ? (Array.isArray(blog.tags) ? blog.tags.join(', ') : blog.tags) : '',
      is_published: blog.is_published,
      priority: blog.priority || 0
    });
    setImagePreview(blog.featured_image || '');
    setImageFile(null);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this insight?')) return;

    try {
      const token = localStorage.getItem('token') || getCookie('token');
      await deleteBlog(id, token);
      loadBlogs();
    } catch (err) {
      console.error('Error deleting blog:', err);
      alert('Failed to delete insight: ' + err.message);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      slug: '',
      content: '',
      excerpt: '',
      category: '',
      featured_image: '',
      tags: '',
      is_published: false,
      priority: 0
    });
    setImageFile(null);
    setImagePreview('');
  };

  const handleImageFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        return;
      }

      setImageFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        setFormData({ ...formData, featured_image: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview('');
    setFormData({ ...formData, featured_image: '' });
  };

  const generateSlug = (title) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleTitleChange = (e) => {
    const title = e.target.value;
    setFormData(prev => ({
      ...prev,
      title,
      slug: generateSlug(title)
    }));
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{
          display: 'inline-block',
          width: '40px',
          height: '40px',
          border: '3px solid #f0f0f0',
          borderTopColor: '#ffc107',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <p style={{ marginTop: '16px', color: '#666', fontSize: '14px' }}>Loading...</p>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ padding: '28px 32px', maxWidth: '1400px' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <div>
          <h1 style={{
            margin: 0,
            fontSize: '22px',
            fontWeight: '600',
            color: '#1a1a1a'
          }}>
            Insights Management
          </h1>
          <p style={{
            margin: '4px 0 0',
            fontSize: '13px',
            color: '#666'
          }}>
            Create and manage insights
          </p>
        </div>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditingBlog(null);
            resetForm();
          }}
          style={{
            padding: '10px 20px',
            background: showForm ? '#f5f5f5' : '#ffc107',
            border: showForm ? '1px solid #d0d0d0' : 'none',
            borderRadius: '6px',
            color: showForm ? '#666' : '#000',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            if (!showForm) e.target.style.background = '#ffca2c';
          }}
          onMouseLeave={(e) => {
            if (!showForm) e.target.style.background = '#ffc107';
          }}
        >
          {showForm ? 'Cancel' : '+ New Insight'}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div style={{
          background: '#fff',
          border: '1px solid #e0e0e0',
          borderRadius: '8px',
          padding: '24px',
          marginBottom: '24px'
        }}>
          <h2 style={{
            margin: '0 0 20px',
            fontSize: '18px',
            fontWeight: '600',
            color: '#1a1a1a'
          }}>
            {editingBlog ? 'Edit Insight' : 'Create New Insight'}
          </h2>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#333', marginBottom: '6px' }}>
                Title *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={handleTitleChange}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  fontSize: '14px',
                  border: '1px solid #d0d0d0',
                  borderRadius: '6px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => e.target.style.borderColor = '#ffc107'}
                onBlur={(e) => e.target.style.borderColor = '#d0d0d0'}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#333', marginBottom: '6px' }}>
                Slug *
              </label>
              <input
                type="text"
                required
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  fontSize: '14px',
                  border: '1px solid #d0d0d0',
                  borderRadius: '6px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => e.target.style.borderColor = '#ffc107'}
                onBlur={(e) => e.target.style.borderColor = '#d0d0d0'}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#333', marginBottom: '6px' }}>
                Excerpt
              </label>
              <textarea
                value={formData.excerpt}
                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                rows="3"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  fontSize: '14px',
                  border: '1px solid #d0d0d0',
                  borderRadius: '6px',
                  outline: 'none',
                  resize: 'vertical',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => e.target.style.borderColor = '#ffc107'}
                onBlur={(e) => e.target.style.borderColor = '#d0d0d0'}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#333', marginBottom: '6px' }}>
                Content *
              </label>
              <div style={{ marginBottom: '24px' }}>
                <Editor
                  apiKey='8aly8qdet7kcmhmr4rnrnclma55ga0rutsoof97qj5023cgu' // Using free version, might show a warning in dev but works
                  value={formData.content}
                  onEditorChange={(content) => setFormData({ ...formData, content })}
                  init={{
                    height: 300,
                    menubar: false,
                    plugins: [
                      'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                      'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                      'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
                    ],
                    toolbar: 'undo redo | blocks | ' +
                      'bold italic forecolor | alignleft aligncenter ' +
                      'alignright alignjustify | bullist numlist outdent indent | ' +
                      'removeformat | help',
                    content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#333', marginBottom: '6px' }}>
                  Category
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    fontSize: '14px',
                    border: '1px solid #d0d0d0',
                    borderRadius: '6px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#ffc107'}
                  onBlur={(e) => e.target.style.borderColor = '#d0d0d0'}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#333', marginBottom: '6px' }}>
                  Featured Image
                </label>

                {/* Image Preview */}
                {(imagePreview || formData.featured_image) && (
                  <div style={{
                    marginBottom: '12px',
                    position: 'relative',
                    border: '1px solid #e0e0e0',
                    borderRadius: '6px',
                    overflow: 'hidden'
                  }}>
                    <img
                      src={imagePreview || formData.featured_image}
                      alt="Preview"
                      style={{
                        width: '100%',
                        height: '120px',
                        objectFit: 'cover',
                        display: 'block'
                      }}
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        background: 'rgba(0,0,0,0.6)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '6px 10px',
                        fontSize: '12px',
                        cursor: 'pointer',
                        fontWeight: '500'
                      }}
                    >
                      Remove
                    </button>
                  </div>
                )}

                {/* Upload Button */}
                {!imagePreview && !formData.featured_image && (
                  <div style={{ marginBottom: '8px' }}>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      style={{ display: 'none' }}
                      id="image-upload"
                    />
                    <label
                      htmlFor="image-upload"
                      style={{
                        display: 'inline-block',
                        padding: '10px 16px',
                        background: '#f8f8f8',
                        border: '1px dashed #d0d0d0',
                        borderRadius: '6px',
                        color: '#666',
                        fontSize: '13px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        textAlign: 'center',
                        width: '100%',
                        boxSizing: 'border-box'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background = '#f0f0f0';
                        e.target.style.borderColor = '#ffc107';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = '#f8f8f8';
                        e.target.style.borderColor = '#d0d0d0';
                      }}
                    >
                      📁 Upload Image
                    </label>
                  </div>
                )}

                {/* OR Divider */}
                {!imagePreview && !formData.featured_image && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    margin: '8px 0'
                  }}>
                    <div style={{ flex: 1, height: '1px', background: '#e0e0e0' }}></div>
                    <span style={{ fontSize: '12px', color: '#999', fontWeight: '500' }}>OR</span>
                    <div style={{ flex: 1, height: '1px', background: '#e0e0e0' }}></div>
                  </div>
                )}

                {/* URL Input */}
                {!imagePreview && !formData.featured_image && (
                  <input
                    type="text"
                    value={formData.featured_image}
                    onChange={(e) => setFormData({ ...formData, featured_image: e.target.value })}
                    placeholder="Or paste image URL"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      fontSize: '14px',
                      border: '1px solid #d0d0d0',
                      borderRadius: '6px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#ffc107'}
                    onBlur={(e) => e.target.style.borderColor = '#d0d0d0'}
                  />
                )}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#333', marginBottom: '6px' }}>
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="football, predictions, betting"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    fontSize: '14px',
                    border: '1px solid #d0d0d0',
                    borderRadius: '6px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#ffc107'}
                  onBlur={(e) => e.target.style.borderColor = '#d0d0d0'}
                />
              </div>
              {/* Priority field removed as per request */}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                id="is_published"
                checked={formData.is_published}
                onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
              />
              <label htmlFor="is_published" style={{ fontSize: '14px', color: '#333', cursor: 'pointer' }}>
                Publish immediately
              </label>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button
                type="submit"
                style={{
                  padding: '10px 24px',
                  background: '#ffc107',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#000',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.background = '#ffca2c'}
                onMouseLeave={(e) => e.target.style.background = '#ffc107'}
              >
                {editingBlog ? 'Update Insight' : 'Create Insight'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingBlog(null);
                  resetForm();
                }}
                style={{
                  padding: '10px 24px',
                  background: '#f5f5f5',
                  border: '1px solid #d0d0d0',
                  borderRadius: '6px',
                  color: '#666',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.background = '#e5e5e5'}
                onMouseLeave={(e) => e.target.style.background = '#f5f5f5'}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Blogs List */}
      <div style={{
        background: '#fff',
        border: '1px solid #e0e0e0',
        borderRadius: '8px',
        overflow: 'hidden'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: '#f8f8f8' }}>
            <tr>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#333', borderBottom: '1px solid #e0e0e0' }}>
                Title
              </th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#333', borderBottom: '1px solid #e0e0e0' }}>
                Category
              </th>
              <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '13px', fontWeight: '600', color: '#333', borderBottom: '1px solid #e0e0e0' }}>
                Status
              </th>
              <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '13px', fontWeight: '600', color: '#333', borderBottom: '1px solid #e0e0e0' }}>
                Views
              </th>
              <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '13px', fontWeight: '600', color: '#333', borderBottom: '1px solid #e0e0e0' }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {blogs.map((blog) => (
              <tr key={blog.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                <td style={{ padding: '14px 16px' }}>
                  <div style={{ fontSize: '14px', fontWeight: '500', color: '#1a1a1a', marginBottom: '3px' }}>
                    {blog.title}
                  </div>
                  <div style={{ fontSize: '12px', color: '#999' }}>
                    /blog/{blog.slug}
                  </div>
                </td>
                <td style={{ padding: '14px 16px', fontSize: '14px', color: '#666' }}>
                  {blog.category || '-'}
                </td>
                <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                  <span style={{
                    padding: '4px 10px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '500',
                    background: blog.is_published ? '#e8f5e9' : '#fff3cd',
                    color: blog.is_published ? '#2e7d32' : '#856404'
                  }}>
                    {blog.is_published ? 'Published' : 'Draft'}
                  </span>
                </td>
                <td style={{ padding: '14px 16px', textAlign: 'center', fontSize: '14px', color: '#666' }}>
                  {blog.view_count || 0}
                </td>
                <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                  <button
                    onClick={() => handleEdit(blog)}
                    style={{
                      padding: '7px 14px',
                      background: '#fff3cd',
                      border: 'none',
                      borderRadius: '5px',
                      color: '#856404',
                      fontSize: '13px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      marginRight: '8px',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.background = '#ffe69c'}
                    onMouseLeave={(e) => e.target.style.background = '#fff3cd'}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(blog.id)}
                    style={{
                      padding: '7px 14px',
                      background: '#ffe5e5',
                      border: 'none',
                      borderRadius: '5px',
                      color: '#d32f2f',
                      fontSize: '13px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.background = '#ffcccc'}
                    onMouseLeave={(e) => e.target.style.background = '#ffe5e5'}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {blogs.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: '#999',
            fontSize: '14px'
          }}>
            No insights yet. Create your first insight!
          </div>
        )}
      </div>
    </div>
  );
}

export default BlogAdmin;

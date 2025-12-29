// Service/BlogService.jsx
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ||
  (window.location.hostname === 'localhost'
    ? 'http://localhost:3000'
    : 'https://livebaz.com');

// Fetch all blogs with filters
export const fetchBlogs = async (filters = {}) => {
  try {
    const queryParams = new URLSearchParams();

    if (filters.category) queryParams.append('category', filters.category);
    if (filters.tag) queryParams.append('tag', filters.tag);
    if (filters.page) queryParams.append('page', filters.page);
    if (filters.limit) queryParams.append('limit', filters.limit);
    if (filters.search) queryParams.append('search', filters.search);

    const url = `${API_BASE_URL}/api/v1/blogs${queryParams.toString() ? `?${queryParams}` : ''}`;
    console.log('Fetching blogs from:', url);
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Blogs response:', data);

    if (data.success) {
      return data;
    }
    throw new Error(data.message || 'Failed to fetch blogs');
  } catch (error) {
    console.error('Error fetching blogs:', error);
    throw error;
  }
};

// Fetch single blog by slug
export const fetchBlogBySlug = async (slug) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/blogs/${slug}`);
    const data = await response.json();

    if (data.success) {
      return data.data;
    }
    throw new Error(data.message || 'Blog not found');
  } catch (error) {
    console.error('Error fetching blog:', error);
    throw error;
  }
};

// Fetch trending blogs
export const fetchTrendingBlogs = async (limit = 5) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/blogs/trending?limit=${limit}`);
    const data = await response.json();

    if (data.success) {
      return data.data;
    }
    throw new Error(data.message || 'Failed to fetch trending blogs');
  } catch (error) {
    console.error('Error fetching trending blogs:', error);
    throw error;
  }
};

// Fetch related blogs
export const fetchRelatedBlogs = async (slug, limit = 3) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/blogs/${slug}/related?limit=${limit}`);
    const data = await response.json();

    if (data.success) {
      return data.data;
    }
    throw new Error(data.message || 'Failed to fetch related blogs');
  } catch (error) {
    console.error('Error fetching related blogs:', error);
    return [];
  }
};

// Fetch blog categories
export const fetchCategories = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/blogs/categories`);
    const data = await response.json();

    if (data.success) {
      return data.data;
    }
    throw new Error(data.message || 'Failed to fetch categories');
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
};

// Admin: Create blog
export const createBlog = async (blogData, token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/blogs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      credentials: 'include',
      body: JSON.stringify(blogData)
    });

    const data = await response.json();

    if (data.success) {
      return data.data;
    }
    throw new Error(data.message || 'Failed to create blog');
  } catch (error) {
    console.error('Error creating blog:', error);
    throw error;
  }
};

// Admin: Update blog
export const updateBlog = async (id, blogData, token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/blogs/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      credentials: 'include',
      body: JSON.stringify(blogData)
    });

    const data = await response.json();

    if (data.success) {
      return data.data;
    }
    throw new Error(data.message || 'Failed to update blog');
  } catch (error) {
    console.error('Error updating blog:', error);
    throw error;
  }
};

// Admin: Delete blog
export const deleteBlog = async (id, token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/blogs/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      credentials: 'include'
    });

    const data = await response.json();

    if (data.success) {
      return data;
    }
    throw new Error(data.message || 'Failed to delete blog');
  } catch (error) {
    console.error('Error deleting blog:', error);
    throw error;
  }
};

// Admin: Fetch all blogs (including unpublished)
export const fetchAllBlogsAdmin = async (filters = {}, token) => {
  try {
    const queryParams = new URLSearchParams();

    if (filters.status) queryParams.append('status', filters.status);
    if (filters.page) queryParams.append('page', filters.page);
    if (filters.limit) queryParams.append('limit', filters.limit);

    const url = `${API_BASE_URL}/api/v1/admin/blogs${queryParams.toString() ? `?${queryParams}` : ''}`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      credentials: 'include'
    });

    const data = await response.json();

    if (data.success) {
      return data;
    }
    throw new Error(data.message || 'Failed to fetch blogs');
  } catch (error) {
    console.error('Error fetching blogs (admin):', error);
    throw error;
  }
};

// Fetch comments for a blog
export const fetchComments = async (blogId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/blogs/${blogId}/comments`);
    const data = await response.json();

    if (data.success) {
      return data.data;
    }
    throw new Error(data.message || 'Failed to fetch comments');
  } catch (error) {
    console.error('Error fetching comments:', error);
    return [];
  }
};

// Post a comment
export const postComment = async (blogId, commentData, token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/blogs/${blogId}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      credentials: 'include',
      body: JSON.stringify(commentData)
    });

    const data = await response.json();

    if (data.success) {
      return data.data;
    }
    throw new Error(data.message || 'Failed to post comment');
  } catch (error) {
    console.error('Error posting comment:', error);
    throw error;
  }
};

// Delete a comment
export const deleteComment = async (blogId, commentId, token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/blogs/${blogId}/comments/${commentId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      credentials: 'include'
    });

    const data = await response.json();

    if (data.success) {
      return data;
    }
    throw new Error(data.message || 'Failed to delete comment');
  } catch (error) {
    console.error('Error deleting comment:', error);
    throw error;
  }
};

// Admin: Fetch blog analytics
export const fetchBlogAnalytics = async (token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/blogs/analytics`, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      credentials: 'include'
    });

    const data = await response.json();

    if (data.success) {
      return data.data;
    }
    throw new Error(data.message || 'Failed to fetch analytics');
  } catch (error) {
    console.error('Error fetching analytics:', error);
    throw error;
  }
};

export default {
  fetchBlogs,
  fetchBlogBySlug,
  fetchTrendingBlogs,
  fetchRelatedBlogs,
  fetchCategories,
  createBlog,
  updateBlog,
  deleteBlog,
  fetchAllBlogsAdmin,
  fetchComments,
  postComment,
  deleteComment,
  fetchBlogAnalytics
};

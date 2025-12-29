import React, { useState, useEffect } from 'react';
import axios from 'axios';

const TranslationAdmin = () => {
    const [translations, setTranslations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        original_word: '',
        wrong_translation: '',
        correct_translation: '',
        language_code: 'fa'
    });

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

    useEffect(() => {
        fetchTranslations();
    }, []);

    const fetchTranslations = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/v1/translations`);
            if (response.data.success) {
                setTranslations(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching translations:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (editingId) {
                const response = await axios.put(`${API_URL}/api/v1/translations/${editingId}`, formData);
                if (response.data.success) {
                    alert('Translation updated successfully!');
                    setEditingId(null);
                }
            } else {
                const response = await axios.post(`${API_URL}/api/v1/translations`, formData);
                if (response.data.success) {
                    alert('Translation saved successfully!');
                }
            }

            setFormData({
                original_word: '',
                wrong_translation: '',
                correct_translation: '',
                language_code: 'fa'
            });
            fetchTranslations();

            // Reload translations in the app
            try {
                const { reloadTranslations } = await import('../utils/translationReplacer.jsx');
                await reloadTranslations();
            } catch (reloadError) {
                console.error('Failed to hot-reload translations:', reloadError);
            }
        } catch (error) {
            alert('Error: ' + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (trans) => {
        setEditingId(trans.id);
        setFormData({
            original_word: trans.original_word,
            wrong_translation: trans.wrong_translation,
            correct_translation: trans.correct_translation,
            language_code: trans.language_code
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this translation?')) return;

        try {
            const response = await axios.delete(`${API_URL}/api/v1/translations/${id}`);
            if (response.data.success) {
                alert('Translation deleted successfully!');
                fetchTranslations();
            }
        } catch (error) {
            alert('Error: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleCancel = () => {
        setEditingId(null);
        setFormData({
            original_word: '',
            wrong_translation: '',
            correct_translation: '',
            language_code: 'fa'
        });
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
            <h1 style={{ marginBottom: '30px', color: '#333' }}>Translation Management</h1>

            {/* Add/Edit Translation Form */}
            <div style={{
                backgroundColor: '#fff',
                padding: '30px',
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                marginBottom: '30px'
            }}>
                <h2 style={{ marginBottom: '20px', fontSize: '20px' }}>
                    {editingId ? 'Edit Translation' : 'Add New Translation'}
                </h2>
                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                                Original Word (English)
                            </label>
                            <input
                                type="text"
                                name="original_word"
                                value={formData.original_word}
                                onChange={handleChange}
                                required
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                    fontSize: '14px'
                                }}
                                placeholder="e.g., Football"
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                                Language Code
                            </label>
                            <select
                                name="language_code"
                                value={formData.language_code}
                                onChange={handleChange}
                                required
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                    fontSize: '14px'
                                }}
                            >
                                <option value="fa">Persian (fa)</option>
                                <option value="ar">Arabic (ar)</option>
                                <option value="es">Spanish (es)</option>
                                <option value="fr">French (fr)</option>
                                <option value="de">German (de)</option>
                                <option value="tr">Turkish (tr)</option>
                            </select>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                                Incorrect Translation (from Google)
                            </label>
                            <input
                                type="text"
                                name="wrong_translation"
                                value={formData.wrong_translation}
                                onChange={handleChange}
                                required
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                    fontSize: '14px'
                                }}
                                placeholder="The wrong text that appears"
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                                Correct Translation (what to show)
                            </label>
                            <input
                                type="text"
                                name="correct_translation"
                                value={formData.correct_translation}
                                onChange={handleChange}
                                required
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                    fontSize: '14px'
                                }}
                                placeholder="The correct text to display"
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                backgroundColor: loading ? '#ccc' : '#000',
                                color: '#fff',
                                padding: '12px 30px',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '16px',
                                fontWeight: '600',
                                cursor: loading ? 'not-allowed' : 'pointer'
                            }}
                        >
                            {loading ? 'Saving...' : editingId ? 'Update Translation' : 'Save Translation'}
                        </button>

                        {editingId && (
                            <button
                                type="button"
                                onClick={handleCancel}
                                style={{
                                    backgroundColor: '#f5f5f5',
                                    color: '#666',
                                    padding: '12px 30px',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                    fontSize: '16px',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                }}
                            >
                                Cancel
                            </button>
                        )}
                    </div>
                </form>
            </div>

            {/* Translations List */}
            <div style={{
                backgroundColor: '#fff',
                padding: '30px',
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
                <h2 style={{ marginBottom: '20px', fontSize: '20px' }}>
                    Saved Translations ({translations.length})
                </h2>

                {translations.length === 0 ? (
                    <p style={{ color: '#999', textAlign: 'center', padding: '40px' }}>
                        No translations saved yet
                    </p>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#f8f8f8', borderBottom: '2px solid #ddd' }}>
                                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Original</th>
                                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Incorrect (Google)</th>
                                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Correct (Fixed)</th>
                                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Language</th>
                                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Date</th>
                                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {translations.map((trans) => (
                                    <tr key={trans.id} style={{ borderBottom: '1px solid #eee' }}>
                                        <td style={{ padding: '12px' }}>{trans.original_word}</td>
                                        <td style={{ padding: '12px' }}>{trans.wrong_translation}</td>
                                        <td style={{ padding: '12px', fontWeight: '600', color: '#00c853' }}>
                                            {trans.correct_translation}
                                        </td>
                                        <td style={{ padding: '12px' }}>
                                            <span style={{
                                                backgroundColor: '#e3f2fd',
                                                color: '#1976d2',
                                                padding: '4px 8px',
                                                borderRadius: '4px',
                                                fontSize: '12px',
                                                fontWeight: '600'
                                            }}>
                                                {trans.language_code}
                                            </span>
                                        </td>
                                        <td style={{ padding: '12px', fontSize: '12px', color: '#666' }}>
                                            {new Date(trans.created_at).toLocaleDateString()}
                                        </td>
                                        <td style={{ padding: '12px', textAlign: 'center' }}>
                                            <button
                                                onClick={() => handleEdit(trans)}
                                                style={{
                                                    backgroundColor: '#2196f3',
                                                    color: '#fff',
                                                    padding: '6px 12px',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    fontSize: '12px',
                                                    fontWeight: '600',
                                                    cursor: 'pointer',
                                                    marginRight: '8px'
                                                }}
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(trans.id)}
                                                style={{
                                                    backgroundColor: '#f44336',
                                                    color: '#fff',
                                                    padding: '6px 12px',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    fontSize: '12px',
                                                    fontWeight: '600',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TranslationAdmin;

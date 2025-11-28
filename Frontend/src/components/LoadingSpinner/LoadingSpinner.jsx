import React from 'react';
import './LoadingSpinner.css';

const LoadingSpinner = ({ size = 'medium', text = '' }) => {
    const sizes = {
        small: '30px',
        medium: '40px',
        large: '60px'
    };

    return (
        <div className="loading-spinner-wrapper">
            <div
                className="loading-spinner"
                style={{
                    width: sizes[size],
                    height: sizes[size]
                }}
            ></div>
            {text && <p className="loading-text">{text}</p>}
        </div>
    );
};

export default LoadingSpinner;

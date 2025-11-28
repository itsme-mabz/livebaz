import React from 'react';
import './SkeletonLoader.css';

// Base Skeleton component
export const Skeleton = ({ width = '100%', height = '20px', borderRadius = '4px', marginBottom = '0' }) => (
    <div
        className="skeleton"
        style={{ width, height, borderRadius, marginBottom }}
    />
);

// Prediction Card Skeleton
export const PredictionCardSkeleton = () => (
    <div className="forecast-item skeleton-card">
        <div className="forecast-item__top">
            <Skeleton height="140px" borderRadius="8px 8px 0 0" />
        </div>
        <div className="forecast-item__bottom" style={{ padding: '16px' }}>
            <div style={{ marginBottom: '12px' }}>
                <Skeleton width="80px" height="20px" marginBottom="8px" />
                <Skeleton width="120px" height="16px" />
            </div>
            <Skeleton width="100%" height="24px" marginBottom="8px" />
            <Skeleton width="70%" height="16px" />
        </div>
    </div>
);

// League Item Skeleton (for grid display)
export const LeagueItemSkeleton = () => (
    <div className="leagues-pop-item skeleton-card" style={{ padding: '20px' }}>
        <Skeleton width="80px" height="80px" borderRadius="50%" marginBottom="12px" />
        <Skeleton width="100%" height="18px" marginBottom="8px" />
        <Skeleton width="60%" height="14px" />
    </div>
);

// Table Row Skeleton (for match predictions)
export const TableRowSkeleton = ({ columns = 6 }) => (
    <div className="match-row skeleton-row" style={{
        display: 'grid',
        gridTemplateColumns: '55px 200px 135px 75px 75px 1fr',
        padding: '16px 24px',
        gap: '16px',
        alignItems: 'center'
    }}>
        <Skeleton width="40px" height="16px" />
        <div>
            <Skeleton width="150px" height="14px" marginBottom="8px" />
            <Skeleton width="100%" height="16px" marginBottom="4px" />
            <Skeleton width="100%" height="16px" />
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
            <Skeleton width="42px" height="50px" borderRadius="6px" />
            <Skeleton width="42px" height="50px" borderRadius="6px" />
            <Skeleton width="42px" height="50px" borderRadius="6px" />
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
            <Skeleton width="35px" height="50px" borderRadius="6px" />
            <Skeleton width="35px" height="50px" borderRadius="6px" />
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
            <Skeleton width="35px" height="50px" borderRadius="6px" />
            <Skeleton width="35px" height="50px" borderRadius="6px" />
        </div>
        <Skeleton width="140px" height="60px" borderRadius="8px" />
    </div>
);

// Live Score Row Skeleton
export const LiveScoreRowSkeleton = () => (
    <div className="match-row skeleton-row" style={{
        display: 'grid',
        gridTemplateColumns: '55px 1fr 80px',
        padding: '16px 24px',
        gap: '16px',
        alignItems: 'center'
    }}>
        <Skeleton width="40px" height="16px" />
        <div>
            <Skeleton width="120px" height="14px" marginBottom="8px" />
            <Skeleton width="100%" height="16px" marginBottom="4px" />
            <Skeleton width="100%" height="16px" />
        </div>
        <Skeleton width="60px" height="24px" />
    </div>
);

// League Accordion Skeleton
export const LeagueAccordionSkeleton = () => (
    <div className="simple-box skeleton-card" style={{ marginBottom: '8px' }}>
        <div style={{ padding: '16px' }}>
            <Skeleton width="200px" height="20px" />
        </div>
    </div>
);

// Standings Table Row Skeleton
export const StandingsRowSkeleton = () => (
    <div style={{
        display: 'grid',
        gridTemplateColumns: '40px 1fr 60px 60px 60px 60px 60px',
        padding: '12px 16px',
        gap: '12px',
        alignItems: 'center',
        borderBottom: '1px solid #f0f0f0'
    }}>
        <Skeleton width="30px" height="16px" />
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Skeleton width="24px" height="24px" borderRadius="50%" />
            <Skeleton width="150px" height="16px" />
        </div>
        <Skeleton width="30px" height="16px" />
        <Skeleton width="30px" height="16px" />
        <Skeleton width="30px" height="16px" />
        <Skeleton width="30px" height="16px" />
        <Skeleton width="30px" height="16px" />
    </div>
);

// Match Detail Skeleton
export const MatchDetailSkeleton = () => (
    <div className="skeleton-card" style={{ padding: '40px', borderRadius: '12px' }}>
        <Skeleton width="200px" height="16px" marginBottom="24px" />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
            <div style={{ textAlign: 'center' }}>
                <Skeleton width="80px" height="80px" borderRadius="50%" marginBottom="12px" />
                <Skeleton width="150px" height="24px" marginBottom="8px" />
                <Skeleton width="100px" height="16px" />
            </div>
            <div style={{ textAlign: 'center' }}>
                <Skeleton width="120px" height="48px" marginBottom="8px" />
                <Skeleton width="100px" height="16px" />
            </div>
            <div style={{ textAlign: 'center' }}>
                <Skeleton width="80px" height="80px" borderRadius="50%" marginBottom="12px" />
                <Skeleton width="150px" height="24px" marginBottom="8px" />
                <Skeleton width="100px" height="16px" />
            </div>
        </div>
        <Skeleton width="100%" height="200px" borderRadius="8px" />
    </div>
);

// Full Page Skeleton Loaders
export const PredictionsPageSkeleton = () => (
    <div className="forecasts__wrapper">
        {[1, 2, 3, 4, 5, 6].map(i => (
            <PredictionCardSkeleton key={i} />
        ))}
    </div>
);

export const LeaguesGridSkeleton = () => (
    <div className="leagues-pop">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(i => (
            <LeagueItemSkeleton key={i} />
        ))}
    </div>
);

export const TableSkeleton = ({ rows = 10 }) => (
    <div className="predictions-table-body">
        {Array.from({ length: rows }).map((_, i) => (
            <TableRowSkeleton key={i} />
        ))}
    </div>
);

export const LiveScoreTableSkeleton = ({ rows = 10 }) => (
    <div className="predictions-table-body">
        {Array.from({ length: rows }).map((_, i) => (
            <LiveScoreRowSkeleton key={i} />
        ))}
    </div>
);

export const StandingsTableSkeleton = ({ rows = 20 }) => (
    <div>
        {Array.from({ length: rows }).map((_, i) => (
            <StandingsRowSkeleton key={i} />
        ))}
    </div>
);

export const LeagueAccordionListSkeleton = ({ items = 10 }) => (
    <div className="leagues-accordion">
        {Array.from({ length: items }).map((_, i) => (
            <LeagueAccordionSkeleton key={i} />
        ))}
    </div>
);

export default Skeleton;

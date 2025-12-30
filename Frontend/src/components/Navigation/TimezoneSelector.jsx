import React from 'react';
import { useTimezone } from '../../context/TimezoneContext';
import { MdAccessTime } from "react-icons/md";
import './TimezoneSelector.css';

const TIMEZONES = [
    { value: 'auto', label: 'Auto (Local)' },
    { value: 'UTC-11:00', label: 'UTC-11:00' },
    { value: 'UTC-10:00', label: 'UTC-10:00' },
    { value: 'UTC-09:30', label: 'UTC-09:30' },
    { value: 'UTC-09:00', label: 'UTC-09:00' },
    { value: 'UTC-08:00', label: 'UTC-08:00' },
    { value: 'UTC-07:00', label: 'UTC-07:00' },
    { value: 'UTC-06:00', label: 'UTC-06:00' },
    { value: 'UTC-05:00', label: 'UTC-05:00' },
    { value: 'UTC-04:00', label: 'UTC-04:00' },
    { value: 'UTC-03:30', label: 'UTC-03:30' },
    { value: 'UTC-03:00', label: 'UTC-03:00' },
    { value: 'UTC-02:00', label: 'UTC-02:00' },
    { value: 'UTC-01:00', label: 'UTC-01:00' },
    { value: 'UTC+00:00', label: 'UTC+00:00' },
    { value: 'UTC+01:00', label: 'UTC+01:00' },
    { value: 'UTC+02:00', label: 'UTC+02:00' },
    { value: 'UTC+03:00', label: 'UTC+03:00' },
    { value: 'UTC+03:30', label: 'UTC+03:30' },
    { value: 'UTC+04:00', label: 'UTC+04:00' },
    { value: 'UTC+04:30', label: 'UTC+04:30' },
    { value: 'UTC+05:00', label: 'UTC+05:00' },
    { value: 'UTC+05:30', label: 'UTC+05:30' },
    { value: 'UTC+05:45', label: 'UTC+05:45' },
    { value: 'UTC+06:00', label: 'UTC+06:00' },
    { value: 'UTC+06:30', label: 'UTC+06:30' },
    { value: 'UTC+07:00', label: 'UTC+07:00' },
    { value: 'UTC+08:00', label: 'UTC+08:00' },
    { value: 'UTC+08:45', label: 'UTC+08:45' },
    { value: 'UTC+09:00', label: 'UTC+09:00' },
    { value: 'UTC+09:30', label: 'UTC+09:30' },
    { value: 'UTC+10:00', label: 'UTC+10:00' },
    { value: 'UTC+10:30', label: 'UTC+10:30' },
    { value: 'UTC+11:00', label: 'UTC+11:00' },
    { value: 'UTC+12:00', label: 'UTC+12:00' },
    { value: 'UTC+13:00', label: 'UTC+13:00' },
    { value: 'UTC+13:45', label: 'UTC+13:45' },
    { value: 'UTC+14:00', label: 'UTC+14:00' }
];

const TimezoneSelector = () => {
    const { currentTimezone, changeTimezone } = useTimezone();

    return (
        <div className="timezone-selector-wrapper">
            <div className="timezone-icon">
                <MdAccessTime size={20} />
            </div>
            <select
                value={currentTimezone}
                onChange={(e) => changeTimezone(e.target.value)}
                className="timezone-select"
            >
                {TIMEZONES.map((tz) => (
                    <option key={tz.value} value={tz.value}>
                        {tz.label}
                    </option>
                ))}
            </select>
        </div>
    );
};

export default TimezoneSelector;

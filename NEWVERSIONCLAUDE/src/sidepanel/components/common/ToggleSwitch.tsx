import React from 'react';
import './ToggleSwitch.css';

interface ToggleSwitchProps {
    id: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    label: string;
}

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ id, checked, onChange, label }) => {
    return (
        <div className="toggle-switch-container">
            <label className="toggle-switch" htmlFor={id}>
                <input
                    type="checkbox"
                    id={id}
                    checked={checked}
                    onChange={(e) => onChange(e.target.checked)}
                />
                <span className="slider"></span>
            </label>
            <span className="toggle-label">{label}</span>
        </div>
    );
};

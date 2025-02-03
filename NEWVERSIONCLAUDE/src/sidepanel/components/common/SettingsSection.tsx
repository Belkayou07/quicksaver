import React from 'react';
import './SettingsSection.css';

interface SettingsSectionProps {
    title: string;
    children: React.ReactNode;
}

export const SettingsSection: React.FC<SettingsSectionProps> = ({ title, children }) => {
    return (
        <section className="settings-section">
            <h2>{title}</h2>
            <div className="settings-content">
                {children}
            </div>
        </section>
    );
};

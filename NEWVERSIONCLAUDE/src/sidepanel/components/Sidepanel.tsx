import React, { useState } from 'react';
import { CountrySelector } from './CountrySelector/CountrySelector';
import { CurrencySelector } from './CurrencySettings';
import { DisplayToggles } from './DisplaySettings';
import { SettingsSection } from './common';
import '../styles.css';

export const Sidepanel: React.FC = () => {
    const [settings, setSettings] = useState({
        currencyCode: 'USD',
        priceComparisonEnabled: true,
        shippingCalculationEnabled: true,
        flagDisplayEnabled: true,
        priceIndicatorEnabled: true,
    });

    const handleSettingChange = (setting: string, value: boolean | string) => {
        setSettings(prev => ({
            ...prev,
            [setting]: value
        }));
    };

    return (
        <div className="sidepanel">
            <header className="sidepanel-header">
                <h1>Quick-Saver Settings</h1>
            </header>
            <main className="sidepanel-content">
                <SettingsSection title="Region Settings">
                    <CountrySelector />
                </SettingsSection>

                <CurrencySelector
                    selectedCurrency={settings.currencyCode}
                    onCurrencyChange={(value) => handleSettingChange('currencyCode', value)}
                />

                <DisplayToggles
                    settings={settings}
                    onSettingChange={handleSettingChange}
                />
            </main>
        </div>
    );
};

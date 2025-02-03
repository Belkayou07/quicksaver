import React from 'react';
import { SettingsSection, ToggleSwitch } from '../common';
import './DisplayToggles.css';

interface DisplayTogglesProps {
    settings: {
        priceComparisonEnabled: boolean;
        shippingCalculationEnabled: boolean;
        flagDisplayEnabled: boolean;
        priceIndicatorEnabled: boolean;
    };
    onSettingChange: (setting: string, value: boolean) => void;
}

export const DisplayToggles: React.FC<DisplayTogglesProps> = ({
    settings,
    onSettingChange,
}) => {
    return (
        <SettingsSection title="Display Settings">
            <div className="display-toggles">
                <ToggleSwitch
                    id="price-comparison"
                    checked={settings.priceComparisonEnabled}
                    onChange={(checked) => onSettingChange('priceComparisonEnabled', checked)}
                    label="Enable Price Comparison"
                />
                
                <ToggleSwitch
                    id="shipping-calculation"
                    checked={settings.shippingCalculationEnabled}
                    onChange={(checked) => onSettingChange('shippingCalculationEnabled', checked)}
                    label="Include Shipping Fees"
                />
                
                <ToggleSwitch
                    id="flag-display"
                    checked={settings.flagDisplayEnabled}
                    onChange={(checked) => onSettingChange('flagDisplayEnabled', checked)}
                    label="Show Country Flags"
                />
                
                <ToggleSwitch
                    id="price-indicator"
                    checked={settings.priceIndicatorEnabled}
                    onChange={(checked) => onSettingChange('priceIndicatorEnabled', checked)}
                    label="Show Price Indicators"
                />
            </div>
        </SettingsSection>
    );
};

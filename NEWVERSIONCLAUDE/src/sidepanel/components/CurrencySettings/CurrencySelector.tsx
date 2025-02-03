import React from 'react';
import { SettingsSection } from '../common';
import './CurrencySelector.css';

interface CurrencySelectorProps {
    selectedCurrency: string;
    onCurrencyChange: (currency: string) => void;
}

const currencies = [
    { code: 'USD', name: 'US Dollar' },
    { code: 'EUR', name: 'Euro' },
    { code: 'GBP', name: 'British Pound' },
    { code: 'JPY', name: 'Japanese Yen' },
    { code: 'AUD', name: 'Australian Dollar' },
    { code: 'CAD', name: 'Canadian Dollar' },
    { code: 'CHF', name: 'Swiss Franc' },
    { code: 'CNY', name: 'Chinese Yuan' },
];

export const CurrencySelector: React.FC<CurrencySelectorProps> = ({
    selectedCurrency,
    onCurrencyChange,
}) => {
    return (
        <SettingsSection title="Currency Settings">
            <div className="currency-selector">
                <label htmlFor="currency">Display Currency:</label>
                <select
                    id="currency"
                    value={selectedCurrency}
                    onChange={(e) => onCurrencyChange(e.target.value)}
                >
                    {currencies.map(currency => (
                        <option key={currency.code} value={currency.code}>
                            {currency.name} ({currency.code})
                        </option>
                    ))}
                </select>
            </div>
        </SettingsSection>
    );
};

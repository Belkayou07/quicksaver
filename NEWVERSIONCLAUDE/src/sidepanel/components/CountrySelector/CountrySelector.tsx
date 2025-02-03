import React, { useState } from 'react';
import './CountrySelector.css';

interface Country {
    code: string;
    name: string;
    domain: string;
}

interface CountryGroup {
    title: string;
    countries: Country[];
}

const COUNTRY_GROUPS: CountryGroup[] = [
    {
        title: 'Major Markets',
        countries: [
            { code: 'us', name: 'US', domain: '.com' },
            { code: 'uk', name: 'UK', domain: '.co.uk' },
            { code: 'de', name: 'DE', domain: '.de' },
            { code: 'fr', name: 'FR', domain: '.fr' },
            { code: 'jp', name: 'JP', domain: '.co.jp' },
        ]
    },
    {
        title: 'Europe',
        countries: [
            { code: 'it', name: 'IT', domain: '.it' },
            { code: 'es', name: 'ES', domain: '.es' },
            { code: 'nl', name: 'NL', domain: '.nl' },
            { code: 'pl', name: 'PL', domain: '.pl' },
            { code: 'se', name: 'SE', domain: '.se' },
            { code: 'be', name: 'BE', domain: '.be' },
        ]
    },
    {
        title: 'Americas & Asia',
        countries: [
            { code: 'ca', name: 'CA', domain: '.ca' },
            { code: 'mx', name: 'MX', domain: '.mx' },
            { code: 'br', name: 'BR', domain: '.br' },
            { code: 'in', name: 'IN', domain: '.in' },
            { code: 'au', name: 'AU', domain: '.au' },
            { code: 'sg', name: 'SG', domain: '.sg' },
        ]
    },
    {
        title: 'Middle East',
        countries: [
            { code: 'ae', name: 'UAE', domain: '.ae' },
            { code: 'sa', name: 'SA', domain: '.sa' },
            { code: 'tr', name: 'TR', domain: '.tr' },
        ]
    }
];

export const CountrySelector: React.FC = () => {
    const [selectedCountries, setSelectedCountries] = useState<string[]>(['us', 'uk', 'de']);

    const toggleCountry = (code: string) => {
        setSelectedCountries(prev => {
            if (prev.includes(code)) {
                return prev.filter(c => c !== code);
            }
            return [...prev, code];
        });
    };

    return (
        <div className="country-selector">
            <div className="selector-header">
                <span>Compare prices across</span>
                <span className="selected-count">{selectedCountries.length} regions</span>
            </div>
            <div className="country-groups">
                {COUNTRY_GROUPS.map(group => (
                    <div key={group.title} className="country-group">
                        <div className="group-title">{group.title}</div>
                        <div className="country-buttons">
                            {group.countries.map(country => (
                                <button
                                    key={country.code}
                                    className={`country-btn ${selectedCountries.includes(country.code) ? 'selected' : ''}`}
                                    onClick={() => toggleCountry(country.code)}
                                    title={`Amazon${country.domain}`}
                                >
                                    <img
                                        src={`/assets/flags/${country.code}.png`}
                                        alt={country.code}
                                        className="country-flag"
                                    />
                                    {country.name}
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

import React, { useEffect, useState } from 'react';
import { MARKETPLACES } from '../../config/marketplaces';
import './Popup.css';

interface Settings {
  selectedMarketplaces: string[];
  autoConvertPrices: boolean;
  notifyOnPriceDrops: boolean;
  priceDropThreshold: number;
}

const DEFAULT_SETTINGS: Settings = {
  selectedMarketplaces: Object.keys(MARKETPLACES),
  autoConvertPrices: true,
  notifyOnPriceDrops: true,
  priceDropThreshold: 10
};

export const Popup: React.FC = () => {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [status, setStatus] = useState<string>('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const result = await chrome.storage.local.get('settings');
      if (result.settings) {
        setSettings(result.settings);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      setStatus('Error loading settings');
    }
  };

  const saveSettings = async (newSettings: Settings) => {
    try {
      await chrome.storage.local.set({ settings: newSettings });
      setSettings(newSettings);
      setStatus('Settings saved successfully');
      setTimeout(() => setStatus(''), 2000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setStatus('Error saving settings');
    }
  };

  const handleMarketplaceToggle = (marketplace: string) => {
    const newSelectedMarketplaces = settings.selectedMarketplaces.includes(marketplace)
      ? settings.selectedMarketplaces.filter(m => m !== marketplace)
      : [...settings.selectedMarketplaces, marketplace];

    saveSettings({
      ...settings,
      selectedMarketplaces: newSelectedMarketplaces
    });
  };

  const handleToggle = (setting: keyof Settings) => {
    if (typeof settings[setting] === 'boolean') {
      saveSettings({
        ...settings,
        [setting]: !settings[setting]
      });
    }
  };

  const handleThresholdChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value);
    if (!isNaN(value) && value >= 0) {
      saveSettings({
        ...settings,
        priceDropThreshold: value
      });
    }
  };

  return (
    <div className="popup">
      <h1>Quick-Saver Settings</h1>

      <section className="settings-section">
        <h2>Marketplaces</h2>
        <div className="marketplace-list">
          {Object.entries(MARKETPLACES).map(([domain, info]) => (
            <label key={domain} className="marketplace-item">
              <input
                type="checkbox"
                checked={settings.selectedMarketplaces.includes(domain)}
                onChange={() => handleMarketplaceToggle(domain)}
              />
              <span className="marketplace-name">
                {info.region} ({info.currency})
              </span>
            </label>
          ))}
        </div>
      </section>

      <section className="settings-section">
        <h2>Price Settings</h2>
        <label className="setting-item">
          <input
            type="checkbox"
            checked={settings.autoConvertPrices}
            onChange={() => handleToggle('autoConvertPrices')}
          />
          <span>Automatically convert prices to local currency</span>
        </label>

        <label className="setting-item">
          <input
            type="checkbox"
            checked={settings.notifyOnPriceDrops}
            onChange={() => handleToggle('notifyOnPriceDrops')}
          />
          <span>Notify me when prices drop</span>
        </label>

        <div className="setting-item">
          <label>
            Price drop threshold (%):
            <input
              type="number"
              min="0"
              value={settings.priceDropThreshold}
              onChange={handleThresholdChange}
              className="threshold-input"
            />
          </label>
        </div>
      </section>

      {status && <div className="status-message">{status}</div>}

      <footer>
        <p>Quick-Saver v1.0.0</p>
        <small>Helping you save money across Amazon marketplaces</small>
      </footer>
    </div>
  );
};

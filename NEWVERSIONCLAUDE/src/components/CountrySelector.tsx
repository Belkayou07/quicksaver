import React, { useEffect } from 'react';
import styled from '@emotion/styled';
import { useMarketplaceStore } from '../store/marketplaceStore';
import { MARKETPLACES, marketplaceToCountry } from '../config/marketplaces';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;

  h2 {
    font-size: 18px;
    font-weight: 600;
    margin: 0;
  }

  h3 {
    font-size: 14px;
    font-weight: 400;
    color: rgba(255, 255, 255, 0.6);
    margin: 0;
  }
`;

const CountryGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const CountryItem = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.05);

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  img {
    width: 24px;
    height: 16px;
    border-radius: 2px;
  }
`;

const Toggle = styled.label`
  position: relative;
  display: inline-block;
  width: 40px;
  height: 20px;
  margin-left: auto;

  input {
    opacity: 0;
    width: 0;
    height: 0;
  }

  span {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #333;
    transition: .4s;
    border-radius: 20px;

    &:before {
      position: absolute;
      content: "";
      height: 16px;
      width: 16px;
      left: 2px;
      bottom: 2px;
      background-color: white;
      transition: .4s;
      border-radius: 50%;
    }
  }

  input:checked + span {
    background-color: #2196F3;
  }

  input:checked + span:before {
    transform: translateX(20px);
  }
`;

// Map country codes to their respective marketplace domains
const countryToMarketplace: { [key: string]: string } = Object.entries(marketplaceToCountry).reduce(
  (acc, [marketplace, countryCode]) => ({
    ...acc,
    [countryCode]: marketplace
  }),
  {}
);

export const CountrySelector = () => {
  const { selectedMarketplaces, toggleMarketplace, loadMarketplaces, initialized } = useMarketplaceStore();
  
  // Load marketplaces on component mount
  useEffect(() => {
    loadMarketplaces();
  }, [loadMarketplaces]);

  // Group marketplace data by region for display
  const marketplacesByRegion = Object.entries(MARKETPLACES).reduce(
    (acc, [domain, info]) => {
      if (!acc[info.region]) {
        acc[info.region] = [];
      }
      acc[info.region].push({
        code: marketplaceToCountry[domain],
        name: info.name,
        domain
      });
      return acc;
    },
    {} as Record<string, Array<{ code: string; name: string; domain: string }>>
  );

  const getFlagUrl = (countryCode: string) => {
    return chrome.runtime.getURL(`assets/flags/${countryCode.toLowerCase()}.png`);
  };

  // Don't render until initialized
  if (!initialized) return null;

  return (
    <Container>
      <div>
        <h2>Select which countries to search</h2>
        <h3>Select your preferences</h3>
      </div>
      {Object.entries(marketplacesByRegion).map(([region, countries]) => (
        <CountryGroup key={region}>
          <h3>{region}</h3>
          {countries.map(country => (
            <CountryItem key={country.code}>
              <img src={getFlagUrl(country.code)} alt={`${country.name} flag`} />
              <span>{country.name}</span>
              <Toggle>
                <input
                  type="checkbox"
                  checked={selectedMarketplaces.includes(country.domain)}
                  onChange={() => toggleMarketplace(country.domain)}
                />
                <span />
              </Toggle>
            </CountryItem>
          ))}
        </CountryGroup>
      ))}
    </Container>
  );
};

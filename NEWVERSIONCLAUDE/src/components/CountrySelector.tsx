import React from 'react';
import styled from '@emotion/styled';
import { useStore } from '../store/marketplace';

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

export const CountrySelector = () => {
  const { selectedCountries, toggleCountry } = useStore();

  const countries = {
    'North America': [
      { code: 'US', name: 'United States' },
      { code: 'CA', name: 'Canada' },
    ],
    'Europe': [
      { code: 'GB', name: 'United Kingdom' },
      { code: 'DE', name: 'Germany' },
      { code: 'FR', name: 'France' },
      { code: 'IT', name: 'Italy' },
      { code: 'ES', name: 'Spain' },
    ],
  };

  const getFlagUrl = (countryCode: string) => {
    return chrome.runtime.getURL(`assets/flags/${countryCode.toLowerCase()}.png`);
  };

  return (
    <Container>
      <div>
        <h2>Select which countries to search</h2>
        <h3>Select your preferences</h3>
      </div>
      {Object.entries(countries).map(([region, countryList]) => (
        <CountryGroup key={region}>
          <h3>{region}</h3>
          {countryList.map(country => (
            <CountryItem key={country.code}>
              <img src={getFlagUrl(country.code)} alt={`${country.name} flag`} />
              <span>{country.name}</span>
              <Toggle>
                <input
                  type="checkbox"
                  checked={selectedCountries.includes(country.code)}
                  onChange={() => toggleCountry(country.code)}
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

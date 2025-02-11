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
`;

const Select = styled.select`
  width: 100%;
  padding: 8px 12px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: white;
  font-size: 14px;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  &:focus {
    outline: none;
    border-color: #2196F3;
  }

  option {
    background: #1a1a1a;
  }
`;

export const CurrencySelector = () => {
  const { currency, setCurrency } = useStore();

  const currencies = [
    { code: 'USD', name: 'US Dollar' },
    { code: 'EUR', name: 'Euro' },
    { code: 'GBP', name: 'British Pound' },
    { code: 'CAD', name: 'Canadian Dollar' },
  ];

  return (
    <Container>
      <h2>Select your preferred currency</h2>
      <Select value={currency} onChange={(e) => setCurrency(e.target.value)}>
        {currencies.map(curr => (
          <option key={curr.code} value={curr.code}>
            {curr.name} ({curr.code})
          </option>
        ))}
      </Select>
    </Container>
  );
};

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

const ToggleGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const ToggleItem = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.05);

  &:hover {
    background: rgba(255, 255, 255, 0.1);
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

export const DisplayToggles = () => {
  const { 
    showPriceComparison,
    showShippingCalculation,
    showFlags,
    showPriceIndicator,
    togglePriceComparison,
    toggleShippingCalculation,
    toggleFlags,
    togglePriceIndicator
  } = useStore();

  const toggles = [
    {
      id: 'priceComparison',
      label: 'Show price comparison',
      checked: showPriceComparison,
      onChange: togglePriceComparison
    },
    {
      id: 'shippingCalculation',
      label: 'Show shipping calculation',
      checked: showShippingCalculation,
      onChange: toggleShippingCalculation
    },
    {
      id: 'flags',
      label: 'Show country flags',
      checked: showFlags,
      onChange: toggleFlags
    },
    {
      id: 'priceIndicator',
      label: 'Show price indicator',
      checked: showPriceIndicator,
      onChange: togglePriceIndicator
    }
  ];

  return (
    <Container>
      <h2>Display Settings</h2>
      <ToggleGroup>
        {toggles.map(toggle => (
          <ToggleItem key={toggle.id}>
            <span>{toggle.label}</span>
            <Toggle>
              <input
                type="checkbox"
                checked={toggle.checked}
                onChange={toggle.onChange}
              />
              <span />
            </Toggle>
          </ToggleItem>
        ))}
      </ToggleGroup>
    </Container>
  );
};

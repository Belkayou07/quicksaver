import React from 'react';
import { createRoot } from 'react-dom/client';
import { Sidepanel } from './components/Sidepanel';
import './styles.css';

const root = document.getElementById('root');
if (root) {
    createRoot(root).render(
        <React.StrictMode>
            <Sidepanel />
        </React.StrictMode>
    );
}

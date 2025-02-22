import React from 'react';
import { createRoot } from 'react-dom/client';
import { Sidepanel } from '../sidepanel/Sidepanel';
import '../i18n/config';
import '../sidepanel/styles.css';

const container = document.querySelector('.content-wrapper');
if (container) {
    const root = createRoot(container);
    root.render(<Sidepanel />);
}

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import './netflix-theme.css';
import './premium-components.css';

// Apply Netflix theme
document.body.classList.add('netflix-theme');

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

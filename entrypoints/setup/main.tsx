import React from 'react';
import ReactDOM from 'react-dom/client';
import SetupPage from '../../src/components/SetupPage';
import '@fortawesome/fontawesome-free/css/all.min.css';
import '../popup/style.css';
import './style.css';

const root = ReactDOM.createRoot(document.getElementById('app')!);
root.render(
  <React.StrictMode>
    <SetupPage />
  </React.StrictMode>,
);

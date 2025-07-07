import React from 'react';
import ReactDOM from 'react-dom/client';
import Popup from '../../src/components/Popup';
import '@fortawesome/fontawesome-free/css/all.min.css';
import './style.css';

const root = ReactDOM.createRoot(document.getElementById('app')!);
root.render(
  <React.StrictMode>
    <Popup />
  </React.StrictMode>
); 
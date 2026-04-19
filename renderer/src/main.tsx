import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app/App';
import './app/styles/global.css';
import { initI18n } from './shared/i18n';
import { ipc } from './shared/api/ipc';

async function bootstrap() {
  // Load saved language preference
  const lang = (await ipc.settings.get('language', 'ru')) as string;
  await initI18n(lang);

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

bootstrap();

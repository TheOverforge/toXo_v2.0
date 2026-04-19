import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import ru from './ru';
import en from './en';

export async function initI18n(language = 'ru') {
  await i18next
    .use(initReactI18next)
    .init({
      lng: language,
      fallbackLng: 'ru',
      resources: {
        ru: { translation: ru },
        en: { translation: en },
      },
      interpolation: { escapeValue: false },
    });
}

export { i18next };

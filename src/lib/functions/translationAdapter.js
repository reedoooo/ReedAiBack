// utils/translationAdapter.js

import { useTranslation } from 'react-i18next';

export const useTranslationAdapter = library => {
  const { t, i18n } = useTranslation();

  const translateForLibrary = (key, options) => {
    const translatedText = t(key, options);

    switch (library) {
      case 'material-ui':
        return translatedText; // Material-UI uses plain strings
      case 'ant-design':
        return <span>{translatedText}</span>; // Ant Design often expects wrapped text
      case 'chakra-ui':
        return translatedText; // Chakra UI uses plain strings
      default:
        return translatedText;
    }
  };

  return { translate: translateForLibrary, i18n };
};

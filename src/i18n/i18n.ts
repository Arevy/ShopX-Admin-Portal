import i18next, { type Resource } from 'i18next'
import { initReactI18next } from 'react-i18next'
import { DEFAULT_LANGUAGE, LANGUAGES } from './config'
import { resources } from './resources'

const instance = i18next.createInstance()

const defaultNamespaces = Object.keys(resources[DEFAULT_LANGUAGE])

void instance.use(initReactI18next).init({
  resources: resources as unknown as Resource,
  lng: DEFAULT_LANGUAGE,
  fallbackLng: DEFAULT_LANGUAGE,
  supportedLngs: [...LANGUAGES],
  defaultNS: 'Common',
  ns: defaultNamespaces,
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
})

export default instance

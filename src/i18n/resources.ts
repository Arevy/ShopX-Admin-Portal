import type { Language } from './config'
import en from '@local/en'
import ro from '@local/ro'
import fr from '@local/fr'
import de from '@local/de'
import ar from '@local/ar'
import he from '@local/he'

type TranslationTree = Record<string, unknown>

type Resources = Record<Language, Record<string, TranslationTree>>

export const resources: Resources = {
  en,
  ro,
  fr,
  de,
  ar,
  he,
}

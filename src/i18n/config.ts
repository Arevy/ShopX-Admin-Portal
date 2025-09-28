export const LANGUAGES = ['en', 'ro', 'fr', 'de', 'ar', 'he'] as const

export type Language = (typeof LANGUAGES)[number]

export const DEFAULT_LANGUAGE: Language = 'en'

export const RTL_LANGUAGES = new Set<Language>(['ar', 'he'])

export const LANGUAGE_STORAGE_KEY = 'shopx-admin-language'

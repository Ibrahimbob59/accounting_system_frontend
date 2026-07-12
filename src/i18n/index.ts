import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import enCommon from './locales/en/common.json'
import enAuth from './locales/en/auth.json'
import enLanding from './locales/en/landing.json'
import enLeads from './locales/en/leads.json'
import frCommon from './locales/fr/common.json'
import frAuth from './locales/fr/auth.json'
import frLanding from './locales/fr/landing.json'
import frLeads from './locales/fr/leads.json'
import arCommon from './locales/ar/common.json'
import arAuth from './locales/ar/auth.json'
import arLanding from './locales/ar/landing.json'
import arLeads from './locales/ar/leads.json'

export const RTL_LANGUAGES = ['ar'] as const

/**
 * Supported languages by their NATIVE names (not translated into the active
 * language) — single source of truth for the LanguageSwitcher.
 */
export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
  { code: 'ar', label: 'العربية' },
] as const

const SUPPORTED_CODES = SUPPORTED_LANGUAGES.map((l) => l.code)

export const resources = {
  en: { common: enCommon, auth: enAuth, landing: enLanding, leads: enLeads },
  fr: { common: frCommon, auth: frAuth, landing: frLanding, leads: frLeads },
  ar: { common: arCommon, auth: arAuth, landing: arLanding, leads: arLeads },
} as const

/**
 * Keep <html dir> and <html lang> in sync with the active language.
 * Arabic flips the document to RTL; everything else is LTR.
 */
function applyDocumentDirection(language: string) {
  const isRtl = (RTL_LANGUAGES as readonly string[]).includes(language)
  document.documentElement.dir = isRtl ? 'rtl' : 'ltr'
  document.documentElement.lang = language
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    // No fixed `lng` — the detector picks it: localStorage first, then the
    // browser's language (falling back to English if it isn't one of the three).
    fallbackLng: 'en',
    supportedLngs: SUPPORTED_CODES,
    // Treat e.g. 'fr-FR' from the browser as 'fr'.
    nonExplicitSupportedLngs: true,
    load: 'languageOnly',
    defaultNS: 'common',
    ns: ['common', 'auth', 'landing', 'leads'],
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  })

applyDocumentDirection(i18n.language)
i18n.on('languageChanged', applyDocumentDirection)

export default i18n

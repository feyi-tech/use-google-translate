
export interface FutureText {
    id: string, text: string
}
export interface GoogleLanguage {
    code: string, name: string, countryCode: string, isRTL: boolean,
    [x: string]: any
}

export interface UseGoogleTranslateReturn {
    lang: string, 
    langs: { [code: string]: GoogleLanguage }, 
    isRTL: boolean,
    detectedCountryCode: string | null,
    detectedCountryLanguage: string | null,
    supportsLanguage: (locale: string) => boolean, 
    getLanguageData: (locale: string) => GoogleLanguage | null,
    getTranslationFutureText: (textIdOrText: string) => string, 
    translate: (locale: string) => void, 
    translating: boolean
}
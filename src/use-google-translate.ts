import { useEffect, useState } from "react"
const Cookies = require('js-cookie');
import { FutureText, GoogleLanguage, UseGoogleTranslateReturn } from "./types";
import { addScriptWithContent, addStyleWithContent, appendHtmlContentToBody, loadScript } from "./utils";
const CountryLanguage = require('country-language');
const $ = require("jquery")

const FUTURE_TEXTS_PREFIX = "google_translation_future_text_"
const TRANSLATION_COMPLETE_ELEMENT_ID = "google_translation_complete_el"
const LIB_NAME = "use-google-translate"
const useGoogleTranslate = (
    langs: { [code: string]: GoogleLanguage }, defaultLang: string, defaultLangLoadCompleteCheckerText: string, 
    futureTexts: (FutureText | string)[] = [],
    mustTranslate: boolean = true,
    translationTimeout: number = 5000//5 seconds
): UseGoogleTranslateReturn => {
    const [translating, setTranslating] = useState<boolean>(true)
    const [lang, setLang] = useState<string>(defaultLang)
    const [detectedCountryCode, setDetectedCountryCode] = useState<string | null>(null)
    const [detectedCountryLanguage, setDetectedCountryLanguage] = useState<string | null>(null)

    function translatePage(userLatestLocale: any){
        if(userLatestLocale) setLang(userLatestLocale)
        //Get the user's preferred or default language
        var userCurrentLocale = Cookies.get('language');
        //Get the google translate set current translation cookie
        const googt = Cookies.get("googtrans")
        const latestTransCode = `/${defaultLang}/${userLatestLocale}`
        const latestHash = `googtrans(${defaultLang}|${userLatestLocale})`
        //If the user's latest language is not empty, and it's different from the current one; 
        // or the latest translation code is different from the one set as cookies, probably due to outside cookies
        // manipulation in the browser, and the hash in the url is not already set to the hash of the latest language,
        // thus signifying a change,
        // and it's not the default language;
        // 1. update the user's current locale to the latest, and
        // 2. add the translation trigger hash to the url, and reload with the hash
        if(userLatestLocale && userLatestLocale.length > 0 && 
            (userLatestLocale != userCurrentLocale || (googt != latestTransCode && location.hash != `#${latestHash}`)) && 
            userLatestLocale != defaultLang
        ){
            Cookies.set('language', userLatestLocale);
            window.location.hash = latestHash;
            location.reload();

        } //If the latest user locale is the default, 
        //it's important we make sure the language trigger hash is not used in this case, for UX purpose
        else if(userLatestLocale == defaultLang) {
            //Create the format expected of the translation being the default language
            const defaultTransCode = `/${defaultLang}/${defaultLang}`
            //If the current translation cookie is not for the default language,
            //1. remove the current translation cookie in all possible forms,
            //2. set the current language as the latest language,
            //3. remove the hash in the url, especially the translation trigger hash,
            //4. reload the page with the hash sign removed
            if(googt && googt != defaultTransCode) {
                Cookies.remove('googtrans')
                Cookies.remove('googtrans', { path: '' })
                Cookies.remove('googtrans', { path: '', domain: `${location.hostname}` })
                Cookies.remove('googtrans', { path: '', domain: `.${location.hostname}` })
                Cookies.set('language', userLatestLocale);
                window.location.hash = '';
                window.location.replace(window.location.href.replace(/#/, ''));

            } //If the current translation cookie is for the default language,
            //this means the user latest language is the current language, and matches the default.
            //We just have to 
            // 1. switch off the translating indicator state, since no translation is needed to be done, and will not be done.
            else {
                setTranslating(false)
            }

        } 
        //If the latest language is empty, 
        //we do nothing more than 
        // 1. setting the language state to the default language, and 
        // 2. switch off the translating indicator state, since no translation is needed to be done, and will not be done.
        else if(!userLatestLocale || userLatestLocale.length == 0) {
            setLang(defaultLang)
            setTranslating(false)
        }
        //We should get here if the user's latest language is not empty 
        // and it's the same as the current language, and
        // and it's not the default language.
        // In this case,
        // 1. poll for the translation's complete state in order to switch off the translating indicator state 
        // when the translation is complete
        else {
            pollTranslateComplete((new Date()).getTime(), userLatestLocale)
        }
        
    }

    const pollTranslateComplete = (startTimeMillis: number, lng: string) => {
        setTimeout(() => {
            if(document && document.querySelector(`#${TRANSLATION_COMPLETE_ELEMENT_ID}`)?.textContent != defaultLangLoadCompleteCheckerText) {
                setTranslating(false)

            } else if((new Date()).getTime() - startTimeMillis >= translationTimeout) {
                if(mustTranslate) {
                    location.reload();

                } else {
                    setTranslating(false)
                }

            } else {
                pollTranslateComplete(startTimeMillis, lng)
            }
        }, 100)
    }
    
    const init = (detected_country_locale: string | null) => {
        var lang = Cookies.get('language')

        //If the user has a valid language set prefencially or defaultly already.
        // Just make sure the detected_country_code is set and translate to the set language
        if(lang && Object.keys(langs).includes(lang)) {
            translatePage(lang);

        } //If the user has no valid language set already.
        //Send an http request to detect the country, use the country code to get the #1 language of the country,
        //then translate to that language if it's among the supported languages or fall back to the default language
        //If an error occurred, also fall back to the default language
        else {
            translatePage(detected_country_locale && Object.keys(langs).includes(detected_country_locale)? detected_country_locale : null);
        }
    }

    const [scriptLoaded, setScriptLoaded] = useState<boolean>()
    useEffect(() => {
        if(!scriptLoaded) {
            setTranslating(true)
            setScriptLoaded(true)
            const styleContent = `
            #goog-gt-tt, iframe.VIpgJd-ZVi9od-ORHb-OEVmcd, .VIpgJd-ZVi9od-aZ2wEe-wOHMyf {display: none !important; height: 0px !important;}
            body {top: 0px !important}
            `
            addStyleWithContent(styleContent)

            // Create the HTML element you want to prepend
            const elementToPrepend = document.createElement('div');
            elementToPrepend.id = "google_translate_element"
            elementToPrepend.setAttribute("style", "display:none !important;")
            // Get a reference to the <body> element
            const body = document.body;

            // Prepend the element to the <body>
            body.insertBefore(elementToPrepend, body.firstChild);

            renderTranslationHiddenTexts()
            const callbackName = `googleTranslateElementInit${Math.round(Math.random() * 100000)}`
            const scriptContent = `
            function ${callbackName}() {
                new google.translate.TranslateElement({pageLanguage: '${defaultLang}', layout: google.translate.TranslateElement.InlineLayout.SIMPLE}, 'google_translate_element');
            }
            `;
            addScriptWithContent(scriptContent)
            loadScript(`${location.protocol}//translate.google.com/translate_a/element.js?cb=${callbackName}`)
            .then(() => {
                $.ajax({
                    type: "GET",
                    url: `${location.protocol}//geolocation-db.com/jsonp/`,
                    jsonpCallback: "callback",
                    dataType: "jsonp",
                    success: function( location: any ) {
                        //$('#country').html(location.country_code);
                        var co = location.country_code;
                        co = co.toUpperCase();
                        Cookies.set('detected_country_code', co);
                        setDetectedCountryCode(co);
                        console.info(`${LIB_NAME}: Detected country  => ${co}`)
                        CountryLanguage.getCountryLanguages(co, function (err: string, languages: any[]) {
                            if (err || !languages || languages.length == 0) {
                                if(err) {
                                    console.warn(`${LIB_NAME}: Failed to get detected locale  => `, err)
                                } else {
                                    console.warn(`${LIB_NAME}: No detected locale returned`)
                                }
                                init(null)
    
                            } else {
                                try {
                                    var locale = languages[0]?.iso639_1.split("-")[0].toLowerCase()
                                    if(locale) {
                                        Cookies.set('detected_country_locale', locale);
                                        setDetectedCountryLanguage(locale)

                                        console.warn(`${LIB_NAME}: Detected locale is empty from this languages => `, languages)
                                    } else {
                                        console.info(`${LIB_NAME}: Detected locale  => ${locale}`)
                                    }
                                    
                                    init(locale)
    
                                } catch(e: any) {
                                    console.warn(`${LIB_NAME}: Failed to extract detected locale  => ${e.message}`)
                                    init(null)
                                }
                            }
                        });
                    },
                    error: (e: any) => {
                        console.warn(`${LIB_NAME}: Failed to get detected country  => `, e)
                        init(null)
                    }
                });
            })
            .catch(e => {
                console.error(`${LIB_NAME}: Google translate script load error => ${e.message}`)
                setScriptLoaded(false)
                setTranslating(false)
            })
        }
    }, [])

    const textToId = (text: string) => {
        if (!text) return "";
    
        // Replace all non-alphanumeric characters (excluding underscores) with an empty string
        const cleanText = text.replace(/[^a-zA-Z0-9_\s]/g, "");
    
        // Replace all whitespace characters with underscores
        const id = cleanText.replace(/\s/g, "_");
    
        return id.toLowerCase();
    };    

    const renderTranslationHiddenTexts = (): any => {
        const content = `
        ${
            futureTexts.map((futureText) => `
                <div id="${FUTURE_TEXTS_PREFIX}${typeof futureText !== 'string'? futureText.id : textToId(futureText as string)}">
                        ${typeof futureText !== "string"? futureText.text : futureText}
                </div>`
            )
        }
        <div id="${TRANSLATION_COMPLETE_ELEMENT_ID}">${defaultLangLoadCompleteCheckerText}</div>`
        appendHtmlContentToBody(content)
    }

    const getTranslationFutureText = (futureTextId: string): string => {
        try {
            if(!futureTextId) return ""
            var el = document.getElementById(`${FUTURE_TEXTS_PREFIX}${textToId(futureTextId)}`);
            if(!el) return futureTextId
            return el.textContent || ""

        } catch(e) {
            return futureTextId
        }
    }

    const supportsLanguage = (locale: string): boolean => {
        if(!langs) return false
        return Object.keys(langs).includes(locale)
    }

    const getLanguageData = (locale: string): GoogleLanguage | null => {
        if(!langs) return null
        return langs[locale]
    }

    const translate = (locale: string) => {
        if(locale && supportsLanguage(locale)) {
            translatePage(locale)
        }
    }

    return {
        lang, langs: langs, isRTL: langs && lang? langs[lang]?.isRTL : false,
        detectedCountryCode, detectedCountryLanguage,
        supportsLanguage, getLanguageData,
        getTranslationFutureText, translate, translating
    }

}


export default useGoogleTranslate
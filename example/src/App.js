import React from 'react'

import useGoogleTranslate from 'use-google-translate';

export default function Example() {


  const supportedLanguages = {
      en: {
          code: "en",//Required
          name: "English",//Optional
          isRTL: false,//Optional
          countryCode: "us"//Optional
      },
      "zh-CN": {
          code: "zh-CN",
          name: "中文",
          isRTL: false,
          countryCode: "cn"
      },
      ar: {
          code: "ar",
          name: "العربية",
          isRTL: true,
          countryCode: "sa"
      }
  }

  const futureTexts = [
      'This is an alert text that shows after clicking "Show Alert 1", and has been translated in the past for this time.',
      {
          id: 'show-alert-2', text: 'The is another alert text that shows after clicking "Show Alert 2", and has been translated in the past for this time.'
      }
  ]
  const mustTranslate = true

  const {
  lang,//current preferred, detected, or default language
  langs,//supportedLanguages
  isRTL,
  detectedCountryCode,
  supportsLanguage,
  getLanguageData,
  getTranslationFutureText,
  translate,
  translating,
  } = useGoogleTranslate(
      supportedLanguages, // *Required. The languages the translator should support

      "en", // *Required. The default language. This is also the language of the page

      // A text in the default language that the hook will add and hide as a div element to the page to detect when translation 
      // is done, by comparing the text content of this div on an interval of 200ms to this text.
      "Hello world", // *Required.

      // This are texts that will be displayed later. Such as in alert pop ups. 
      // The texts are added and hidden with unique ids as div elements to the page 
      // This allows the texts that will be needed in the lifespan of the page to be translated all at once, 
      // while the contents of these divs are returned with a simple function(getTranslationFutureText) when needed; 
      // to avoid layout change during user interactions that would cause another google translation process.
      futureTexts, 

      // If set to true, the page will reload when the translation has timed out without any translation done.
      // IF false, the translating state of will be set to false with no translation done.
      mustTranslate, // the default is true

      6000, // The translation process timeout in milliseconds. The default is 5000. That is, 5 seconds.
  );

  const handleAlert1 = () => {
      alert(getTranslationFutureText('This is an alert text that shows after clicking "Show Alert 1", and has been translated in the past for this time.'))
  }

  const handleAlert2 = () => {
      alert(getTranslationFutureText('show-alert-2'))
  }

  return (
    <div>
        <div style={{display: translating? "none" : "block"}}>
            <h1>This is a test content for translation.</h1>
            <div>Current language: {lang}</div>
            <select onChange={(e) => {
                translate(e.value)
            }}>
            {Object.keys(langs || {}).map((lng) => {
                if (lng === lang) return null;
                return (
                    <option key={index} value={lang.code}>{lang.name}</option>
                )
            })}
            </select>
            <button onClick={handleAlert1}>Show Alert 1</button><br />
            <button onClick={handleAlert2}>Show Alert 2</button>
        </div>
        <div style={{display: !translating? "none" : "block", fontStyle: "italic"}}>...</div>
    </div>
  )
}

export function loadScript(scriptSrc: string) {
    return new Promise((reslove, reject) => {
        // Create a script element
        const script = document.createElement('script');
        script.src = scriptSrc;
    
        // Set the onload event handler
        script.onload = () => {
        // The script has loaded, call the callback function
            reslove(null)
        };
        script.onerror = (e) => {
            reject(e)
        }
    
        // Append the script to the document
        document.body.appendChild(script);
    })
}

export function addScriptWithContent(scriptContent: string) {
    // Create a script element
    const script = document.createElement('script');
    
    // Set the type attribute to JavaScript
    script.type = 'text/javascript';
    
    // Set the script content
    script.text = scriptContent;
  
    // Append the script to the document's head
    document.body.appendChild(script);
}
export function addStyleWithContent(styleContent: string) {
    // Create a style element
    const style = document.createElement('style');
    
    // Set the style content
    style.textContent = styleContent;
  
    // Append the style element to the document's head
    document.head.appendChild(style);
}

export function appendHtmlContentToBody(htmlContent: string) {
    const div = document.createElement('div');
    div.setAttribute("style", "display:none !important")
    div.innerHTML = htmlContent;
    document.body.appendChild(div);
}
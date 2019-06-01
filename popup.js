/* global chrome axios */

let bkg = chrome.extension.getBackgroundPage()

let fromUrl = document.getElementById('fromUrl')
let toUrl = document.getElementById('toUrl')

function htmlToElement (html) {
  var template = document.createElement('template');
  html = html.trim(); // Never return a text node of whitespace as the result
  template.innerHTML = html;
  return template.content.firstChild;
}

chrome.tabs.query({ active: true, currentWindow: true }, async function (tabs) {

  var response = await axios.get(`http://localhost:2800/url/${encodeURIComponent(tabs[0].url)}`)

  if (!response.data) {
    return addUrl.classList.remove('hidden')
  }

  response.data.toUrl.forEach(function (url) {
    console.log(url)
    toUrl.insertAdjacentHTML('beforeend', `<li>${url.title}</li>`)
  })

  response.data.fromUrl.forEach(function (url) {
    fromUrl.insertAdjacentHTML('beforeend', `<li>${url.title}</li>`)
  })
})

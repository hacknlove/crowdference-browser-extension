/* global chrome axios */

APIURL = 'https://api.crowdference.org'

var currentUrl

const createLinkElement = function createLink (link) {
  const div = document.createElement('div')
  const title = document.createElement('div')
  const url = document.createElement('a')

  if (!link.url[0].match(/^http(s?):\/\//)) {
    link.url[0] = 'http://' + link.url[0]
  }

  title.innerText = link.title
  url.innerText = link.url[0]

  div.appendChild(title)
  div.appendChild(url)



  div.addEventListener('click', (event) => {

    console.log(link.url[0])
    chrome.tabs.create({
      url: link.url[0],
      active: false
    })
  })

  return div
}
const createTabElement = function createLink (tab) {

  const div = document.createElement('div')
  const img = document.createElement('img')
  const title = document.createElement('div')
  const url = document.createElement('a')

  img.src = tab.favIconUrl
  title.innerText = tab.title
  url.innerText = tab.url

  div.appendChild(img)
  div.appendChild(title)
  div.appendChild(url)

  div.addEventListener('click', async (event) => {

    const response = await fetch(`${APIURL}/addLink`, {
      method: 'POST',
      body: JSON.stringify({
        fromUrl: currentUrl,
        toUrl: tab.url
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    })

    console.log(response)
  })

  return div
}

const insertTabs = function (options) {
  options.tabs.forEach(tab => {
    if (options.notLinkableURLs[tab.url] === true) {
      return
    }
    options.notLinkableURLs[tab.url] = true
    options.container.insertAdjacentElement('beforeend', createTabElement(tab))
  })
}

const getTabs = function getTabs (notLinkableURLs) {
  const linkThisWith = document.getElementById('linkThisWith')
  chrome.tabs.query({
    status: 'complete',
    url: ['http://*/*', 'https://*/*'],
  }, tabs => {
    insertTabs({
      tabs: tabs,
      container: linkThisWith,
      notLinkableURLs
    })
  })

}

const getLinks = async function getLinks (url, notLinkableURLs) {
  var response = await fetch(`${APIURL}/url/${encodeURIComponent(url)}`).then(res => res.json())
  if (!response) {
    return
  }
  insertLinks({
    links: response.toUrl,
    container: document.getElementById('toUrl'),
    notLinkableURLs
  })

  insertLinks({
    links: response.fromUrl,
    container: document.getElementById('fromUrl'),
    notLinkableURLs
  })
}

const insertLinks = function (options) {
  options.links.forEach( link => {

    link.url.forEach(url => {
      options.notLinkableURLs[url] = true
    })

    options.container.insertAdjacentElement('beforeend', createLinkElement(link))
  })
}

chrome.tabs.query({ active: true, currentWindow: true }, async function (tabs) {
  currentUrl = tabs[0].url
  const notLinkableURLs = {}
  notLinkableURLs[currentUrl] = true

  await getLinks(currentUrl, notLinkableURLs)
  getTabs(notLinkableURLs)
})


document.querySelectorAll('[data-locale]').forEach(elem => {
  console.log(elem.dataset.locale)
  elem.innerText = chrome.i18n.getMessage(elem.dataset.locale)
})

/* global browser */

// @ts-ignore
import browser from '../node_modules/webextension-polyfill'

const APIURL = 'https://api.crowdference.org'


var currentUrl: string

interface Link {
  title: string
  url: Array<string>
}

interface Tab {
  favIconUrl: string
  title: string
  url: string
}

interface InsertTabsOptions {
  tabs: Array<Tab>
  notLinkableURLs: {[key: string]: boolean}
  container: HTMLElement
}

interface InsertLinksOptions {
  links: Array<Link>
  container: HTMLElement,
  notLinkableURLs: { [key: string]: boolean }
}

const createLinkElement = function createLink (link: Link) {
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



  div.addEventListener('click', () => {
    console.log(link.url[0])
    browser.tabs.create({
      url: link.url[0],
      active: false
    })
  })

  return div
}
const createTabElement = function createLink (tab: Tab) {

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

  div.addEventListener('click', async () => {

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

const insertTabs = function (options: InsertTabsOptions) {
  var inserted = false
  options.tabs.forEach(tab => {
    if (options.notLinkableURLs[tab.url] === true) {
      return
    }
    inserted = true
    options.notLinkableURLs[tab.url] = true
    options.container.insertAdjacentElement('beforeend', createTabElement(tab))
  })
  if (!inserted) {
    options.container.remove()
  }
}

const getLinks = async function getLinks(url: string, notLinkableURLs: { [key: string]: boolean}) {
  const fromUrl = <HTMLElement> document.getElementById('fromUrl') || new Element()
  const toUrl = <HTMLElement> document.getElementById('toUrl') || new Element()
  var response = await fetch(`${APIURL}/url/${encodeURIComponent(url)}`).then(res => res.json())
  if (!response) {
    fromUrl.remove()
    toUrl.remove()
    return
  }

  insertLinks({
    links: response.toUrl,
    container: toUrl,
    notLinkableURLs
  })

  insertLinks({
    links: response.fromUrl,
    container: fromUrl,
    notLinkableURLs
  })
}

const insertLinks = function (options: InsertLinksOptions) {
  if (!options.links.length) {
    options.container.remove()
  }
  options.links.forEach( link => {

    link.url.forEach(url => {
      options.notLinkableURLs[url] = true
    })

    options.container.insertAdjacentElement('beforeend', createLinkElement(link))
  })
}

browser.tabs.query({ active: true, currentWindow: true })
.then(async function (tabs: any) {
  currentUrl = tabs[0].url

  if (!currentUrl.match(/^http/)) {
    browser.tabs.create({
      url: 'https://crowdference.org'
    })
    return window.close()
  }

  const notLinkableURLs: { [key: string]: boolean }  = {}
  notLinkableURLs[currentUrl] = true

  await getLinks(currentUrl, notLinkableURLs)


  insertTabs({
    container: <HTMLElement> document.getElementById('linkThisWith') || new Element(),
    tabs: await browser.tabs.query({
      status: 'complete',
      url: ['http://*/*', 'https://*/*'],
    }),
    notLinkableURLs
  })

  if (document.querySelectorAll('#menu>*').length === 0) {
    browser.tabs.create({
      url: 'https://crowdference.org'
    })
    return window.close()
  }
})


document.querySelectorAll('[data-locale]').forEach(elem => {
  const l = <HTMLElement> elem
  l.innerText = browser.i18n.getMessage(l.dataset.locale)
})

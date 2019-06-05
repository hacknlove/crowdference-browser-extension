// @ts-ignore
import browser from '../node_modules/webextension-polyfill'
// @ts-ignore
declare var API_URL: string

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
  title: string,
  notLinkableURLs: { [key: string]: boolean }
}

const cleanMenu = function cleanMenu (): HTMLElement{
  var myNode = document.getElementById("menu")
  while (myNode.firstChild) {
    myNode.removeChild(myNode.firstChild)
  }
  return myNode
}
const createH4 = function createH4(message: string): HTMLElement {
  const h4 = document.createElement('h4')
  h4.innerText = message

  return h4
}

const error = function error (message: string) {
  const menu = cleanMenu()
  console.log(message)
  console.log(browser.i18n.getMessage(message))
  menu.appendChild(createH4(browser.i18n.getMessage(message)))
  menu.addEventListener('click', function () {
    return window.close()
  })
}

const createSection = function createDiv (title: string): HTMLElement {
  const div = document.createElement('div')
  const h4 = document.createElement('h4')

  h4.innerText = title

  div.appendChild(h4)

  return div
}

const createLinkElement = function createLink (link: Link): HTMLElement {
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
const createTabElement = function createLink (tab: Tab): HTMLElement {

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

    const response = await fetch(`${API_URL}/addLink`, {
      method: 'POST',
      body: JSON.stringify({
        fromUrl: currentUrl,
        toUrl: tab.url
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (response.status !== 200) {
      error('serverProblems')
    }
    error('enlaceAgregado')
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
  var response = await fetch(`${API_URL}/url/${encodeURIComponent(url)}`).then(res => res.json())
  console.log(response)
  if (!response) {
    return
  }

  if (response.status !== 200) {
    throw new Error()
  }

  insertLinks({
    title: 'toLinksTitle',
    links: response.toUrl,
    notLinkableURLs
  })

  insertLinks({
    title: 'fromLinksTitle',
    links: response.fromUrl,
    notLinkableURLs
  })
  return
}

const insertLinks = function (options: InsertLinksOptions) {
  console.log(options)
  if (!options.links.length) {
    return
  }
  const container = createSection(options.title)
  options.links.forEach( link => {

    link.url.forEach(url => {
      options.notLinkableURLs[url] = true
    })

    container.insertAdjacentElement('beforeend', createLinkElement(link))
  })
  console.log(container)
  document.getElementById('menu').appendChild(container)
}

browser.tabs.query({ active: true, currentWindow: true })
.then(async function (tabs: any) {
  currentUrl = tabs[0].url

  if (!currentUrl.match(/^http/)) {
    error('notValidTab')
  }

  const notLinkableURLs: { [key: string]: boolean }  = {}
  notLinkableURLs[currentUrl] = true

  try {
    await getLinks(currentUrl, notLinkableURLs)
  } catch (e) {
    error('serverProblems')
    return
  }

  insertTabs({
    container: <HTMLElement> document.getElementById('linkThisWith') || new HTMLElement(),
    tabs: await browser.tabs.query({
      status: 'complete',
      url: ['http://*/*', 'https://*/*'],
    }),
    notLinkableURLs
  })

  if (document.querySelectorAll('#menu>*').length === 0) {
    error('nothingToDo')
  }
})

document.querySelectorAll('[data-locale]').forEach(elem => {
  const l = <HTMLElement> elem
  l.innerText = browser.i18n.getMessage(l.dataset.locale)
})

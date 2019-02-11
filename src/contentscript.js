'use strict'

/**
 * Handles the expansion of the mail.
 *
 * @author 	Jacob Groß
 * @date   	2016-09-09
 */
const label = /#label(?:\/.+){2}/
const inbox = /#(inbox|imp|al{2}|search|trash|sent)\/.+/
const fetchMap = new Map()

function fetchFromBackground(path) {
	return new Promise((resolve, reject) => {
		chrome.runtime.sendMessage({ path }, html => {
			if (html === undefined && chrome.runtime.lastError)
				return reject(chrome.runtime.lastError.message)

			return resolve(html)
		})
	})
}

function fetchFromElem(parent, target) {
	const href = target.href
	if (target.href.indexOf('https://mail.google.com/') !== 0) return

	const path = new URL(href).search.slice(1)

	const maybePromise = fetchMap.get(path)
	if (maybePromise !== undefined) {
		maybePromise.then(handleResponse.bind(undefined, parent)).catch(error)
		fetchMap.delete(path)
		return
	}

	let a = document.createElement('a')

	const promise = fetchFromBackground(path)
		.then(handleResponse.bind(undefined, parent))
		.catch(function(error) {
			console.error(error)
			a.textContent += ` ― ${chrome.i18n.getMessage(
				'error'
			)} (${chrome.i18n.getMessage('clickHere')})`

			a = null // prevent memory leak
			return error
		})
	fetchMap.set(path, promise)

	a.href = '#'
	a.textContent = `${chrome.i18n.getMessage(
		'expanding'
	)}... (${chrome.i18n.getMessage('clickHere')})`
	a.style.paddingLeft = '5px'
	a.addEventListener(
		'click',
		e => {
			e.preventDefault()
			fetchMap.delete(path)
			fetchFromElem(parent, target)
		},
		false
	)
	target.parentElement.append(a)
}

function handleResponse(parent, text) {
	const dom = new DOMParser().parseFromString(text, 'text/html')
	const elem = dom.querySelector('.message div > font')
	if (!elem.textContent) {
		console.warn('childNodes', elem.childNodes)
		throw new Error('empty message')
	}

	parent.innerHTML = elem.innerHTML // swap content
	parent.classList.add('gmail-em--added')

	return text
}

function error(e) {
	console.error(e)
	return e
}

let observer
function observe() {
	let div = document.querySelector('div[id=":4"] + div')
	if (div === null) {
		div = document.querySelector('div[id=":5"] + div')
		if (div === null) {
			console.warn('no div found')
			return
		}
	}

	observer = new MutationObserver(handleMutations)
	observer.observe(div, {
		subtree: true,
		childList: true,
	})
}

const visited = new WeakSet()
function handleMutations(mutations) {
	const hash = location.hash
	if (!label.test(hash) && !inbox.test(hash)) return

	let foundOnce = false
	for (let i = 0; i < mutations.length; ++i) {
		const mutation = mutations[i].target,
			parent = mutation.querySelector('.a3s')

		if (parent === null) return

		foundOnce = true

		if (parent.classList.contains('gmail-em--added')) return

		let extend = mutation.querySelector('vem')
		if (extend === null) {
			extend = mutation.querySelector('.ii.gt > div > div > br + br + a')
			if (extend === null) return
		}
		if (visited.has(parent)) return

		//console.log(mutations[i], mutations[i].target, extend)
		visited.add(parent)
		fetchFromElem(parent, extend)
	}

	if (!foundOnce) console.warn('Mail outer parent probably changed')
}

/**
 * Adds event listeners.
 *
 * @author 	Jacob Groß
 * @date   	2015-06-07
 */
function addListener() {
	window.addEventListener('load', function() {
		if (observer !== undefined) observer.disconnect()
		observe()
	})

	window.addEventListener('hashchange', function() {
		fetchMap.clear()
	})
}

addListener()

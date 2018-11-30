;(function(window) {
	'use strict'

	const document = window.document,
		location = window.location

	/**
	 * Fetches the given URL; we can't use Fetch here, because it has no support for returning XML/HTML as response.
	 *
	 * @author 	Jacob Groß
	 * @date   	2015-06-07
	 * @param  	{String}    	href 	URL to fetch
	 * @return 	{Promise}         		Fetch Promise
	 */
	function fetch(href) {
		return new Promise(function(resolve, reject) {
			const xhr = new XMLHttpRequest()
			xhr.responseType = 'document'

			xhr.addEventListener('load', function() {
				resolve(xhr)
			})
			xhr.addEventListener('error', reject)
			xhr.addEventListener('abort', reject)

			xhr.open('GET', href, true)
			xhr.setRequestHeader('max-stale', '')
			xhr.send()
		})
	}

	/**
	 * Handles the expansion of the mail.
	 *
	 * @author 	Jacob Groß
	 * @date   	2016-09-09
	 */
	const label = /#label(?:\/.+){2}/
	const inbox = /#(inbox|imp|al{2}|search|trash|sent)\/.+/
	const hrefToHash = new Map()

	const fetchFromElemThrottled = throttle(fetchFromElem, 100)

	function fetchFromElem(parent, target, oldHash) {
		let hash = location.hash
		if (oldHash !== hash) return

		let a = document.createElement('a')

		const href = target.href
		if (href.indexOf('https://mail.google.com/mail/u/') === -1) return

		const key = hrefToHash.get(href)
		if (key !== undefined && key !== hash) return

		const date = Date.now()
		console.log(date, 'hash1', hrefToHash.get(href), location.hash)
		hrefToHash.set(href, hash)
		fetch(href)
			.then(xhr => {
				console.log(date, 'hash2', hrefToHash.get(href), location.hash)
				if (hrefToHash.get(href) !== location.hash || oldHash !== location.hash)
					return console.log('hash doesnt match', hrefToHash.get(href), location.hash) // If the XHR is returned to late, abort; issue #1

				if (!document.body.contains(parent)) parent = document.querySelector('div[id=":5"] + div')

				console.log(xhr.responseXML)
				let elem = xhr.responseXML.querySelector('.message div > font')
				if (!elem.textContent) {
					console.warn(elem.childNodes)
					throw new Error('empty message')
				}

				let $$ = parent.querySelector('.a3s')
				$$.innerHTML = elem.innerHTML // swap content
				$$ = a = hash = null // prevent memory leak

				return xhr
			})
			.catch(function(error) {
				console.error(error)
				a.textContent += ` ― ${chrome.i18n.getMessage('error')} (${chrome.i18n.getMessage('clickHere')})`

				a = hash = null // prevent memory leak
				return error
			})

		a.href = '#'
		a.textContent = `${chrome.i18n.getMessage('expanding')}... (${chrome.i18n.getMessage('clickHere')})`
		a.style.paddingLeft = '5px'
		a.addEventListener(
			'click',
			e => {
				e.preventDefault()
				hrefToHash.delete(href)
				fetchFromElem(parent, target)
			},
			false
		)
		target.parentElement.appendChild(a)
	}

	let observer
	function observe() {
		const div = document.querySelector('div[id=":5"] + div')
		if (div === null) return

		observer = new MutationObserver(handleMutations)
		observer.observe(div, {
			subtree: true,
			childList: true,
		})
	}

	function handleMutations(mutations) {
		const hash = location.hash
		if (!label.test(hash) && !inbox.test(hash)) return

		for (let i = 0; i < mutations.length; ++i) {
			const parent = mutations[i].target
			let mutation = parent.querySelector('vem')
			if (mutation === null) mutation = parent.querySelector('.ii.gt > div > div > br + br + a')
			if (mutation === null) return

			const len = mutation.length
			if (len === 0) return
			console.log(mutations[i], mutations[i].target, mutation)

			if (mutation !== null) fetchFromElemThrottled(parent, mutation, hash) //fetchFromElemThrottled(parent, mutation, hash)
		}
	}

	function throttle(callback, wait = 100) {
		let time
		let lastFunc

		return function throttle(...args) {
			if (time === undefined) {
				callback.apply(this, args)
				time = Date.now()
			} else {
				clearTimeout(lastFunc)
				lastFunc = setTimeout(() => {
					if (Date.now() - time >= wait) {
						callback.apply(this, args)
						time = Date.now()
					}
				}, wait - (Date.now() - time))
			}
		}
	}

	/**
	 * Adds event listeners.
	 *
	 * @author 	Jacob Groß
	 * @date   	2015-06-07
	 */
	function addListener() {
		/** hashchanges */
		window.addEventListener('load', function() {
			window.setInterval(() => hrefToHash.clear(), 300000)
		})

		window.addEventListener('hashchange', function() {
			if (observer !== undefined) observer.disconnect()
			observe()
		})
	}

	addListener()
})(window)

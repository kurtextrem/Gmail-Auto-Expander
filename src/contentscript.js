;(function(window) {
	'use strict'

	const document = window.document,
		location = window.location

	/**
	 * Fetches the given URL; we can't use Fetch here, because it has no support for returning XML/HTML as response.
	 *
	 * @author 	Jacob Groß
	 * @date   	2015-06-07
	 * @param  	{string}    	href 	URL to fetch
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
	const fetchMap = new Map()

	function fetchFromElem(parent, target) {
		const href = target.href
		if (href.indexOf('https://mail.google.com/mail/u/') === -1) return

		const maybePromise = fetchMap.get(href)
		if (maybePromise !== undefined) {
			maybePromise.then(handleXHR.bind(undefined, parent)).catch(error)
			fetchMap.delete(href)
			return
		}

		let a = document.createElement('a')

		const promise = fetch(href)
			.then(handleXHR.bind(undefined, parent))
			.catch(function(error) {
				console.error(error)
				a.textContent += ` ― ${chrome.i18n.getMessage(
					'error'
				)} (${chrome.i18n.getMessage('clickHere')})`

				a = null // prevent memory leak
				return error
			})
		fetchMap.set(href, promise)

		a.href = '#'
		a.textContent = `${chrome.i18n.getMessage(
			'expanding'
		)}... (${chrome.i18n.getMessage('clickHere')})`
		a.style.paddingLeft = '5px'
		a.addEventListener(
			'click',
			e => {
				e.preventDefault()
				fetchMap.delete(href)
				fetchFromElem(parent, target)
			},
			false
		)
		target.parentElement.appendChild(a)
	}

	function handleXHR(parent, xhr) {
		/*let pa = parent
		if (!document.body.contains(pa))
			pa = document.querySelector('div[id=":5"] + div')*/

		//console.log(xhr.responseXML)
		const elem = xhr.responseXML.querySelector('.message div > font')
		if (!elem.textContent) {
			console.warn(elem.childNodes)
			throw new Error('empty message')
		}

		parent.querySelector('.a3s').innerHTML = elem.innerHTML // swap content

		return xhr
	}

	function error(e) {
		console.error(e)
		return e
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
			if (parent.classList.contains('gmail-em--matched')) return

			let mutation = parent.querySelector('vem')
			if (mutation === null)
				mutation = parent.querySelector('.ii.gt > div > div > br + br + a')
			if (mutation === null) return

			const len = mutation.length
			if (len === 0) return

			//console.log(mutations[i], mutations[i].target, mutation)
			parent.classList.add('gmail-em--matched')
			fetchFromElem(parent, mutation)
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

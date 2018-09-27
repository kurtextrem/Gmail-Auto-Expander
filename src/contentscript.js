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
	function hashChange() {
		let hash = location.hash
		if (!label.test(hash) && !inbox.test(hash)) return

		let vem = document.getElementsByClassName('vem')
		if (vem.length === 0) vem = document.querySelectorAll('.ii.gt > div > div > br + br + a')
		const len = vem.length

		if (len === 0) return

		let target
		if (len !== 1) for (let i = 0; i < len; ++i) if (document.body.contains(vem[i])) target = vem[i]

		let a = document.createElement('a')

		const href = target.href,
			key = hrefToHash.get(href)
		if (key !== undefined && key !== hash) return

		hrefToHash.set(href, hash)
		fetch(href)
			.then(xhr => {
				if (hrefToHash.get(href) !== location.hash) return hrefToHash.delete(href) // issue #1

				console.log(target, xhr.responseXML)
				let elem = xhr.responseXML.querySelector('.message div > font')
				if (!elem.textContent) {
					console.warn(elem.childNodes)
					throw new Error('empty message')
				}

				window.requestAnimationFrame(() => {
					let $$ = document.querySelectorAll('.a3s'),
						$len = $$.length
					console.log($$)
					$$[$len > 1 ? $len - 2 : $len - 1].innerHTML = elem.innerHTML // swap content
					$$ = $len = elem = null
				})

				vem.length = 0
				a = hash = vem = target = null // prevent memory leak

				return xhr
			})
			.catch(function(error) {
				console.error(error)
				a.textContent += ` ― ${chrome.i18n.getMessage('error')} (${chrome.i18n.getMessage('clickHere')})`

				vem.length = 0
				a = hash = vem = target = null // prevent memory leak
				return error
			})

		a.href = '#'
		a.textContent = `${chrome.i18n.getMessage('expanding')}... (${chrome.i18n.getMessage('clickHere')})`
		a.style.paddingLeft = '5px'
		a.addEventListener('click', e => hrefToHash.delete(href) && e.preventDefault() && hashChange(), false)
		target.parentElement.appendChild(a)
	}

	let observer
	function observe() {
		observer = new MutationObserver(function(mutations) {
			const hash = document.location.hash
			if (!label.test(hash) && !inbox.test(hash)) return

			for (let i = 0; i < mutations.length; ++i) {
				let mutation = mutations[i].target.querySelector('vem')
				if (mutation.length === 0) mutation = document.querySelectorAll('.ii.gt > div > div > br + br + a')
				const len = mutation.length

				if (len === 0) return

				if (mutation !== null) window.setTimeout(() => fetchFromElem(mutation), 0)
			}
		})
		observer.observe(document.querySelector('div[id=":5"] + div'), {
			subtree: true,
			childList: true,
		})
	}

	/**
	 * Adds event listeners.
	 *
	 * @author 	Jacob Groß
	 * @date   	2015-06-07
	 */
	function addListener() {
		/** hashchanges */
		window.addEventListener('DOMContentLoaded', function() {
			if (observer === undefined) observe()
		})
	}

	addListener()
})(window)

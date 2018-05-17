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
		if (vem.length === 0) return

		vem = vem.length > 1 ? vem[1] : vem[0]

		let a = document.createElement('a')

		const href = vem.href
		hrefToHash.set(href, hash)
		fetch(href)
			.then(xhr => {
				if (hrefToHash.get(href) !== location.hash) return hrefToHash.delete(href) // issue #1

				console.log(location.hash, hash, vem, xhr.responseXML)
				let elem = xhr.responseXML.querySelector('.message div > font')
				if (!elem.textContent) {
					console.warn(elem.childNodes)
					throw new Error('empty message')
				}

				document.querySelector('.a3s').innerHTML = elem.innerHTML // swap content (.a3s)
				a = hash = vem = elem = null // prevent memory leak

				return xhr
			})
			.catch(function(error) {
				a.textContent += ` ― ${chrome.i18n.getMessage('error')} (${messages.clickHere})`
				console.error(error)
				a = hash = vem = null // prevent memory leak
				return error
			})

		a.href = '#'
		a.textContent = `${chrome.i18n.getMessage('expanding')}... (${chrome.i18n.getMessage('clickHere')})`
		a.style.paddingLeft = '5px'
		a.addEventListener('click', e => e.preventDefault() && hashChange(), false)
		vem.parentElement.appendChild(a)
	}

	/**
	 * Adds event listeners.
	 *
	 * @author 	Jacob Groß
	 * @date   	2015-06-07
	 */
	function addListener() {
		/** hashchanges */
		window.addEventListener(
			'hashchange',
			function() {
				// window.setTimeout(hashChange, 600)
				window.requestIdleCallback(hashChange)
			},
			false
		)
	}

	addListener()
})(window)

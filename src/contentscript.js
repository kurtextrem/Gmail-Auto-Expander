;(function(window) {
	'use strict'

	const document = window.document,
		location = window.location

	/** Locales cache */
	const messages = {
		expanding: chrome.i18n.getMessage('expanding'),
		clickHere: chrome.i18n.getMessage('clickHere'),
	}

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
			xhr.onreadystatechange = function() {
				if (xhr.readyState === 4) {
					resolve(xhr)
				}
			}
			xhr.onerror = xhr.onabort = reject

			xhr.open('GET', href, true)
			xhr.send()
		})
	}

	/**
	 * Handles the expansion of the mail.
	 *
	 * @author 	Jacob Groß
	 * @date   	2016-09-09
	 */
	const label = /#label\/.+\/.+/
	const inbox = /#(inbox|imp|all)\/.+/
	function init() {
		let hash = location.hash
		if (!label.test(hash) && !inbox.test(hash)) return

		let vem = document.getElementsByClassName('vem')[0]
		if (vem !== undefined) {
			let a = document.createElement('a')

			a.href = 'javascript:null'
			a.textContent = messages.expanding + '... (' + messages.clickHere + ')'
			a.style.paddingLeft = '5px'
			a.addEventListener('click', fetch.bind(undefined, vem.href), false)
			vem.parentElement.appendChild(a)

			fetch(vem.href)
				.then(function(xhr) {
					if (location.hash !== hash) return // issue #1

					let elem = xhr.responseXML.querySelector('.message div > font')
					if (!elem.innerText) {
						console.warn(elem.childNodes)
						throw new Error('empty message')
					}

					vem.parentElement.innerHTML = elem.innerHTML // swap content (.a3s)
					hash = a = vem = elem = null // prevent memory leak

					return xhr
				})
				.catch(function(error) {
					a.textContent += ' ― ' + chrome.i18n.getMessage('error') + ' (' + messages.clickHere + ')'
					console.error(error)
					hash = a = vem = null // prevent memory leak
				})
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
		window.addEventListener('hashchange', init, false)
	}

	addListener()
})(window)

!function (window) {
	'use strict'

	var document = window.document,
		location = window.location

	/** Locales cache */
	var messages = {
		expanding: chrome.i18n.getMessage('expanding'),
		clickHere: chrome.i18n.getMessage('clickHere')
	}

	/**
	 * The constructor.
	 *
	 * @author 	Jacob Groß
	 * @date   	2015-06-07
	 */
	var ExpandMessage = function () {
		this.addListener()
		// this.init() - see issue #2
	}

	/**
	 * Handles the expansion of the mail.
	 *
	 * @author 	Jacob Groß
	 * @date   	2016-09-09
	 */
	ExpandMessage.prototype.init = function () {
		if (location.hash.indexOf('/') === -1) return

		var vem = document.getElementsByClassName('vem')[0]
		if (vem !== undefined) {
			var a = document.createElement('a'),
				savedHash = location.hash

			a.href = 'javascript:null'
			a.textContent = messages.expanding + '... (' + messages.clickHere + ')'
			a.style.paddingLeft = '5px'
			a.addEventListener('click', this.fetch.bind(this, vem.href), false)
			vem.parentElement.appendChild(a)

			this.fetch(vem.href)
			.then(function (xhr) {
				if (location.hash !== savedHash) return // issue #1

				var elem = xhr.responseXML.querySelector('.message div > font')
				if (!elem.innerText) return console.warn('empty message', elem.childNodes)

				vem.parentElement.innerHTML = elem.innerHTML // swap content (.a3s)
				savedHash = a = vem = null // prevent memory leak
			})
			.catch(function (error) {
				a.textContent += ' ― ' + chrome.i18n.getMessage('error') + ' (' + messages.clickHere + ')'
				console.error(error)
			})
		}
	}

	/**
	 * Fetches the given URL; we can't use Fetch here, because it has no support for returning XML/HTML as response.
	 *
	 * @author 	Jacob Groß
	 * @date   	2015-06-07
	 * @param  	{string}    	href 	URL to fetch
	 * @return 	{promise}         		Fetch Promise
	 */
	ExpandMessage.prototype.fetch = function (href) {
		return new Promise(function (resolve, reject) {
			var xhr = new XMLHttpRequest()
			xhr.responseType = 'document'
			xhr.onreadystatechange = function () {
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
	 * Adds event listeners.
	 *
	 * @author 	Jacob Groß
	 * @date   	2015-06-07
	 */
	ExpandMessage.prototype.addListener = function () {
		/** hashchanges */
		window.addEventListener('hashchange', this.init.bind(this), false)
	}

	new ExpandMessage()
} (window);

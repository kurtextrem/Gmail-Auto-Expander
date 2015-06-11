+function (window) {
	'use strict';

	var document = window.document,
		location = window.location

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
	 * @date   	2015-06-07
	 */
	ExpandMessage.prototype.init = function () {
		if (location.hash.indexOf('/') === -1) return

		var vem = document.getElementsByClassName('vem')[0]
		if (vem !== undefined) {
			var a = document.createElement('a'),
				savedHash = location.hash

			a.href = 'javascript:null'
			a.textContent = chrome.i18n.getMessage('expanding') + '... (' + chrome.i18n.getMessage('clickHere') + ')'
			a.style.paddingLeft = '5px'
			a.addEventListener('click', this.fetch.bind(this, vem.href), false)
			vem.parentElement.appendChild(a)

			this.fetch(vem.href)
			.then(function (xhr) {
				if (location.hash !== savedHash) return // issue #1

				vem.parentElement.innerHTML = xhr.responseXML.querySelector('.message div > font > div').innerHTML // swap content (.a3s)
				savedHash = a = vem = null // prevent memory leak
			})
			.catch(function (error) {
				a.textContent += ' ― ' + chrome.i18n.getMessage('error') + ' (' + chrome.i18n.getMessage('clickHere') + ')'
				console.log(error)
			})
		}
	}

	/**
	 * Fetches the given URL.
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
		window.addEventListener('popstate', this.init.bind(this), false)
	}

	new ExpandMessage()
} (window);

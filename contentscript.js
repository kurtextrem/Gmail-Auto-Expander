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
		if (location.hash.indexOf('inbox/') === -1) return

		var vem = document.getElementsByClassName('vem')[0]
		if (vem !== undefined) {
			var a = document.createElement('a'),
				savedHash = location.hash

			a.href = 'javascript:void'
			a.textContent = '| ' + chrome.i18n.getMessage('expanding') + '... (' + chrome.i18n.getMessage('clickHere') + ')'
			a.style.paddingLeft = '2px'
			a.addEventListener('click', this.request.bind(this, vem.href), false)
			vem.parentElement.appendChild(a)

			this.request(vem.href)
			.then(function (xml) {
				if (location.hash !== savedHash) return // issue #1

				vem.parentElement.innerHTML = xml.querySelector('.message div > font > div').innerHTML // swap content (.a3s)
				savedHash = a = vem = null // prevent memory leak
			})
			.catch(function (error) {
				a.textContent += '| ' + chrome.i18n.getMessage('error') + ' (' + chrome.i18n.getMessage('clickHere') + ')'
			})
		}
	}

	/**
	 * Requests the given URL.
	 *
	 * @author 	Jacob Groß
	 * @date   	2015-06-07
	 * @param  	{string}    	href 	URL to request
	 * @return 	{promise}         		Fetch Promise
	 */
	ExpandMessage.prototype.request = function (href) {
		return window.fetch(href).then(function (response) {
			return (new window.DOMParser()).parseFromString(response.text(), 'text/xml')
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

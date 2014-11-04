+function (window) {
	'use strict';

	var document = window.document, location = window.location

	var ExpandMessage = function () {
		this.addListener()
		//this.init()
	}

	ExpandMessage.prototype.init = function () {
		if (location.hash.indexOf('inbox/') === -1) return

		var vem = document.getElementsByClassName('vem')[0]
		if (vem !== undefined) {
			var a = document.createElement('a')
			a.href = '#'
			a.textContent += ' | ' + chrome.i18n.getMessage('expanding') + '...'
			a.addEventListener('click', this.request.bind(this, vem.href), false)
			vem.parentElement.appendChild(a)

			this.request(vem.href)
			.then(function () { a = vem = null }) // prevent memory leak
			.catch(function () {
				a.textContent += ' | ' + chrome.i18n.getMessage('error')
			})
		}
	}

	ExpandMessage.prototype.request = function (href) {
		return new Promise(function (resolve, reject) {
			var xhr = new XMLHttpRequest()
			xhr.responseType = 'document'
			xhr.onreadystatechange = function () {
				if (xhr.readyState === 4) {
					document.getElementsByClassName('a3s')[0].innerHTML = xhr.responseXML.querySelector('.message table tbody div > font').innerHTML
					resolve()
				}
			}
			xhr.onerror = xhr.onabort = reject

			xhr.open('GET', href, true)
			xhr.send()
		})
	}

	ExpandMessage.prototype.addListener = function () {
		window.addEventListener('popstate', this.init.bind(this), false) // hashchange
	}

	new ExpandMessage()
} (window);

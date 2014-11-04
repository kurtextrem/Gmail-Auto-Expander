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
			vem.textContent += ' | Expanding...'
			vem.addEventListener('click', this.request.bind(this, vem.href), false)

			this.request(vem.href, function () {
				vem.textContent += ' | Error while expanding. Click to try again.'
			})
		}
	}

	ExpandMessage.prototype.request = function (href, abort) {
		var xhr = new XMLHttpRequest()
		xhr.open('GET', href, true)
		xhr.responseType = 'document'
		xhr.onreadystatechange = function () {
			if (xhr.readyState === 4) {
				document.getElementsByClassName('a3s')[0].innerHTML = xhr.responseXML.querySelector('.message table tbody div > font').innerHTML
			}
		}
		xhr.onerror = xhr.onabort = abort
		xhr.send()
	}

	ExpandMessage.prototype.addListener = function () {
		window.addEventListener('popstate', this.init.bind(this), false) // hashchange
	}

	new ExpandMessage()
} (window);

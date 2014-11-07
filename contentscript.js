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
			var a = document.createElement('a'), savedHash = location.hash
			a.href = 'javascript:void'
			a.textContent += '| ' + chrome.i18n.getMessage('expanding') + '... (' + chrome.i18n.getMessage('clickHere') + ')'
			a.style.paddingLeft = '2px'
			a.addEventListener('click', this.request.bind(this, vem.href), false)
			vem.parentElement.appendChild(a)

			this.request(vem.href)
			.then(function (xhr) {
				if (location.hash !== savedHash) return // #1
				vem.parentElement.innerHTML = xhr.responseXML.querySelector('.message table tbody div > font').innerHTML // swap content (.a3s)
				savedHash = a = vem = null // prevent memory leak
			})
			.catch(function () {
				a.textContent += '| ' + chrome.i18n.getMessage('error') + ' (' + chrome.i18n.getMessage('clickHere') + ')'
			})
		}
	}

	ExpandMessage.prototype.request = function (href) {
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

	ExpandMessage.prototype.addListener = function () {
		window.addEventListener('popstate', this.init.bind(this), false) // hashchange
	}

	new ExpandMessage()
} (window);

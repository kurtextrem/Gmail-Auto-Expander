'use strict'

const options = {
	cache: 'force-cache',
	headers: new Headers({
		Connection: 'keep-alive',
	}),
}

function fetchCache(url) {
	return fetch(url, options)
		.then(checkStatus)
		.then(toText)
		.catch(error)
}

function checkStatus(response) {
	if (response.ok) return response

	const error = new Error(`HTTP Error ${response.statusText}`)
	error.status = response.statusText
	error.response = response
	console.error(error)
	throw error
}

function toText(response) {
	return response.text()
}

function error(e) {
	console.error(e)
	return e
}

function parse(text) {
	const dom = new DOMParser().parseFromString(text, 'text/html')
	const element = dom.querySelector('.message div > font')
	if (element === null || !element.textContent) {
		console.warn('childNodes', element.childNodes)
		throw new Error('empty message')
	}

	return element.innerHTML
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	fetchCache(
		'https://mail.google.com/mail/u/0?' + decodeURIComponent(request.path)
	)
		.then(parse)
		.then(sendResponse)

	return true
})

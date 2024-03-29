'use strict'

const options = {
	cache: 'force-cache',
	credentials: 'include',
	headers: new Headers({
		Connection: 'keep-alive',
	}),
}

/**
 *
 */
function fetchCache(url) {
	return fetch(url, options)
		.then(checkStatus)
		.then(toText)
}

/**
 *
 */
function checkStatus(response) {
	if (response.ok) return response

	const error = new Error(`HTTP Error ${response.statusText}`)
	error.status = response.statusText
	error.response = response
	console.error(error)
	throw error
}

/**
 *
 */
function toText(response) {
	return response.text()
}

/**
 *
 */
function error(e) {
	console.error(e)
	return e
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	fetchCache(
		'https://mail.google.com/mail/u/0?' + decodeURIComponent(request.path)
	)
		.then(sendResponse)
		.catch(error)

	return true
})

/* jshint node: true, devel: true */
var shell = require('shelljs'),
	zipdir = require('zip-dir'),
	fs = require('fs')

!function () {
	'use strict'

	var Build = function () {
		this.args = process.argv.slice(2)
		this.args.forEach(function (arg) {
			if (this[arg]) {
				this[arg]()
			} else {
				console.warn('undefined option', arg)
			}
		}.bind(this))
	}

	Build.prototype.copy = function () {
		this.copyLocales()
		this.copyImg()
	}

	Build.prototype.copyLocales = function () {
		fs.readdir('src/_locales', function (err, folder) {
			if (err) throw err

			folder.forEach(function (name) {
				if (name !== '.' && name !== '..') {
					shell.mkdir('-p', 'dist/_locales/' + name)
					shell.exec('json-minify src/_locales/' + name + '/messages.json > dist/_locales/' + name + '/messages.json')
				}
			})
		})
	}

	Build.prototype.copyImg = function () {
		shell.cp('src/*.png', 'dist')
	}

	Build.prototype.replaceJSON = function () {
		shell.sed('-i', 'contentscript.js', 'contentscript.min.js', 'dist/manifest.json')
	}

	Build.prototype.buildZip = function () {
		zipdir('dist', { saveTo: 'dist.zip' }, function (err) {
			if (err)
				console.error(err)
		})
	}

	new Build()
}();

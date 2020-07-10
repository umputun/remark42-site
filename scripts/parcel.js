#!/usr/bin/env node
const fs = require('fs')
const path = require('path')
const Bundler = require('parcel-bundler')
const express = require('express')
const { createProxyMiddleware } = require('http-proxy-middleware')

const { parcelOptions } = require('../package.json')

function getEnvOptions(opts) {
	const envOptions = opts.env[process.env.NODE_ENV]
	const commonOptions = { outDir: './dist', ...opts }

	delete commonOptions.env
	delete commonOptions.entryFiles
	delete commonOptions.manifestDest

	return Object.assign(commonOptions, envOptions)
}

function readManifestJson(path) {
	if (!fs.existsSync(path)) {
		return {}
	}

	try {
		return JSON.parse(fs.readFileSync(path, 'utf8'))
	} catch (e) {
		console.error('Manifest file is invalid')
		throw e
	}
}

function feedManifestValue(bundle, manifestValue, publicUrl) {
	const filename = path.basename(bundle.name)
	const output = path.join(publicUrl, filename)
	let hash

	if (bundle.entryAsset) {
		hash = bundle.entryAsset.hash
	} else if (bundle.assets) {
		hash = bundle.assets.values().next().value.hash
	}

	if (filename && !manifestValue[filename]) {
		const isNotMap = path.extname(filename) !== '.map'
		const hashParam = hash && isNotMap ? `?${hash.substring(0, 6)}` : ''

		manifestValue[filename] = `${output}${hashParam}`
	}

	bundle.childBundles.forEach((bundle) => {
		feedManifestValue(bundle, manifestValue, publicUrl)
	})
}

function entryPointHandler(bundle, { publicUrl, manifestDest }) {
	const manifestPath = path.resolve(manifestDest)
	const manifestValue = {}

	feedManifestValue(bundle, manifestValue, publicUrl)

	const oldManifestValue = readManifestJson(manifestPath)
	const combinedManifest = Object.assign(oldManifestValue, manifestValue)

	fs.writeFileSync(manifestPath, JSON.stringify(combinedManifest, null, 2))
	console.log(`Manifest has been written to ${manifestPath}`)
}

;(async function () {
	const options = getEnvOptions(parcelOptions)
	const bundler = new Bundler(parcelOptions.entryFiles, options)

	bundler.on('bundled', (bundle) => {
		if (bundler.options.entryFiles.length > 1) {
			bundle.childBundles.forEach((item) => entryPointHandler(item, parcelOptions))
			return
		}

		entryPointHandler(bundle, parcelOptions)
	})

	if (process.env.NODE_ENV === 'production') {
		await bundler.bundle()

		process.exit(0)
	}

	const app = express()

	app.use(parcelOptions.staticPath || '/', express.static(path.resolve(options.outDir)))
	app.use(
		bundler.middleware(),
		createProxyMiddleware({
			target: `http://localhost:${process.env.HUGO_PORT || 1313}`,
		})
	)

	app.listen(8081, () => console.log('🌎  Dev env started on http://localhost:8081'))
})()

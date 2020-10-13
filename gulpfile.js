const { writeFileSync, existsSync, readFileSync } = require('fs')
const { resolve } = require('path')
const { series, src, dest, watch } = require('gulp')
const hash = require('gulp-hash')
const postcss = require('gulp-postcss')
const clean = require('gulp-clean')

const cssnano = require('cssnano')
const postcssImport = require('postcss-import')
const postcssEnv = require('postcss-preset-env')
const postcssModules = require('postcss-modules')

const jsonFileName = resolve('./data/classnames.json')

const postcssPlugins = [
	postcssImport,
	postcssEnv({ stage: 0 }),
	postcssModules({
		generateScopeName: '[name]__[local]___[hash:base64:5]',
		getJSON(_, newClassnames) {
			let classnamesMap = { ...newClassnames }

			if (existsSync(jsonFileName)) {
				const writedClassnames = readFileSync(jsonFileName, 'utf8')

				classnamesMap = Object.assign(JSON.parse(writedClassnames), classnamesMap)
			}

			writeFileSync(jsonFileName, JSON.stringify(classnamesMap))
		},
	}),
	cssnano,
]

const cssTask = () =>
	src('./assets/main.css')
		.pipe(postcss(postcssPlugins))
		.pipe(hash())
		.pipe(dest('./static/assets'))
		.pipe(
			hash.manifest('manifest.json', {
				deleteOld: true,
				sourceDir: __dirname + '/static/assets',
			})
		)
		.pipe(dest('./data'))

const cleanTask = () => src('./static/assets/*.css').pipe(clean())
const watchTask = () => watch('./assets/**/*.css', series(cleanTask, cssTask))

exports.clean = cleanTask
exports.css = series(cleanTask, cssTask)
exports.watch = watchTask
exports.default = cssTask

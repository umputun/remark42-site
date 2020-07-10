module.exports = {
	plugins: [
		require('postcss-preset-env')({ stage: 0 }),
		require('postcss-modules')({
			generateScopeName: '[name]__[local]___[hash:base64:5]',
			getJSON(_, newClassnames) {
				const fs = require('fs')
				const path = require('path')
				const jsonFileName = path.resolve('./data/classnames.json')
				let classnamesMap = { ...newClassnames }

				if (fs.existsSync(jsonFileName)) {
					const writedClassnames = fs.readFileSync(jsonFileName, 'utf8')

					classnamesMap = Object.assign(JSON.parse(writedClassnames), classnamesMap)
				}

				fs.writeFileSync(jsonFileName, JSON.stringify(classnamesMap))
			},
		}),
		require('cssnano'),
	],
}

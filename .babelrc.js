const path = require('path');
const jsConfig = require('./jsconfig.js');

module.exports = {
	presets: [
		[
			'@babel/preset-env',
			{
				targets: {
					node: 'current',
				},
			},
		],
	],
	plugins: [
		[
			'module-resolver',
			{
				root: [path.resolve(__dirname, 'src')],
				alias: jsConfig.compilerOptions.paths,
			},
		],
	],
};
// The file contents for the current environment will overwrite these during build.
// The build system defaults to the dev environment which uses `environment.ts`, but if you do
// `ng build --env=prod` then `environment.prod.ts` will be used instead.
// The list of which env maps to which file can be found in `.angular-cli.json`.

import { BadgrEnvironment } from './badgr-environment';

export const environment: BadgrEnvironment = {
	production: false,
	config: {
		features: {
			externalAuthProviders: [
				{
					color: '#ffeace',
					imgSrc: 'https://hmgstrategy1.blob.core.windows.net/hmgfiles/images/default-source/articles/auth0-logo794e56d3-50c9-4c18-901c-98fffa711981.png?sfvrsn=85689ff5_1',
					label: 'Auth0',
					slug: 'auth0',
				},
			],
			socialAccountProviders: ['auth0'],
			disableIssuers: true,
		},
		theme: {
			welcomeMessage: 'Willkommen auf myBadges',
			serviceName: 'myBadges',
			showPoweredByBadgr: true,
			providedBy: {
				name: 're:edu',
				url: 'https://reedu.de',
			},
			showApiDocsLink: true,
			logoImg: {
				small: 'https://avatars.githubusercontent.com/u/72136919?s=60&v=4',
				desktop: 'https://avatars.githubusercontent.com/u/72136919?s=400&v=4',
			},
			loadingImg: {
				imageUrl:
					'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiBzdHlsZT0ibWFyZ2luOiBhdXRvOyBiYWNrZ3JvdW5kOiByZ2IoMjQxLCAyNDIsIDI0Myk7IGRpc3BsYXk6IGJsb2NrOyIgd2lkdGg9IjIwMHB4IiBoZWlnaHQ9IjIwMHB4IiB2aWV3Qm94PSIwIDAgMTAwIDEwMCIgcHJlc2VydmVBc3BlY3RSYXRpbz0ieE1pZFlNaWQiPgo8ZyB0cmFuc2Zvcm09InJvdGF0ZSgwIDUwIDUwKSI+CiAgPHJlY3QgeD0iNDciIHk9IjI0IiByeD0iMi40IiByeT0iMi40IiB3aWR0aD0iNiIgaGVpZ2h0PSIxMiIgZmlsbD0iIzA3YWJjYyI+CiAgICA8YW5pbWF0ZSBhdHRyaWJ1dGVOYW1lPSJvcGFjaXR5IiB2YWx1ZXM9IjE7MCIga2V5VGltZXM9IjA7MSIgZHVyPSIxcyIgYmVnaW49Ii0wLjkxNjY2NjY2NjY2NjY2NjZzIiByZXBlYXRDb3VudD0iaW5kZWZpbml0ZSIvPgogIDwvcmVjdD4KPC9nPjxnIHRyYW5zZm9ybT0icm90YXRlKDMwIDUwIDUwKSI+CiAgPHJlY3QgeD0iNDciIHk9IjI0IiByeD0iMi40IiByeT0iMi40IiB3aWR0aD0iNiIgaGVpZ2h0PSIxMiIgZmlsbD0iIzA3YWJjYyI+CiAgICA8YW5pbWF0ZSBhdHRyaWJ1dGVOYW1lPSJvcGFjaXR5IiB2YWx1ZXM9IjE7MCIga2V5VGltZXM9IjA7MSIgZHVyPSIxcyIgYmVnaW49Ii0wLjgzMzMzMzMzMzMzMzMzMzRzIiByZXBlYXRDb3VudD0iaW5kZWZpbml0ZSIvPgogIDwvcmVjdD4KPC9nPjxnIHRyYW5zZm9ybT0icm90YXRlKDYwIDUwIDUwKSI+CiAgPHJlY3QgeD0iNDciIHk9IjI0IiByeD0iMi40IiByeT0iMi40IiB3aWR0aD0iNiIgaGVpZ2h0PSIxMiIgZmlsbD0iIzA3YWJjYyI+CiAgICA8YW5pbWF0ZSBhdHRyaWJ1dGVOYW1lPSJvcGFjaXR5IiB2YWx1ZXM9IjE7MCIga2V5VGltZXM9IjA7MSIgZHVyPSIxcyIgYmVnaW49Ii0wLjc1cyIgcmVwZWF0Q291bnQ9ImluZGVmaW5pdGUiLz4KICA8L3JlY3Q+CjwvZz48ZyB0cmFuc2Zvcm09InJvdGF0ZSg5MCA1MCA1MCkiPgogIDxyZWN0IHg9IjQ3IiB5PSIyNCIgcng9IjIuNCIgcnk9IjIuNCIgd2lkdGg9IjYiIGhlaWdodD0iMTIiIGZpbGw9IiMwN2FiY2MiPgogICAgPGFuaW1hdGUgYXR0cmlidXRlTmFtZT0ib3BhY2l0eSIgdmFsdWVzPSIxOzAiIGtleVRpbWVzPSIwOzEiIGR1cj0iMXMiIGJlZ2luPSItMC42NjY2NjY2NjY2NjY2NjY2cyIgcmVwZWF0Q291bnQ9ImluZGVmaW5pdGUiLz4KICA8L3JlY3Q+CjwvZz48ZyB0cmFuc2Zvcm09InJvdGF0ZSgxMjAgNTAgNTApIj4KICA8cmVjdCB4PSI0NyIgeT0iMjQiIHJ4PSIyLjQiIHJ5PSIyLjQiIHdpZHRoPSI2IiBoZWlnaHQ9IjEyIiBmaWxsPSIjMDdhYmNjIj4KICAgIDxhbmltYXRlIGF0dHJpYnV0ZU5hbWU9Im9wYWNpdHkiIHZhbHVlcz0iMTswIiBrZXlUaW1lcz0iMDsxIiBkdXI9IjFzIiBiZWdpbj0iLTAuNTgzMzMzMzMzMzMzMzMzNHMiIHJlcGVhdENvdW50PSJpbmRlZmluaXRlIi8+CiAgPC9yZWN0Pgo8L2c+PGcgdHJhbnNmb3JtPSJyb3RhdGUoMTUwIDUwIDUwKSI+CiAgPHJlY3QgeD0iNDciIHk9IjI0IiByeD0iMi40IiByeT0iMi40IiB3aWR0aD0iNiIgaGVpZ2h0PSIxMiIgZmlsbD0iIzA3YWJjYyI+CiAgICA8YW5pbWF0ZSBhdHRyaWJ1dGVOYW1lPSJvcGFjaXR5IiB2YWx1ZXM9IjE7MCIga2V5VGltZXM9IjA7MSIgZHVyPSIxcyIgYmVnaW49Ii0wLjVzIiByZXBlYXRDb3VudD0iaW5kZWZpbml0ZSIvPgogIDwvcmVjdD4KPC9nPjxnIHRyYW5zZm9ybT0icm90YXRlKDE4MCA1MCA1MCkiPgogIDxyZWN0IHg9IjQ3IiB5PSIyNCIgcng9IjIuNCIgcnk9IjIuNCIgd2lkdGg9IjYiIGhlaWdodD0iMTIiIGZpbGw9IiMwN2FiY2MiPgogICAgPGFuaW1hdGUgYXR0cmlidXRlTmFtZT0ib3BhY2l0eSIgdmFsdWVzPSIxOzAiIGtleVRpbWVzPSIwOzEiIGR1cj0iMXMiIGJlZ2luPSItMC40MTY2NjY2NjY2NjY2NjY3cyIgcmVwZWF0Q291bnQ9ImluZGVmaW5pdGUiLz4KICA8L3JlY3Q+CjwvZz48ZyB0cmFuc2Zvcm09InJvdGF0ZSgyMTAgNTAgNTApIj4KICA8cmVjdCB4PSI0NyIgeT0iMjQiIHJ4PSIyLjQiIHJ5PSIyLjQiIHdpZHRoPSI2IiBoZWlnaHQ9IjEyIiBmaWxsPSIjMDdhYmNjIj4KICAgIDxhbmltYXRlIGF0dHJpYnV0ZU5hbWU9Im9wYWNpdHkiIHZhbHVlcz0iMTswIiBrZXlUaW1lcz0iMDsxIiBkdXI9IjFzIiBiZWdpbj0iLTAuMzMzMzMzMzMzMzMzMzMzM3MiIHJlcGVhdENvdW50PSJpbmRlZmluaXRlIi8+CiAgPC9yZWN0Pgo8L2c+PGcgdHJhbnNmb3JtPSJyb3RhdGUoMjQwIDUwIDUwKSI+CiAgPHJlY3QgeD0iNDciIHk9IjI0IiByeD0iMi40IiByeT0iMi40IiB3aWR0aD0iNiIgaGVpZ2h0PSIxMiIgZmlsbD0iIzA3YWJjYyI+CiAgICA8YW5pbWF0ZSBhdHRyaWJ1dGVOYW1lPSJvcGFjaXR5IiB2YWx1ZXM9IjE7MCIga2V5VGltZXM9IjA7MSIgZHVyPSIxcyIgYmVnaW49Ii0wLjI1cyIgcmVwZWF0Q291bnQ9ImluZGVmaW5pdGUiLz4KICA8L3JlY3Q+CjwvZz48ZyB0cmFuc2Zvcm09InJvdGF0ZSgyNzAgNTAgNTApIj4KICA8cmVjdCB4PSI0NyIgeT0iMjQiIHJ4PSIyLjQiIHJ5PSIyLjQiIHdpZHRoPSI2IiBoZWlnaHQ9IjEyIiBmaWxsPSIjMDdhYmNjIj4KICAgIDxhbmltYXRlIGF0dHJpYnV0ZU5hbWU9Im9wYWNpdHkiIHZhbHVlcz0iMTswIiBrZXlUaW1lcz0iMDsxIiBkdXI9IjFzIiBiZWdpbj0iLTAuMTY2NjY2NjY2NjY2NjY2NjZzIiByZXBlYXRDb3VudD0iaW5kZWZpbml0ZSIvPgogIDwvcmVjdD4KPC9nPjxnIHRyYW5zZm9ybT0icm90YXRlKDMwMCA1MCA1MCkiPgogIDxyZWN0IHg9IjQ3IiB5PSIyNCIgcng9IjIuNCIgcnk9IjIuNCIgd2lkdGg9IjYiIGhlaWdodD0iMTIiIGZpbGw9IiMwN2FiY2MiPgogICAgPGFuaW1hdGUgYXR0cmlidXRlTmFtZT0ib3BhY2l0eSIgdmFsdWVzPSIxOzAiIGtleVRpbWVzPSIwOzEiIGR1cj0iMXMiIGJlZ2luPSItMC4wODMzMzMzMzMzMzMzMzMzM3MiIHJlcGVhdENvdW50PSJpbmRlZmluaXRlIi8+CiAgPC9yZWN0Pgo8L2c+PGcgdHJhbnNmb3JtPSJyb3RhdGUoMzMwIDUwIDUwKSI+CiAgPHJlY3QgeD0iNDciIHk9IjI0IiByeD0iMi40IiByeT0iMi40IiB3aWR0aD0iNiIgaGVpZ2h0PSIxMiIgZmlsbD0iIzA3YWJjYyI+CiAgICA8YW5pbWF0ZSBhdHRyaWJ1dGVOYW1lPSJvcGFjaXR5IiB2YWx1ZXM9IjE7MCIga2V5VGltZXM9IjA7MSIgZHVyPSIxcyIgYmVnaW49IjBzIiByZXBlYXRDb3VudD0iaW5kZWZpbml0ZSIvPgogIDwvcmVjdD4KPC9nPgo8L3N2Zz4=',
			},
			useColorNavbar: true,
			termsOfServiceLink: 'https://mybadges.org',
			termsHelpLink: 'https://mybadges.org',
			cssCustomProps: {
				'--color-interactive1': '#44a981',
				'--color-interactive2': '#aed9c8',
				'--color-interactive2alpha50': '#aed9c880',
				'--color-theme': '#aed9c8',
			},
		},
	},
};

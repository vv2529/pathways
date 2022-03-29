import Game from './js/class/Game.js'

function loadScript(src, onload) {
	let script = document.createElement('script')
	script.src = src + (src.includes('?') ? '&' : '?') + 'u=' + Math.random()
	if (onload) script.onload = onload
	document.body.appendChild(script)
	return script
}

const game = new Game(
	document.getElementById('canvas'),
	document.getElementById('bg-canvas'),
	document.getElementById('overlay'),
	{
		container: document.getElementById('writing'),
		heading: document.getElementById('writing-heading'),
		message: document.getElementById('writing-message'),
		button: document.getElementById('writing-button'),
	}
)

loadScript('js/function.js', () => {
	onFullLoad(() => {
		game.start(
			location.pathname.slice(0, location.pathname.lastIndexOf('/')) +
				'/level/level.json'
		)
	})
})

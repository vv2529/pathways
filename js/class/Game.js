import Level from './Level.js'
import Player from './Player.js'

export default class Game {
	constructor(cPlayer, cBg, overlay, writing) {
		this.canvas = {
			player: cPlayer,
			bg: cBg,
			character: document.createElement('canvas'),
		}
		this.ctx = Object.fromEntries(
			Object.entries(this.canvas).map(([key, canvas]) => [
				key,
				canvas.getContext('2d'),
			])
		)

		this.overlay = overlay
		this.writing = writing
		this.cSize = 0 //size of canvas, px
		this.bSize = 0 //size of a block on a canvas, px
		this.tSize = 16 //size of a block on a texture, px
		this.cSizeInBlocks = 20

		this.setEventListeners()
	}

	async start(url) {
		await this.startLevel(url)
	}

	async startLevel(url) {
		this.level = new Level(this)
		await this.level.load(url)

		this.canvas.bg.width = this.tSize * this.level.size[0]
		this.canvas.bg.height = this.tSize * this.level.size[1]

		this.resize()
		await this.level.start()
		this.player = new Player(this)
		this.resize()
		this.level.updateBgColor()
		this.player.drawControls()
	}

	openWriting(heading, message, callback = () => {}) {
		this.writing.heading.textContent = heading
		this.writing.message.textContent = message
		this.writing.container.hidden = false
		this.writing.button.focus()
		this.writing.button.onclick = () => {
			callback()
			this.writing.container.hidden = true
			this.writing.button.onclick = null
		}
	}

	render() {
		this.renderBG()
		this.player.render()
	}

	renderBG() {
		let [dx, dy] = this.player.getDelta()

		/* clearCanvas(this.canvas.bg)
		this.ctx.bg.translate(dx, dy)
		this.canvas.bg.style.backgroundPosition = dx + 'px ' + dy + 'px' */
		this.canvas.bg.style.left = `${Math.floor(-dx * this.bSize)}px`
		this.canvas.bg.style.top = `${Math.floor(-dy * this.bSize)}px`
	}

	recalculate() {
		const vmin = Math.min(
			this.canvas.player.offsetWidth,
			this.canvas.player.offsetHeight
		)
		// if (this.cSize === vmin) return

		this.cSize = vmin
		// Block size has to be whole so that all blocks are rendered even, it looks nicer
		this.bSize = div(this.cSize, this.cSizeInBlocks) + 1

		// this.canvas.bg.style.backgroundSize = (this.bSize + 'px ').repeat(2)
		this.canvas.player.width = this.canvas.player.offsetWidth
		this.canvas.player.height = this.canvas.player.offsetHeight

		if (this.player) {
			this.canvas.character.width = this.canvas.character.height =
				2 * this.bSize
		}

		this.canvas.bg.style.width = `${Math.floor(
			this.level.size[0] * this.bSize
		)}px`
		this.canvas.bg.style.height = `${Math.floor(
			this.level.size[1] * this.bSize
		)}px`

		this.smoothFix()
	}

	resize() {
		this.recalculate()
		if (this.player) this.player.setDelta('exact-center')
	}

	smoothFix() {
		for (let key in this.ctx) smoothFixCtx(this.ctx[key])
	}

	setEventListeners() {
		document.body.onresize = this.resize.bind(this)

		document.body.addEventListener(
			'keydown',
			((event) => {
				const key = event.keyCode
				if (WASD && key in WASD) {
					event.preventDefault()
					if (this.player.frozen || WASDPressed[key]) return
					WASDPressed[key] = true

					if (WASD[key][0]) WASDCombined[0] = WASD[key][0]
					else if (WASD[key][1]) WASDCombined[1] = WASD[key][1]

					this.player.updateSpeed(WASDCombined)
					this.player.move()
				}
			}).bind(this)
		)

		document.body.addEventListener(
			'keyup',
			((event) => {
				const key = event.keyCode
				if (WASD && key in WASD) {
					event.preventDefault()
					if (!WASDPressed[key]) return
					delete WASDPressed[key]

					if (WASD[key][0])
						WASDCombined[0] = WASDPressed[WASDPair[key]]
							? WASD[WASDPair[key]][0]
							: 0
					if (WASD[key][1])
						WASDCombined[1] = WASDPressed[WASDPair[key]]
							? WASD[WASDPair[key]][1]
							: 0

					if (!this.player.frozen) this.player.updateSpeed(WASDCombined)
				}
			}).bind(this)
		)

		this.writing.button.onfocus = ({ target }) => {
			target.innerHTML = 'Press enter to continue &#8594;'
		}
		this.writing.button.onblur = ({ target }) => {
			target.innerHTML = 'Press here to continue &#8594;'
		}
	}
}

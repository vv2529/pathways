export default class Level {
	constructor(game) {
		this.game = game
		this.ctx = game.ctx.bg
	}

	async load(url) {
		const response = await fetch(url)
		Object.assign(this, await response.json())
	}

	async start() {
		await this.loadImages()
		this.prepareBlocks()
		this.render()
	}

	render() {
		for (let x = 0; x < this.size[0]; x++) {
			for (let y = 0; y < this.size[1]; y++) {
				this.drawBlock(x, y)
			}
		}
	}

	drawBlock(x, y, block, ctx = this.ctx) {
		if (!block) {
			if (!this.isInRange(x, y)) return
			block = this.getBlock(x, y)
		}

		ctx.save()

		const size = this.game.tSize
		ctx.translate(x * size, y * size)

		ctx.clearRect(0, 0, size, size)

		const drawWallBlock = (alpha = 0.5) => {
			ctx.save()
			ctx.globalAlpha = alpha
			ctx.fillStyle = '#000'
			ctx.fillRect(0, 0, size, size)
			ctx.fillRect(0, size - 1, size, 1)
			ctx.fillRect(0, size / 2 - 1, size, 1)
			ctx.fillRect(size / 2, (size / 2) * (x % 2), 1, size / 2)
			ctx.restore()
		}

		if (block === ' ') {
			drawWallBlock(0.05)
			return ctx.restore()
		}

		if (block === '_') {
			drawWallBlock(0.05)
			const btn = this.buttons[`${x},${y}`]
			ctx.fillStyle = '#000'
			ctx.fillRect(2, 2, size - 4, size - 4)

			if (btn[1]) ctx.globalAlpha = 0.5
			ctx.fillStyle = `rgb(${btn[0]})`
			ctx.fillRect(3, 3, size - 6, size - 7)

			return ctx.restore()
		}

		const drawLock = (color, locked = true) => {
			ctx.fillStyle = color
			ctx.fillRect(4, 9, 8, 5)
			if (locked) ctx.fillRect(5, 5, 1, 4)
			ctx.fillRect(10, 5, 1, 4)
			ctx.fillRect(5, 4, 2, 1)
			ctx.fillRect(9, 4, 2, 1)
			ctx.fillRect(7, 3, 2, 1)
			ctx.fillStyle = '#000'
			ctx.fillRect(7, 11, 2, 2)
		}

		if (block === '|') {
			const door = this.getDoor(x, y)
			if (!door) return ctx.restore()
			drawWallBlock(door[2] ? 0.05 : 0.5)
			ctx.globalAlpha = door[2] ? 0.25 : 1
			drawLock(`rgb(${door[3]})`, !door[2])

			return ctx.restore()
		}

		if (block === '+') {
			drawWallBlock(0.05)
			ctx.drawImage(this.img.exit, 0, 0, size, size)
			if (this.checkpoint !== 10) drawLock('#888')

			return ctx.restore()
		}

		const n = this.checkpoints.findIndex(([cx, cy]) => cx === x && cy === y)
		if (n >= 0) {
			drawWallBlock(0.05)
			if (n < this.checkpoint) ctx.globalAlpha = 0.5
			ctx.drawImage(
				n <= this.checkpoint ? this.img.paper : this.img.unknown,
				0,
				0,
				size,
				size
			)
			return ctx.restore()
		}

		drawWallBlock()

		ctx.restore()
	}

	updateBgColor() {
		const h = (this.game.player.y / this.size[1]) * 90 + 60,
			l = (this.game.player.x / this.size[0]) * 20 + 60
		this.game.canvas.bg.style.backgroundColor = `hsl(${h}, 80%, ${l}%)`
	}

	isDoorOpen(x, y) {
		const door = this.getDoor(x, y)
		// not a door or an open door => true
		return !door || door[2]
	}

	getDoor(x, y) {
		x = Math.floor(x)
		y = Math.floor(y)
		const door = Object.values(this.doors)
			.flat()
			.find((door) => door[0] === x && door[1] === y)
		return door === -1 ? null : door
	}

	prepareBlocks() {
		Object.keys(this.doors).forEach((color) => {
			this.doors[color].forEach((door) => {
				if (!door[2]) door[2] = 0
				door[3] = color
			})
		})

		Object.keys(this.buttons).forEach((key) => {
			this.buttons[key] = [this.buttons[key].join(',')]
		})

		this.checkpoints = []
		this.checkpoint = 0

		for (let x = 0; x < this.size[0]; x++) {
			for (let y = 0; y < this.size[1]; y++) {
				let n = this.terrain[y][x].charCodeAt(0) - 48
				if (this.terrain[y][x] === '+') n = 10
				if (n >= 0 && n <= 10) this.checkpoints[n] = [x, y]
			}
		}
	}

	openCheckpoint(n) {
		if (n > this.checkpoint) return

		let updated = false

		if (n <= 10 && n === this.checkpoint) {
			this.game.player.frozen = true
			this.checkpoint++
			if (n < 10) {
				this.game.player.speed = [0, 0]
				this.game.openWriting(`#${n + 1}`, this.messages[n], () => {
					this.game.player.frozen = false
				})
				this.drawBlock(...this.checkpoints[n])
				this.drawBlock(...this.checkpoints[n + 1])
				updated = true
			} else {
				this.game.player.updateSpeed([1, 0])
			}

			return updated
		}
	}

	finish() {
		this.game.overlay.hidden = false
		this.game.overlay.className = 'full'
		this.game.overlay.textContent = this.finalMessage
	}

	setBlock(x, y, block) {
		if (!this.isInRange(x, y)) return
		this.terrain[x][y] = block
	}

	fill(x1, y1, x2, y2, block) {
		if (x1 > x2) [x1, x2] = [x2, x1]
		if (y1 > y2) [y1, y2] = [y2, y1]

		for (let x = x1; x <= x2; x++) {
			for (let y = y1; y <= y2; y++) {
				this.setBlock(x, y, block)
			}
		}
	}

	getBlock(x, y) {
		x = Math.floor(x)
		y = Math.floor(y)
		return this.isInRange(x, y) ? this.terrain[y][x] : ' '
	}

	isInRange(x, y) {
		return x >= 0 && y >= 0 && x < this.size[0] && y < this.size[1]
	}

	async loadImages() {
		let imgload = []
		for (let i in this.img) {
			let img = new Image()
			img.src = `assets/${this.img[i]}.png`
			this.img[i] = img
			imgload.push(
				new Promise((resolve, reject) => {
					img.onload = resolve
					img.onerror = reject
				})
			)
		}
		await Promise.all(imgload)
	}
}

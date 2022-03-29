export default class Player {
	constructor(game, img = game.level.img.player, pos = game.level.spawn) {
		this.game = game
		this.canvas = game.canvas.player
		this.ctx = this.canvas.getContext('2d')
		this.level = game.level
		this.img = img
		this.x = pos[0] + 0.5
		this.y = pos[1] + 0.5
		this.speed = [0, 0]
		this.deltaX = 0
		this.deltaY = 0
		this.stopMove = null
		this.buttons = []
		this.checkpoints = []
		this.frozen = false
		this.prerendered = -1

		/* const */
		this.bps = 7.5
		this.size = 0.75
	}

	render() {
		clearCanvas(this.canvas)
		this.ctx.save()
		this.ctx.translate(
			Math.round((this.x - this.deltaX) * this.game.bSize),
			Math.round((this.y - this.deltaY) * this.game.bSize)
		)

		const angle = Math.atan2(...this.speed),
			still = !this.speed[0] && !this.speed[1]
		if (this.prerendered !== angle || still) {
			if (!still) this.prerendered = angle

			const canvas = still ? this.canvas : this.game.canvas.character,
				ctx = canvas.getContext('2d')
			if (!still) {
				clearCanvas(canvas)
				ctx.translate(this.game.bSize, this.game.bSize)
			}

			const k = this.size * this.game.bSize * 1.5,
				frown = {
					'-1': [-100, 10],
					1: [-190, -80],
				}

			ctx.beginPath()
			ctx.lineWidth = k / 30
			ctx.arc(0, 0, k / 2, 0, Math.PI * 2)
			ctx.fillStyle = 'hsl(180, 70%, 70%)'
			ctx.stroke()
			ctx.fill()

			ctx.beginPath()
			ctx.arc(0, 0, k / 3.5, deg2rad(15), deg2rad(105))
			ctx.stroke()

			for (let i = -1; i < 2; i += 2) {
				ctx.save()

				ctx.translate((i * k) / 6, -k / 5)
				ctx.beginPath()
				if (still)
					ctx.arc(0, 0, k / 8, deg2rad(frown[i][1]), deg2rad(frown[i][0]))
				else ctx.arc(0, 0, k / 8, 0, Math.PI * 2)
				ctx.closePath()
				ctx.fillStyle = '#fff'
				ctx.stroke()
				ctx.fill()

				ctx.translate(...this.speed.map((v) => ((v / this.bps) * k) / 16))
				ctx.beginPath()
				ctx.arc(0, 0, k / 16, 0, Math.PI * 2)
				ctx.fillStyle = '#000'
				ctx.stroke()
				ctx.fill()

				ctx.translate(-k / 32 / Math.sqrt(2), -k / 32 / Math.sqrt(2))
				ctx.beginPath()
				ctx.arc(0, 0, k / 32, 0, Math.PI * 2)
				ctx.fillStyle = '#fff'
				ctx.stroke()
				ctx.fill()

				ctx.restore()
			}
		}

		if (!still)
			this.ctx.drawImage(
				this.game.canvas.character,
				-this.game.bSize,
				-this.game.bSize
			)

		this.ctx.restore()
	}

	move() {
		if (this.stopMove) {
			this.stopMove()
			this.stopMove = null
		}

		if (!this.speed[0] && !this.speed[1]) return

		if (this.game.overlay.className) {
			this.game.overlay.className = ''
			setTimeout(() => {
				this.game.overlay.hidden = true
			}, 1000)
		}

		this.stopMove = animate((dt) => {
			if (this.frozen) {
				if (this.speed[0] && this.x > this.level.size[0] + this.size) {
					this.speed = [0, 0]
					this.level.finish()
				}
			}

			if (!this.speed[0] && !this.speed[1]) {
				this.stopMove()
				this.render()
				return
			}

			dt /= 1000
			let prev = [this.x, this.y],
				next = [prev[0] + this.speed[0] * dt, prev[1] + this.speed[1] * dt],
				canGo = [this.canBeAt(next[0], prev[1]), this.canBeAt(prev[0], next[1])]

			if (!this.speed[0] || !this.speed[1]) {
				// const sign = this.speed[0] + this.speed[1] < 0 ? -1 : 1
				const limit = this.size / 2
				let temp
				if (
					this.speed[0] &&
					!canGo[0] &&
					this.canBeAt(
						next[0],
						(temp = Math.round(this.y + limit - this.size / 2) + this.size / 2)
					) &&
					temp - next[1] <= limit
				)
					next[1] = temp
				else if (
					this.speed[0] &&
					!canGo[0] &&
					this.canBeAt(
						next[0],
						(temp = Math.round(this.y - limit + this.size / 2) - this.size / 2)
					) &&
					next[1] - temp <= limit
				)
					next[1] = temp
				else if (
					this.speed[1] &&
					!canGo[1] &&
					this.canBeAt(
						(temp = Math.round(this.x + limit - this.size / 2) + this.size / 2),
						next[1]
					) &&
					temp - next[0] <= limit
				)
					next[0] = temp
				else if (
					this.speed[1] &&
					!canGo[1] &&
					this.canBeAt(
						(temp = Math.round(this.x - limit + this.size / 2) - this.size / 2),
						next[1]
					) &&
					next[0] - temp <= limit
				)
					next[0] = temp
			}

			this.x = canGo[0]
				? next[0]
				: this.speed[0] > 0
				? Math.round(this.x + this.size / 2) - this.size / 2
				: Math.round(this.x - this.size / 2) + this.size / 2
			this.y = canGo[1]
				? next[1]
				: this.speed[1] > 0
				? Math.round(this.y + this.size / 2) - this.size / 2
				: Math.round(this.y - this.size / 2) + this.size / 2

			this.checkArea()

			/* Move the screen with the player */
			this.setDelta()

			this.level.updateBgColor()

			this.render()
		})
	}

	drawControls() {
		this.ctx.save()
		this.ctx.translate(
			Math.round((this.x - this.deltaX) * this.game.bSize),
			Math.round((this.y - this.deltaY) * this.game.bSize)
		)

		const size = this.game.bSize * 2
		const labels = {
			W: [0, -1],
			A: [-1, 0],
			S: [0, 1],
			D: [1, 0],
		}

		Object.entries(labels).forEach(([key, offset]) => {
			this.ctx.save()
			this.ctx.translate(
				(this.size + 1) * offset[0] * this.game.bSize,
				(this.size + 1) * offset[1] * this.game.bSize
			)
			this.ctx.rotate(Math.atan2(...offset) - (offset[0] ? 0 : Math.PI))

			this.ctx.beginPath()
			this.ctx.moveTo(-size / 2, size / 4)
			this.ctx.lineTo(0, -size / 2)
			this.ctx.lineTo(size / 2, size / 4)
			this.ctx.closePath()
			this.ctx.fillStyle = '#000'
			this.ctx.fill()

			this.ctx.fillStyle = '#fff'
			this.ctx.font = `${size / 3}px Calibri`
			this.ctx.textAlign = 'center'
			this.ctx.fillText(key, 0, size / 10)

			this.ctx.restore()
		})

		this.ctx.restore()
	}

	//setDelta('player-center') - center the scene roughly around the player, 'exact-center' - exactly
	setDelta(dx = 'player-center', dy) {
		const oldX = this.deltaX,
			oldY = this.deltaY
		const mode = dx

		if (mode?.endsWith('center')) {
			dx = this.x - this.canvas.width / this.game.bSize / 2
			dy = this.y - this.canvas.height / this.game.bSize / 2

			const xk =
				mode === 'exact-center' ? 0 : this.canvas.width / this.game.bSize / 8
			const yk =
				mode === 'exact-center' ? 0 : this.canvas.height / this.game.bSize / 8
			if (Math.abs(this.deltaX - dx) > xk) {
				const sign = this.deltaX - dx < 0 ? 1 : -1
				this.deltaX = Math.min(
					Math.max(dx - xk * sign, 0),
					this.level.size[0] - this.canvas.width / this.game.bSize
				)
			}
			if (Math.abs(this.deltaY - dy) > yk) {
				const sign = this.deltaY - dy < 0 ? 1 : -1
				this.deltaY = Math.min(
					Math.max(dy - yk * sign, 0),
					this.level.size[1] - this.canvas.height / this.game.bSize
				)
			}
		}

		// this.deltaX = dx
		// this.deltaY = dy
		if (oldX != this.deltaX || oldY != this.deltaY) {
			this.game.render()
		}
	}

	getDelta() {
		return [this.deltaX, this.deltaY]
	}

	checkArea() {
		let updated = false
		const fullArea = this.getArea()
		const area = fullArea.filter(([x, y]) => this.level.getBlock(x, y) === '_')
		const cpArea = fullArea.filter(([x, y]) => {
			const n = this.level.checkpoints.findIndex(
				([cx, cy]) => cx === x && cy === y
			)
			if (n >= 0 && !this.checkpoints.includes(n)) {
				this.checkpoints.push(n)
				if (this.level.openCheckpoint(n)) updated = true
			}
			return n >= 0
		})

		area.forEach(([x, y], i) => {
			const btn = `${x},${y}`
			if (!this.buttons.includes(btn)) {
				this.buttons.push(btn)
				this.level.doors[this.level.buttons[btn][0]].forEach((door) => {
					door[2] = !door[2]
					this.level.buttons[btn][1] = true
					this.level.drawBlock(x, y)
					this.level.drawBlock(door[0], door[1])
					updated = true
				})
			}

			area[i] = btn
		})

		for (let i = this.buttons.length - 1; i >= 0; i--) {
			const btn = this.buttons[i]
			let [x, y] = btn.split(',')
			x = +x
			y = +y

			if (!area.includes(btn)) {
				this.buttons.splice(i, 1)
				this.level.buttons[btn][1] = false
				this.level.drawBlock(x, y)
				updated = true
			}
		}

		for (let i = this.checkpoints.length - 1; i >= 0; i--) {
			const n = this.checkpoints[i]
			const [x, y] = this.level.checkpoints[n]

			if (cpArea.findIndex(([cx, cy]) => cx === x && cy === y) === -1) {
				this.checkpoints.splice(i, 1)
			}
		}

		if (updated) this.game.renderBG()
	}

	getArea() {
		const x1 = Math.floor(this.x - this.size / 2),
			x2 = Math.floor(this.x + this.size / 2 - 0.01),
			y1 = Math.floor(this.y - this.size / 2),
			y2 = Math.floor(this.y + this.size / 2 - 0.01),
			area = [[x1, y1]]

		if (x1 !== x2) area.push([x2, y1])
		if (y1 !== y2) area.push([x1, y2])
		if (x1 !== x2 && y1 !== y2) area.push([x2, y2])

		return area
	}

	canGoThrough(x, y) {
		const block = this.level.getBlock(x, y)
		return (
			' _0123456789'.includes(block) ||
			(block === '|' && this.level.isDoorOpen(x, y)) ||
			(block === '+' && this.level.checkpoint >= 10)
		)
	}

	canBeAt(x, y) {
		const size = this.size / 2 - 0.01
		return (
			this.canGoThrough(x - size, y - size) &&
			this.canGoThrough(x + size, y - size) &&
			this.canGoThrough(x - size, y + size) &&
			this.canGoThrough(x + size, y + size)
		)
	}

	updateSpeed(vector) {
		this.speed = [...vector]
		if (vector[0] && vector[1]) {
			this.speed[0] /= Math.sqrt(2)
			this.speed[1] /= Math.sqrt(2)
		}
		this.speed[0] *= this.bps
		this.speed[1] *= this.bps
	}
}

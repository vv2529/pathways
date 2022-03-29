const readImage = (img) => {
	let canvas = document.createElement('canvas')
	let c = canvas.getContext('2d')
	document.body.appendChild(canvas)

	canvas.width = img.width
	canvas.height = img.height
	c.imageSmoothingEnabled = false

	c.drawImage(img, 0, 0, img.width, img.height)
	return getImageData(c)
}

const readBase = (img) => {
	const data = readImage(img)

	const level = data.map((row, y) => {
		return row.map((pixel, x) => {
			if (!pixel[3]) return ' '
			if (equals(pixel, [0, 0, 0])) return '*'
			if (equals(pixel, [192, 192, 0])) return '-'
			if (equals(pixel, [192, 192, 1])) return '+'
			if (inRange(pixel, [0, 192, 0], [0, 201, 0])) return '' + (pixel[1] - 192)
			if (equals(pixel, [192, 0, 0])) return '|'
			if (equals(pixel, [192, 96, 0])) return '_'
		})
	})

	return level
}

const readDoors = (img) => {
	const pixels = readImage(img)
	const doors = {}

	pixels.forEach((row, y) => {
		row.map((pixel, x) => {
			if (!pixel[3]) return
			const color = getColorString(pixel)
			if (!doors[color]) doors[color] = []
			doors[color].push([x, y])
		})
	})

	return doors
}

const readButtons = (img) => {
	const pixels = readImage(img)
	const buttons = {}

	pixels.forEach((row, y) => {
		row.map((pixel, x) => {
			if (!pixel[3]) return
			buttons[getCoordString(x, y)] = [...pixel.slice(0, 3)]
		})
	})

	return buttons
}

const readOpen = (img, doors) => {
	const pixels = readImage(img)
	const open = []

	pixels.forEach((row, y) => {
		row.forEach((pixel, x) => {
			if (pixel[3]) open.push(getCoordString(x, y))
		})
	})

	Object.values(doors)
		.flat()
		.forEach((door) => {
			if (open.includes(getCoordString(door[0], door[1]))) door.push(1)
		})

	return open
}

const getImageData = (c) => {
	const width = c.canvas.width,
		height = c.canvas.height
	const raw = c.getImageData(0, 0, width, height).data
	const data = []

	for (let index = 0; index < raw.length; index += 4) {
		const x = Math.floor(index / 4 / width),
			y = (index / 4) % width
		if (!data[x]) data[x] = []
		data[x][y] = raw.slice(index, index + 4)
	}

	return data
}

const equals = (c1, c2) => {
	return c1[0] === c2[0] && c1[1] === c2[1] && c1[2] === c2[2]
}

const inRange = (c, a, b) => {
	return (
		c[0] >= a[0] &&
		c[0] <= b[0] &&
		c[1] >= a[1] &&
		c[1] <= b[1] &&
		c[2] >= a[2] &&
		c[2] <= b[2]
	)
}

const getColorString = (pixel) => `${pixel[0]},${pixel[1]},${pixel[2]}`

const getCoordString = (x, y) => `${x},${y}`

export { readBase, readDoors, readButtons, readOpen }

/* ;() => {
	document.body.innerHTML = ''

	let images = ['base', 'doors', 'buttons', 'open']
	let promises = []

	for (let i in images) {
		let img = new Image()
		img.src = `source/Pathways-${images[i]}.png`
		images[i] = img
		promises.push(
			new Promise((resolve, reject) => {
				img.onload = resolve
				img.onerror = reject
			})
		)
	}

	Promise.all(promises).then(() => {
		const level = readBase(images[0])
		const doors = readDoors(images[1])
		const buttons = readButtons(images[2])
		const open = readOpen(images[3], doors)

		// console.log(JSON.stringify(level.map((row) => row.join(''))))
		console.log('Doors:', JSON.stringify(doors))
		console.log('Buttons:', JSON.stringify(buttons))
		console.log('Open:', JSON.stringify(open))
	})
} */

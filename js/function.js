function random(a, b = 0) {
	return Math.floor(Math.random() * a) + b
}
function onFullLoad(onload) {
	document.addEventListener('readystatechange', () => {
		if (document.readyState == 'complete') onload()
	})
}
function deg2rad(deg) {
	return (deg * Math.PI) / 180
}
function div(a, b) {
	return Math.trunc(a / b)
}

function animate(f) {
	let time = performance.now()
	let running = true

	let anim = function () {
		if (running) requestAnimationFrame(anim)

		let dt = performance.now() - time
		time = performance.now()
		if (!dt) return

		f(dt)
	}

	anim()

	return function () {
		running = false
	}
}

function smoothFixCtx(ctx) {
	ctx.imageSmoothingEnabled = false
}

function clearCanvas(canvas) {
	const ctx = canvas.getContext('2d')
	canvas.width += 0
	smoothFixCtx(ctx)
}

const WASD = { 65: [-1, 0], 87: [0, -1], 68: [1, 0], 83: [0, 1] },
	WASDPair = { 65: 68, 87: 83, 68: 65, 83: 87 },
	WASDPressed = {},
	WASDCombined = [0, 0]

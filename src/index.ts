import "./styles/index.scss";

interface Player {
	left: number;
	touch: number | null;
	score: number;
}
class Vector {
	public constructor(public readonly x: number, public readonly y: number) { }

	public add(other: Vector): Vector {
		return new Vector(this.x + other.x, this.y + other.y);
	}

	public scale(scale: number): Vector {
		return new Vector(this.x * scale, this.y * scale);
	}

	public sub(other: Vector): Vector {
		return new Vector(this.x - other.x, this.y - other.y);
	}

	public normalize(): Vector {
		return this.scale(1 / this.length());
	}

	public length(): number {
		return Math.sqrt(this.x * this.x + this.y * this.y);
	}
}

class WaitForPlayers { }
class StartDelay {
	public constructor(public readonly start: number) { }
}
class Play { }
class EndDelay {
	public constructor(public readonly start: number) { }
}
type State = WaitForPlayers | StartDelay | Play | EndDelay;

const PAD_WIDTH = 0.15;
const PAD_HEIGHT = 0.02;
const PAD_MARGIN = 0.2;
const BALL_RADIUS = 0.02;

const START_DELAY = 2000;
const END_DELAY = 4000;

const BALL_SPEED = 0.002;

const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");
const top = {
	left: 0,
	touch: null,
	score: 0,
};
const bottom = {
	left: 0,
	touch: null,
	score: 0,
};
const ball = {
	pos: new Vector(100, 0),
	speed: new Vector(0, 0),
};
let state: State = new WaitForPlayers();

canvas.addEventListener("touchstart", onTouchStart, false);
canvas.addEventListener("touchmove", onTouchMove, false);
canvas.addEventListener("touchend", onTouchEnd, false);
function onTouchStart(e: TouchEvent): void {
	for (let i = 0; i < e.changedTouches.length; i++) {
		const touch = e.changedTouches.item(i);
		const target = touch.clientY < canvas.offsetHeight / 2 ? top : bottom;
		if (target.touch == null) {
			target.touch = touch.identifier;
			target.left = (touch.clientX / canvas.offsetWidth - 0.5) * 2;
		}
	}
}
function onTouchMove(e: TouchEvent): void {
	e.preventDefault();
	for (let i = 0; i < e.changedTouches.length; i++) {
		const touch = e.changedTouches.item(i);
		const target = getTarget(touch.identifier);
		if (target != null) {
			target.left = (touch.clientX / canvas.offsetWidth - 0.5) * 2;
		}
	}
}
function onTouchEnd(e: TouchEvent): void {
	for (let i = 0; i < e.changedTouches.length; i++) {
		const touch = e.changedTouches.item(i);
		const target = getTarget(touch.identifier);
		if (target != null) {
			target.touch = null;
		}
	}
}
function getTarget(identifier: number): Player | null {
	if (top.touch === identifier) {
		return top;
	} else if (bottom.touch === identifier) {
		return bottom;
	} else {
		return null;
	}
}

canvas.addEventListener("dblclick", onDoubleClick, true);
function onDoubleClick(e: MouseEvent): void {
	if (document.fullscreenElement == null) {
		canvas.requestFullscreen();
	} else {
		document.exitFullscreen();
	}
}

window.requestAnimationFrame(animate);
function animate(timestamp: number): void {
	canvas.height = canvas.offsetHeight;
	canvas.width = canvas.offsetWidth;

	update(timestamp);

	ctx.clearRect(0, 0, canvas.width, canvas.height);

	drawPad(top.left, canvas.height * PAD_MARGIN);
	drawPad(bottom.left, canvas.height * (1.0 - PAD_MARGIN));

	drawBall();

	drawScore(top.score, bottom.score);

	window.requestAnimationFrame(animate);
}
function drawPad(left: number, top: number): void {
	ctx.beginPath();
	ctx.fillStyle = "#ffffff";
	const width = canvas.width * PAD_WIDTH;
	const height = canvas.width * PAD_HEIGHT;
	const x = (canvas.width + canvas.width * left - width) / 2;
	ctx.rect(x, top - height / 2, width, height);
	ctx.closePath();
	ctx.fill();
}
function drawScore(top: number, bottom: number): void {
	ctx.save();
	ctx.fillStyle = "#ffffff";
	ctx.textAlign = "center";
	ctx.textBaseline = "top";
	ctx.font = "24px monospace";
	ctx.rotate(Math.PI / 2);
	ctx.fillText(`${bottom} : ${top}`, canvas.height / 2, -canvas.width + 20);
	ctx.restore();
}
function drawBall(): void {
	ctx.beginPath();
	ctx.fillStyle = "#ffffff";
	const pos = ballToPixel(ball.pos);
	ctx.ellipse(pos.x, pos.y, BALL_RADIUS * canvas.width, BALL_RADIUS * canvas.width, 0, 0, Math.PI * 2);
	ctx.closePath();
	ctx.fill();
}

let prevTimestamp = null;
function update(timestamp: number): void {
	if (state instanceof WaitForPlayers) {
		if (top.touch != null && bottom.touch != null) {
			state = new StartDelay(timestamp);
			ball.pos = new Vector(0, 0);
		}
	} else if (state instanceof StartDelay) {
		if (top.score >= 5 || bottom.score >= 5) {
			state = new EndDelay(timestamp);
			ball.pos = new Vector(100, 0);
		} else if (state.start + START_DELAY <= timestamp) {
			state = new Play();
			let y = 0;
			if (Math.random() > 0.5) {
				y = Math.random() * -0.5 - 0.5;
			} else {
				y = Math.random() * 0.5 + 0.5;
			}
			ball.speed = new Vector(Math.sqrt(1 - y * y), y);
		}
	} else if (state instanceof Play) {
		const deltaTime = prevTimestamp != null ? timestamp - prevTimestamp : 0;

		ball.pos = ball.pos.add(ball.speed.scale(deltaTime * BALL_SPEED));
		if (ball.pos.x < -1 + BALL_RADIUS) {
			ball.pos = new Vector(-1 + BALL_RADIUS, ball.pos.y);
			ball.speed = new Vector(-ball.speed.x, ball.speed.y);
		} else if (ball.pos.x > 1 - BALL_RADIUS) {
			ball.pos = new Vector(1 - BALL_RADIUS, ball.pos.y);
			ball.speed = new Vector(-ball.speed.x, ball.speed.y);
		}
		const pixelPos = ballToPixel(ball.pos);
		const padHeight = canvas.width * PAD_HEIGHT;
		const topBallY = pixelPos.y - BALL_RADIUS * canvas.width - canvas.height * PAD_MARGIN;
		const bottomBallY = pixelPos.y + BALL_RADIUS * canvas.width - canvas.height * (1.0 - PAD_MARGIN);
		if (-padHeight / 2 < topBallY && topBallY < padHeight / 2 && top.left - PAD_WIDTH < ball.pos.x + BALL_RADIUS && ball.pos.x - BALL_RADIUS < top.left + PAD_WIDTH) {
			ball.speed = pixelPos.sub(new Vector((canvas.width + canvas.width * top.left) / 2, canvas.height * PAD_MARGIN)).normalize();
		} else if (-padHeight / 2 < bottomBallY && bottomBallY < padHeight / 2 && bottom.left - PAD_WIDTH < ball.pos.x + BALL_RADIUS && ball.pos.x - BALL_RADIUS < bottom.left + PAD_WIDTH) {
			ball.speed = pixelPos.sub(new Vector((canvas.width + canvas.width * bottom.left) / 2, canvas.height * (1.0 - PAD_MARGIN))).normalize();
		}

		if (pixelPos.y < canvas.height * PAD_MARGIN / 4) {
			bottom.score++;
			state = new StartDelay(timestamp);
			ball.pos = new Vector(0, 0);
		} else if (pixelPos.y > canvas.height * (1.0 - PAD_MARGIN / 4)) {
			top.score++;
			state = new StartDelay(timestamp);
			ball.pos = new Vector(0, 0);
		}
	} else if (state instanceof EndDelay) {
		if (state.start + END_DELAY <= timestamp) {
			top.score = bottom.score = 0;
			state = new WaitForPlayers();
		}
	}

	prevTimestamp = timestamp;
}

function ballToPixel(pos: Vector): Vector {
	return new Vector(
		(canvas.width + canvas.width * ball.pos.x) / 2,
		(canvas.height + canvas.width * ball.pos.y) / 2
	);
}

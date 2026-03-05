const canvas = document.getElementById('dust-canvas');
const ctx = canvas.getContext('2d');

const PARTICLE_COUNT = 90;

// Gold / amber / cream palette
const COLORS = [
  'rgba(232, 201, 110, {a})',
  'rgba(201, 168, 76,  {a})',
  'rgba(245, 232, 190, {a})',
  'rgba(160, 124,  46, {a})',
  'rgba(255, 240, 180, {a})',
];

function resize() {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
}
resize();
window.addEventListener('resize', resize);

function randBetween(a, b) {
  return a + Math.random() * (b - a);
}

class Particle {
  constructor() {
    this.reset(true); // stagger lifecycle on first fill
  }

  reset(stagger = false) {
    this.x      = randBetween(0, canvas.width);
    this.y      = randBetween(0, canvas.height);
    this.r      = randBetween(0.6, 2.2);
    this.speedY = randBetween(0.15, 0.55);
    this.speedX = randBetween(-0.12, 0.12);
    this.angle  = randBetween(0, Math.PI * 2);
    this.angleSpeed = randBetween(0.004, 0.014) * (Math.random() < 0.5 ? 1 : -1);
    this.wobbleAmp  = randBetween(0.3, 1.2);
    this.color  = COLORS[Math.floor(Math.random() * COLORS.length)];
    this.maxLife = randBetween(180, 520);
    // stagger=true: spread across lifecycle phases so initial screen stays full;
    // stagger=false: always start at 0 so every respawn fades in from transparent
    this.life    = stagger ? randBetween(0, this.maxLife * 0.75) : 0;
    this.alpha   = 0;
  }

  update() {
    this.life++;
    // smooth ease-in / ease-out alpha over lifetime
    const t = this.life / this.maxLife;
    if (t < 0.15)      this.alpha = t / 0.15;
    else if (t < 0.75) this.alpha = 1;
    else               this.alpha = (1 - t) / 0.25;
    this.alpha = Math.max(0, Math.min(1, this.alpha)) * 0.55; // cap opacity

    // oscillate horizontally
    this.angle += this.angleSpeed;
    this.x += this.speedX + Math.sin(this.angle) * this.wobbleAmp;
    this.y -= this.speedY;

    if (this.life >= this.maxLife || this.y < -10) this.reset(false);
  }

  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    ctx.fillStyle = this.color.replace('{a}', this.alpha.toFixed(3));
    ctx.fill();
  }
}

const particles = Array.from(
  { length: PARTICLE_COUNT },
  () => new Particle()
);

function loop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (const p of particles) {
    p.update();
    p.draw();
  }
  requestAnimationFrame(loop);
}

loop();

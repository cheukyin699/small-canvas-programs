/**
 * A level can have different stats, based on the difficulty.
 *
 * Length goes from 1.1 to infinity. Any length above 3 is difficulty 1. Anything below that can be calculated as
 * following: (3 - level - 1.1) / (3 - 1.1) * 100
 *
 * Speed is a multiplier that serves to multiply the difficulty score from the length. The multiplier can be calculated
 * as following: 1 + speed
 *
 * At the moment, I want things to work, so the difficulty won't be factored into the level generation, and they will
 * instead be randomly generated.
 */
const EASY_LEVEL = {
  length: 5,            // 5 units in length, meaning you can fit 5 slimes on the platform
  speed: 0,             // 0 speed means it stands still
  distance: 2,
};
const HARD_LEVEL = {
  length: 1.5,          // 1.5 units in length
  speed: 0.5,           // 0.5 speed means it moves 0.5 units per second
  distance: 5,
};

const SWEAT_DROPLET = {
  x: 0,                 // Use percentages again, centered around slime x/y
  y: 0,
  dx: 0.001,            // Percentages relative to canvas size
  dy: 0.002,
  lifeMS: 202,          // When it reaches zero (or below zero), it gets deleted
};

const STATE = {
  score: 59,
  difficulty: 2,
  currentLvl: EASY_LEVEL,
  state: 'slime_idle',          // can be one of slime_idle (accepts input), slime_jumping (doesn't accept input), slime_transition (doesn't accept input)
  animationTimeMS: 0,           // time spent in animation
  slime: {
    power: 0,
    state: 'idle',              // can be one of idle, crouching, jumping
    animationTimeMS: 0,
    blinkTimeMS: 0,
    sweat: [],
  }
};

// actual constants
const MAX_SLIME_JUMP_MS = 500;         // snappy transitions make for better user experience
const MAX_SLIME_TRANSITION_MS = 500;
const MAX_SLIME_BLINK_MS = 100;
const MAX_SLIME_SWEAT_MS = 500;
const MAX_SLIME_SWEAT = 20;

const POWER_PER_SECOND = 2;

// Use percentages instead of pixels
const SLIME_IDLE_X = 0.2;
const SLIME_IDLE_Y = 0.5;
const SWEAT_RADIUS_PX = 2;

const SLIME_WIDTH_PX = 80;
const SLIME_HEIGHT_PX = 64;
const GRAVITY_ACCEL = 0.5;

let input = {
  mousedown: false,
};

let debug = true;
let spriteSheet = new Image();

/**
 * Responsible for giving us the stats for the next jump, given the difficulty.
 *
 * Difficulty starts from 1 and increases to infinity, increasing every time a jump is made, and increasing even more
 * when a perfect jump is made. We call the platform that spawns a "level". Each level has a difficulty number that is
 * calculated based on the following:
 *
 *  - total length of platform
 *  - whether the platform is moving or not
 *  - 
 */
function generateNextLevel(difficulty) {
  return EASY_LEVEL;
}

/**
 * Draw lines of text starting from bottom-left corner.
 */
function drawLinesOfTextFromBottom(ctx, lines, x, y, fontHeight) {
  for (let i = lines.length - 1; i >= 0; --i) {
    ctx.fillText(lines[i], x, y - fontHeight * (lines.length - 1 - i));
  }
}

function drawUI(ctx, gameState) {
  if (debug) {
    ctx.fillStyle = 'red';
    ctx.font = '15px sans';
    drawLinesOfTextFromBottom(ctx, [
      `debug on`,
      `animation time (ms): ${gameState.animationTimeMS.toFixed(2)}`,
      `power: ${gameState.slime.power.toFixed(2)}`,
      `state: ${gameState.state}`
    ], 0, ctx.canvas.height - 15, 15);
  }

  ctx.fillStyle = 'green';
  ctx.font = '15px sans';
  ctx.fillText(`score: ${gameState.score}`, 0, 10);
}

function drawSlimeSweat(ctx, gameState) {
  // Sweat slowly dissipates, not all at once, so we use square root to represent this on alpha
  for (let {x, y, lifeMS} of gameState.slime.sweat) {
    if (lifeMS <= 0) {
      continue;
    }

    const alpha = Math.sqrt(lifeMS / MAX_SLIME_SWEAT_MS);
    ctx.fillStyle = `rgba(87.3, 19.3, 19.3, ${alpha}`;
    ctx.beginPath();
    ctx.arc((SLIME_IDLE_X + x) * ctx.canvas.width + SLIME_WIDTH_PX / 2, (SLIME_IDLE_Y + y) * ctx.canvas.height - SLIME_HEIGHT_PX / 2, SWEAT_RADIUS_PX, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();
  }
}

function drawSlimeIdle(ctx, gameState) {
  const animationTimeS = gameState.slime.animationTimeMS / 1000;
  const heightModifierPX = 2 * Math.sin(animationTimeS * 4) + 2;
  const height = SLIME_HEIGHT_PX + heightModifierPX;

  // Blink every other 5 seconds
  const allowedToBlink = animationTimeS > 5 && Math.floor(animationTimeS / 5) % 2 == 1;
  const modulo5 = animationTimeS - Math.floor(animationTimeS / 5) * 5;      // like a normal modulo 5 group, but continuous
  const isBlinking = allowedToBlink &&
    (modulo5 <= MAX_SLIME_BLINK_MS / 1000 ||                                // blink immediately at 0
      (modulo5 >= 0.5 && modulo5 <= 0.5 + MAX_SLIME_BLINK_MS / 1000));      // next blink half a second from last

  const imgIndexX = isBlinking ? 1 : 0;
  ctx.drawImage(spriteSheet, imgIndexX * SLIME_WIDTH_PX, 0, SLIME_WIDTH_PX, SLIME_HEIGHT_PX, SLIME_IDLE_X * ctx.canvas.width, SLIME_IDLE_Y * ctx.canvas.height - height, SLIME_WIDTH_PX, height);
}

function drawSlimeTryingToJump(ctx, gameState) {
  drawSlimeSweat(ctx, gameState);

  const height = SLIME_HEIGHT_PX;
  ctx.drawImage(spriteSheet, SLIME_WIDTH_PX * 2, 0, SLIME_WIDTH_PX, SLIME_HEIGHT_PX, SLIME_IDLE_X * ctx.canvas.width, SLIME_IDLE_Y * ctx.canvas.height - height, SLIME_WIDTH_PX, height);
}

function drawSlimeJumping(ctx, gameState) {
}

function drawSlimeTransition(ctx, gameState) {
}

/**
 * Draw the current game state
 */
function draw(ctx, gameState) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  const { state } = gameState;

  if (state === 'slime_idle') {
    // Slime isn't doing a thing
    drawSlimeIdle(ctx, gameState);
  } else if (state === 'slime_trying_jump') {
    // Slime is trying to jump (you are holding the mouse down)
    drawSlimeTryingToJump(ctx, gameState);
  } else if (state === 'slime_jumping') {
    // Slime is in the jumping animation
    // All jumps take a constant amount of time, and the animation speeds up or slows down depending on distance.
    drawSlimeJumping(ctx, gameState);
  } else if (state === 'slime_transition') {
    // Slime is on the next platform and the level is transitioning back to slime_idle
    drawSlimeTransition(ctx, gameState);
  }

  drawUI(ctx, gameState);
}

function newSweat(ctx) {
  return {
    x: 0,
    y: 0,
    dx: Math.random() * 0.5 - 0.25,
    dy: -1 * (Math.random() * 0.1 + 0.3),
    lifeMS: MAX_SLIME_SWEAT_MS,
  };
}

/**
 * Update the game state
 */
function update(elapsedTimeMS, gameState) {
  const { state } = gameState;

  gameState.slime.animationTimeMS += elapsedTimeMS;

  if (state === 'slime_idle') {
    // Slime isn't doing a thing
    if (input.mousedown) {
      gameState.state = 'slime_trying_jump';
      gameState.slime.state = 'crouching';
      gameState.slime.animationTimeMS = 0;
    }
  } else if (state === 'slime_trying_jump') {
    // Slime is trying to jump (you are holding the mouse down)
    const canAddMoreSweat = gameState.slime.animationTimeMS / 1000 >= gameState.slime.sweat.length && gameState.slime.sweat.length <= MAX_SLIME_SWEAT;
    if (canAddMoreSweat) {
      gameState.slime.sweat.push(newSweat());
    }

    gameState.slime.sweat = gameState.slime.sweat
      .filter(sweat => sweat.lifeMS > 0)
      .map(sweat => {
        return {
          x: sweat.x + sweat.dx * elapsedTimeMS / 1000,
          y: sweat.y + sweat.dy * elapsedTimeMS / 1000,
          dx: sweat.dx,
          dy: sweat.dy + GRAVITY_ACCEL * elapsedTimeMS / 1000,
          lifeMS: sweat.lifeMS - elapsedTimeMS,
        };
      });

    if (!input.mousedown) {
      gameState.state = 'slime_jumping';
      gameState.slime.state = 'jumping';
      gameState.slime.animationTimeMS = 0;
    } else {
      gameState.slime.power += POWER_PER_SECOND * elapsedTimeMS / 1000;
    }
  } else if (state === 'slime_jumping') {
    // Slime is in the jumping animation
    gameState.animationTimeMS += elapsedTimeMS;

    if (gameState.animationTimeMS >= MAX_SLIME_JUMP_MS) {
      gameState.state = 'slime_transition';
      gameState.slime.state = 'idle';
      gameState.animationTimeMS = 0;
      gameState.slime.animationTimeMS = 0;
      gameState.slime.power = 0;
    }
  } else if (state === 'slime_transition') {
    // Slime is on the next platform and the level is transitioning back to slime_idle
    gameState.animationTimeMS += elapsedTimeMS;

    if (gameState.animationTimeMS >= MAX_SLIME_TRANSITION_MS) {
      gameState.state = 'slime_idle';
      gameState.animationTimeMS = 0;
      gameState.currentLvl = generateNextLevel(gameState.difficulty);
    }
  }
}

function step(params) {
  const elapsedTimeMS = params.timestamp - params.previousTimestamp;

  update(elapsedTimeMS, params.gameState);
  draw(params.ctx, params.gameState);

  requestAnimationFrame(timestamp => step({
    previousTimestamp: params.timestamp,
    timestamp,
    gameState: params.gameState,
    ctx: params.ctx,
  }));
}

function init() {
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');

  canvas.onmousedown = () => input.mousedown = true;
  canvas.onmouseup = () => input.mousedown = false;

  const gameState = {
    score: 0,
    difficulty: 1,
    currentLvl: EASY_LEVEL,
    state: 'slime_idle',
    animationTimeMS: 0,
    slime: {
      power: 0,
      state: 'idle',
      animationTimeMS: 0,
      blinkTimeMS: 0,
      sweat: [],
    },
  };

  // Place source at back so .onload and .onerror gets triggered properly
  spriteSheet.onload = () => {
    requestAnimationFrame(timestamp => step({
      previousTimestamp: 0,
      timestamp,
      ctx,
      gameState,
    }));
  };
  spriteSheet.onerror = () => {
    console.error('could not load spritesheet');
  };
  spriteSheet.src = 'slime-bounce.png';
}

window.onload = init;

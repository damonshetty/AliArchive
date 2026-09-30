/*
 * Comeback — a drift arcade.
 *
 * Steer a signal through a collapsing archive. Wreckage costs a life
 * unless you come back: after a hit you are briefly invulnerable and
 * must grab 3 shards before the ring expires.
 */
(function (root, factory) {
    var api = factory();
    if (typeof module === "object" && module.exports) {
        module.exports = api;
    }
    if (root) {
        root.ComebackGame = api;
    }
})(typeof window !== "undefined" ? window : null, function () {
    var WIDTH = 360;
    var HEIGHT = 640;
    var PLAYER_Y = 508;
    var PLAYER_R = 12;
    var ACCEL = 2400;
    var DRAG = 6.5;
    var MAX_SPEED = 340;
    var COMEBACK_TIME = 4.4;
    var COMEBACK_NEED = 3;
    var BEST_KEY = "aliarchive.comeback.best";
    var MUTE_KEY = "aliarchive.comeback.mute";

    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    function dist2(ax, ay, bx, by) {
        var dx = ax - bx;
        var dy = ay - by;
        return dx * dx + dy * dy;
    }

    function circleHitsRect(cx, cy, r, rect) {
        var nx = clamp(cx, rect.x, rect.x + rect.w);
        var ny = clamp(cy, rect.y, rect.y + rect.h);
        return dist2(cx, cy, nx, ny) <= r * r;
    }

    function defaultStorage() {
        var memory = {};
        var memoryStore = {
            getItem: function (key) {
                return Object.prototype.hasOwnProperty.call(memory, key) ? memory[key] : null;
            },
            setItem: function (key, value) {
                memory[key] = String(value);
            }
        };
        try {
            if (typeof localStorage === "undefined" || !localStorage) {
                return memoryStore;
            }
            localStorage.setItem(BEST_KEY + ".probe", "1");
            localStorage.removeItem(BEST_KEY + ".probe");
            return localStorage;
        } catch (err) {
            return memoryStore;
        }
    }

    function readNumber(storage, key) {
        var raw = storage.getItem(key);
        var value = parseInt(raw, 10);
        return isNaN(value) ? 0 : value;
    }

    function makeStars(rng) {
        var stars = [];
        var i;
        for (i = 0; i < 56; i++) {
            stars.push({
                x: rng() * WIDTH,
                y: rng() * HEIGHT,
                z: 0.25 + rng() * 0.75,
                s: rng() > 0.85 ? 2.2 : 0.8 + rng() * 1.2
            });
        }
        return stars;
    }

    function createGame(options) {
        options = options || {};
        var rng = options.random || Math.random;
        var storage = options.storage || defaultStorage();
        var best = readNumber(storage, BEST_KEY);
        var muted = storage.getItem(MUTE_KEY) === "1";

        var state = {
            status: "ready",
            width: WIDTH,
            height: HEIGHT,
            score: 0,
            best: best,
            lives: 3,
            elapsed: 0,
            clock: 0,
            combo: 1,
            comboTimer: 0,
            comeback: null,
            hurt: 0,
            shake: 0,
            flash: 0,
            flashColor: "#ffffff",
            banner: null,
            player: { x: WIDTH / 2, y: PLAYER_Y, vx: 0, r: PLAYER_R },
            shards: [],
            debris: [],
            particles: [],
            popups: [],
            stars: makeStars(rng),
            trail: [],
            gaps: [],
            events: [],
            recoveries: 0,
            failures: 0,
            priorBest: best,
            muted: muted,
            distance: 0,
            distanceScore: 0,
            spawnDebrisIn: 1.6,
            spawnShardIn: 0.55
        };

        var held = { left: false, right: false, pointer: false, pointerX: WIDTH / 2 };
        var edges = { start: false, pause: false, restart: false, mute: false };
        var bestSaveIn = 0;

        function worldSpeed() {
            return Math.min(380, 150 + state.elapsed * 4.2);
        }

        function persistBest(force) {
            if (state.score > state.best) {
                state.best = state.score;
            }
            if (!force && bestSaveIn > 0) {
                return;
            }
            storage.setItem(BEST_KEY, String(state.best));
            bestSaveIn = 0.75;
        }

        function burst(x, y, color, count, speed) {
            var i;
            for (i = 0; i < count; i++) {
                var angle = rng() * Math.PI * 2;
                var mag = speed * (0.35 + rng());
                state.particles.push({
                    x: x,
                    y: y,
                    vx: Math.cos(angle) * mag,
                    vy: Math.sin(angle) * mag,
                    life: 0.28 + rng() * 0.35,
                    age: 0,
                    color: color,
                    size: 1.5 + rng() * 2.4
                });
            }
            if (state.particles.length > 220) {
                state.particles.splice(0, state.particles.length - 220);
            }
        }

        function popup(text, x, y, color) {
            state.popups.push({
                text: text,
                x: x,
                y: y,
                life: 0.7,
                age: 0,
                color: color || "#fff6d8"
            });
            if (state.popups.length > 12) {
                state.popups.shift();
            }
        }

        function resetRound() {
            state.priorBest = state.best;
            state.status = "playing";
            state.score = 0;
            state.lives = 3;
            state.elapsed = 0;
            state.combo = 1;
            state.comboTimer = 0;
            state.comeback = null;
            state.hurt = 1.25;
            state.shake = 0;
            state.flash = 0;
            state.banner = null;
            state.player.x = WIDTH / 2;
            state.player.y = PLAYER_Y;
            state.player.vx = 0;
            state.shards = [];
            state.debris = [];
            state.particles = [];
            state.popups = [];
            state.trail = [];
            state.gaps = [];
            state.recoveries = 0;
            state.failures = 0;
            state.distance = 0;
            state.distanceScore = 0;
            state.spawnDebrisIn = 1.7;
            state.spawnShardIn = 0.45;
            state.events.push("start");
        }

        function beginComeback() {
            if (state.comeback || state.hurt > 0 || state.status !== "playing") {
                return;
            }
            var speed = worldSpeed();
            var spacing = Math.max(84, speed * 0.58);
            var lead = Math.max(110, speed * 0.62);
            var i;
            function recoveryX(preferred, y) {
                var options = [preferred, state.player.x, WIDTH / 2, 40, WIDTH - 40];
                var t;
                var d;
                for (t = 0; t < options.length; t++) {
                    var x = clamp(options[t], 28, WIDTH - 28);
                    var clear = true;
                    for (d = 0; d < state.debris.length; d++) {
                        if (circleHitsRect(x, y, 14, state.debris[d])) {
                            clear = false;
                            break;
                        }
                    }
                    if (clear) {
                        return x;
                    }
                }
                return clamp(preferred, 28, WIDTH - 28);
            }
            state.comeback = {
                time: COMEBACK_TIME,
                duration: COMEBACK_TIME,
                need: COMEBACK_NEED,
                got: 0
            };
            state.banner = { text: "COMEBACK", time: 0.85 };
            state.flash = 0.28;
            state.flashColor = "#ffd56a";
            state.shake = Math.max(state.shake, 0.22);
            state.events.push("comeback");
            burst(state.player.x, state.player.y, "#ffd56a", 18, 160);
            for (i = 0; i < 4; i++) {
                var side = (i % 2 === 0) ? -1 : 1;
                var spread = 70 + (i > 1 ? 26 : 0);
                var shardY = state.player.y - lead - i * spacing;
                state.shards.push({
                    x: recoveryX(state.player.x + side * spread, shardY),
                    y: shardY,
                    r: 9,
                    vy: -36,
                    recovery: true
                });
            }
        }

        function succeedComeback() {
            if (!state.comeback) {
                return;
            }
            state.comeback = null;
            state.score += 300;
            state.hurt = 0.9;
            state.recoveries += 1;
            state.banner = { text: "RECOVERED", time: 0.8 };
            state.flash = 0.22;
            state.flashColor = "#9af7ff";
            state.events.push("recover");
            popup("RECOVERED +300", state.player.x, state.player.y - 36, "#bff");
            burst(state.player.x, state.player.y, "#7af0ff", 22, 200);
            persistBest(true);
        }

        function failComeback() {
            if (!state.comeback) {
                return;
            }
            state.comeback = null;
            state.lives -= 1;
            state.failures += 1;
            state.hurt = 1.15;
            state.shake = 0.48;
            state.flash = 0.34;
            state.flashColor = "#ff5d7a";
            burst(state.player.x, state.player.y, "#ff5d7a", 16, 180);
            if (state.lives <= 0) {
                state.lives = 0;
                state.status = "over";
                state.banner = { text: "SIGNAL LOST", time: 1.2 };
                state.events.push("over");
                persistBest(true);
            } else {
                state.banner = { text: "TOO SLOW", time: 0.7 };
                state.events.push("fail");
            }
        }

        function collectShard(shard) {
            if (state.comboTimer > 0) {
                state.combo = Math.min(8, state.combo + 1);
            } else {
                state.combo = 1;
            }
            state.comboTimer = 1.55;
            var points = 25 * state.combo;
            if (state.comeback) {
                points *= 2;
            }
            state.score += points;
            popup("+" + points, shard.x, shard.y - 8, shard.recovery ? "#ffe7a3" : "#fff6d8");
            burst(shard.x, shard.y, shard.recovery ? "#ffd56a" : "#fff1b0", 8, 90);
            state.events.push("collect");
            if (state.comeback) {
                state.comeback.got += 1;
                if (state.comeback.got >= state.comeback.need) {
                    succeedComeback();
                }
            }
            if (state.score > state.best) {
                state.best = state.score;
            }
        }

        function spawnDebrisRow() {
            var gap = Math.max(96, 136 - state.elapsed * 0.7) + Math.floor(rng() * 18);
            var room = Math.max(0, WIDTH - gap - 32);
            var gapX = 16 + rng() * room;
            state.gaps.push({ x: gapX, w: gap, at: state.elapsed });
            if (state.gaps.length > 24) {
                state.gaps.shift();
            }
            var thickness = 20 + rng() * 16;
            var y = -thickness - 8;
            if (gapX > 26) {
                state.debris.push({
                    x: -8,
                    y: y,
                    w: gapX + 4,
                    h: thickness,
                    vy: rng() * 24
                });
            }
            var right = gapX + gap;
            if (WIDTH - right > 26) {
                state.debris.push({
                    x: right,
                    y: y,
                    w: WIDTH - right + 8,
                    h: thickness,
                    vy: rng() * 24
                });
            }
        }

        function spawnShard() {
            var x = 24 + rng() * (WIDTH - 48);
            var y = -18;
            var i;
            for (i = 0; i < state.debris.length; i++) {
                var debris = state.debris[i];
                if (debris.y > 80) {
                    continue;
                }
                if (circleHitsRect(x, y, 12, debris)) {
                    x = clamp(state.gaps.length ? state.gaps[state.gaps.length - 1].x + 40 : WIDTH / 2, 24, WIDTH - 24);
                    break;
                }
            }
            state.shards.push({
                x: x,
                y: y,
                r: 8,
                vy: -10 + rng() * 20,
                recovery: false
            });
        }

        function tickWorld(dt) {
            var speed = worldSpeed();
            var i;
            state.distance += speed * dt;
            var awarded = Math.floor(state.distance / 28);
            if (awarded > state.distanceScore) {
                state.score += awarded - state.distanceScore;
                state.distanceScore = awarded;
                if (state.score > state.best) {
                    state.best = state.score;
                }
            }

            state.player.y = PLAYER_Y;
            var dir = 0;
            if (held.left) {
                dir -= 1;
            }
            if (held.right) {
                dir += 1;
            }
            if (dir === 0 && held.pointer) {
                dir = clamp((held.pointerX - state.player.x) / 42, -1, 1);
            }
            state.player.vx += dir * ACCEL * dt;
            state.player.vx *= Math.exp(-DRAG * dt);
            if (Math.abs(state.player.vx) < 3) {
                state.player.vx = 0;
            }
            state.player.vx = clamp(state.player.vx, -MAX_SPEED, MAX_SPEED);
            state.player.x += state.player.vx * dt;
            var minX = PLAYER_R + 10;
            var maxX = WIDTH - PLAYER_R - 10;
            if (state.player.x < minX) {
                state.player.x = minX;
                state.player.vx = 0;
            }
            if (state.player.x > maxX) {
                state.player.x = maxX;
                state.player.vx = 0;
            }

            state.trail.push({ x: state.player.x, y: state.player.y });
            if (state.trail.length > 12) {
                state.trail.shift();
            }

            if (state.hurt > 0) {
                state.hurt -= dt;
            }
            if (state.comboTimer > 0) {
                state.comboTimer -= dt;
                if (state.comboTimer <= 0) {
                    state.combo = 1;
                }
            }

            for (i = state.shards.length - 1; i >= 0; i--) {
                var shard = state.shards[i];
                shard.y += (speed + (shard.vy || 0)) * dt;
                var reach = dist2(state.player.x, state.player.y, shard.x, shard.y);
                var hitR = state.player.r + shard.r;
                if (reach <= hitR * hitR) {
                    collectShard(shard);
                    state.shards.splice(i, 1);
                    continue;
                }
                if (shard.y - shard.r > HEIGHT + 30) {
                    state.shards.splice(i, 1);
                }
            }

            var struck = false;
            for (i = state.debris.length - 1; i >= 0; i--) {
                var block = state.debris[i];
                block.y += (speed + (block.vy || 0)) * dt;
                if (!struck && state.status === "playing" && !state.comeback && state.hurt <= 0) {
                    if (circleHitsRect(state.player.x, state.player.y, state.player.r, block)) {
                        struck = true;
                    }
                }
                if (block.y > HEIGHT + 40) {
                    state.debris.splice(i, 1);
                }
            }
            if (struck) {
                beginComeback();
            }

            if (state.comeback) {
                state.comeback.time -= dt;
                if (state.comeback.time <= 0) {
                    failComeback();
                }
            }

            if (state.status !== "playing") {
                return;
            }

            state.spawnDebrisIn -= dt;
            if (state.spawnDebrisIn <= 0) {
                spawnDebrisRow();
                var interval = Math.max(0.46, 1.08 - state.elapsed * 0.012);
                state.spawnDebrisIn = interval;
            }
            state.spawnShardIn -= dt;
            if (state.spawnShardIn <= 0) {
                spawnShard();
                state.spawnShardIn = Math.max(0.38, 0.78 - state.elapsed * 0.006);
            }
        }

        function tickAmbient(dt) {
            var speed = state.status === "playing" ? worldSpeed() : 70;
            var i;
            for (i = 0; i < state.stars.length; i++) {
                var star = state.stars[i];
                star.y += speed * star.z * dt;
                if (star.y > HEIGHT) {
                    star.y = -4;
                    star.x = rng() * WIDTH;
                }
            }
            for (i = state.particles.length - 1; i >= 0; i--) {
                var particle = state.particles[i];
                particle.age += dt;
                particle.x += particle.vx * dt;
                particle.y += particle.vy * dt;
                particle.vy += 20 * dt;
                if (particle.age >= particle.life) {
                    state.particles.splice(i, 1);
                }
            }
            for (i = state.popups.length - 1; i >= 0; i--) {
                var note = state.popups[i];
                note.age += dt;
                note.y -= 28 * dt;
                if (note.age >= note.life) {
                    state.popups.splice(i, 1);
                }
            }
            if (state.banner) {
                state.banner.time -= dt;
                if (state.banner.time <= 0) {
                    state.banner = null;
                }
            }
            if (state.shake > 0) {
                state.shake = Math.max(0, state.shake - dt * 1.4);
            }
            if (state.flash > 0) {
                state.flash = Math.max(0, state.flash - dt);
            }
            if (bestSaveIn > 0) {
                bestSaveIn -= dt;
            }
        }

        function update(dt) {
            if (!isFinite(dt) || dt < 0) {
                dt = 0;
            }
            if (dt > 0.05) {
                dt = 0.05;
            }
            state.events = [];
            state.clock += dt;
            tickAmbient(dt);

            var start = edges.start;
            var pause = edges.pause;
            var restart = edges.restart;
            var mute = edges.mute;
            edges.start = false;
            edges.pause = false;
            edges.restart = false;
            edges.mute = false;

            if (mute) {
                state.muted = !state.muted;
                storage.setItem(MUTE_KEY, state.muted ? "1" : "0");
                state.events.push(state.muted ? "mute" : "unmute");
            }

            if (state.status === "ready") {
                state.player.x = WIDTH / 2 + Math.sin(state.clock * 1.3) * 36;
                state.player.y = PLAYER_Y;
                state.player.vx = 0;
                if (start) {
                    resetRound();
                }
                return state;
            }

            if (state.status === "over") {
                if (start || restart) {
                    resetRound();
                }
                return state;
            }

            if (restart) {
                resetRound();
                return state;
            }

            if (state.status === "paused") {
                if (pause || start) {
                    state.status = "playing";
                    state.events.push("resume");
                }
                return state;
            }

            if (pause) {
                state.status = "paused";
                persistBest(true);
                state.events.push("pause");
                return state;
            }

            state.elapsed += dt;
            tickWorld(dt);
            if (state.score > state.best) {
                persistBest(false);
            }
            return state;
        }

        function setKey(code, down) {
            if (code === "ArrowLeft" || code === "KeyA" || code === "Left") {
                held.left = !!down;
            } else if (code === "ArrowRight" || code === "KeyD" || code === "Right") {
                held.right = !!down;
            }
            if (!down) {
                return;
            }
            if (code === "Space" || code === "Enter") {
                edges.start = true;
            } else if (code === "KeyP" || code === "Escape") {
                edges.pause = true;
            } else if (code === "KeyR") {
                edges.restart = true;
            } else if (code === "KeyM") {
                edges.mute = true;
            }
        }

        function releaseAll() {
            held.left = false;
            held.right = false;
            held.pointer = false;
        }

        return {
            state: state,
            update: update,
            start: function () {
                edges.start = true;
            },
            togglePause: function () {
                edges.pause = true;
            },
            restart: function () {
                edges.restart = true;
            },
            toggleMute: function () {
                edges.mute = true;
            },
            setPointer: function (x, active) {
                held.pointer = !!active;
                if (isFinite(x)) {
                    held.pointerX = clamp(x, 0, WIDTH);
                }
            },
            setKey: setKey,
            releaseAll: releaseAll,
            worldSpeed: worldSpeed
        };
    }

    function roundRect(ctx, x, y, w, h, r) {
        var radius = Math.max(0, Math.min(r, w / 2, h / 2));
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.arcTo(x + w, y, x + w, y + h, radius);
        ctx.arcTo(x + w, y + h, x, y + h, radius);
        ctx.arcTo(x, y + h, x, y, radius);
        ctx.arcTo(x, y, x + w, y, radius);
        ctx.closePath();
    }

    function draw(ctx, state) {
        var shakeX = 0;
        var shakeY = 0;
        if (state.shake > 0) {
            shakeX = Math.sin(state.clock * 48) * 7 * state.shake;
            shakeY = Math.cos(state.clock * 37) * 4 * state.shake;
        }
        var scaleX = ctx.canvas.width / WIDTH;
        var scaleY = ctx.canvas.height / HEIGHT;
        ctx.setTransform(scaleX, 0, 0, scaleY, 0, 0);
        ctx.clearRect(0, 0, WIDTH, HEIGHT);

        var sky = ctx.createLinearGradient(0, 0, 0, HEIGHT);
        sky.addColorStop(0, "#141b33");
        sky.addColorStop(0.55, "#0b1022");
        sky.addColorStop(1, "#070910");
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, WIDTH, HEIGHT);

        ctx.save();
        ctx.translate(shakeX, shakeY);

        var i;
        for (i = 0; i < state.stars.length; i++) {
            var star = state.stars[i];
            ctx.globalAlpha = 0.25 + star.z * 0.6;
            ctx.fillStyle = star.s > 2 ? "#d7e6ff" : "#8ea0c8";
            ctx.fillRect(star.x, star.y, star.s, star.s);
        }
        ctx.globalAlpha = 1;

        var lane = ctx.createLinearGradient(0, PLAYER_Y - 80, 0, HEIGHT);
        lane.addColorStop(0, "rgba(122, 240, 255, 0)");
        lane.addColorStop(1, "rgba(122, 240, 255, 0.05)");
        ctx.fillStyle = lane;
        ctx.fillRect(0, PLAYER_Y - 80, WIDTH, HEIGHT - PLAYER_Y + 80);

        for (i = 0; i < state.debris.length; i++) {
            var block = state.debris[i];
            ctx.fillStyle = "rgba(255, 93, 122, 0.13)";
            ctx.fillRect(block.x - 2, block.y - 2, block.w + 4, block.h + 4);
            var body = ctx.createLinearGradient(block.x, block.y, block.x, block.y + block.h);
            body.addColorStop(0, "#3a2236");
            body.addColorStop(1, "#1a101c");
            ctx.fillStyle = body;
            roundRect(ctx, block.x, block.y, block.w, block.h, 6);
            ctx.fill();
            ctx.strokeStyle = "#ff5d7a";
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.strokeStyle = "rgba(255, 214, 232, 0.35)";
            ctx.beginPath();
            ctx.moveTo(block.x + 8, block.y + 6);
            ctx.lineTo(block.x + block.w - 8, block.y + 6);
            ctx.stroke();
        }

        for (i = 0; i < state.shards.length; i++) {
            var shard = state.shards[i];
            var pulse = 1 + Math.sin(state.clock * 7 + shard.x) * 0.08;
            ctx.save();
            ctx.translate(shard.x, shard.y);
            ctx.rotate(Math.PI / 4);
            ctx.scale(pulse, pulse);
            if (shard.recovery) {
                ctx.shadowColor = "#ffd56a";
                ctx.shadowBlur = 12;
            }
            ctx.fillStyle = shard.recovery ? "#ffd56a" : "#ffe29a";
            ctx.fillRect(-shard.r, -shard.r, shard.r * 2, shard.r * 2);
            ctx.shadowBlur = 0;
            ctx.fillStyle = "rgba(255,255,255,0.75)";
            ctx.fillRect(-2, -2, 4, 4);
            ctx.restore();
        }

        for (i = 0; i < state.particles.length; i++) {
            var particle = state.particles[i];
            var fade = 1 - particle.age / particle.life;
            ctx.globalAlpha = Math.max(0, fade);
            ctx.fillStyle = particle.color;
            ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
        }
        ctx.globalAlpha = 1;

        var player = state.player;
        var visible = state.hurt <= 0 || Math.sin(state.clock * 28) > 0;
        if (visible) {
            ctx.save();
            ctx.translate(player.x, player.y);
            var t;
            for (t = 0; t < state.trail.length; t++) {
                var crumb = state.trail[t];
                ctx.globalAlpha = (t / state.trail.length) * 0.35;
                ctx.fillStyle = state.comeback ? "#ffd56a" : "#7af0ff";
                ctx.beginPath();
                ctx.arc(crumb.x - player.x, crumb.y - player.y, 3, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1;
            ctx.shadowColor = state.comeback ? "#ffd56a" : "#7af0ff";
            ctx.shadowBlur = 16;
            ctx.fillStyle = state.comeback ? "#ffd56a" : "#d9fbff";
            ctx.beginPath();
            ctx.moveTo(0, -16);
            ctx.lineTo(12, 12);
            ctx.lineTo(0, 5);
            ctx.lineTo(-12, 12);
            ctx.closePath();
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.fillStyle = state.comeback ? "#fff4cc" : "#7af0ff";
            ctx.beginPath();
            ctx.moveTo(0, -8);
            ctx.lineTo(5, 6);
            ctx.lineTo(0, 2);
            ctx.lineTo(-5, 6);
            ctx.closePath();
            ctx.fill();
            var flame = 6 + Math.sin(state.clock * 30) * 3 + Math.min(8, Math.abs(player.vx) / 50);
            ctx.globalAlpha = 0.85;
            ctx.fillStyle = state.comeback ? "#ff8a3d" : "#5ce1ff";
            ctx.beginPath();
            ctx.moveTo(-4, 10);
            ctx.lineTo(0, 10 + flame);
            ctx.lineTo(4, 10);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
            ctx.globalAlpha = 1;
        }

        if (state.comeback) {
            var ratio = clamp(state.comeback.time / state.comeback.duration, 0, 1);
            ctx.beginPath();
            ctx.strokeStyle = "rgba(255, 213, 106, 0.35)";
            ctx.lineWidth = 3;
            ctx.arc(player.x, player.y, 28, 0, Math.PI * 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.strokeStyle = "#ffd56a";
            ctx.lineWidth = 3;
            ctx.arc(player.x, player.y, 28, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * ratio);
            ctx.stroke();
            ctx.fillStyle = "#ffe7a8";
            ctx.font = "700 11px Segoe UI, sans-serif";
            ctx.textAlign = "center";
            ctx.fillText(state.comeback.got + "/" + state.comeback.need, player.x, player.y + 36);
        }

        for (i = 0; i < state.popups.length; i++) {
            var note = state.popups[i];
            ctx.globalAlpha = 1 - note.age / note.life;
            ctx.fillStyle = note.color;
            ctx.font = "700 13px Segoe UI, sans-serif";
            ctx.textAlign = "center";
            ctx.fillText(note.text, note.x, note.y);
        }
        ctx.globalAlpha = 1;

        if (state.banner && state.status === "playing") {
            ctx.fillStyle = "rgba(255,255,255,0.92)";
            ctx.font = "800 26px Segoe UI, sans-serif";
            ctx.textAlign = "center";
            ctx.fillText(state.banner.text, WIDTH / 2, 168);
        }

        if (state.status === "playing" && state.elapsed < 3.2 && !state.comeback) {
            ctx.globalAlpha = clamp(1 - (state.elapsed - 2.2), 0, 0.85);
            ctx.fillStyle = "#d5e4ff";
            ctx.font = "600 13px Segoe UI, sans-serif";
            ctx.textAlign = "center";
            ctx.fillText("A / D  or  hold to drift", WIDTH / 2, HEIGHT - 28);
            ctx.globalAlpha = 1;
        }

        if (state.flash > 0) {
            ctx.fillStyle = state.flashColor;
            ctx.globalAlpha = state.flash * 0.45;
            ctx.fillRect(0, 0, WIDTH, HEIGHT);
            ctx.globalAlpha = 1;
        }

        if (state.comeback) {
            ctx.strokeStyle = "rgba(255, 213, 106, 0.45)";
            ctx.lineWidth = 8;
            ctx.strokeRect(4, 4, WIDTH - 8, HEIGHT - 8);
        }

        ctx.restore();
    }

    function createAudio() {
        var ctx = null;
        function context() {
            var AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (!AudioCtx) {
                return null;
            }
            if (!ctx) {
                ctx = new AudioCtx();
            }
            if (ctx.state === "suspended") {
                ctx.resume();
            }
            return ctx;
        }
        function tone(freq, when, dur, type, gain) {
            var audio = context();
            if (!audio) {
                return;
            }
            var start = audio.currentTime + (when || 0);
            var osc = audio.createOscillator();
            var amp = audio.createGain();
            osc.type = type || "square";
            osc.frequency.setValueAtTime(freq, start);
            amp.gain.setValueAtTime(gain || 0.04, start);
            amp.gain.exponentialRampToValueAtTime(0.001, start + dur);
            osc.connect(amp);
            amp.connect(audio.destination);
            osc.start(start);
            osc.stop(start + dur + 0.02);
        }
        return {
            collect: function (combo) {
                tone(480 + (combo || 1) * 36, 0, 0.07, "square", 0.035);
            },
            comeback: function () {
                tone(392, 0, 0.1, "square", 0.04);
                tone(587, 0.08, 0.14, "square", 0.04);
            },
            recover: function () {
                tone(523, 0, 0.1, "square", 0.045);
                tone(659, 0.09, 0.12, "square", 0.045);
                tone(784, 0.18, 0.18, "square", 0.04);
            },
            fail: function () {
                tone(196, 0, 0.16, "sawtooth", 0.04);
            },
            over: function () {
                tone(220, 0, 0.18, "triangle", 0.05);
                tone(146, 0.16, 0.28, "triangle", 0.05);
            }
        };
    }

    function mount(root) {
        var canvas = root.querySelector("canvas");
        var game = createGame();
        var audio = createAudio();
        var overlay = root.querySelector("[data-overlay]");
        var panels = {
            ready: root.querySelector('[data-panel="ready"]'),
            paused: root.querySelector('[data-panel="paused"]'),
            over: root.querySelector('[data-panel="over"]')
        };
        var scoreEl = root.querySelector("[data-score]");
        var bestEl = root.querySelector("[data-best]");
        var bestOverEl = root.querySelector("[data-best-over]");
        var finalEl = root.querySelector("[data-final]");
        var recordEl = root.querySelector("[data-record]");
        var livesEl = root.querySelector("[data-lives]");
        var comboEl = root.querySelector("[data-combo]");
        var comebackEl = root.querySelector("[data-comeback]");
        var countEl = root.querySelector("[data-comeback-count]");
        var meterEl = root.querySelector("[data-meter]");
        var liveEl = root.querySelector("[data-live]");
        var muteEl = root.querySelector("[data-mute]");
        var lastNow = 0;
        var announced = -1;

        root.__game = game;

        function resize() {
            var rect = canvas.getBoundingClientRect();
            var dpr = Math.min(window.devicePixelRatio || 1, 2);
            var width = Math.max(1, Math.round(rect.width * dpr));
            var height = Math.max(1, Math.round(rect.height * dpr));
            if (canvas.width !== width || canvas.height !== height) {
                canvas.width = width;
                canvas.height = height;
            }
        }

        function pointerX(event) {
            var point = event.touches && event.touches[0] ? event.touches[0] : event;
            var rect = canvas.getBoundingClientRect();
            return ((point.clientX - rect.left) / rect.width) * WIDTH;
        }

        function paintLives() {
            var marks = "";
            var i;
            for (i = 0; i < 3; i++) {
                marks += i < game.state.lives ? "▲" : "△";
                if (i < 2) {
                    marks += " ";
                }
            }
            livesEl.textContent = marks;
        }

        function sync() {
            var state = game.state;
            scoreEl.textContent = String(state.score);
            if (bestEl) {
                bestEl.textContent = String(state.best);
            }
            paintLives();
            if (comboEl) {
                comboEl.hidden = state.combo <= 1 || state.status !== "playing";
                comboEl.textContent = "x" + state.combo;
            }
            if (state.comeback && state.status === "playing") {
                comebackEl.hidden = false;
                countEl.textContent = state.comeback.got + "/" + state.comeback.need;
                meterEl.style.width = Math.max(0, (state.comeback.time / state.comeback.duration) * 100) + "%";
            } else if (comebackEl) {
                comebackEl.hidden = true;
            }
            overlay.hidden = state.status === "playing";
            panels.ready.hidden = state.status !== "ready";
            panels.paused.hidden = state.status !== "paused";
            panels.over.hidden = state.status !== "over";
            if (state.status === "over") {
                finalEl.textContent = String(state.score);
                bestOverEl.textContent = String(state.best);
                recordEl.hidden = state.score <= state.priorBest;
            }
            if (muteEl) {
                muteEl.textContent = state.muted ? "Sound off" : "Sound on";
                muteEl.setAttribute("aria-pressed", state.muted ? "true" : "false");
            }
            if (liveEl && state.score !== announced && (state.events.length || Math.abs(state.score - announced) >= 100)) {
                liveEl.textContent = "Score " + state.score + ". " + state.lives + " lives left.";
                announced = state.score;
            }
        }

        function playEvents() {
            if (game.state.muted) {
                return;
            }
            var events = game.state.events;
            var i;
            for (i = 0; i < events.length; i++) {
                if (events[i] === "collect") {
                    audio.collect(game.state.combo);
                } else if (events[i] === "comeback") {
                    audio.comeback();
                } else if (events[i] === "recover") {
                    audio.recover();
                } else if (events[i] === "fail") {
                    audio.fail();
                } else if (events[i] === "over") {
                    audio.over();
                }
            }
        }

        function frame(now) {
            if (!lastNow) {
                lastNow = now;
            }
            var dt = (now - lastNow) / 1000;
            lastNow = now;
            resize();
            game.update(dt);
            draw(canvas.getContext("2d"), game.state);
            sync();
            playEvents();
            window.requestAnimationFrame(frame);
        }

        function bindPress(selector, method) {
            var button = root.querySelector(selector);
            if (!button) {
                return;
            }
            button.addEventListener("click", function () {
                game[method]();
            });
        }

        bindPress("[data-play]", "start");
        bindPress("[data-again]", "start");
        bindPress("[data-resume]", "togglePause");
        bindPress("[data-pause]", "togglePause");
        bindPress("[data-restart]", "restart");
        bindPress("[data-mute]", "toggleMute");

        canvas.addEventListener("pointerdown", function (event) {
            if (game.state.status !== "playing") {
                return;
            }
            canvas.setPointerCapture(event.pointerId);
            game.setPointer(pointerX(event), true);
            event.preventDefault();
        });
        canvas.addEventListener("pointermove", function (event) {
            if (game.state.status !== "playing") {
                return;
            }
            if (event.buttons || event.pressure > 0) {
                game.setPointer(pointerX(event), true);
            }
        });
        function releasePointer(event) {
            game.setPointer(pointerX(event), false);
        }
        canvas.addEventListener("pointerup", releasePointer);
        canvas.addEventListener("pointercancel", releasePointer);

        window.addEventListener("keydown", function (event) {
            var tag = event.target && event.target.tagName;
            if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") {
                return;
            }
            if (!root.contains(event.target) && event.target !== document.body && event.target !== document.documentElement) {
                return;
            }
            if (event.code === "Space" || event.code === "ArrowLeft" || event.code === "ArrowRight" || event.code === "ArrowUp" || event.code === "ArrowDown") {
                event.preventDefault();
            }
            game.setKey(event.code, true);
        });
        window.addEventListener("keyup", function (event) {
            game.setKey(event.code, false);
        });
        window.addEventListener("blur", function () {
            game.releaseAll();
        });
        window.addEventListener("resize", resize);

        resize();
        sync();
        window.requestAnimationFrame(frame);
        return game;
    }

    function boot() {
        var root = document.getElementById("comeback-root");
        if (!root || root.__mounted) {
            return;
        }
        root.__mounted = true;
        mount(root);
    }

    if (typeof document !== "undefined") {
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", boot);
        } else {
            boot();
        }
    }

    return {
        WIDTH: WIDTH,
        HEIGHT: HEIGHT,
        PLAYER_Y: PLAYER_Y,
        PLAYER_R: PLAYER_R,
        createGame: createGame,
        draw: draw,
        mount: mount
    };
});

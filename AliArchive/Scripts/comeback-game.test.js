var assert = require("assert");
var Game = require("./comeback-game");

function mulberry32(seed) {
    var a = seed >>> 0;
    return function () {
        a |= 0;
        a = (a + 0x6D2B79F5) | 0;
        var t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function memoryStorage(seed) {
    var data = {};
    if (seed && seed.best) {
        data["aliarchive.comeback.best"] = String(seed.best);
    }
    return {
        getItem: function (key) {
            return Object.prototype.hasOwnProperty.call(data, key) ? data[key] : null;
        },
        setItem: function (key, value) {
            data[key] = String(value);
        },
        data: data
    };
}

function make(seed, storage) {
    return Game.createGame({
        random: mulberry32(seed || 1),
        storage: storage || memoryStorage()
    });
}

function boot(game) {
    game.start();
    game.update(1 / 60);
    assert.strictEqual(game.state.status, "playing");
    game.state.spawnDebrisIn = 1000;
    game.state.spawnShardIn = 1000;
}

function otherScore(state) {
    return state.score - state.distanceScore;
}

function nextRecovery(state) {
    var best = null;
    var i;
    for (i = 0; i < state.shards.length; i++) {
        var shard = state.shards[i];
        if (!shard.recovery) {
            continue;
        }
        if (shard.y > state.player.y + shard.r) {
            continue;
        }
        if (!best || shard.y > best.y) {
            best = shard;
        }
    }
    return best;
}

function hold(game, code, seconds) {
    game.setKey(code, true);
    var steps = Math.round(seconds * 60);
    var n;
    for (n = 0; n < steps; n++) {
        game.update(1 / 60);
    }
}

function chase(game, seconds) {
    var steps = Math.round(seconds * 60);
    var n;
    for (n = 0; n < steps; n++) {
        var target = nextRecovery(game.state);
        var dx = target ? target.x - game.state.player.x : 0;
        var vx = game.state.player.vx;
        if (!target || Math.abs(dx) < 28) {
            game.setKey("ArrowLeft", dx < 0 && vx > 30);
            game.setKey("ArrowRight", dx > 0 && vx < -30);
        } else {
            game.setKey("ArrowLeft", dx < 0);
            game.setKey("ArrowRight", dx > 0);
        }
        game.state.spawnDebrisIn = 1000;
        game.state.spawnShardIn = 1000;
        game.update(1 / 60);
    }
    game.releaseAll();
}

var game = make();
assert.strictEqual(game.state.status, "ready");
assert.strictEqual(game.state.score, 0);
assert.strictEqual(game.state.lives, 3);

game.update(1);
assert.strictEqual(game.state.status, "ready");
assert.strictEqual(game.state.debris.length, 0);

boot(game);
assert.ok(game.state.events.indexOf("start") >= 0);

var startX = game.state.player.x;
hold(game, "ArrowRight", 0.45);
assert.ok(game.state.player.x > startX, "player should move right");
game.releaseAll();
hold(game, "ArrowLeft", 1.4);
assert.ok(game.state.player.x < Game.WIDTH / 2, "player should move back left");
hold(game, "ArrowLeft", 2);
assert.ok(game.state.player.x <= Game.PLAYER_R + 10 + 0.01);
assert.ok(game.state.player.x >= Game.PLAYER_R);
var pinned = game.state.player.x;
game.update(1 / 60);
assert.strictEqual(game.state.player.x, pinned);
game.releaseAll();

boot(make(2));
var scorer = make(3);
boot(scorer);
scorer.state.shards.push({
    x: scorer.state.player.x,
    y: scorer.state.player.y,
    r: 8,
    vy: 0,
    recovery: false
});
scorer.state.score = 0;
scorer.state.distance = 0;
scorer.state.distanceScore = 0;
scorer.update(1 / 60);
assert.strictEqual(otherScore(scorer.state), 25);
assert.ok(scorer.state.events.indexOf("collect") >= 0);

scorer.state.shards.push({
    x: scorer.state.player.x,
    y: scorer.state.player.y,
    r: 8,
    vy: 0,
    recovery: false
});
var beforeCombo = otherScore(scorer.state);
scorer.update(1 / 60);
assert.strictEqual(otherScore(scorer.state) - beforeCombo, 50);
assert.strictEqual(scorer.state.combo, 2);

var hit = make(4);
boot(hit);
hit.state.hurt = 0;
hit.state.debris.push({
    x: hit.state.player.x - 20,
    y: hit.state.player.y - 8,
    w: 40,
    h: 20,
    vy: 0
});
hit.update(1 / 60);
assert.ok(hit.state.comeback, "a hit should open a comeback");
assert.strictEqual(hit.state.lives, 3);
assert.strictEqual(hit.state.comeback.need, 3);
var recovery = hit.state.shards.filter(function (shard) { return shard.recovery; });
assert.strictEqual(recovery.length, 4);

hit.state.debris.push({
    x: hit.state.player.x - 20,
    y: hit.state.player.y - 8,
    w: 50,
    h: 30,
    vy: 0
});
hit.update(1 / 60);
assert.strictEqual(hit.state.lives, 3);
assert.ok(hit.state.comeback, "comeback should ignore extra hits");

var hero = make(5);
boot(hero);
hero.state.elapsed = 48;
hero.state.hurt = 0;
hero.state.debris.push({
    x: hero.state.player.x - 24,
    y: hero.state.player.y - 10,
    w: 48,
    h: 24,
    vy: 0
});
hero.update(1 / 60);
assert.ok(hero.state.comeback);
chase(hero, 5);
assert.strictEqual(hero.state.recoveries, 1, "a chasing player should recover");
assert.strictEqual(hero.state.lives, 3);
assert.strictEqual(hero.state.comeback, null);
assert.ok(otherScore(hero.state) >= 300);

var late = make(9);
boot(late);
late.state.elapsed = 8;
late.state.hurt = 0;
late.state.debris.push({
    x: late.state.player.x - 24,
    y: late.state.player.y - 10,
    w: 48,
    h: 24,
    vy: 0
});
late.update(1 / 60);
chase(late, 5);
assert.strictEqual(late.state.recoveries, 1);

function drain(seed) {
    var run = make(seed);
    boot(run);
    var i;
    for (i = 0; i < 3; i++) {
        run.state.comeback = { time: 0.01, duration: 4.4, need: 3, got: 0 };
        run.state.hurt = 0;
        run.state.spawnDebrisIn = 1000;
        run.update(0.05);
    }
    return run;
}

var dead = drain(6);
assert.strictEqual(dead.state.lives, 0);
assert.strictEqual(dead.state.status, "over");
assert.strictEqual(dead.state.failures, 3);
dead.update(0.2);
assert.strictEqual(dead.state.status, "over");
dead.start();
dead.update(1 / 60);
assert.strictEqual(dead.state.status, "playing");
assert.strictEqual(dead.state.lives, 3);

var paused = make(7);
boot(paused);
paused.togglePause();
paused.update(1 / 60);
assert.strictEqual(paused.state.status, "paused");
var elapsed = paused.state.elapsed;
paused.update(1);
assert.strictEqual(paused.state.elapsed, elapsed);
paused.setKey("KeyP", true);
paused.update(1 / 60);
assert.strictEqual(paused.state.status, "playing");

var store = memoryStorage({ best: 40 });
var veteran = make(8, store);
assert.strictEqual(veteran.state.best, 40);
boot(veteran);
veteran.state.score = 90;
veteran.state.priorBest = 40;
veteran.togglePause();
veteran.update(1 / 60);
assert.strictEqual(veteran.state.best, 90);
assert.strictEqual(store.data["aliarchive.comeback.best"], "90");

var field = make(11);
boot(field);
field.state.elapsed = 3;
field.state.spawnDebrisIn = 0.01;
var steps;
for (steps = 0; steps < 400; steps++) {
    field.state.hurt = 5;
    field.update(0.05);
}
assert.ok(field.state.gaps.length >= 8, "rows should keep spawning");
field.state.gaps.forEach(function (gap) {
    assert.ok(gap.w >= 96, "gap should stay wide enough to fly through");
    assert.ok(gap.x >= 0 && gap.x + gap.w <= Game.WIDTH);
});

var messy = make(12);
boot(messy);
var frame;
for (frame = 0; frame < 90; frame++) {
    messy.setKey("ArrowLeft", frame % 10 < 4);
    messy.setKey("ArrowRight", frame % 10 >= 6);
    if (frame === 40) {
        messy.setPointer(20, true);
    }
    if (frame === 50) {
        messy.setPointer(300, false);
    }
    messy.update(1 / 30);
    assert.ok(messy.state.lives >= 0 && messy.state.lives <= 3);
    assert.ok(messy.state.player.x >= 0 && messy.state.player.x <= Game.WIDTH);
}
messy.toggleMute();
messy.update(1 / 60);
assert.strictEqual(messy.state.muted, true);
messy.setKey("KeyM", true);
messy.update(1 / 60);
assert.strictEqual(messy.state.muted, false);

var idle = make(13);
boot(idle);
idle.state.hurt = 0;
idle.state.shards.push({
    x: idle.state.player.x + 80,
    y: idle.state.player.y,
    r: 8,
    vy: 0,
    recovery: false
});
idle.update(1 / 60);
assert.ok(idle.state.events.indexOf("collect") === -1);

console.log("comeback-game tests passed");

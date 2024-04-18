import React, { useEffect, useRef } from "react";
import Phaser from "phaser";
import { Game } from "phaser";
import { Tilemaps } from "phaser";
const GameComponent = () => {
  const ref = useRef(null);

  const phaserConfig = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: "game-container",
    pixelArt: true,
    physics: {
      default: "arcade",
      arcade: {
        gravity: { y: 0 },
      },
    },
    scene: {
      preload: preload,
      create: create,
      update: update,
    },
  };
  var player;
  var cursors;

  function preload() {
    this.load.image(
      "tiles",
      process.env.PUBLIC_URL + "/images/tmw_desert_spacing.png"
    );
    this.load.tilemapTiledJSON(
      "map",
      process.env.PUBLIC_URL + "/images/test.json"
    );
    this.load.atlas(
      "atlas",
      "https://mikewesthad.github.io/phaser-3-tilemap-blog-posts/post-1/assets/atlas/atlas.png",
      "https://mikewesthad.github.io/phaser-3-tilemap-blog-posts/post-1/assets/atlas/atlas.json"
    );
  }

  function create() {
    const map = this.make.tilemap({
      key: "map",
    });
    const tileset = map.addTilesetImage("tmw_desert_spacing", "tiles");
    // Parameters: layer name (or index) from Tiled, tileset, x, y
    const worldLayer = map.createLayer("World", tileset, 0, 0);

    worldLayer.setCollisionByProperty({ collides: true });

    const debugGraphics = this.add.graphics().setAlpha(0.75);
    worldLayer.renderDebug(debugGraphics, {
      tileColor: null, // Color of non-colliding tiles
      collidingTileColor: new Phaser.Display.Color(243, 134, 48, 255), // Color of colliding tiles
      faceColor: new Phaser.Display.Color(40, 39, 37, 255), // Color of colliding face edges
    });

    const PlnatsLayer = map.createLayer("Plnats", tileset, 0, 0);
    const StoneLayer = map.createLayer("Stone", tileset, 0, 0);
    const spawnPoint = map.findObject(
      "Objects",
      (obj) => obj.name === "Spawn Point"
    );

    // Create a sprite with physics enabled via the physics system. The image used for the sprite has
    // a bit of whitespace, so I'm using setSize & setOffset to control the size of the player's body.
    player = this.physics.add
      .sprite(spawnPoint.x, spawnPoint.y, "atlas", "misa-front")
      .setSize(30, 40)
      .setOffset(0, 24);

    // Watch the player and worldLayer for collisions, for the duration of the scene:
    this.physics.add.collider(player, worldLayer);

    // Create the player's walking animations from the texture atlas. These are stored in the global
    // animation manager so any sprite can access them.
    const anims = this.anims;
    anims.create({
      key: "misa-left-walk",
      frames: anims.generateFrameNames("atlas", {
        prefix: "misa-left-walk.",
        start: 0,
        end: 3,
        zeroPad: 3,
      }),
      frameRate: 10,
      repeat: -1,
    });
    anims.create({
      key: "misa-right-walk",
      frames: anims.generateFrameNames("atlas", {
        prefix: "misa-right-walk.",
        start: 0,
        end: 3,
        zeroPad: 3,
      }),
      frameRate: 10,
      repeat: -1,
    });
    anims.create({
      key: "misa-front-walk",
      frames: anims.generateFrameNames("atlas", {
        prefix: "misa-front-walk.",
        start: 0,
        end: 3,
        zeroPad: 3,
      }),
      frameRate: 10,
      repeat: -1,
    });
    anims.create({
      key: "misa-back-walk",
      frames: anims.generateFrameNames("atlas", {
        prefix: "misa-back-walk.",
        start: 0,
        end: 3,
        zeroPad: 3,
      }),
      frameRate: 10,
      repeat: -1,
    });

    const camera = this.cameras.main;
    camera.startFollow(player);
    camera.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

    this.add
      .text(16, 16, 'Arrow keys to move\nPress "D" to show hitboxes', {
        font: "18px monospace",
        fill: "#000000",
        padding: { x: 20, y: 10 },
        backgroundColor: "#ffffff",
      })
      .setScrollFactor(0)
      .setDepth(30);

    this.input.keyboard.once("keydown-D", (event) => {
      // Turn on physics debugging to show player's hitbox
      this.physics.world.createDebugGraphic();
      console.log("push d");
      // Create worldLayer collision graphic above the player, but below the help text
      const graphics = this.add.graphics().setAlpha(0.75).setDepth(20);
      worldLayer.renderDebug(graphics, {
        tileColor: null, // Color of non-colliding tiles
        collidingTileColor: new Phaser.Display.Color(243, 134, 48, 255), // Color of colliding tiles
        faceColor: new Phaser.Display.Color(40, 39, 37, 255), // Color of colliding face edges
      });
    });
  }
  function update(time, delta) {
    cursors = this.input.keyboard.createCursorKeys();

    const speed = 175;
    const prevVelocity = player.body.velocity.clone();

    // Stop any previous movement from the last frame
    player.body.setVelocity(0);

    // Horizontal movement
    if (cursors.left.isDown) {
      player.body.setVelocityX(-speed);
    } else if (cursors.right.isDown) {
      player.body.setVelocityX(speed);
    }

    // Vertical movement
    if (cursors.up.isDown) {
      player.body.setVelocityY(-speed);
    } else if (cursors.down.isDown) {
      player.body.setVelocityY(speed);
    }

    // Normalize and scale the velocity so that player can't move faster along a diagonal
    player.body.velocity.normalize().scale(speed);

    // Update the animation last and give left/right animations precedence over up/down animations
    if (cursors.left.isDown) {
      player.anims.play("misa-left-walk", true);
    } else if (cursors.right.isDown) {
      player.anims.play("misa-right-walk", true);
    } else if (cursors.up.isDown) {
      player.anims.play("misa-back-walk", true);
    } else if (cursors.down.isDown) {
      player.anims.play("misa-front-walk", true);
    } else {
      player.anims.stop();

      // If we were moving, pick and idle frame to use
      if (prevVelocity.x < 0) player.setTexture("atlas", "misa-left");
      else if (prevVelocity.x > 0) player.setTexture("atlas", "misa-right");
      else if (prevVelocity.y < 0) player.setTexture("atlas", "misa-back");
      else if (prevVelocity.y > 0) player.setTexture("atlas", "misa-front");
    }
  }
  useEffect(() => {
    ref.current = new Game(phaserConfig);
  }, []);
  return <div ref={ref} id="game-container"></div>;
};

export default GameComponent;

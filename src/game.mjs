import * as THREE from 'https://unpkg.com/three@0.121.1/build/three.module.js';
// import { BoxLineGeometry } from 'https://unpkg.com/three@0.121.1/examples/jsm/geometries/BoxLineGeometry.js';
import { PointerLockControls } from 'https://unpkg.com/three@0.121.1/examples/jsm/controls/PointerLockControls.js';
import { CSS2DObject } from 'https://unpkg.com/three@0.121.1/examples/jsm/renderers/CSS2DRenderer.js';

import * as ProtoThree from "./ProtoThree/main.mjs";

// boot
(()=>{
  window.addEventListener('DOMContentLoaded', () => {
    window.gameManager = new ProtoThree.Manager("#container", window.innerWidth - 10, window.innerHeight - 10, {
      useCSS2D: true
    });
    gameManager.scene.add('Main', Main);
    gameManager.scene.start('Main');
  });
})();

// const
const M_WHITE = new THREE.MeshLambertMaterial({color: 0xeeeeee});
const M_BLACK = new THREE.MeshLambertMaterial({color: 0x111111});
const M_RED = new THREE.MeshLambertMaterial({color: 0xbb1111});
const M_GREEN = new THREE.MeshLambertMaterial({color: 0x11bb11});
const M_BLUE = new THREE.MeshLambertMaterial({color: 0x1111bb});

const G_BOX = new THREE.BoxBufferGeometry(.5,.5,.5);
const G_BALL = new THREE.SphereBufferGeometry(.25);


// util
function dig2rad(degree) {
  return degree * ( Math.PI / 180 ) ;
};


// scene setup
class Main extends ProtoThree.AbstractScene {
  constructor(){
    super();

    this.playerData = {
      moveForward: false,
      moveBackward: false,
      moveLeft: false,
      moveRight: false,
      groundRayCaster: null,
      velocity: new THREE.Vector3(),
      fire: false,
      platform: 5
    };
    this.bulletData = {
      mesh: null,
      label: null,
      alive: false,
      lifeTime: 1000,
      fireTimeStamp: 0,
      hitRayCaster: null,
      velocity: new THREE.Vector3(0, 0, 1),
      stockPosition: new THREE.Vector3(0, -10, 0),
      speed: 300,
      size: .25
    };
    this.enemyData = {
      meshes: [],
      max: 100,
      lastPopTime: 0,
      stockPosition: new THREE.Vector3(0, -10, 0),
      size: 10 * .5,
      speed: 50
    };
    this.metaData = {
      state: 0,
      score: 0,
      highScore: 0,

      level: 0,
      killCount: 0,
      popRate: [4, 2, 1, 0.5, 0.25],
      levelUpRate: [5, 10, 20, 40, 40],

      hitTime: 0,
      hitStopLength: 400
    }

  }

  setupCamera() {
    const cam = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 0.1, 1000 );
    cam.position.set( 0, 10, 0 );

    return cam;
  }


  create() {
    this.background = new THREE.Color(0x000000);
    this.fog = new THREE.Fog(0x000000, 0, 200);

    // lights
    this.add( new THREE.HemisphereLight( 0x606060, 0x202020 ) );

    const light = new THREE.DirectionalLight( 0xffffff );
    light.position.set( 1, 1, 1 ).normalize();
    this.add( light );


    // control
    this.controls = new PointerLockControls(this.camera, document.body);
    this.add(this.controls.getObject());

    this.playerData.groundRayCaster = new THREE.Raycaster( new THREE.Vector3(), new THREE.Vector3( 0, - 1, 0 ), 0, 10 );


    // floor
    let centerGeometry = new THREE.PlaneBufferGeometry(2, 2000, 1, 1);
    centerGeometry.rotateX(- Math.PI / 2);
    const center = new THREE.Mesh(centerGeometry, M_WHITE);
    this.add(center);
    let floorGeometry = new THREE.PlaneBufferGeometry( this.playerData.platform * 2, this.playerData.platform * 2, 1, 1 );
    floorGeometry.rotateX(- Math.PI / 2);
    const floor = new THREE.Mesh(floorGeometry, M_WHITE);
    this.add(floor);


    // bullet
    const b = new THREE.Mesh(G_BALL, M_RED);
    this.add(b);
    this.bulletData.mesh = b;
    b.position.copy(this.bulletData.stockPosition);

    const cursorDom = document.createElement('div');
    cursorDom.className = 'label';
    cursorDom.textContent = '+';
    // cursorDom.style.marginTop = '-1em';
    cursorDom.style.fontSize = '30px';
    cursorDom.style.color = '#00ffff';
    const cursor = new CSS2DObject( cursorDom );
    cursor.position.set(0, 0, -2);
    this.cursor = cursor;
    this.camera.add(cursor);


    // enemy
    for (let i = 0; i < this.enemyData.max; i++){
      const e = new THREE.Mesh(G_BOX, M_WHITE);
      e.position.copy(this.enemyData.stockPosition);
      e.scale.multiplyScalar(this.enemyData.size * 2);
      e.data = {
        alive: false,
      };
      this.add(e);
      this.enemyData.meshes.push(e);
    }

    // ui
    const scoreDom = document.createElement('div');
    scoreDom.className = 'label';
    scoreDom.textContent = 'score: 0　　　　　　　　high score: 0';
    scoreDom.style.fontSize = '20px';
    scoreDom.style.color = '#ffffff';
    const score = new CSS2DObject(scoreDom);
    score.position.set(0, 0.9, -2);
    this.score = score;
    this.camera.add(score);

    const titleDom = document.createElement('div');
    titleDom.className = 'label';
    titleDom.innerHTML = 'Shooting Game<br><br>click to start<br><br>WASD: move<br>MouseMove: rotate<br>MouseClick: shot';
    titleDom.style.fontSize = '20px';
    titleDom.style.color = '#0080ff';
    titleDom.style.textAlign = 'center';
    const title = new CSS2DObject(titleDom);
    title.position.set(0, 0, -2);
    this.title = title;
    this.camera.add(title);

    const endingDom = document.createElement('div');
    endingDom.className = 'label';
    endingDom.innerHTML = 'game over<br><br>click to restart';
    endingDom.style.fontSize = '20px';
    endingDom.style.color = '#ff0000';
    endingDom.style.textAlign = 'center';
    const ending = new CSS2DObject(endingDom);
    ending.position.set(0, 0, -2);
    this.ending = ending;
    this.camera.add(ending);

    this.cursor.visible = false;
    this.ending.visible = false;
  }

  update() {
    if (this.metaData.state == 0) return;
    // console.log("Sample.update");
    this.score.element.textContent = 'score: ' + this.metaData.score + '　　　　　　　　high score: ' + this.metaData.highScore;

    if (this.controls.isLocked) {

      // --- player move - s
      // check ground
      const p = this.playerData;
      const cObj = this.controls.getObject();
      const r = p.groundRayCaster;
      r.ray.origin.copy(cObj.position);
      r.ray.origin.y -= 1;

      // const intersections = r.intersectObjects(objects);
      // const onObject = intersections.length > 0;
      const delta = (gameManager.time - gameManager.prevTime) / 1000;
      p.velocity.x -= p.velocity.x * 10.0 * delta;
      p.velocity.z -= p.velocity.z * 10.0 * delta;
      p.velocity.y -= 9.8 * 100.0 * delta; // 100.0 = mass

      const direction = new THREE.Vector3();
      direction.z = Number( p.moveForward ) - Number( p.moveBackward ); // (!)
      direction.x = Number( p.moveRight ) - Number( p.moveLeft );
      direction.normalize(); // this ensures consistent movements in all directions

      if ( p.moveForward || p.moveBackward ) p.velocity.z -= direction.z * 400.0 * delta;
      if ( p.moveLeft || p.moveRight ) p.velocity.x -= direction.x * 400.0 * delta;

      // if ( onObject === true ) {
      //   velocity.y = Math.max(0, velocity.y);
      //   canJump = true;
      // }

      this.controls.moveRight( - p.velocity.x * delta );
      this.controls.moveForward( - p.velocity.z * delta );

      cObj.position.y += ( p.velocity.y * delta ); // new behavior

      if ( cObj.position.y < 1 ) {
        // 擬似的な床の実装
        p.velocity.y = 0;
        cObj.position.y = 1; // 視点
        // canJump = true;
      }
      const area = this.playerData.platform;
      if (cObj.position.x > area) p.velocity.x = 0, cObj.position.x = area;
      if (cObj.position.x < -area) p.velocity.x = 0, cObj.position.x = -area;
      if (cObj.position.z > 0) p.velocity.z = 0, cObj.position.z = 0;
      if (cObj.position.z < -area) p.velocity.z = 0, cObj.position.z = -area;

      if (!this.bulletData.alive && this.playerData.fire) {
        const cObj = this.controls.getObject();
        this.bulletData.alive = true;
        this.bulletData.mesh.position.copy(cObj.position);
        // this.bulletData.mesh.quaternion.copy(cObj.quaternion);
        this.bulletData.velocity.set(0, 0, -1); // define front
        this.bulletData.velocity.applyQuaternion(cObj.quaternion);
        this.bulletData.velocity.multiplyScalar(this.bulletData.speed);
        this.bulletData.fireTimeStamp = gameManager.time;
      }
      if (gameManager.time > this.metaData.hitTime + this.metaData.hitStopLength) {
        this.playerData.fire = false;
      }


      // --- player move - e

      // --- bullet move - s
      if (this.bulletData.alive) {
        const b = this.bulletData.mesh;
        const prevPosition = b.position.clone();

        // move
        b.position.x += this.bulletData.velocity.x * delta;
        b.position.y += this.bulletData.velocity.y * delta;
        b.position.z += this.bulletData.velocity.z * delta;

        // collide
        const collideEnemy = this.enemyData.meshes.find((mesh) => {
          if (!mesh.data.alive) return false;
          const diff = mesh.position.clone().sub(b.position);
          return diff.length() < this.enemyData.size + this.bulletData.size;
        });
        if (collideEnemy) {
          // hit
          this.bulletData.mesh.position.copy(this.bulletData.stockPosition);
          this.bulletData.alive = false;

          collideEnemy.position.copy(this.enemyData.stockPosition);
          collideEnemy.data.alive = false;

          this.metaData.hitTime = gameManager.time;
          this.metaData.killCount++;
          this.metaData.score++;
          if (this.metaData.score > this.metaData.highScore) this.metaData.highScore = this.metaData.score;
        }

        // destroy
        const age = (gameManager.time - this.bulletData.fireTimeStamp);
        if (age > this.bulletData.lifeTime) {
          this.bulletData.alive = false;
          b.position.copy(this.bulletData.stockPosition);
        }

        this.cursor.visible = false;

      }
      else {
        if(this.metaData.state != 2) this.cursor.visible = true;
      }
      // --- bullet move - e

      // --- enemy move - s
      if (gameManager.time > this.metaData.hitTime + this.metaData.hitStopLength) {

        this.enemyData.meshes.forEach((e) => {
          // check gameover
          const pl = cObj.position.clone();
          if (pl.sub(e.position).lengthSq() < 1) {
            this.gameOver();
          }

          if (e.data.alive) {
            e.rotation.y += 1 * delta;
            e.position.x += e.data.velocity.x * delta;
            e.position.y += e.data.velocity.y * delta;
            e.position.z += e.data.velocity.z * delta;

            if (e.position.y < -2) {
              e.data.alive = false;
              e.position.set(this.enemyData.stockPosition);
            }
          }
        });

        const popRate = this.metaData.popRate[this.metaData.level];
        if (gameManager.time > this.enemyData.lastPopTime + popRate * 1000) {
          // pop enemy
          const e = this.enemyData.meshes.find((mesh) => !mesh.data.alive);
          if (e) {
            const popAngleHorizontal = dig2rad(Math.floor(Math.random() * 46) + 90 - 23 + 180);
            const popAngleVertical = dig2rad(Math.floor(Math.random() * 45) + 15);
            const range = Math.random() * 20 + 180;
            const x = Math.cos(popAngleHorizontal) * range;
            const z = Math.sin(popAngleHorizontal) * range;
            const y = Math.sin(popAngleVertical) * range;
            e.data.alive = true;
            e.position.set(x, y, z);
            // e.scale.multiplyScalar(10);
            e.data.velocity = new THREE.Vector3()
              .copy(cObj.position).sub(e.position)
              // .copy(e.position)
              // .multiplyScalar(-1)
              .normalize()
              .multiplyScalar(this.enemyData.speed);
          }
          this.enemyData.lastPopTime = gameManager.time;
        }
      }
      // --- enemy move - e

      // --- calc meta - s
      if (this.metaData.killCount > this.metaData.levelUpRate[this.metaData.level]) {
        this.metaData.killCount = 0;
        this.metaData.level++;
        if (this.metaData.level >= this.metaData.levelUpRate.length) this.metaData.level = 0;
      }
      // --- calc meta - e

    }

  }

  shutdown(){
    console.log("Sample.shutdown");
    this.children.forEach((e)=>{e.destroy});
  }

  onClick(e) {
    if (this.metaData.state == 0 || this.metaData.state == 2)
      this.gameStart();
    else if (this.metaData.state == 1)
      this.playerData.fire = true;
  }

  onKeyDown(e) {
    if (this.metaData.state == 2) return;

    switch ( e.keyCode ) {

      case 38: // up
      case 87: // w
        this.playerData.moveForward = true;
        break;

      case 37: // left
      case 65: // a
        this.playerData.moveLeft = true;
        break;

      case 40: // down
      case 83: // s
        this.playerData.moveBackward = true;
        break;

      case 39: // right
      case 68: // d
        this.playerData.moveRight = true;
        break;

      case 32: // space
        if ( canJump === true ) velocity.y += 350;
        canJump = false;
        break;
    }
  }
  onKeyUp(e) {

    switch ( e.keyCode ) {

      case 38: // up
      case 87: // w
        this.playerData.moveForward = false;
        break;

      case 37: // left
      case 65: // a
        this.playerData.moveLeft = false;
        break;

      case 40: // down
      case 83: // s
        this.playerData.moveBackward = false;
        break;

      case 39: // right
      case 68: // d
        this.playerData.moveRight = false;
        break;

    }
  }

  gameStart() {
    if (!this.controls.isLocked) this.controls.lock();
    this.title.visible = false;
    this.ending.visible = false;
    this.cursor.visible = true;
    this.metaData.state = 1;
    this.metaData.score = 0;
    this.metaData.level = 0;
    this.metaData.killCount = 0;
    this.enemyData.meshes.forEach((e) => {
      e.data.alive = false;
      e.position.set(this.enemyData.stockPosition);
    });
  }

  gameOver() {
    this.ending.visible = true;
    this.cursor.visible = false;
    this.metaData.state = 2;
  }
}


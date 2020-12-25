import * as THREE from 'https://unpkg.com/three@0.121.1/build/three.module.js';

export default class AbstractScene extends THREE.Scene {
  constructor() {
    super();
  }

  setManager(manager) {
    this.manager = manager
  }

  setupCamera() {
    console.warn("setup camera default");
    const cam_size = 4;
    const aspect_r = window.innerHeight / window.innerWidth;
    const cam = new THREE.OrthographicCamera(
      -cam_size, cam_size,
      cam_size * aspect_r, -cam_size*aspect_r,
      1, 1000);
    cam.position.set(0,0,10);
    // cam.position.set(5,-50,20);
    cam.lookAt(new THREE.Vector3(0,0,0));
    return cam;
  }

  create() {
    // NOP
  }

  update() {
    // NOP
  }

  shutdown() {
    // NOP
  }

  onClick(e){
    // NOP
  }
  onKeyDown(e) {
    // NOP
  }
  onKeyUp(e) {
    // NOP
  }

};
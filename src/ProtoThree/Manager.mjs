import * as THREE from 'https://unpkg.com/three@0.121.1/build/three.module.js';
import { CSS2DRenderer } from 'https://unpkg.com/three@0.121.1/examples/jsm/renderers/CSS2DRenderer.js';

import SceneManager from "./SceneManager.mjs";
import InputManager from "./InputManager.mjs";

export default class Manager {
  constructor(parent, width, height, render_option) {
    console.log(" ==== ProtoThree Start ==== ")

    // setup three.js - s
    width ||= window.innerWidth;
    height ||= window.innerHeight;

    render_option ||= {
      clearColor: 0x7f7fff,
      useCSS2D: false
    };


    const wrapper = document.querySelector(parent);

    const renderer = new THREE.WebGLRenderer();
    renderer.setClearColor(new THREE.Color(render_option.clearColor));
    renderer.setSize(width, height);
    wrapper.appendChild(renderer.domElement);

    let css2DRenderer = null;
    if (render_option.useCSS2D) {
      css2DRenderer = new CSS2DRenderer();
      css2DRenderer.setSize( width, height );
      css2DRenderer.domElement.style.position = 'absolute';
      css2DRenderer.domElement.style.top = '0px';
      wrapper.appendChild(css2DRenderer.domElement);
    }


    this.three = {
      canvas: renderer.domElement,
      renderer: renderer,
      css2D: css2DRenderer,
    };
    // setup three.js - e

    // setup proto three
    this.scene = new SceneManager(this);
    window.addEventListener('resize', () => {
      // リサイズ対応
      this.scene.current.camera.aspect = window.innerWidth / window.innerHeight;
      this.scene.current.camera.updateProjectionMatrix();
      this.three.renderer.setSize( window.innerWidth, window.innerHeight );
    }, false );

    this.input = new InputManager(this);
    this.loadFunc = () => { return []; };

    // start main loop
    this.prevTime = performance.now();
    this.tick();
  }

  /**
   *
   * @param func {Function} Promiseの配列を返す関数
   */
  setLoad(func) {
    this.loadFunc = func;
  }

  tick() {
    this.time = performance.now();
    if (this.scene.current && this.scene.current.camera) {
      this.input.update();
      this.scene.update();
      this.three.renderer.render(this.scene.current, this.scene.current.camera);
      if (this.three.css2D) this.three.css2D.render(this.scene.current, this.scene.current.camera);
    }
    requestAnimationFrame(this.tick.bind(this));
    this.prevTime = this.time;
  }

};
/*
構想
SceneManagerと同じ階層のマネージャ

とりあえずマウスクリックだけ実装

InputManager
　mouseRayCaster



*/

import * as THREE from 'https://unpkg.com/three@0.121.1/build/three.module.js';

export default  class InputManager {
    constructor(manager){
        this.manager = manager;

        // get mouse position
        this.mouse_pos_by_screen = new THREE.Vector2();
        const c = this.manager.three.canvas;
        window.addEventListener("mousemove", (e) => {
            // update mouse pos
            this.mouse_pos_by_screen.x = (e.clientX / c.width) * 2 - 1;
            this.mouse_pos_by_screen.y = - (e.clientY / c.height) * 2 + 1;
        });
        this.mouse_raycaster = new THREE.Raycaster();

        // setup event
        window.addEventListener("click", (e)=>{
            this.manager.scene.current.onClick(e);
        });
        window.addEventListener("keydown", (e) => {
            console.log('keydown');
            this.manager.scene.current.onKeyDown(e);
        });
        window.addEventListener("keyup", (e) => {
            console.log('keyup');
            this.manager.scene.current.onKeyUp(e);
        });
    }

    update(){
        this.mouse_raycaster.setFromCamera(this.mouse_pos_by_screen, this.manager.scene.current.camera);
    }
}
export default class SceneManager {
  constructor(manager) {
    this.manager = manager;
    this.scenes = {};
    this.current = null;
  }

  add(name, scene) {
    const s = new scene();
    s.setManager(this.manager);

    this.scenes[name] = s;
  }

  start(name) {
    this.loadPromises ||= this.manager.loadFunc();
    Promise.all(this.loadPromises)
      .then(() => {
        if (this.current) this.current.shutdown();

        this.current = this.scenes[name];
        if (!this.current.camera)
          this.current.camera = this.current.setupCamera();
        this.current.create();
      });
  }

  update() {
    if (!this.current) return;
    this.current.update();
  }
};

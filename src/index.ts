declare var GIF: any;  // for https://github.com/jnordberg/gif.js

const EMPTY: number = 0;

module framework {
  export class Random {
    private x: number;
    private y: number;
    private z: number;
    private w: number;
    constructor() {
      this.x = 123456789;
      this.y = 362436069;
      this.z = 521288629;
      this.w = 88675123; // seedk
    }

    // XorShift
    next() {
      let t;
      t = this.x ^ (this.x << 11);
      this.x = this.y; this.y = this.z; this.z = this.w;
      return this.w = (this.w ^ (this.w >>> 19)) ^ (t ^ (t >>> 8));
    }

    nextInt(max: number) {
      // javascriptのmodは負になりうるので、非負にするため2回modをとる
      return (this.next() % max + max) % max;
    }
  }

  export class cKeyboardInput {
    public keyCallback: { [keycode: number]: () => void; } = {};
    public keyDown: { [keycode: number]: boolean; } = {};

    constructor() {
      document.addEventListener('keydown', this.keyboardDown);
      document.addEventListener('keyup', this.keyboardUp);
    }
    public keyboardDown = (event: KeyboardEvent): void => {
      event.preventDefault();
      this.keyDown[event.keyCode] = true;
    }
    public keyboardUp = (event: KeyboardEvent): void => {
      this.keyDown[event.keyCode] = false;
    }

    public addKeycodeCallback = (keycode: number, f: () => void): void => {
      this.keyCallback[keycode] = f;
      this.keyDown[keycode] = false;
    }

    public inputLoop = (): void => {
      for (var key in this.keyDown) {
        var is_down: boolean = this.keyDown[key];
        if (is_down) {
          var callback: () => void = this.keyCallback[key];
          if (callback != null) {
            callback();
          }
        }
      }
    }
  }

  export class Game {
    public readonly N: number = 9;
    public grid: number[][] = [];
    public score: number;
    public random: Random;

    constructor() {
      this.score = 0;
      this.random = new Random();
      for (let i = 0; i < this.N; i++) {
        const row: number[] = [];
        for (let j = 0; j < this.N; j++) {
          row.push(EMPTY);
        }
        this.grid.push(row);
      }
    }

    public update = (dir: number): void => {
    }
  }
}

module visualizer {
  class Visualizer {
    private updatedTime: number;
    private keyInput: framework.cKeyboardInput;
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private scoreInput: HTMLInputElement;
    private game: framework.Game;
    static background: { [value: number]: string; } = {
      0: "#cdc1b4",
      2: "#eee4da",
      4: "#ede0c8",
      8: "#f2b179",
      16: "#f59563",
      32: "#f67c5f",
      64: "#f65e3b",
      128: "#edcf72",
      256: "#edcc61",
      512: "#edc850",
      1024: "#edc53f",
      2048: "#edc22e",
      4096: "#edc22e",
    };
    static color: { [value: number]: string; } = {
      0: "#776e65",
      2: "#776e65",
      4: "#776e65",
      8: "#f9f6f2",
      16: "#f9f6f2",
      32: "#f9f6f2",
      64: "#f9f6f2",
      128: "#f9f6f2",
      256: "#f9f6f2",
      512: "#f9f6f2",
      1024: "#f59563",
      2048: "#f67c5f",
      4096: "#f65e3b",
    };

    constructor() {
      this.game = new framework.Game();
      this.canvas = <HTMLCanvasElement>document.getElementById("canvas");  // TODO: IDs should be given as arguments
      const size = 450;
      this.canvas.height = size;  // pixels
      this.canvas.width = size;  // pixels
      this.ctx = this.canvas.getContext('2d')!;
      this.scoreInput = <HTMLInputElement>document.getElementById("scoreInput");
      this.keyInput = new framework.cKeyboardInput();
      // press left, up, right, down arrow
      this.keyInput.addKeycodeCallback(37, () => this.game.update(0));
      this.keyInput.addKeycodeCallback(38, () => this.game.update(1));
      this.keyInput.addKeycodeCallback(39, () => this.game.update(2));
      this.keyInput.addKeycodeCallback(40, () => this.game.update(3));

      this.updatedTime = new Date().getTime();
    }

    public draw() {
      this.scoreInput.value = String(this.game.score);

      this.ctx.fillStyle = "#bbada0";
      const W = this.canvas.width / this.game.N;
      const H = this.canvas.height / this.game.N;

      // 輪郭をdraw
      for (let i = 0; i <= this.game.N; i++) {
        if (i % 3 == 0) {
          this.ctx.lineWidth = 3;
          this.ctx.strokeStyle = "#000000";
        }
        else { 
          this.ctx.lineWidth = 1;
          this.ctx.strokeStyle = "#bbbbbb";
        }
        const x = i * W;
        this.ctx.beginPath();
        this.ctx.moveTo(x, 0);
        this.ctx.lineTo(x, this.game.N*H);
        this.ctx.stroke();
        const y = i * H;
        this.ctx.beginPath();
        this.ctx.moveTo(0, y);
        this.ctx.lineTo(this.game.N*W, y);
        this.ctx.stroke();
      }

      const MARGIN = 0;
      const W2 = W - MARGIN * 2;
      const H2 = H - MARGIN * 2;
      this.ctx.font = `${H2 / 2}px monospace`;
      this.ctx.textAlign = 'center';
      for (let i = 0; i < this.game.N; i++) {
        const x = i * W + MARGIN;
        for (let j = 0; j < this.game.N; j++) {
          const y = j * H + MARGIN;
          const value = this.game.grid[j][i];
          this.ctx.fillStyle = Visualizer.background[value];
          // this.ctx.strokeRect(x, y, W2, H2);
          // if (value != EMPTY) {
          //   this.ctx.fillStyle = Visualizer.color[value];
          //   this.ctx.fillText(String(this.game.grid[j][i]), x + W2 / 2, y + 3 * H2 / 4);
          // }
        }
      }
    }

    public loop = () => {
      this.keyInput.inputLoop();
      let now = new Date().getTime();
      while (now - this.updatedTime < 80) {
        now = new Date().getTime();
      }
      this.updatedTime = now;
      requestAnimationFrame(this.loop);
      this.draw();
    }

    public getCanvas(): HTMLCanvasElement {
      return this.canvas;
    }
  };

  export class App {
    public visualizer: Visualizer;

    constructor() {
      this.visualizer = new Visualizer();
      this.visualizer.draw();
      this.visualizer.loop();
    }
  }
}

window.onload = () => {
  if (location.host != 'atcoder.jp') {
    document.body.style.paddingTop = '40px';
  }
  new visualizer.App();
};

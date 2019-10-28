declare var GIF: any;  // for https://github.com/jnordberg/gif.js

const EMPTY: number = 0;
const startGrid: number[][] = [
  [0,0,0,0,0,0,0,0,0],
  [0,0,2,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0],
  [0,1,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0]
];

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
    public fixed: boolean[][] = []; // 初期配置のcellならtrue
    public score: number;
    public random: Random;
    public choosedX: number | null = null;
    public choosedY: number | null = null;

    constructor() {
      this.score = 0;
      this.random = new Random();
      for (let i = 0; i < this.N; i++) {
        const row: boolean[] = [];
        for (let j = 0; j < this.N; j++) {
          row.push(startGrid[i][j] != 0);
        }
        this.fixed.push(row);
        this.grid.push(startGrid[i]);
      }
    }

    public update = (num: number): void => {
      if (this.choosedX == null || this.choosedY == null) return;
      if (this.fixed[this.choosedY][this.choosedX]) return;
      this.grid[this.choosedY][this.choosedX] = num;
      console.log(this.choosedX, this.choosedY, num);
    }

    public reset = (): void => {
      for (let i = 0; i < this.N; i++) {
        for (let j = 0; j < this.N; j++) {
          if (this.fixed[i][j]) continue;
          this.grid[i][j] = EMPTY;
        }
      }
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
    private resetButton: HTMLButtonElement;

    constructor() {
      this.resetButton = <HTMLButtonElement>document.getElementById("reset");
      this.game = new framework.Game();
      this.canvas = <HTMLCanvasElement>document.getElementById("canvas");  // TODO: IDs should be given as arguments
      const size = 450;
      this.canvas.height = size;  // pixels
      this.canvas.width = size;  // pixels
      this.ctx = this.canvas.getContext('2d')!;
      this.scoreInput = <HTMLInputElement>document.getElementById("scoreInput");
      this.keyInput = new framework.cKeyboardInput();
      // press number keys
      for (let i = 0; i < 10; ++i) {
        this.keyInput.addKeycodeCallback(48+i, () => this.game.update(i));
      }
      this.resetButton.addEventListener("click", e => {
        this.game.reset();
      });
      this.canvas.addEventListener("click", e => {
        // マウスの座標をCanvas内の座標とあわせる
        const rect = this.canvas.getBoundingClientRect();
        const point = {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        };
      
        const gridX = Math.floor(point.x * this.game.N / this.canvas.width);
        const gridY = Math.floor(point.y * this.game.N / this.canvas.height);
        if (this.game.choosedX == gridX && this.game.choosedY == gridY) {
          // 選択を解除する
          this.game.choosedX = null;
          this.game.choosedY = null;
        }
        else {
          // 選択する
          this.game.choosedX = gridX;
          this.game.choosedY = gridY;
        }
      });

      this.updatedTime = -1;
    }

    public draw() {
      this.scoreInput.value = String(this.game.score);

      // 初期化
      this.ctx.fillStyle = "#ffffff";
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

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

      this.ctx.font = `${H / 2}px monospace`;
      this.ctx.textAlign = 'center';
      for (let i = 0; i < this.game.N; i++) {
        const x = i * W;
        for (let j = 0; j < this.game.N; j++) {
          const y = j * H;
          const value = this.game.grid[j][i];
          if (value != EMPTY) {
            if (this.game.fixed[j][i]) {
              this.ctx.fillStyle = "#000000";
            }
            else {
              this.ctx.fillStyle = "#0000ff";
            }
            this.ctx.fillText(String(this.game.grid[j][i]), x + W / 2, y + 3 * H / 4);
          }
        }
      }

      // 選択されたcellをdraw
      if (this.game.choosedX != null && this.game.choosedY != null) {
        this.ctx.lineWidth = 2;
        this.ctx.strokeStyle = "#ff0000";
        this.ctx.strokeRect(this.game.choosedX*W, this.game.choosedY*H, W, H);
      }
    }

    public loop = () => {
      this.keyInput.inputLoop();
      // let now = new Date().getTime();
      // while (now - this.updatedTime < 30) {
      //   now = new Date().getTime();
      // }
      // this.updatedTime = now;
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

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
    public readonly N: number = 4;
    public grid: number[][] = [];
    public score: number;
    public random: Random;

    private spawnValues: number[] = [2, 2, 2, 2, 2, 4];

    // left, up, right, down
    private DX: number[] = [1, 1, -1, 1];
    private DY: number[] = [1, 1, 1, -1];
    private DX2: number[] = [-1, 0, 1, 0];
    private DY2: number[] = [0, -1, 0, 1];
    private SX: number[] = [1, 0, this.N-2, 0];
    private SY: number[] = [0, 1, 0, this.N-2];
    private EX: number[] = [this.N, this.N, -1, this.N];
    private EY: number[] = [this.N, this.N, this.N, -1];

    constructor() {
      this.score = 0;
      this.random = new Random();
      for (let i = 0; i < this.N; i++) {
        const row: number[] = [];
        for (let j = 0; j < this.N; j++) {
          if (i == 2 && j == 2) row.push(2);
          if (i == 1 && j == 1) row.push(2);
          else { row.push(EMPTY) };
        }
        this.grid.push(row);
      }
    }

    private updateCell(x: number, y: number, dir: number) {
      const dx = this.DX2[dir];
      const dy = this.DY2[dir];
      let cx = x;
      let cy = y;
      let nx = cx+dx;
      let ny = cy+dy;
      while (0 <= nx && nx < this.N && 0 <= ny && ny < this.N) {
        const cell = this.grid[cy][cx];
        if (cell == EMPTY) return;
        const adjacentCell = this.grid[ny][nx];
        if (adjacentCell == EMPTY) {
          this.grid[ny][nx] = cell;
          this.grid[cy][cx] = EMPTY;
        }
        else if (cell == adjacentCell) {
          this.grid[ny][nx] += cell;
          this.grid[cy][cx] = EMPTY;
          this.score += this.grid[ny][nx];
        }
        else {
          return;
        }
        cx += dx;
        cy += dy;
        nx += dx;
        ny += dy;
      }
    }

    public gameover() {
      // 空きのcellがあればgameoverではない
      for (let x = 0; x < this.N; ++x) {
        for (let y = 0; y < this.N; ++y) {
          if (this.grid[y][x] == EMPTY) {
            return false;
          }
          for (let dir = 0; dir < 4; ++dir) {
            const nx = x+this.DX2[dir];
            if (nx < 0 || nx >= this.N) continue;
            const ny = y+this.DY2[dir];
            if (ny < 0 || ny >= this.N) continue;
            if (this.grid[y][x] == this.grid[ny][nx]) {
              return false;
            }
          }
        }
      }
      // くっつけられるcellがあればgameoverではない
      for (let x = 0; x < this.N; ++x) {
        for (let y = 0; y < this.N; ++y) {
        }
      }
      return true;
    }

    private spawn() {
      const emptyCells: [number, number][] = [];
      for (let x = 0; x < this.N; ++x) {
        for (let y = 0; y < this.N; ++y) {
          if (this.grid[y][x] == EMPTY) {
            emptyCells.push([x, y]);
          }
        }
      }
      if (emptyCells.length == 0) return;
      const r1 = this.random.nextInt(emptyCells.length);
      const spawnPos = emptyCells[r1];
      const r2 = this.random.nextInt(this.spawnValues.length);
      const spawnValue = this.spawnValues[r2];
      this.grid[spawnPos[1]][spawnPos[0]] = spawnValue;
    }

    public update = (dir: number): void => { 
      for (let x = this.SX[dir]; x != this.EX[dir]; x += this.DX[dir]) {
        for (let y = this.SY[dir]; y != this.EY[dir]; y += this.DY[dir]) {
          this.updateCell(x, y, dir);
        }
      }
      this.spawn();
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
      const size = 400;
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

      this.ctx.fillStyle = "#bbada0"
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      const W = this.canvas.width / this.game.N;
      const H = this.canvas.height / this.game.N;
      const MARGIN = 4;
      const W2 = W-MARGIN*2;
      const H2 = H-MARGIN*2;
      this.ctx.font = `${H2/2}px monospace`;
      this.ctx.textAlign = 'center';
      for (let i = 0; i < this.game.N; i++) {
        const x = i * W + MARGIN;
        for (let j = 0; j < this.game.N; j++) {
          const y = j * H + MARGIN;
          const value = this.game.grid[j][i];
          this.ctx.fillStyle = Visualizer.background[value];
          this.ctx.fillRect(x, y, W2, H2);
          if (value != EMPTY) {
            this.ctx.fillStyle = Visualizer.color[value];
            this.ctx.fillText(String(this.game.grid[j][i]), x+W2/2, y+3*H2/4);
          }
        }
      }
    }

    public loop = () => {
      if (this.game.gameover()) {
        console.log("GAME OVER");
        return;
      }
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

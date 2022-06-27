// ゲームスクリプト
// ---------------

// モジュールのインポート
import * as Screen from './screen.js';
import * as Plane from './plane.js';
import * as Space from './space.js';

// HTMLのキャンバス要素を取得
const canvas = document.getElementById('canvas');

// スクリーンの作成
const screen = new Screen.Screen(canvas);

// 2D平面の作成
const plane = new Plane.Plane(screen);

// グラフィックを作成
const d2d = {
    width  : 4,
    height : 4,
    pixel : 
    [
        51, 51, 51, 255,
        153, 153, 153, 255,
        153, 153, 153, 255,
        51, 51, 51, 255,
        
        153, 153, 153, 255,
        204, 204, 204, 255,
        204, 204, 204, 255,
        153, 153, 153, 255,

        153, 153, 153, 255,
        204, 204, 204, 255,
        204, 204, 204, 255,
        153, 153, 153, 255,

        51, 51, 51, 255,
        153, 153, 153, 255,
        153, 153, 153, 255,
        51, 51, 51, 255,
    ],
};
const graphic2d = new Plane.Graphic(plane);
graphic2d.setData(d2d.width, d2d.height, d2d.pixel);

// スプライトの作成
const sprite2d = new Plane.Sprite(plane);

// グラフィックの設定
sprite2d.graphic = graphic2d;

// 3D空間の作成
const space = new Space.Space(screen);

// グラフィックを作成
const d3d = {
    width  : 4,
    height : 4,
    depth : 4,
    voxel : 
    [
        // 0
        51,  51,  51, 255,
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
        
        153, 153, 153, 255,
        204, 204, 0,  255,
        0, 0, 0, 0,
        0, 0, 0, 0,
 
        153, 153, 153, 255,
        204, 204, 0,  255,
        204, 204, 0,  255,
        0, 0, 0, 0,
 
        51,  51,  51,  255,
        153, 153, 153, 255,
        153, 153, 153, 255,
        51,  51,  51,  255,

        // 1
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
        
        0, 204, 204, 255,
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
 
        0, 204, 204,  255,
        0, 0, 0, 0,
        0, 0, 0, 0,
        204, 0, 0, 255,
 
        153, 153, 153, 255,
        204, 204, 204, 255,
        204, 204, 204, 255,
        153, 153, 153, 255,

        // 2
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
        
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
        204, 0, 0, 255,
 
        0, 204, 204, 255,
        0, 0, 0, 0,
        0, 0, 0, 0,
        204, 0, 0, 255,
 
        153, 153, 153, 255,
        204, 204, 204, 255,
        204, 204, 204, 255,
        153, 153, 153, 255,

        // 3
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
        51,  51,  51, 255,

        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 204, 255,
        153, 153, 153, 255,
  
        0, 0, 0, 0,
        0, 0, 204, 255,
        0, 0, 204, 255,
        153, 153, 153, 255,
  
        51,  51,  51, 255,
        153, 153, 153, 255,
        153, 153, 153, 255,
        51,  51,  51, 255,
    ],
};
const graphic3d = new Space.Graphic(space);
graphic3d.setData(d3d.width, d3d.height, d3d.depth, d3d.voxel);

// スプライトの作成
const sprite3d = new Space.Sprite(space);

// グラフィックの設定
sprite3d.graphic = graphic3d;

// 位置の調整
sprite2d.translate(-7/8, -7/8, 5);
sprite2d.scale(1/8, 1/8);

sprite3d.translate(0, 0, 2);
sprite3d.scale(1/4, 1/4, 1/4);
sprite3d.perspective.ratio = 4;

// 操作の変数
let px = 0, py = 0;

// 自動画面リサイズ登録
sprite2d.registerAutoResize();
sprite3d.registerAutoResize();

// アニメーションループ
const loop = function ()
{
    screen.clear(1.0, 1.0, 1.0, 1.0);
    screen.clearFrame(1.0, 1.0, 1.0, 1.0);

    // input
    if(screen.pointerDown)
    {
      px = screen.pointerX;
      py = screen.pointerY;
    }

    sprite3d.rotateY(-px * Math.PI);
    sprite3d.rotateX(Math.min(Math.max(-Math.PI, -py * Math.PI), Math.PI));

    sprite2d.draw();
    sprite3d.draw();

    screen.flush();

    screen.animate(loop);
};
loop();

// サービスワーカーの登録
if ('serviceWorker' in navigator) navigator.serviceWorker.register('./service-worker.js');
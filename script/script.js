// ゲームスクリプト
// ---------------

// モジュールのインポート
import * as Screen from './screen.js';
import * as Plane from './plane.js';
import * as Space from './space.js';

// スクリーンの作成
const screen = new Screen.Screen();

// 平面の作成
const plane = new Plane.Plane(screen);

// グラフィックを作成
const d2d = {
    width  : 4,
    height : 4,
    pixel : 
    [
         51, 255,  51, 255,
        153, 153, 153, 255,
        153, 153, 153, 255,
        255, 255,  51, 255,
        
        153, 153, 153, 255,
          0,   0,   0,   0,
          0,   0,   0,   0,
        153, 153, 153, 255,

        153, 153, 153, 255,
          0,   0,   0,   0,
          0,   0,   0,   0,
        153, 153, 153, 255,

         51,  51,  51, 255,
        153, 153, 153, 255,
        153, 153, 153, 255,
        255,  51,  51, 255,
    ],
};
const graphic2d = new Plane.Graphic(plane);
graphic2d.setData(d2d.width,d2d.height,d2d.pixel);

// スプライトの作成
const sprite2d = new Plane.Sprite(plane);

// グラフィックの設定
sprite2d.graphic = graphic2d;

// 空間の作成
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
        153, 153, 153, 255,
        153, 153, 153, 255,
        153, 153, 153, 255,
        
        153, 153, 153, 255,
          0,   0,   0,   0,
          0,   0,   0,   0,
        153, 153, 153, 255,
 
        153, 153, 153, 255,
          0,   0,   0,   0,
          0,   0,   0,   0,
        153, 153, 153, 255,
 
        153, 153, 153, 255,
        153, 153, 153, 255,
        153, 153, 153, 255,
        153, 153, 153, 255,

        // 1
         51,  51,  51, 255,
          0,   0,   0,   0,
          0,   0,   0,   0,
        153, 153, 153, 255,
        
        153, 153, 153, 255,
          0,   0,   0,   0,
          0,   0,   0,   0,
        153, 153, 153, 255,
 
        153, 153, 153, 255,
          0,   0,   0,   0,
          0,   0,   0,   0,
        153, 153, 153, 255,
 
        153, 153, 153, 255,
          0,   0,   0,   0,
          0,   0,   0,   0,
        153, 153, 153, 255,

        // 2
         51,  51,  51, 255,
          0,   0,   0,   0,
          0,   0,   0,   0,
        153, 153, 153, 255,
        
        153, 153, 153, 255,
          0,   0,   0,   0,
          0,   0,   0,   0,
        153, 153, 153, 255,
 
        153, 153, 153, 255,
          0,   0,   0,   0,
          0,   0,   0,   0,
        153, 153, 153, 255,
 
        153, 153, 153, 255,
          0,   0,   0,   0,
          0,   0,   0,   0,
        153, 153, 153, 255,

        // 3
         51,  51,  51, 255,
        153, 153, 153, 255,
        153, 153, 153, 255,
        153, 153, 153, 255,
        
        153, 153, 153, 255,
          0,   0,   0,   0,
          0,   0,   0,   0,
        153, 153, 153, 255,
 
        153, 153, 153, 255,
          0,   0,   0,   0,
          0,   0,   0,   0,
        153, 153, 153, 255,
 
        153, 153, 153, 255,
        153, 153, 153, 255,
        153, 153, 153, 255,
        153, 153, 153, 255,
    ],
};
const graphic3d = new Space.Graphic(space);
graphic3d.setData(d3d.width,d3d.height,d3d.depth,d3d.voxel);

// スプライトの作成
const sprite3d = new Space.Sprite(space);

// グラフィックの設定
sprite3d.graphic = graphic3d;

// アニメーション
let t = 0;

sprite2d.translate(0, -14/16, 0);
sprite2d.scale(1/16, 1/16);

sprite3d.scale(1/4, 1/4);

// アニメーションループ
const loop = function ()
{
    screen.clear(1.0, 1.0, 1.0, 1.0);

    t += 1;

    sprite3d.rotateX(t/256 * Math.PI);
    sprite3d.rotateZ(t/64 * Math.PI);

    space.drawSprite(sprite3d);
    plane.drawSprite(sprite2d);

    screen.animate(loop);
};
loop();

// サービスワーカーの登録
if ('serviceWorker' in navigator) navigator.serviceWorker.register('./service-worker.js');
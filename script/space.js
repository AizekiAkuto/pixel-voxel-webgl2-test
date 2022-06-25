// 簡易Voxelartゲームフレームワーク
// ------------------------------

import * as Mat4 from './mat4.js';

// 画面
const Space = class
{
    constructor(screen)
    {
        const ctx = screen._ctx;
        this._ctx = ctx;

        // 頂点シェーダー
        const vertexShaderString =
        `#version 300 es
            layout (location = 0) in vec3 position;
            layout (location = 1) in vec3 coord3d;
            centroid out vec3 varCoord3d;
            uniform mat4 mvpMatrix;
            
            void main(void)
            {
                varCoord3d = coord3d;
                gl_Position = mvpMatrix * vec4(position, 1.0);
            }
        `;
        // フラグメントシェーダー
        const fragmentShaderString =
        `#version 300 es
            precision mediump sampler3D;
            precision mediump float;
            
            uniform sampler3D graphic;
            centroid in vec3 varCoord3d;
            out vec4 outColor;
            
            void main(void)
            {
                outColor = texture(graphic, varCoord3d);
            }
        `;

        // 頂点シェーダーをコンパイル
        const vertexShader = ctx.createShader(ctx.VERTEX_SHADER);
        ctx.shaderSource(vertexShader, vertexShaderString);
        ctx.compileShader(vertexShader);
        if(ctx.getShaderParameter(vertexShader, ctx.COMPILE_STATUS))
            this._vertexShader = vertexShader;
        else
            console.error(ctx.getShaderInfoLog(vertexShader));
        
        // フラグメントシェーダーをコンパイル
        const fragmentShader = ctx.createShader(ctx.FRAGMENT_SHADER);
        ctx.shaderSource(fragmentShader, fragmentShaderString);
        ctx.compileShader(fragmentShader);
        if(ctx.getShaderParameter(fragmentShader, ctx.COMPILE_STATUS))
            this._fragmentShader = fragmentShader;
        else
            console.error(ctx.getShaderInfoLog(fragmentShader));
        
        // シェーダープログラム
        const program = ctx.createProgram();
        ctx.attachShader(program, vertexShader);
        ctx.attachShader(program, fragmentShader);
        ctx.linkProgram(program);
        if(ctx.getProgramParameter(program, ctx.LINK_STATUS))
        {
            ctx.useProgram(program);
            this._program = program;
        }
        else
            console.error(ctx.getProgramInfoLog(program));

        // ロケーションを取得
        this._textureLocation = ctx.getUniformLocation(this._program, 'graphic');
        this._mvpMatrixLocation = ctx.getUniformLocation(this._program, 'mvpMatrix');
        this._positionLocation = ctx.getAttribLocation(this._program, 'position');
        this._coordLocation = ctx.getAttribLocation(this._program, 'coord3d');
    }
};



// スプライト
const Sprite = class
{
    constructor(space)
    {
        this._space = space;
        const ctx = space._ctx;
        this._ctx = ctx;
        this.graphic = null;

        // 位置
        this.positionArray = 
        [
            // Front
            -1.0, -1.0, -1.0,
            -1.0,  1.0, -1.0,
             1.0, -1.0, -1.0, 
             1.0,  1.0, -1.0,
            // Back
             1.0, -1.0,  1.0,
             1.0,  1.0,  1.0,
            -1.0, -1.0,  1.0, 
            -1.0,  1.0,  1.0,
            // Left
            -1.0, -1.0,  1.0,
            -1.0,  1.0,  1.0,
            -1.0, -1.0, -1.0, 
            -1.0,  1.0, -1.0,
            // Right
             1.0, -1.0, -1.0,
             1.0,  1.0, -1.0,
             1.0, -1.0,  1.0, 
             1.0,  1.0,  1.0,
            // Bottom
            -1.0, -1.0,  1.0,
            -1.0, -1.0, -1.0,
             1.0, -1.0,  1.0, 
             1.0, -1.0, -1.0,
            // Top
            -1.0,  1.0, -1.0,
            -1.0,  1.0,  1.0,
             1.0,  1.0, -1.0, 
             1.0,  1.0,  1.0,
        ];
        
        this.coordArray =
        [
            // Front
            0, 1, 1/16,
            0, 0, 1/16,
            1, 1, 1/16,
            1, 0, 1/16,
            // Back
            1, 1, 15/16,
            1, 0, 15/16,
            0, 1, 15/16,
            0, 0, 15/16,
            // Left
            1/16, 1, 1,
            1/16, 0, 1,
            1/16, 1, 0,
            1/16, 0, 0,
            // Right
            15/16, 1, 0,
            15/16, 0, 0,
            15/16, 1, 1,
            15/16, 0, 1,
            // Bottom
            0, 15/16, 1,
            0, 15/16, 0,
            1, 15/16, 1,
            1, 15/16, 0,
            // Top
            0, 1/16, 0,
            0, 1/16, 1,
            1, 1/16, 0,
            1, 1/16, 1,
        ];

        // 頂点配列作成
        this.vertexArray = [];
        for(let i = 0; i < 4 * 6; i++)
        {
            this.vertexArray.push(this.positionArray[i * 3 + 0]);
            this.vertexArray.push(this.positionArray[i * 3 + 1]);
            this.vertexArray.push(this.positionArray[i * 3 + 2]);
            this.vertexArray.push(this.coordArray[i * 3 + 0]);
            this.vertexArray.push(this.coordArray[i * 3 + 1]);
            this.vertexArray.push(this.coordArray[i * 3 + 2]);
        }

        // 頂点バッファーを生成する
        const vbo = ctx.createBuffer();
        ctx.bindBuffer(ctx.ARRAY_BUFFER, vbo);
        ctx.bufferData(ctx.ARRAY_BUFFER, new Float32Array(this.vertexArray), ctx.STATIC_DRAW);
        ctx.bindBuffer(ctx.ARRAY_BUFFER, null);
        this._vbo = vbo;

        // インデクス
        const indexArray =
        [
            // Front
            0, 1, 2,
            3, 2, 1,
            // Back
            4, 5, 6,
            7, 6, 5,
            // Left
            8, 9, 10,
            11, 10, 9,
            // Right
            12, 13, 14,
            15, 14, 13,
            // Bottom
            16, 17, 18,
            19, 18, 17,
            // Top
            20, 21, 22,
            23, 22, 21,
        ];

        // インデクスバッファーを生成する
        const ibo = ctx.createBuffer();
        ctx.bindBuffer(ctx.ELEMENT_ARRAY_BUFFER, ibo);
        ctx.bufferData(ctx.ELEMENT_ARRAY_BUFFER, new Int16Array(indexArray), ctx.STATIC_DRAW);
        ctx.bindBuffer(ctx.ELEMENT_ARRAY_BUFFER, null);
        this._ibo = ibo;

        // 位置などの初期値
        this.left = 0;
        this.down = 0;
        this.near = 5;
        this.width = 0.5;
        this.height = 0.5;
        this.depth = 0.5;
        this.radian = {
            x : 0,
            y : 0,
            z : 0,
        };
        this.perspective = 
        {
            far : 1.0,
            near : 9.0,
            ratio : 2.0,
        };
        this.setScreenPerspective();
        this._updateMatrix();
    }
    
    // スプライト描画
    draw()
    {
        const space = this._space;
        const ctx = this._ctx;

        if(this.graphic != null)
        {
            ctx.activeTexture(ctx.TEXTURE0 + 0);
            ctx.bindTexture(ctx.TEXTURE_3D, this.graphic._texture);
            ctx.uniform1i(space.textureLocation, 0);
        }
        else return;
        
        if(ctx.getProgramParameter(space._program, ctx.LINK_STATUS)) ctx.useProgram(space._program);

		ctx.uniformMatrix4fv(space._mvpMatrixLocation, false, this.mvpMatrix);

        ctx.bindBuffer(ctx.ARRAY_BUFFER, this._vbo);
        
        ctx.enableVertexAttribArray(space._positionLocation);
        ctx.vertexAttribPointer(space._positionLocation, 3, ctx.FLOAT, false, (3 + 3) * 4, 0);
        
        ctx.enableVertexAttribArray(space._coordLocation);
        ctx.vertexAttribPointer(space._coordLocation, 3, ctx.FLOAT, false, (3 + 3) * 4, 3 * 4);

        ctx.bindBuffer(ctx.ELEMENT_ARRAY_BUFFER, this._ibo);
        ctx.drawElements(ctx.TRIANGLES, 36, ctx.UNSIGNED_SHORT, 0);
    }

    // 行列の更新
    _updateMatrix()
    {
        this.mvpMatrix = new Mat4.Mat4();

        this.mvpMatrix.setPerspective(
            this.perspective.left,
            this.perspective.right,
            this.perspective.bottom,
            this.perspective.top,
            this.perspective.far,
            this.perspective.near,
            this.perspective.ratio,
        );

        this.mvpMatrix.translate(this.left, this.down, this.near);
        this.mvpMatrix.rotateX(this.radian.x);
        this.mvpMatrix.rotateY(this.radian.y);
        this.mvpMatrix.rotateZ(this.radian.z);
        this.mvpMatrix.scale(this.width, this.height, this.depth);
    }
        
    // 透視投影行列の初期化
    setScreenPerspective()
    {
        const ctx = this._ctx;

        let w, h;
        if(ctx.canvas.height > ctx.canvas.width)
        {
            w = 1;
            h = ctx.canvas.height / ctx.canvas.width;
        }
        else
        {
            w = ctx.canvas.width / ctx.canvas.height;
            h = 1;
        }
        this.perspective.left = -w;
        this.perspective.right = w;
        this.perspective.bottom = -h;
        this.perspective.top = h;
        this._updateMatrix();
    }

    // 移動
    translate(left, down, near)
    {
        this.left = left;
        this.down = down;
        this.near = near;
        this._updateMatrix();
    }
    // 回転X
    rotateX(radianX)
    {
        this.radian.x = radianX;
        this._updateMatrix();
    }
    // 回転Y
    rotateY(radianY)
    {
        this.radian.y = radianY;
        this._updateMatrix();
    }
    // 回転Z
    rotateZ(radianZ)
    {
        this.radian.z = radianZ;
        this._updateMatrix();
    }
    // 拡縮
    scale(width, height, depth)
    {
        this.width = width;
        this.height = height;
        this.depth = depth;
        this._updateMatrix();
    }
};

// 画像
const Graphic = class
{
    // 初期化
    constructor(space)
    {
        const ctx = space._ctx;
        this._ctx = ctx;

        this._texture = ctx.createTexture();
        ctx.activeTexture(ctx.TEXTURE0 + 1);
        ctx.bindTexture(ctx.TEXTURE_3D, this._texture);
        ctx.texParameteri(ctx.TEXTURE_3D, ctx.TEXTURE_MAG_FILTER, ctx.NEAREST);
        ctx.texParameteri(ctx.TEXTURE_3D, ctx.TEXTURE_MIN_FILTER, ctx.NEAREST);
        ctx.bindTexture(ctx.TEXTURE_3D, null);
    }

    // データテクスチャ
    setData(width, height, depth, data)
    {
        const ctx = this._ctx;

        const texture = this._texture;
        ctx.bindTexture(ctx.TEXTURE_3D, texture);

        const level = 0;
        const internalFormat = ctx.RGBA8;
        const border = 0;
        const format = ctx.RGBA;
        const type = ctx.UNSIGNED_BYTE;
        const data8 = new Uint8Array(data);

        ctx.texImage3D(ctx.TEXTURE_3D, level, internalFormat, width, height, depth, border, format, type, data8);
        ctx.generateMipmap(ctx.TEXTURE_3D);
        ctx.bindTexture(ctx.TEXTURE_3D, null);
    }
};

// 別ファイルにクラスを公開
export
{
    Space,
    Sprite,
    Graphic,
};
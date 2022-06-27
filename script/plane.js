// 簡易Pixelartゲームフレームワーク
// ------------------------------

import * as Mat4 from './mat4.js';

// 画面
const Plane = class
{
    constructor(screen)
    {
        this._screen = screen;
        const gl = screen._gl;
        this._gl = gl;

        // 頂点シェーダー
        const vertexShaderString =
        `#version 300 es
            layout (location = 0) in vec3 position;
            layout (location = 1) in vec2 coord2d;
            centroid out vec2 varCoord2d;
            uniform mat4 mvpMatrix;
            
            void main(void)
            {
                varCoord2d = coord2d;
                gl_Position = mvpMatrix * vec4(position, 1.0);
            }
        `;
        // フラグメントシェーダー
        const fragmentShaderString =
        `#version 300 es
            precision mediump float;
            
            uniform sampler2D graphic;
            centroid in vec2 varCoord2d;
            out vec4 outColor;
            
            void main(void)
            {
                outColor = texture(graphic, varCoord2d);
            }
        `;

        // 頂点シェーダーをコンパイル
        const vertexShader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vertexShader, vertexShaderString);
        gl.compileShader(vertexShader);
        if(gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS))
            this._vertexShader = vertexShader;
        else
            console.error(gl.getShaderInfoLog(vertexShader));
        
        // フラグメントシェーダーをコンパイル
        const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fragmentShader, fragmentShaderString);
        gl.compileShader(fragmentShader);
        if(gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS))
            this._fragmentShader = fragmentShader;
        else
            console.error(gl.getShaderInfoLog(fragmentShader));
        
        // シェーダープログラム
        const program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        if(gl.getProgramParameter(program, gl.LINK_STATUS))
        {
            gl.useProgram(program);
            this._program = program;
        }
        else
            console.error(gl.getProgramInfoLog(program));

        // ロケーションを取得
        this._textureLocation = gl.getUniformLocation(this._program, 'graphic');
        this._mvpMatrixLocation = gl.getUniformLocation(this._program, 'mvpMatrix');
        this._positionLocation = gl.getAttribLocation(this._program, 'position');
        this._coordLocation = gl.getAttribLocation(this._program, 'coord2d');
        
    }
};



// スプライト
const Sprite = class
{
    constructor(plane)
    {
        this._plane = plane;
        this._screen = plane._screen;
        const gl = plane._gl;
        this._gl = gl;
        this.graphic = null;

        // 位置
        this.positionArray = 
        [
            -1.0, -1.0,  0.0,
            -1.0,  1.0,  0.0,
             1.0, -1.0,  0.0, 
             1.0,  1.0,  0.0,
        ];

        this.coordArray =
        [
            0, 1,
            0, 0,
            1, 1,
            1, 0,
        ];


        // 頂点配列作成
        this.vertexArray = [];
        for(let i = 0; i < 4; i++)
        {
            this.vertexArray.push(this.positionArray[i * 3 + 0]);
            this.vertexArray.push(this.positionArray[i * 3 + 1]);
            this.vertexArray.push(this.positionArray[i * 3 + 2]);
            this.vertexArray.push(this.coordArray[i * 2 + 0]);
            this.vertexArray.push(this.coordArray[i * 2 + 1]);    
        }

        // 頂点バッファーを生成する
        const vbo = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertexArray), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        this._vbo = vbo;

        // インデクス
        const indexArray =
        [
            0, 1, 2,
            3, 2, 1,
        ];

        // インデクスバッファーを生成する
        const ibo = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Int16Array(indexArray), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
        this._ibo = ibo;

        // 位置などの初期値
        this.left = 0;
        this.down = 0;
        this.near = 5;
        this.width = 1;
        this.height = 1;
        this.radian = 
        {
            x: 0,
            y: 0,
            z: 0,
        };
        this.perspective = 
        {
            near : 1.0,
            far : 9.0,
            ratio : 1.0,
            size : 1.0,
        };
        this.setScreenPerspective();
        this._updateMatrix();
        this.setScreenPerspectiveBind = this.setScreenPerspective.bind(this);
    }

    // スプライト描画
    draw()
    {
        const screen = this._screen;
        const plane = this._plane;
        const gl = this._gl;

        if(this.graphic != null)
        {
            gl.activeTexture(gl.TEXTURE0 + 0);
            gl.bindTexture(gl.TEXTURE_2D, this.graphic._texture);
            gl.uniform1i(plane.textureLocation, 0);
        }
        else return;

        if(gl.getProgramParameter(plane._program, gl.LINK_STATUS)) gl.useProgram(plane._program);

		gl.uniformMatrix4fv(plane._mvpMatrixLocation, false, this.mvpMatrix);

        gl.bindBuffer(gl.ARRAY_BUFFER, this._vbo);
        
        gl.enableVertexAttribArray(plane._positionLocation);
        gl.vertexAttribPointer(plane._positionLocation, 3, gl.FLOAT, false, (3 + 2) * 4, 0);

        gl.enableVertexAttribArray(plane._coordLocation);
        gl.vertexAttribPointer(plane._coordLocation, 2, gl.FLOAT, false, (3 + 2) * 4, 3 * 4);
        
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._ibo);

		gl.bindFramebuffer(gl.FRAMEBUFFER, screen._frameBuffer);
        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
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
        this.mvpMatrix.scale(this.width, this.height, 1);
    }

    // 平行投影行列の初期化
    setScreenPerspective()
    {
        const gl = this._gl;
        let w, h;
        if(gl.canvas.height > gl.canvas.width)
        {
            w = 1;
            h = gl.canvas.height / gl.canvas.width;
        }
        else
        {
            w = gl.canvas.width / gl.canvas.height;
            h = 1;
        }
        w *= this.perspective.size;
        h *= this.perspective.size;

        this.perspective.left = -w;
        this.perspective.right = w;
        this.perspective.bottom = -h;
        this.perspective.top = h;
        this._updateMatrix();
    }

    // 自動リサイズ登録
    registerAutoResize()
    {
        window.addEventListener('resize', this.setScreenPerspectiveBind);
    }

    // 自動リサイズ解除
    releaseAutoResize()
    {
        window.removeEventListener('resize', this.setScreenPerspectiveBind);
    }

    // 画面サイズ指定
    setSize(size)
    {
        this.perspective.size = size;
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
    scale(width, height)
    {
        this.width = width;
        this.height = height;
        this._updateMatrix();
    }
};

// 画像
const Graphic = class
{
    // 初期化
    constructor(plane)
    {
        const gl = plane._gl;
        this._gl = gl;

        this._texture = gl.createTexture();
        gl.activeTexture(gl.TEXTURE0 + 0);
        gl.bindTexture(gl.TEXTURE_2D, this._texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.bindTexture(gl.TEXTURE_2D, null);
    }

    // ソーステクスチャ
    /*
    setSource(source)
    {
        const gl = this._gl;

        this._image = new Image();
        //this._location = gl.getUniformLocation(pix._program, 'texture');
        const loadTexture = function()
        {
            gl.bindTexture(gl.TEXTURE_2D, this._texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this._image);
            gl.generateMipmap(gl.TEXTURE_2D);
            gl.bindTexture(gl.TEXTURE_2D, null);
        };
        this._image.addEventListener('load',
            loadTexture.bind(this));
        this._image.src = source;
    }
    */

    // データテクスチャ
    setData(width, height, pixel)
    {
        const gl = this._gl;

        const texture = this._texture;
        gl.bindTexture(gl.TEXTURE_2D, texture);

        const level = 0;
        const internalFormat = gl.RGBA8;
        const border = 0;
        const format = gl.RGBA;
        const type = gl.UNSIGNED_BYTE;
        const p8 = new Uint8Array(pixel);

        gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, width, height, border, format, type, p8);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.bindTexture(gl.TEXTURE_2D, null);
    }
};

// 別ファイルにクラスを公開
export
{
    Plane,
    Sprite,
    Graphic,
};
// 簡易Voxelartゲームフレームワーク
// ------------------------------

import * as Mat4 from './mat4.js';

// 画面
const Space = class
{
    constructor(screen)
    {
        const gl = screen._gl;
        this._gl = gl;
        this._screen = screen;

        // 頂点シェーダー
        const vertexShaderString =
        `#version 300 es
            layout (location = 0) in vec3 position;
            
            uniform mat4 modelMatrix;
            uniform mat4 projectionMatrix;
            uniform float perspectiveRatio;

            centroid out vec3 varRay;
            centroid out vec3 varPosition;
            
            void main(void)
            {
                mat4 mvpMatrix = projectionMatrix * modelMatrix;
                if(perspectiveRatio > 1.0)
                   varRay = position - ((inverse(modelMatrix) * vec4(0.0, 0.0, 0.0, 1.0))).xyz;
                else
                   varRay = vec3(0.0, 0.0, 0.0) - ((inverse(modelMatrix) * vec4(0.0, 0.0, 0.0, 1.0))).xyz;
                varPosition = position;
                gl_Position = mvpMatrix * vec4(position, 1.0);
            }
        `;
        // フラグメントシェーダー
        const fragmentShaderString =
        `#version 300 es
            precision mediump sampler3D;
            precision mediump float;

            uniform sampler3D graphic;

            centroid in vec3 varRay;
            centroid in vec3 varPosition;

            out vec4 outColor;
            
            void main(void)
            {
                vec3 ray = normalize(varRay);
                vec3 textureSizeVec3 = vec3(textureSize(graphic, 0)); // テクスチャのサイズ

                vec3 scanStep; // 走査の方向
                scanStep.x = sign(ray.x);
                scanStep.y = -sign(ray.y);
                scanStep.z = sign(ray.z);
                vec3 rayAbs = abs(ray); // レイ各要素の絶対値
                float rayLen = sqrt(rayAbs.x*rayAbs.x + rayAbs.y*rayAbs.y + rayAbs.z*rayAbs.z); // レイの長さ

                vec3 texturePosition; // テクセルに対応した位置
                texturePosition.x = (varPosition.x + 1.0) / 2.0 * textureSizeVec3.x;
                texturePosition.y = (-varPosition.y + 1.0) / 2.0 * textureSizeVec3.y;
                texturePosition.z = (varPosition.z + 1.0) / 2.0 * textureSizeVec3.z;
                vec3 currentBlock = floor(texturePosition); // 現在の走査ブロック
                if(scanStep.x < 0.0 && texturePosition.x >= textureSizeVec3.x) currentBlock.x--;
                if(scanStep.y < 0.0 && texturePosition.y >= textureSizeVec3.y) currentBlock.y--;
                if(scanStep.z < 0.0 && texturePosition.z >= textureSizeVec3.z) currentBlock.z--;

                vec3 tDelta; // ブロックの走査のため比較する変数の増分
                if(rayAbs.x > 0.0) tDelta.x = rayLen / rayAbs.x; else tDelta.x = 0.0;
                if(rayAbs.y > 0.0) tDelta.y = rayLen / rayAbs.y; else tDelta.y = 0.0;
                if(rayAbs.z > 0.0) tDelta.z = rayLen / rayAbs.z; else tDelta.z = 0.0;

                vec3 tMax = (currentBlock - texturePosition) * scanStep * tDelta; // ブロックの走査のため比較する変数の総和
                if(scanStep.x >= 0.0) tMax.x += tDelta.x;
                if(scanStep.y >= 0.0) tMax.y += tDelta.y;
                if(scanStep.z >= 0.0) tMax.z += tDelta.z;
                if(rayAbs.x == 0.0) tMax.x = 1000000000.0;
                if(rayAbs.y == 0.0) tMax.y = 1000000000.0;
                if(rayAbs.z == 0.0) tMax.z = 1000000000.0;

                // 走査ループ
                vec4 rezultColor = vec4(0.8, 0.8, 0.8, 1.0);
                for(int s = 0; s < 256; s++)
                {
                    vec3 currentUVW;
                    currentUVW = currentBlock / textureSizeVec3;

                    // 領域の外に出たら終わる
                    if
                    (
                        currentUVW.x <  0.0 && scanStep.x < 0.0 ||
                        currentUVW.x >= 1.0 && scanStep.x > 0.0  || 
                        currentUVW.y <  0.0 && scanStep.y < 0.0  || 
                        currentUVW.y >= 1.0 && scanStep.y > 0.0  || 
                        currentUVW.z <  0.0 && scanStep.z < 0.0  || 
                        currentUVW.z >= 1.0 && scanStep.z > 0.0 
                    )
                        break;

                    // 色が見つかったら終わる
                    vec4 color = texture(graphic, currentUVW);
                    if(color.a >= 0.2){
                        rezultColor = color;
                        //rezultColor = vec4(0.0, 0.0, 0.0, 1.0);
                        break;
                    }

                    if(tMax.x < tMax.y)
                    {
                        if(tMax.x < tMax.z)
                        {
                            tMax.x += tDelta.x;
                            currentBlock.x += scanStep.x;
                        }
                        else // tMax.z <= tMax.x
                        {
                            tMax.z += tDelta.z;
                            currentBlock.z += scanStep.z;
                        }
                    }
                    else // tMax.y <= tMax.x
                    {
                        if(tMax.y < tMax.z)
                        {
                            tMax.y += tDelta.y;
                            currentBlock.y += scanStep.y;
                        }
                        else // tMax.z <= tMax.y
                        {
                            tMax.z += tDelta.z;
                            currentBlock.z += scanStep.z;
                        }
                    }
                }

                outColor = rezultColor;
                //outColor = varC;
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
        this._modelMatrixLocation = gl.getUniformLocation(this._program, 'modelMatrix');
        this._projectionMatrixLocation = gl.getUniformLocation(this._program, 'projectionMatrix');
        this._perspectiveRatioLocation = gl.getUniformLocation(this._program, 'perspectiveRatio');
        this._positionLocation = gl.getAttribLocation(this._program, 'position');
    }
};



// スプライト
const Sprite = class
{
    constructor(space)
    {
        this._space = space;
        this._screen = space._screen;
        const gl = space._gl;
        this._gl = gl;
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

        // 頂点配列作成
        this.vertexArray = [];
        for(let i = 0; i < 6 * 4; i++)
        {
            this.vertexArray.push(this.positionArray[i * 3 + 0]);
            this.vertexArray.push(this.positionArray[i * 3 + 1]);
            this.vertexArray.push(this.positionArray[i * 3 + 2]);
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
        const ibo = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Int16Array(indexArray), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
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
            near : 1.0,
            far : 9.0,
            ratio : 4.0,
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
        const space = this._space;
        const gl = this._gl;

        if(this.graphic != null)
        {
            gl.activeTexture(gl.TEXTURE0 + 0);
            gl.bindTexture(gl.TEXTURE_3D, this.graphic._texture);
            gl.uniform1i(space.textureLocation, 0);
        }
        else return;
        
        if(gl.getProgramParameter(space._program, gl.LINK_STATUS)) gl.useProgram(space._program);

		gl.uniformMatrix4fv(space._modelMatrixLocation, false, this.modelMatrix);
		gl.uniformMatrix4fv(space._projectionMatrixLocation, false, this.projectionMatrix);
		gl.uniform1f(space._perspectiveRatioLocation, this.perspective.ratio);

        gl.bindBuffer(gl.ARRAY_BUFFER, this._vbo);
        
        gl.enableVertexAttribArray(space._positionLocation);
        gl.vertexAttribPointer(space._positionLocation, 3, gl.FLOAT, false, (3) * 4, 0);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._ibo);

		gl.bindFramebuffer(gl.FRAMEBUFFER, screen._frameBuffer);
        gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0);
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    // 行列の更新
    _updateMatrix()
    {
        this.projectionMatrix = new Mat4.Mat4();
        this.modelMatrix = new Mat4.Mat4();

        this.projectionMatrix.setPerspective(
            this.perspective.left,
            this.perspective.right,
            this.perspective.bottom,
            this.perspective.top,
            this.perspective.far,
            this.perspective.near,
            this.perspective.ratio,
        );

        this.modelMatrix.translate(this.left, this.down, this.near);
        this.modelMatrix.rotateX(this.radian.x);
        this.modelMatrix.rotateY(this.radian.y);
        this.modelMatrix.rotateZ(this.radian.z);
        this.modelMatrix.scale(this.width, this.height, this.depth);
    }
        
    // 透視投影行列の初期化
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
        const gl = space._gl;
        this._gl = gl;

        this._texture = gl.createTexture();
        gl.activeTexture(gl.TEXTURE0 + 1);
        gl.bindTexture(gl.TEXTURE_3D, this._texture);
        gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.bindTexture(gl.TEXTURE_3D, null);
    }

    // データテクスチャ
    setData(width, height, depth, data)
    {
        const gl = this._gl;

        const texture = this._texture;
        gl.bindTexture(gl.TEXTURE_3D, texture);

        const level = 0;
        const internalFormat = gl.RGBA8;
        const border = 0;
        const format = gl.RGBA;
        const type = gl.UNSIGNED_BYTE;
        const data8 = new Uint8Array(data);

        gl.texImage3D(gl.TEXTURE_3D, level, internalFormat, width, height, depth, border, format, type, data8);
        gl.generateMipmap(gl.TEXTURE_3D);
        gl.bindTexture(gl.TEXTURE_3D, null);
    }
};

// 別ファイルにクラスを公開
export
{
    Space,
    Sprite,
    Graphic,
};
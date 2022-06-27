// 簡易WebGL2フレームワーク
// ----------------------

const Screen = class
{
    constructor(canvas)
    {
        this._canvas = canvas;
        const gl = canvas.getContext("webgl2");
        this._gl = gl;

        if (gl == null)
        {
            console.error(
                'WebGL2 を初期化できません。' +
                'ブラウザまたはマシンがサポートしていないか、' +
                '無効になっています。'
            );
            return;
        }

        // 頂点シェーダー
        const vertexShaderString =
        `#version 300 es
            layout (location = 0) in vec3 position;
            layout (location = 1) in vec2 coord;
            
            out vec2 varCoord;
            
            void main(void)
            {
                varCoord = coord;
                gl_Position = vec4(position, 1.0);
            }
        `;
        // フラグメントシェーダー
        const fragmentShaderString =
        `#version 300 es
            precision mediump sampler2D;
            precision mediump float;
            
            uniform sampler2D sampler;
            in vec2 varCoord;
            out vec4 outColor;
            
            void main(void)
            {
                outColor = texture(sampler, varCoord);
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
            0, 0,
            0, 1,
            1, 0,
            1, 1,
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

        // ロケーションを取得
        this._textureLocation = gl.getUniformLocation(this._program, 'sampler');
        this._positionLocation = gl.getAttribLocation(this._program, 'position');
        this._coordLocation = gl.getAttribLocation(this._program, 'coord');
        
        this._resize();

        // 画面を消す
        gl.clearColor(0.0, 0.0, 0.0, 0.0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        // ブレンド
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.enable(gl.BLEND);

        // カリング
        gl.frontFace(gl.CW);
        gl.enable(gl.CULL_FACE);

        // 深度
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);

        // タッチ入力
        this.pointerX = -256;
        this.pointerY = -256;
        this.pointerDown = false;
        document.addEventListener('pointerdown', this._pointerdown.bind(this));
        document.addEventListener('pointerup', this._pointerup.bind(this));
        document.addEventListener('pointermove', this._pointermove.bind(this));

        // リサイズ
        window.addEventListener('resize', this._resize.bind(this));

        // スクロール禁止
        document.addEventListener('touchmove', this._noScroll, { passive: false });
        document.addEventListener('mousewheel', this._noScroll, { passive: false });
    }


    // 画面描画
    flush()
    {
        const gl = this._gl;

        if(this._frameTexture != null)
        {
            gl.activeTexture(gl.TEXTURE0 + 0);
            gl.bindTexture(gl.TEXTURE_2D, this._frameTexture);
            gl.uniform1i(this.textureLocation, 0);
        }
        else return;

        if(gl.getProgramParameter(this._program, gl.LINK_STATUS)) gl.useProgram(this._program);

        gl.bindBuffer(gl.ARRAY_BUFFER, this._vbo);
        
        gl.enableVertexAttribArray(this._positionLocation);
        gl.vertexAttribPointer(this._positionLocation, 3, gl.FLOAT, false, (3 + 2) * 4, 0);

        gl.enableVertexAttribArray(this._coordLocation);
        gl.vertexAttribPointer(this._coordLocation, 2, gl.FLOAT, false, (3 + 2) * 4, 3 * 4);
        
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._ibo);

        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);

        gl.flush();
    }

    // 画面クリア
    clearCanvas(r, g, b, a)
    {
        const gl = this._gl;
        gl.clearColor(r, g, b, a);
		gl.clearDepth(1.0);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    }

    // 画面クリア
    clearFrame(r, g, b, a)
    {
        const gl = this._gl;
		gl.bindFramebuffer(gl.FRAMEBUFFER, this._frameBuffer);
        gl.clearColor(r, g, b, a);
		gl.clearDepth(1.0);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    // アニメーション
    animate(callback)
    {
        this._gl.flush();
        requestAnimationFrame(callback);
    }

    // ポインターが押された
    _pointerdown(e)
    {
        this.pointerDown = true;
    }

    // ポインターが離された
    _pointerup(e)
    {
        this.pointerDown = false;
    }

    // ポインターが動かされた
    _pointermove(e)
    {
        if(this.clientWidth > this.clientHeight)
        {
            this.pointerX = (e.clientX / this.clientWidth * 2 - 1) * (this.clientWidth / this.clientHeight);;
            this.pointerY = e.clientY / this.clientHeight * 2 - 1;
        }
        else
        {
            this.pointerX = e.clientX / this.clientWidth * 2 - 1;
            this.pointerY = (e.clientY / this.clientHeight * 2 - 1) * (this.clientHeight / this.clientWidth);
        }
    }

    // 画面幅が変えられた
    _resize()
    {
        const gl = this._gl;
        canvas = this._canvas;
        
        this.ratio = window.devicePixelRatio || 1;
        this.clientWidth = window.innerWidth;
        this.clientHeight = window.innerHeight;
        this.physicalWidth = this.clientWidth * this.ratio;
        this.physicalHeight = this.clientHeight * this.ratio;
        const width = this.physicalWidth;
        const height = this.physicalHeight;
        canvas.width = width;
        canvas.height = height;
        canvas.style.width = this.clientWidth + 'px';
        canvas.style.height = this.clientHeight + 'px';
        gl.viewport(0, 0, width, height);

        // 深度バッファ用レンダーバッファ
        this._depthRenderBuffer = gl.createRenderbuffer();
        gl.bindRenderbuffer(gl.RENDERBUFFER, this._depthRenderBuffer);
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);

        // フレームテクスチャ
        this._frameTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this._frameTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

        // フレームバッファ
        this._frameBuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, this._frameBuffer);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this._depthRenderBuffer);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this._frameTexture, 0);

        // それぞれのバインドを解除
        gl.bindTexture(gl.TEXTURE_2D, null);
        gl.bindRenderbuffer(gl.RENDERBUFFER, null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    }

    // スクロールを禁止
    _noScroll(e) {
        e.preventDefault();
    }
};

// 別ファイルにクラスを公開
export
{
    Screen,
};
// 簡易WebGL2フレームワーク
// ----------------------

const Screen = class
{
    constructor()
    {
        const canvas = document.createElement('canvas');
        this._canvas = canvas;
        const ctx = canvas.getContext("webgl2");
        this._ctx = ctx;

        this.ratio = 1; //window.devicePixelRatio || 1;
        this.clientWidth = window.innerWidth;
        this.clientHeight = window.innerHeight;
        this.physicalWidth = this.clientWidth * this.ratio;
        this.physicalHeight = this.clientHeight * this.ratio;
        canvas.width = this.physicalWidth;
        canvas.height = this.physicalHeight;
        canvas.style.width = this.clientWidth + 'px';
        canvas.style.height = this.clientHeight + 'px';
        ctx.viewport(0, 0, this.physicalWidth, this.physicalHeight);
        document.body.appendChild(canvas);

        if (ctx == null)
        {
            console.error(
                'WebGL2 を初期化できません。' +
                'ブラウザまたはマシンがサポートしていないか、' +
                '無効になっています。'
            );
            return;
        }

        // 画面を消す
        ctx.clearColor(0.0, 0.0, 0.0, 0.0);
        ctx.clear(ctx.COLOR_BUFFER_BIT);
        
        // ブレンド//////////////
        ctx.blendFunc(ctx.SRC_ALPHA, ctx.ONE_MINUS_SRC_ALPHA);
        ctx.enable(ctx.BLEND);

        // カリング
        ctx.frontFace(ctx.CW);
        ctx.enable(ctx.CULL_FACE);

        // 深度
        ctx.enable(ctx.DEPTH_TEST);
        ctx.depthFunc(ctx.LEQUAL);

        // タッチ入力
        this.pointerX = -256;
        this.pointerY = -256;
        this.pointerDown = false;
        document.addEventListener('pointerdown', this._pointerdown.bind(this));
        document.addEventListener('pointerup', this._pointerup.bind(this));
        document.addEventListener('pointermove', this._pointermove.bind(this));

        // 画面
        window.addEventListener('resize', this._resize.bind(this));
        this._resize();

        // スクロール禁止
        document.addEventListener('touchmove', this._noScroll, { passive: false });
        document.addEventListener('mousewheel', this._noScroll, { passive: false });
    }


    // 画面クリア
    clear(r, g, b, a)
    {
        const ctx = this._ctx;
        ctx.clearColor(r, g, b, a);
        ctx.clear(ctx.COLOR_BUFFER_BIT);
    }

    // アニメーション
    animate(callback)
    {
        this._ctx.flush();
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
        const ctx = this._ctx;
        this.clientWidth = window.innerWidth;
        this.clientHeight = window.innerHeight;
        this.physicalWidth = this.clientWidth * this.ratio;
        this.physicalHeight = this.clientHeight * this.ratio;
        this._canvas.width = this.physicalWidth;
        this._canvas.height = this.physicalHeight;
        this._canvas.style.width = this.clientWidth + 'px';
        this._canvas.style.height = this.clientHeight + 'px';
        ctx.viewport(0, 0, this.physicalWidth, this.physicalHeight);
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
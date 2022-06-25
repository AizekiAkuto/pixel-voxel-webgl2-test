// 簡易行列フレームワーク
// --------------------

// 行列4*4
const Mat4 = class extends Float32Array
{
    // 初期化
    constructor()
    {
        super(16);

        this[ 0] = 1;
        this[ 1] = 0;
        this[ 2] = 0;
        this[ 3] = 0;

        this[ 4] = 0;
        this[ 5] = 1;
        this[ 6] = 0;
        this[ 7] = 0;
        
        this[ 8] = 0;
        this[ 9] = 0;
        this[10] = 1;
        this[11] = 0;
        
        this[12] = 0;
        this[13] = 0;
        this[14] = 0;
        this[15] = 1;
    }

    // 移動
    translate (left, down, near)
    {
        let m = new Float32Array(16);

        m[ 0] = 1;
        m[ 1] = 0;
        m[ 2] = 0;
        m[ 3] = 0;

        m[ 4] = 0;
        m[ 5] = 1;
        m[ 6] = 0;
        m[ 7] = 0;

        m[ 8] = 0;
        m[ 9] = 0;
        m[10] = 1;
        m[11] = 0;

        m[12] = left;
        m[13] = down;
        m[14] = near;
        m[15] = 1;

        this.multiply(m);
    }

    // 拡縮
    scale (width, height, depth)
    {
        let m = new Float32Array(16);

        m[ 0] = width;
        m[ 1] = 0;
        m[ 2] = 0;
        m[ 3] = 0;

        m[ 4] = 0;
        m[ 5] = height;
        m[ 6] = 0;
        m[ 7] = 0;

        m[ 8] = 0;
        m[ 9] = 0;
        m[10] = depth;
        m[11] = 0;

        m[12] = 0;
        m[13] = 0;
        m[14] = 0;
        m[15] = 1;

        this.multiply(m);
    }

    // X回転
    rotateX (rad)
    {
        let m = new Float32Array(16);
        
        m[ 0] = 1;
        m[ 1] = 0;
        m[ 2] = 0;
        m[ 3] = 0;

        m[ 4] = 0;
        m[ 5] = Math.cos(rad);
        m[ 6] = Math.sin(rad);
        m[ 7] = 0;

        m[ 8] = 0;
        m[ 9] = -Math.sin(rad);
        m[10] = Math.cos(rad);
        m[11] = 0;

        m[12] = 0;
        m[13] = 0;
        m[14] = 0;
        m[15] = 1;
        
        this.multiply(m);
    }

    // Y回転
    rotateY (rad)
    {
        let m = new Float32Array(16);
        
        m[ 0] = Math.cos(rad);
        m[ 1] = 0;
        m[ 2] = -Math.sin(rad);
        m[ 3] = 0;

        m[ 4] = 0;
        m[ 5] = 1;
        m[ 6] = 0;
        m[ 7] = 0;

        m[ 8] = Math.sin(rad);
        m[ 9] = 0;
        m[10] = Math.cos(rad);
        m[11] = 0;

        m[12] = 0;
        m[13] = 0;
        m[14] = 0;
        m[15] = 1;
        
        this.multiply(m);
    }

    // Z回転
    rotateZ (rad)
    {
        let m = new Float32Array(16);
        
        m[ 0] = Math.cos(rad);
        m[ 1] = Math.sin(rad);
        m[ 2] = 0;
        m[ 3] = 0;

        m[ 4] = -Math.sin(rad);
        m[ 5] = Math.cos(rad);
        m[ 6] = 0;
        m[ 7] = 0;

        m[ 8] = 0;
        m[ 9] = 0;
        m[10] = 1;
        m[11] = 0;

        m[12] = 0;
        m[13] = 0;
        m[14] = 0;
        m[15] = 1;
        
        this.multiply(m);
    }

    // 平行投影
    setParallel (left, right, bottom, top, far, near)
    {
        this[ 0] = 2 / (right - left);
        this[ 1] = 0;
        this[ 2] = 0;
        this[ 3] = 0;

        this[ 4] = 0;
        this[ 5] = 2 / (top - bottom);
        this[ 6] = 0;
        this[ 7] = 0;

        this[ 8] = 0;
        this[ 9] = 0;
        this[10] = 2 / (far - near);
        this[11] = 0;

        this[12] = -(right + left) / (right - left);
        this[13] = -(top + bottom) / (top - bottom);
        this[14] = -(far + near) / (far - near);
        this[15] = 1;
    }

    // 透視投影
    setPerspective (left, right, bottom, top, far, near, ratio)
    {
        if(ratio === 1.0)
        {
            this.setParallel(left, right, bottom, top, far, near);
            return;
        }

        this[ 0] = 2 * ratio / (right - left);
        this[ 1] = 0;
        this[ 2] = 0;
        this[ 3] = 0;

        this[ 4] = 0;
        this[ 5] = 2 * ratio / (top - bottom);
        this[ 6] = 0;
        this[ 7] = 0;

        this[ 8] = -(right + left) / (right - left);
        this[ 9] = -(top + bottom) / (top - bottom);
        this[10] = -(far + near) / (far - near);
        this[11] = 1;

        this[12] = 0;
        this[13] = 0;
        this[14] = -2 * far * near / (far - near)
        this[15] = 0;
    }

    // 乗算
    multiply (right)
    {
        let r = right;
        let l = new Float32Array(16);
        for(let i in this){ l[i] = this[i]; }
        
        this[ 0] = l[ 0] * r[ 0] + l[ 4] * r[ 1] + l[ 8] * r[ 2] + l[12] * r[ 3];
        this[ 1] = l[ 1] * r[ 0] + l[ 5] * r[ 1] + l[ 9] * r[ 2] + l[13] * r[ 3];
        this[ 2] = l[ 2] * r[ 0] + l[ 6] * r[ 1] + l[10] * r[ 2] + l[14] * r[ 3];
        this[ 3] = l[ 3] * r[ 0] + l[ 7] * r[ 1] + l[11] * r[ 2] + l[15] * r[ 3];

        this[ 4] = l[ 0] * r[ 4] + l[ 4] * r[ 5] + l[ 8] * r[ 6] + l[12] * r[ 7];
        this[ 5] = l[ 1] * r[ 4] + l[ 5] * r[ 5] + l[ 9] * r[ 6] + l[13] * r[ 7];
        this[ 6] = l[ 2] * r[ 4] + l[ 6] * r[ 5] + l[10] * r[ 6] + l[14] * r[ 7];
        this[ 7] = l[ 3] * r[ 4] + l[ 7] * r[ 5] + l[11] * r[ 6] + l[15] * r[ 7];

        this[ 8] = l[ 0] * r[ 8] + l[ 4] * r[ 9] + l[ 8] * r[10] + l[12] * r[11];
        this[ 9] = l[ 1] * r[ 8] + l[ 5] * r[ 9] + l[ 9] * r[10] + l[13] * r[11];
        this[10] = l[ 2] * r[ 8] + l[ 6] * r[ 9] + l[10] * r[10] + l[14] * r[11];
        this[11] = l[ 3] * r[ 8] + l[ 7] * r[ 9] + l[11] * r[10] + l[15] * r[11];

        this[12] = l[ 0] * r[12] + l[ 4] * r[13] + l[ 8] * r[14] + l[12] * r[15];
        this[13] = l[ 1] * r[12] + l[ 5] * r[13] + l[ 9] * r[14] + l[13] * r[15];
        this[14] = l[ 2] * r[12] + l[ 6] * r[13] + l[10] * r[14] + l[14] * r[15];
        this[15] = l[ 3] * r[12] + l[ 7] * r[13] + l[11] * r[14] + l[15] * r[15];
    }
};

// 別ファイルにクラスを公開
export
{
    Mat4,
};
# Перекраска салатовых 3D-картинок шаблона в любой цвет.
# Запуск: python3 tools/recolor.py "#FFC400" ПАПКА-КУДА blank/img/ИМЯ.webp
# Цвет — параметром (hex). Яркость и тени объекта сохраняются, тёмные части не трогаем.
import sys, os, numpy as np
from PIL import Image

def hex2rgb(h):
    h = h.lstrip("#"); return np.array([int(h[i:i+2], 16) for i in (0, 2, 4)], float) / 255

def recolor(src, dst, color):
    im = Image.open(src).convert("RGBA"); a = np.array(im).astype(float) / 255
    rgb = a[..., :3]; mx = rgb.max(-1); mn = rgb.min(-1)
    s = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1e-6), 0)
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    m = (g >= r * 0.9) & (g > b * 1.4) & (s > 0.25)        # салатовые пиксели
    w = np.clip((s - 0.25) / 0.25, 0, 1) * m               # мягкий переход по краям
    k = np.clip(mx / 0.9, 0, 1.15)[..., None]              # яркость исходного пикселя
    new = np.clip(color[None, None, :] * k, 0, 1)
    a[..., :3] = rgb * (1 - w[..., None]) + new * w[..., None]
    Image.fromarray((a * 255).round().astype("uint8"), "RGBA").save(dst, quality=90)

if __name__ == "__main__":
    color, out, files = hex2rgb(sys.argv[1]), sys.argv[2], sys.argv[3:]
    os.makedirs(out, exist_ok=True)
    for f in files:
        recolor(f, os.path.join(out, os.path.basename(f)), color)
        print("ok", f)

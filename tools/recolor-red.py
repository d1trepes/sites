# Перекраска салатовых 3D-картинок шаблона в ярко-красный. Запуск: python3 tools/recolor-red.py ПАПКА-КУДА template/img/*.webp
import sys,os,colorsys,numpy as np
from PIL import Image
# салатовые пиксели -> чистый ярко-красный, яркость сохраняем
def recolor(p,o):
  im=Image.open(p).convert('RGBA'); a=np.array(im).astype(float)/255
  rgb=a[...,:3]; mx=rgb.max(-1); mn=rgb.min(-1); s=np.where(mx>0,(mx-mn)/np.maximum(mx,1e-6),0)
  r,g,b=rgb[...,0],rgb[...,1],rgb[...,2]
  m=(g>=r*0.85)&(g>b*1.3)&(s>0.12)&(mx>0.2)  # жёлто-зелёные, включая бледные тонкие линии
  w=np.clip((s-0.12)/0.2,0,1)*m             # мягкий переход
  v=mx
  red=np.dstack([np.clip(v*1.15,0,1), v*0.06, v*0.04])  # #ff1010-подобный
  out=rgb*(1-w[...,None])+red*w[...,None]
  a[...,:3]=out; Image.fromarray((a*255).astype('uint8'),'RGBA').save(o)
for f in sys.argv[2:]: recolor(f, os.path.join(sys.argv[1],os.path.basename(f)))

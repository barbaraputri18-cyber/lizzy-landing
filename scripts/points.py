"""Himalayan colour points for Lizzy: soft grey-taupe on face mask, ears, paws, tail.
Reads pristine cutouts from raw/base/, writes public/img/cat-<pose>.webp (day) and cat-<pose>-n.webp (night cream).
Regions are hand-placed ellipses (x, y, rx, ry, strength) in cutout pixel coords."""
import numpy as np
from PIL import Image
R={
 'sit': [(72,86,28,20,.8),(70,72,40,24,.35),(45,27,15,21,.9),(116,36,15,17,.9),(32,268,15,11,.7),(58,272,15,10,.7),(82,272,13,9,.65),(165,282,48,18,.85),(205,262,14,30,.8)],
 'peek':[(96,106,20,17,.8),(118,90,28,18,.4),(100,26,11,21,.9),(166,38,15,23,.9),(122,290,18,15,.6),(222,300,26,26,.85),(205,320,30,10,.7)],
 'push':[(246,74,22,20,.8),(234,60,30,22,.35),(205,30,13,19,.9),(240,12,10,11,.85),(308,96,17,15,.75),(300,132,15,14,.75),(115,290,19,11,.65),(188,276,17,10,.65),(52,262,48,40,.85),(30,290,30,16,.85)],
 'jump':[(102,98,30,24,.7),(100,72,44,24,.3),(76,16,13,19,.9),(150,26,13,19,.9),(26,112,19,19,.7),(100,168,23,15,.6),(122,250,14,11,.65),(180,262,14,11,.65),(218,78,34,40,.85),(232,130,18,26,.8)],
 'lie': [(136,82,30,22,.8),(136,68,44,26,.3),(110,26,15,23,.9),(182,38,15,23,.9),(24,176,21,14,.7),(70,196,23,12,.7),(262,186,50,26,.85),(300,160,16,30,.7)],
}
TAUPE=np.array([112,98,90.])
def shade(p):
  im=np.asarray(Image.open(f'raw/base/cat-{p}.webp').convert('RGBA')).astype(float);H,W=im.shape[:2]
  rgb=im[...,:3];yy,xx=np.mgrid[0:H,0:W];m=np.zeros((H,W))
  for x,y,rx,ry,s in R[p]:
    d=((xx-x)/rx)**2+((yy-y)/ry)**2;m=np.maximum(m,s*np.exp(-d*d*.9))
  r,g,b=rgb[...,0],rgb[...,1],rgb[...,2]
  eye=(b>r+12)&(b>g)          # keep ice-blue eyes untouched
  pink=(r>g+25)&(r>b+25)&(r>150)  # keep nose/tongue/paw-pad pink lighter
  m=np.where(eye,0,np.where(pink,m*.35,m))
  L=rgb.mean(2,keepdims=True)/255
  tint=TAUPE*(0.45+0.55*L)    # multiply-ish: keeps line detail
  out=rgb*(1-m[...,None])+tint*m[...,None]
  # nudge eyes a touch more ice-blue
  out[eye]=out[eye]*.8+np.array([150,190,225.])*.2
  day=np.dstack([np.clip(out,0,255),im[...,3]]).astype('uint8')
  Image.fromarray(day,'RGBA').save(f'public/img/cat-{p}.webp','WEBP',quality=90,method=6,exact=True)
  # night: same cream recolour as before (lines -> warm tan, fur -> ivory), then the point shading on top
  L0=rgb.mean(2,keepdims=True);t=np.clip((L0-60)/170,0,1)
  n=np.array([196,164,120.])*(1-t)+np.array([248,240,226.])*t
  n=n*.85+(rgb*(t>0.3)+n*(t<=0.3))*.15
  NT=np.array([128,116,108.])*(0.55+0.45*t)
  mn=np.clip(m[...,None]*1.1,0,.92)
  n=n*(1-mn)+NT*mn
  n[eye]=out[eye]*.7+np.array([170,205,235.])*.3
  Image.fromarray(np.dstack([np.clip(n,0,255),im[...,3]]).astype('uint8'),'RGBA').save(f'public/img/cat-{p}-n.webp','WEBP',quality=90,method=6,exact=True)
for p in R: shade(p)
print('ok')

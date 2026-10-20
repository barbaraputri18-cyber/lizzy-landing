"""Asset pipeline. Sources in raw/: sheet-day.jpg, sheet-night.jpg (same 5 poses, aligned), cups.jpg, logo-original.jpg.
rembg (isnet) masks -> poses separated by connected components of the night sheet (nearest-label for overlaps)
-> soft edges + fringe decontamination -> public/img/*.webp."""
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage
from rembg import remove, new_session
S=new_session('isnet-general-use');O='public/img/'
def mask(im): return np.asarray(remove(im,session=S,only_mask=True,post_process_mask=False)).astype(float)/255
def labels(m,n):
  lab,k=ndimage.label(ndimage.binary_dilation(m>.25,iterations=2));sz=ndimage.sum(m>.25,lab,range(1,k+1))
  keep=sorted(np.argsort(sz)[::-1][:n]+1,key=lambda l:np.where(lab==l)[1].mean())
  L=np.zeros_like(lab)
  for i,l in enumerate(keep): L[lab==l]=i+1
  _,(iy,ix)=ndimage.distance_transform_edt(L==0,return_indices=True);return L[iy,ix]
def save(im,a,nm,bgc,maxw=640):
  a=Image.fromarray((np.clip(a,0,1)*255).astype('uint8')).filter(ImageFilter.GaussianBlur(.7))
  rgb=np.asarray(im).astype(float);al=np.asarray(a).astype(float)[...,None]/255
  # decontaminate semi-transparent fringe from background colour
  fg=np.where(al>.05,(rgb-(1-al)*np.array(bgc))/np.maximum(al,.05),rgb);fg=np.clip(fg,0,255)
  o=Image.fromarray(np.dstack([fg,al[...,0]*255]).astype('uint8'),'RGBA');o=o.crop(o.getchannel('A').point(lambda v:255 if v>12 else 0).getbbox())
  if o.width>maxw:o=o.resize((maxw,round(o.height*maxw/o.width)),Image.LANCZOS)
  o.save(O+nm+'.webp','WEBP',quality=88,method=6,exact=True);print(nm,o.size)
day=Image.open('raw/sheet-day.jpg').convert('RGB');night=Image.open('raw/sheet-night.jpg').convert('RGB')
md,mn=mask(day),mask(night)
# night glow: keep halo via brightness
lum=np.asarray(night.convert('L')).astype(float);mn=np.maximum(mn,np.clip((lum-30)/60,0,1))
L=labels(mn,5);bgd=np.median(np.asarray(day)[:8].reshape(-1,3),0);bgn=np.median(np.asarray(night)[:8].reshape(-1,3),0)
for i,p in enumerate(['peek','push','sit','jump','lie']):
  for im,m,suf,bg in [(day,md,'',bgd),(night,mn,'-n',bgn)]:
    a=m*(L==i+1);ys,xs=np.where(a>.1);b=(xs.min(),ys.min(),xs.max()+1,ys.max()+1)
    save(im.crop(b),a[b[1]:b[3],b[0]:b[2]],'cat-'+p+suf,bg)
cups=Image.open('raw/cups.jpg').convert('RGB');mc=mask(cups);Lc=labels(mc,3);bgc=np.median(np.asarray(cups)[:8].reshape(-1,3),0)
for i,nm in enumerate(['cup-aren','cup-matcha','cup-butterscotch']):
  a=mc*(Lc==i+1);ys,xs=np.where(a>.1);b=(xs.min(),ys.min(),xs.max()+1,ys.max()+1);save(cups.crop(b),a[b[1]:b[3],b[0]:b[2]],nm,bgc,480)
lg=Image.open('raw/logo-original.jpg').convert('RGB');s=min(lg.size)
lg.crop(((lg.width-s)//2,(lg.height-s)//2,(lg.width+s)//2,(lg.height+s)//2)).resize((256,256),Image.LANCZOS).save(O+'logo.webp','WEBP',quality=90)

# Night mode: run scripts/night.py afterwards (cream recolour of day line-art overwrites cat-*-n.webp).

"""Night Lizzy = day line-art recoloured cream/ivory (owner prefers it over the gold sheet)."""
import numpy as np
from PIL import Image
for p in ['peek','push','sit','jump','lie']:
  im=np.asarray(Image.open(f'public/img/cat-{p}.webp').convert('RGBA')).astype(float)
  rgb,a=im[...,:3],im[...,3:];L=rgb.mean(2,keepdims=True)
  cream=np.array([248,240,226.]);line=np.array([196,164,120.]);t=np.clip((L-60)/170,0,1)
  out=line*(1-t)+cream*t;out=out*.85+(rgb*(t>0.3)+out*(t<=0.3))*.15
  Image.fromarray(np.dstack([np.clip(out,0,255),a]).astype('uint8'),'RGBA').save(f'public/img/cat-{p}-n.webp','WEBP',quality=88,method=6,exact=True)

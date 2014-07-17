import numpy as np
# (x,y,z) -> xp,yp
# (x - xo) / z = xp
# (y - yo) / z = yp

#Constants x/z 1.0 / z

# Solving gets us nz and ox * nz
#  ox = ox * nz / nz

def parsePt(pt):
    return tuple([float(x) for x in pt.split(',')])
def parseLine(pts):
    return tuple([parsePt(pt) for pt in pts.split(' -> ')])

data = open('RenderingPts.txt', 'r').readlines()
pts = [parseLine(ln) for ln in data]

xrs = []
xls = []

yrs = []
yls = []
for (x, y, z), (xp, yp) in pts:
    xrs.append([x / z, 1.0 / z])
    yrs.append([y / z, 1.0 / z])
    xls.append(xp)
    yls.append(yp)

resx = np.linalg.lstsq(xrs, xls)[0]
resy = np.linalg.lstsq(yrs, yls)[0]

nzx = resx[0]
ox = resx[1] / nzx
nzy = resy[0]
oy = resy[1] / nzy

for (x, y, z), (xp, yp) in pts:
    xp2 = (x + ox) * nzx / z
    yp2 = (y + oy) * nzy / z
    xe = xp2 - xp
    ye = yp2 - yp
    print("Error: {0} from {1} + {2}".format(abs(xe) + abs(ye), xe, ye))

print("OX: {0}, NZX: {1}".format(ox, nzx))
print("OY: {0}, NZY: {1}".format(oy, nzy))
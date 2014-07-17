f = open('RenderingEqs.txt')
l1 = f.readline()
data = f.readlines()

a, b, c, d, e, f = [float(x) for x in l1.split(' ')]

def splitEq(eq, a, b, c):
    eq = eq.split(' ')
    res = int(eq[0])
    off = int(eq[4])
    z = int(eq[6])

    actual = a * off / z + b / z + c
    print("ERR: {2} FROM {0} <> {1}".format(actual, res, abs(actual - res)))
    return eq[0], "{0} {1} 1".format(off / z, 1.0 / z)

xMat = ""
xRes = ""

yMat = ""
yRes = ""

for i in range(0, len(data), 3):
    xR, xM = splitEq(data[i], a, b, c)
    xRes += xR + "\n"
    xMat += xM + "\n"

    yR, yM = splitEq(data[i + 1], d, e, f)
    yRes += yR + "\n"
    yMat += yM + "\n"

print ("xLeft")
print (xMat)
print ("xRight")
print (xRes)

print ("yLeft")
print (yMat)

print ("yRight")
print (yRes)
    

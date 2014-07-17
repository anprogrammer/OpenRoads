def ROR(x, n):
    mask = (2**n) - 1
    mask_bits = x & mask
    return (x >> n) | (mask_bits << (8 - n))

for i in range(0,15):
    print bin(ROR(0xEF, i))

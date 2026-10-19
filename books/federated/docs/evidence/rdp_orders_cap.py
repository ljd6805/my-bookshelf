"""Check: McMahan et al. 2018 Table 1 z=3 rows if accountant orders are capped at 32 (moments up to lambda=31/32)."""
import math, sys
sys.path.insert(0, sys.argv[1])
import rdp_accountant as r

for cap in (32, 33):
    r.ORDERS = range(2, cap + 1)
    for t, pub in [(1, 0.47), (1000, 0.48), (100000, 0.67), (1000000, 1.95)]:
        e = r.eps_from(0.001, 3.0, t, 1e6 ** -1.1)
        print(f"orders<= {cap}: z=3 T={t}: eps={e[0]:.3f} (alpha={e[1]}) published={pub}")

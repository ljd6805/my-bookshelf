"""Independent RDP accountant check (수아, 2026-10-19). Standard library only.

Sampled Gaussian Mechanism (Poisson sampling rate q, noise multiplier sigma,
L2 sensitivity 1), integer orders alpha (Mironov, Talwar, Zhang 2019, Sec 3.3 Case I):
  A_alpha = sum_{k=0}^{alpha} C(alpha,k) (1-q)^(alpha-k) q^k exp((k^2-k)/(2 sigma^2))
  eps_RDP(alpha) = log(A_alpha)/(alpha-1)      (per step; composes additively, Mironov 2017 Prop 1)
Conversion to (eps, delta)-DP:
  classic  : eps = T*eps_RDP + log(1/delta)/(alpha-1)          (Mironov 2017 Prop 3)
  improved : eps = T*eps_RDP + log((alpha-1)/alpha) - (log(delta)+log(alpha))/(alpha-1)
             (Balle et al. 2020 / Canonne-Kamath-Steinke 2020; used by newer TF Privacy / dp_accounting)
Units: eps, delta dimensionless; q in [0,1]; sigma = noise std / clipping norm.
"""
import math

ORDERS = range(2, 257)


def log_a(q, sigma, alpha):
    if q == 0:
        return 0.0
    if q == 1:
        return alpha * (alpha - 1) / (2 * sigma ** 2)
    terms = []
    for k in range(alpha + 1):
        t = (math.lgamma(alpha + 1) - math.lgamma(k + 1) - math.lgamma(alpha - k + 1)
             + (alpha - k) * math.log1p(-q) + k * math.log(q)
             + (k * k - k) / (2 * sigma ** 2))
        terms.append(t)
    m = max(terms)
    return m + math.log(sum(math.exp(t - m) for t in terms))


def rdp(q, sigma, alpha):
    return log_a(q, sigma, alpha) / (alpha - 1)


def eps_from(q, sigma, steps, delta, improved=False):
    best = (float("inf"), None)
    for a in ORDERS:
        r = steps * rdp(q, sigma, a)
        if improved:
            e = r + math.log((a - 1) / a) - (math.log(delta) + math.log(a)) / (a - 1)
        else:
            e = r + math.log(1 / delta) / (a - 1)
        if e < best[0]:
            best = (e, a)
    return best


def zcdp_to_eps(rho, delta):
    """Classic zCDP conversion (Bun-Steinke 2016) and RDP-based improved one, alpha real."""
    classic = rho + 2 * math.sqrt(rho * math.log(1 / delta))
    best = float("inf")
    a = 1.001
    while a < 2000:
        e = rho * a + math.log((a - 1) / a) - (math.log(delta) + math.log(a)) / (a - 1)
        best = min(best, e)
        a *= 1.001
    return classic, best


def report(name, q, sigma, steps, delta, published=None):
    c = eps_from(q, sigma, steps, delta)
    i = eps_from(q, sigma, steps, delta, improved=True)
    pub = "" if published is None else f"  published={published}"
    print(f"{name}: q={q:.6g} sigma={sigma} T={steps} delta={delta:g} -> "
          f"eps_classic={c[0]:.3f} (alpha={c[1]})  eps_improved={i[0]:.3f} (alpha={i[1]}){pub}")


def main():
    print("== sanity checks ==")
    print("q=1 matches Gaussian alpha/(2 sigma^2):", rdp(1, 2.0, 5), 5 / (2 * 4.0))
    print("q=1 via binomial path (q=1-1e-12):", rdp(1 - 1e-12, 2.0, 5))
    print("q=0 gives 0:", rdp(0, 1.0, 10))
    print("== cases ==")
    report("(a) task", 0.01, 1.1, 1000, 1e-5)
    steps_tf = math.ceil(60 * 60000 / 256)
    report("(b) TF Privacy MNIST README", 256 / 60000, 1.1, steps_tf, 1e-5, published="3.01")
    report("(b2) TF README row 2", 256 / 60000, 1.3, math.ceil(15 * 60000 / 256), 1e-5, published="1.19")
    report("(b3) TF README row 4", 256 / 60000, 0.7, math.ceil(45 * 60000 / 256), 1e-5, published="7.10")
    report("(c) Abadi 2016 Sec 3.1", 0.01, 4, 10000, 1e-5, published="~1.26 (moments accountant)")
    print("-- McMahan et al. 2018 Table 1 (delta = K^-1.1, q = C/K) --")
    rows = [(1e5, 1e2, 1.0, [0.97, 0.98, 1.00, 1.07, 1.18, 2.21, 7.50]),
            (1e6, 1e3, 1.0, [1.17, 1.17, 1.20, 1.28, 1.39, 2.44, 8.13]),
            (1e6, 1e3, 3.0, [0.47, 0.47, 0.48, 0.48, 0.49, 0.67, 1.95])]
    for k, c, z, pub in rows:
        for j, t in enumerate([1, 10, 100, 1000, 10000, 100000, 1000000]):
            report(f"K={k:g} C={c:g} z={z} T={t}", c / k, z, t, k ** -1.1, published=pub[j])
    print("-- McMahan et al. 2018 Table 2 row: K=763430, C=5000, z? --")
    print("   (Table 2 lists sigma=0.003, S=15 -> z = sigma*qW/S = 0.003*5000/15 = 1.0)")
    report("K=763430 C=5000 z=1.0 T=5000", 5000 / 763430, 1.0, 5000, 1e-9, published="4.634")
    report("K=1e8 C=5000 z=1.0 T=5000", 5000 / 1e8, 1.0, 5000, 1e-9, published="1.152")
    print("-- Xu et al. 2023 Appendix A: rho-zCDP -> eps at delta=1e-10 --")
    for rho, pub in [(0.25, 4.49), (0.89, 9.01), (1.86, 13.69)]:
        c, i = zcdp_to_eps(rho, 1e-10)
        print(f"rho={rho}: classic={c:.2f} improved={i:.2f} published={pub}")


if __name__ == "__main__":
    main()

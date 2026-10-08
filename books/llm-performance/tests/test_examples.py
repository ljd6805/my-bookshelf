import importlib.util
import math
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location("profile_matmul", Path(__file__).parents[1] / "examples/profile_matmul.py")
example = importlib.util.module_from_spec(spec)
spec.loader.exec_module(example)


class MeasurementHelpers(unittest.TestCase):
    def test_known_quantiles_and_median(self):
        result = example.summarize(list(range(1, 21)))
        self.assertEqual(result["median_ms"], 10.5)
        self.assertEqual(result["p95_ms_nearest_rank"], 19)
        self.assertEqual(result["min_ms"], 1)
        self.assertEqual(result["max_ms"], 20)

    def test_one_observation(self):
        result = example.summarize([.1])
        self.assertEqual(result["p95_ms_nearest_rank"], .1)

    def test_invalid_samples(self):
        for sample in [[], [-1], [math.nan], [math.inf]]:
            with self.assertRaises(ValueError):
                example.summarize(sample)

    def test_cli_preserves_measurement_scope(self):
        args = example.parse_args(["--device", "cpu", "--n", "8", "--batch", "4", "--repeats", "3"])
        self.assertEqual((args.n, args.batch, args.repeats), (8, 4, 3))


if __name__ == "__main__":
    unittest.main()

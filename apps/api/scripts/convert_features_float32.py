#!/usr/bin/env python3
"""Convert final_features.npy to float32 to cut feature RAM ~in half."""

from __future__ import annotations

import sys
from pathlib import Path

import numpy as np

ARTIFACTS = Path(__file__).resolve().parent.parent / "artifacts"
SRC = ARTIFACTS / "final_features.npy"
TMP = ARTIFACTS / "final_features.float32.npy"


def main() -> int:
    if not SRC.exists():
        print(f"Missing {SRC}")
        return 1

    arr = np.load(SRC, mmap_mode="r")
    print(f"input: shape={arr.shape} dtype={arr.dtype} size={arr.nbytes / 1e6:.1f}MB")
    if arr.dtype == np.float32:
        print("Already float32 — nothing to do.")
        return 0

    print("Converting to float32 in chunks...")
    out = np.lib.format.open_memmap(
        TMP, mode="w+", dtype=np.float32, shape=arr.shape
    )
    chunk = 1024
    for start in range(0, arr.shape[0], chunk):
        end = min(start + chunk, arr.shape[0])
        out[start:end] = np.asarray(arr[start:end], dtype=np.float32)
        if start % (chunk * 10) == 0:
            print(f"  {end}/{arr.shape[0]}")
    out.flush()
    del out, arr

    TMP.replace(SRC)
    verify = np.load(SRC, mmap_mode="r")
    print(f"output: shape={verify.shape} dtype={verify.dtype} size={verify.nbytes / 1e6:.1f}MB")
    print("Done.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

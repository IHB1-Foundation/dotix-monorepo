# Agent Sample Output

This directory contains sample outputs for judge review.

- `dry-run-sample.json`: snapshot + computed targets + swap plan + explanation.
- `execute-sample.json`: execute mode payload including `txHash`, `blockNumber`, and NAV fields.

## Reproduce

```bash
bun run agent/execute.ts --dry-run
bun run agent/execute.ts --execute
```

The commands write timestamped JSON files into `agent/sample-output/`.

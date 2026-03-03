import { promises as fs } from "node:fs";
import path from "node:path";

import { NextResponse } from "next/server";

const SAMPLE_DIR = path.join(process.cwd(), "..", "agent", "sample-output");

export async function GET() {
  try {
    const files = (await fs.readdir(SAMPLE_DIR)).filter((name) => name.endsWith(".json"));
    if (files.length === 0) {
      return NextResponse.json({ error: "No sample output found" }, { status: 404 });
    }

    const entries = await Promise.all(
      files.map(async (name) => {
        const fullPath = path.join(SAMPLE_DIR, name);
        const stat = await fs.stat(fullPath);
        return { name, fullPath, mtimeMs: stat.mtimeMs };
      })
    );

    entries.sort((a, b) => b.mtimeMs - a.mtimeMs);
    const latest = entries[0];

    const raw = await fs.readFile(latest.fullPath, "utf8");
    const payload = JSON.parse(raw);

    return NextResponse.json({ file: latest.name, payload });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

import { exec } from "child_process";
import { promisify } from "util";
import { NextResponse } from "next/server";

const execAsync = promisify(exec);

const SCRAPER_DIR = "/Users/djaumandreuondaro/Downloads/nutrition-scraper";
const PYTHON = "/usr/local/bin/python3";

export async function POST() {
  try {
    const { stdout, stderr } = await execAsync(
      `${PYTHON} scrape.py --days 2`,
      { cwd: SCRAPER_DIR, timeout: 60_000 }
    );
    const output = stdout + (stderr ? `\nSTDERR: ${stderr}` : "");
    return NextResponse.json({ ok: true, output });
  } catch (err: unknown) {
    const e = err as { message?: string; stderr?: string; stdout?: string };
    const combined = [e.message, e.stderr, e.stdout].filter(Boolean).join("\n");
    const needsLogin = combined.includes("Session expired") || combined.includes("needLogon");
    return NextResponse.json({ ok: false, needsLogin, error: combined }, { status: 500 });
  }
}

#!/usr/bin/env node

import { main } from "../src/cli.js";

main(process.argv.slice(2)).catch((error) => {
  console.error(`\nเกิดข้อผิดพลาด: ${error.message}`);
  if (process.env.SHOT_ANALYSIS_DEBUG === "1") {
    console.error(error.stack);
  }
  process.exitCode = 1;
});

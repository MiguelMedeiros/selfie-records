import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const parse = (version) => version.split(".").map((part) => Number.parseInt(part, 10));

const atLeast = (version, minimum) => {
  const a = parse(version);
  const b = parse(minimum);
  for (let i = 0; i < b.length; i += 1) {
    if ((a[i] ?? 0) !== b[i]) return (a[i] ?? 0) > b[i];
  }
  return true;
};

test("locked Next.js includes the current security fixes (>= 15.5.29)", () => {
  const lock = JSON.parse(read("package-lock.json"));
  const version = lock.packages["node_modules/next"].version;
  assert.ok(atLeast(version, "15.5.29"), `next ${version} is older than 15.5.29`);
});

test("eslint-config-next matches the locked Next.js version", () => {
  const lock = JSON.parse(read("package-lock.json"));
  assert.equal(
    lock.packages["node_modules/eslint-config-next"].version,
    lock.packages["node_modules/next"].version,
  );
});

test("production image runs on a supported Node.js LTS (>= 20)", () => {
  const match = read("Dockerfile").match(/^FROM node:(\d+)/m);
  assert.ok(match, "Dockerfile must start from an official node image");
  assert.ok(Number(match[1]) >= 20, `node:${match[1]} is end-of-life`);
});

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  DEFAULT_DNS_SERVER,
  DNS_SERVERS,
  MAX_FILTERS,
  parseCheckAddressQuery,
} from "../src/lib/checkAddressQuery.ts";

test("defaults to Cloudflare when no DNS server is given", () => {
  const result = parseCheckAddressQuery({ name: "miguel@example.com" });
  assert.equal(result.ok, true);
  assert.equal(result.value.dnsServer, DEFAULT_DNS_SERVER);
  assert.equal(DEFAULT_DNS_SERVER, "1.1.1.1");
});

test("accepts every DNS server offered in the UI", () => {
  for (const server of DNS_SERVERS) {
    const result = parseCheckAddressQuery({ name: "example.com", dnsServer: server.value });
    assert.equal(result.ok, true, server.value);
    assert.equal(result.value.dnsServer, server.value);
  }
});

test("rejects DNS servers outside the public resolver allowlist", () => {
  for (const dnsServer of ["127.0.0.1", "192.168.0.1", "10.0.0.1", "203.0.113.7", "evil.example", "1.1.1.1:5353"]) {
    const result = parseCheckAddressQuery({ name: "example.com", dnsServer });
    assert.equal(result.ok, false, dnsServer);
    assert.equal(result.status, 400);
  }
});

test("requires a single non-empty name of sane length", () => {
  assert.equal(parseCheckAddressQuery({}).ok, false);
  assert.equal(parseCheckAddressQuery({ name: "" }).ok, false);
  assert.equal(parseCheckAddressQuery({ name: ["a.com", "b.com"] }).ok, false);
  assert.equal(parseCheckAddressQuery({ name: "a".repeat(321) }).ok, false);
});

test("splits filters and caps how many lookups one request can trigger", () => {
  const ok = parseCheckAddressQuery({ name: "example.com", filters: "nostr,pgp" });
  assert.equal(ok.ok, true);
  assert.deepEqual(ok.value.filters, ["nostr", "pgp"]);

  const none = parseCheckAddressQuery({ name: "example.com" });
  assert.equal(none.value.filters, undefined);

  const tooMany = Array.from({ length: MAX_FILTERS + 1 }, (_, i) => `k${i}`).join(",");
  const rejected = parseCheckAddressQuery({ name: "example.com", filters: tooMany });
  assert.equal(rejected.ok, false);
  assert.equal(rejected.status, 400);
});

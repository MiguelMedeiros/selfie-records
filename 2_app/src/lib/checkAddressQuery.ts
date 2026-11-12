// Validation for /api/checkAddress. The API resolves TXT records from the
// server, so every query parameter is untrusted input that controls outbound
// DNS traffic from the host. Keep this module dependency-free so it can be
// unit-tested directly with `node --test`.

export const DNS_SERVERS = [
  { name: "Cloudflare (1.1.1.1) Default", value: "1.1.1.1" },
  { name: "Google (8.8.8.8)", value: "8.8.8.8" },
  { name: "OpenDNS (208.67.222.222)", value: "208.67.222.222" },
  { name: "Quad9 (9.9.9.9)", value: "9.9.9.9" },
  { name: "NextDNS (45.90.28.0)", value: "45.90.28.0" },
] as const;

export const DEFAULT_DNS_SERVER = "1.1.1.1";

// Each filter triggers its own DNS lookup.
export const MAX_FILTERS = 20;

// Longest email address (local@domain) allowed by RFC 5321.
const MAX_NAME_LENGTH = 320;

type QueryValue = string | string[] | undefined;

export type CheckAddressQuery = {
  name: string;
  filters: string[] | undefined;
  dnsServer: string;
};

export type ParseResult =
  | { ok: true; value: CheckAddressQuery }
  | { ok: false; status: 400; error: string };

const single = (value: QueryValue): string | undefined | null => {
  if (value === undefined) return undefined;
  if (Array.isArray(value)) return null;
  return value;
};

const invalid = (error: string): ParseResult => ({ ok: false, status: 400, error });

export function parseCheckAddressQuery(query: Record<string, QueryValue>): ParseResult {
  const name = single(query.name);
  if (!name) return invalid("'name' param is required");
  if (name.length > MAX_NAME_LENGTH) return invalid("'name' param is too long");

  const dnsServer = single(query.dnsServer);
  if (dnsServer === null) return invalid("'dnsServer' must be a single value");
  const server = dnsServer || DEFAULT_DNS_SERVER;
  if (!DNS_SERVERS.some((option) => option.value === server)) {
    return invalid("'dnsServer' is not a supported resolver");
  }

  const rawFilters = single(query.filters);
  if (rawFilters === null) return invalid("'filters' must be a single value");
  const filters = rawFilters ? rawFilters.split(",") : [];
  if (filters.length > MAX_FILTERS) {
    return invalid(`'filters' accepts at most ${MAX_FILTERS} records`);
  }

  return {
    ok: true,
    value: { name, filters: filters.length ? filters : undefined, dnsServer: server },
  };
}

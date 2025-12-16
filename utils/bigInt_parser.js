export function convertBigInt(obj) {
  return JSON.parse(
    JSON.stringify(obj, (_, value) =>
      typeof value === "bigint" ? value.toString() : value
    )
  );
}
export function parseBigIntFields(obj) {
  if (typeof obj === "string" && /^\d+$/.test(obj)) return BigInt(obj);
  if (Array.isArray(obj)) return obj.map(parseBigIntFields);
  if (typeof obj === "object" && obj !== null) {
    const o = {};
    for (const k in obj) o[k] = parseBigIntFields(obj[k]);
    return o;
  }
  return obj;
}

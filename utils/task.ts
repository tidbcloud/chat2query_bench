export function mapTaskId(id: string) {
  const arr = id.split("-");
  if (arr.length === 1) return "";
  return arr
    .slice(1)
    .map((i) => Number(i) + 1)
    .join(".");
}

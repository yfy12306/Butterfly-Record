function randomSegment(length: number) {
  let output = "";
  while (output.length < length) {
    output += Math.random().toString(36).slice(2);
  }
  return output.slice(0, length);
}

export function createId(prefix = ""): string {
  const timePart = Date.now().toString(36);
  const randomPart = randomSegment(12);
  return `${prefix}${timePart}${randomPart}`;
}

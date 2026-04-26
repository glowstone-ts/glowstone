export function toPascalCase(str: string) {
  return str
    .split(/[^a-zA-Z0-9]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
}

export function toSnakeCase(str: string) {
  return str
    .split(/[^a-zA-Z0-9]+/)
    .map(word => word.toLowerCase())
    .join('_');
}

export function toCamelCase(str: string) {
  const pascalCase = toPascalCase(str);
  return pascalCase.charAt(0).toLowerCase() + pascalCase.slice(1);
}

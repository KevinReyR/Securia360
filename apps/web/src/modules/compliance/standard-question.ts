export function buildStandardQuestion(standard: { code: string; criterion: string | null }) {
  const criterion = standard.criterion?.trim().replace(/[.;:]+$/, "");
  if (!criterion) return `¿La empresa cumple con el estándar ${standard.code} y puede demostrarlo con evidencia verificable?`;

  const transformations: Array<[RegExp, string]> = [
    [/^Asignar\s+/i, "¿La empresa ha asignado "],
    [/^Asegurar\s+/i, "¿La empresa asegura "],
    [/^Contar con\s+/i, "¿La empresa cuenta con "],
    [/^Definir\s+/i, "¿La empresa ha definido "],
    [/^Diseñar\s+/i, "¿La empresa ha diseñado "],
    [/^Elaborar\s+/i, "¿La empresa ha elaborado "],
    [/^Establecer\s+/i, "¿La empresa ha establecido "],
    [/^Evaluar\s+/i, "¿La empresa ha evaluado "],
    [/^Garantizar\s+/i, "¿La empresa garantiza "],
    [/^Identificar\s+/i, "¿La empresa ha identificado "],
    [/^Implementar\s+/i, "¿La empresa ha implementado "],
    [/^Investigar\s+/i, "¿La empresa ha investigado "],
    [/^Mantener\s+/i, "¿La empresa mantiene "],
    [/^Medir\s+/i, "¿La empresa mide "],
    [/^Realizar\s+/i, "¿La empresa ha realizado "],
    [/^Reportar\s+/i, "¿La empresa ha reportado "],
    [/^Suministrar\s+/i, "¿La empresa ha suministrado "],
    [/^Verificar\s+/i, "¿La empresa verifica "],
  ];
  const transformation = transformations.find(([pattern]) => pattern.test(criterion));
  if (transformation) return `${criterion.replace(transformation[0], transformation[1])}?`;
  return `¿La empresa cumple con el siguiente criterio: ${criterion.charAt(0).toLowerCase()}${criterion.slice(1)}?`;
}

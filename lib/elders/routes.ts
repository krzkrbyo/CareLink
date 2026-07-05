export type ElderCareSection = "dashboard" | "configuracion" | "perfil";

export function elderCarePath(slug: string, section: ElderCareSection = "dashboard"): string {
  return `/cuidador/${slug}/${section}`;
}

export function parseElderSlugFromPath(pathname: string): string | undefined {
  const match = pathname.match(/^\/cuidador\/([^/]+)/);
  const segment = match?.[1];
  if (!segment) return undefined;

  const reserved = new Set(["resumen", "dashboard", "configuracion"]);
  if (reserved.has(segment)) return undefined;

  return segment;
}

import versions from '../versions.json';
import type { VersionRelease } from '../versions-model';

const versionMap: Record<string, VersionRelease[]> = {
  './versions.json': versions as VersionRelease[],
};

export function loadVersions(imports: string[]): VersionRelease[] {
  return imports.flatMap((p) => {
    const mod = versionMap[p];
    if (!mod) {
      throw new Error(`Version JSON not bundled: ${p}. Add a static import in versions-loader.ts`);
    }
    return [...mod];
  });
}

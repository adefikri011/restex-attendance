import { cacheLife, cacheTag } from "next/cache";
import { getRecruitmentStatus } from "./recruitment";
import { getRecruitmentSettings } from "./recruitment-service";

export async function getCachedRecruitmentConfig() {
  "use cache";
  cacheLife({ stale: 3600, revalidate: 3600, expire: 86_400 });
  cacheTag("recruitment-settings");
  const settings = await getRecruitmentSettings();
  return { settings, status: getRecruitmentStatus(new Date(), settings) };
}

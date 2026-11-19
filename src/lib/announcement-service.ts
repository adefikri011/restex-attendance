import "server-only";
import type { AnnouncementType, Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export async function getPublishedAnnouncements() {
  return prisma.announcement.findMany({
    where: { isPublished: true },
    orderBy: { publishedAt: "desc" },
    select: {
      slug: true,
      title: true,
      excerpt: true,
      content: true,
      type: true,
      publishedAt: true,
    },
  });
}

export async function getPublishedAnnouncement(slug: string) {
  return prisma.announcement.findFirst({
    where: { slug, isPublished: true },
    select: {
      slug: true,
      title: true,
      excerpt: true,
      content: true,
      type: true,
      publishedAt: true,
    },
  });
}

export async function getAllAnnouncements() {
  return prisma.announcement.findMany({
    orderBy: [{ isPublished: "desc" }, { createdAt: "desc" }],
  });
}

export type AnnouncementInput = {
  title: string;
  excerpt: string;
  content: string;
  type: AnnouncementType;
  isPublished: boolean;
};

export async function createAnnouncement(input: AnnouncementInput) {
  const baseSlug = input.title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 150) || "pengumuman";

  const slug = `${baseSlug}-${Date.now().toString(36)}`;
  const data: Prisma.AnnouncementCreateInput = {
    slug,
    title: input.title,
    excerpt: input.excerpt,
    content: input.content,
    type: input.type,
    isPublished: input.isPublished,
    publishedAt: input.isPublished ? new Date() : null,
  };

  return prisma.announcement.create({ data });
}

export async function updateAnnouncementPublication(id: string, isPublished: boolean) {
  return prisma.announcement.update({
    where: { id },
    data: {
      isPublished,
      publishedAt: isPublished ? new Date() : null,
    },
  });
}

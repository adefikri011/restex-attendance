"use client";

import Image from "next/image";
import { useState } from "react";
import styles from "./user-avatar.module.css";

type UserAvatarProps = {
  className: string;
  initials: string;
  imageUrl?: string | null;
};

export function UserAvatar({
  className,
  initials,
  imageUrl,
}: UserAvatarProps) {
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null);

  return (
    <span className={`${styles.frame} ${className}`}>
      {initials}
      {imageUrl && failedImageUrl !== imageUrl && (
        <Image
          className={styles.image}
          src={imageUrl}
          alt=""
          fill
          sizes="48px"
          unoptimized
          onError={() => setFailedImageUrl(imageUrl)}
        />
      )}
    </span>
  );
}

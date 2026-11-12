"use client";

import Image from "next/image";
import { Check, LoaderCircle, TriangleAlert, X } from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import styles from "./notifications.module.css";

type NotificationStatus = "loading" | "success" | "warning" | "error";
type NotificationId = string | number;

type NotificationCardProps = {
  id: NotificationId;
  status: NotificationStatus;
  title: string;
  description?: string;
};

const statusLabels: Record<NotificationStatus, string> = {
  loading: "Sedang berjalan",
  success: "Selesai",
  warning: "Perlu diperhatikan",
  error: "Perlu perhatian",
};

const statusMarks = {
  loading: <LoaderCircle size={14} aria-hidden="true" />,
  success: <Check size={15} aria-hidden="true" />,
  warning: <TriangleAlert size={16} aria-hidden="true" />,
  error: <TriangleAlert size={16} aria-hidden="true" />,
};

const mascotImages: Record<NotificationStatus, { src: string; alt: string }> = {
  loading: { src: "/assets/mascot/feedback-loading.webp", alt: "" },
  success: { src: "/assets/mascot/feedback-success.webp", alt: "" },
  warning: { src: "/assets/mascot/feedback-warning.webp", alt: "" },
  error: { src: "/assets/mascot/feedback-warning.webp", alt: "" },
};

function NotificationCard({
  id,
  status,
  title,
  description,
}: NotificationCardProps) {
  return (
    <article
      className={`${styles.card} ${styles[status]}`}
      role={status === "error" || status === "warning" ? "alert" : "status"}
      aria-live={status === "error" || status === "warning" ? "assertive" : "polite"}
      aria-atomic="true"
    >
      <div className={styles.iconFrame} aria-hidden="true">
        <Image
          className={`${styles.mascotImage} ${styles[status]}`}
          src={mascotImages[status].src}
          alt={mascotImages[status].alt}
          width={56}
          height={56}
          unoptimized
        />
        <span className={styles.statusMark}>{statusMarks[status]}</span>
      </div>

      <div className={styles.copy}>
        <span className={styles.statusLabel}>
          <span className={styles.statusDot} />
          RESTEX <span className={styles.labelDivider}>/</span> {statusLabels[status]}
        </span>
        <strong className={styles.title}>{title}</strong>
        {description && <span className={styles.description}>{description}</span>}
      </div>

      <button
        type="button"
        className={styles.dismiss}
        aria-label="Tutup notifikasi"
        onClick={() => toast.dismiss(id)}
      >
        <X size={15} aria-hidden="true" />
      </button>

      {status === "loading" && (
        <span className={styles.progressTrack} aria-hidden="true">
          <span />
        </span>
      )}
    </article>
  );
}

function showNotification(
  status: NotificationStatus,
  title: string,
  description?: string,
  id?: NotificationId,
) {
  return toast.custom(
    (toastId) => (
      <NotificationCard
        id={toastId}
        status={status}
        title={title}
        description={description}
      />
    ),
    {
      id,
      duration: status === "loading" ? Number.POSITIVE_INFINITY : 4500,
      unstyled: true,
    },
  );
}

export const notifications = {
  loading(title: string, description?: string) {
    return showNotification("loading", title, description);
  },
  success(title: string, description?: string, id?: NotificationId) {
    return showNotification("success", title, description, id);
  },
  warning(title: string, description?: string, id?: NotificationId) {
    return showNotification("warning", title, description, id);
  },
  error(title: string, description?: string, id?: NotificationId) {
    return showNotification("error", title, description, id);
  },
  dismiss(id: NotificationId) {
    toast.dismiss(id);
  },
};

export function NotificationViewport() {
  return <Toaster position="top-right" closeButton={false} visibleToasts={3} />;
}

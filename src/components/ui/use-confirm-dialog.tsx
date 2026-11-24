"use client";

import Image from "next/image";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import styles from "./confirm-dialog.module.css";

type ConfirmDialogOptions = {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
};

type ConfirmDialogContextValue = {
  confirm: (options: ConfirmDialogOptions) => Promise<boolean>;
};

const ConfirmDialogContext = createContext<ConfirmDialogContextValue | null>(null);

export function ConfirmDialogProvider({ children }: PropsWithChildren) {
  const [options, setOptions] = useState<ConfirmDialogOptions | null>(null);
  const resolver = useRef<((confirmed: boolean) => void) | null>(null);

  const finish = useCallback((confirmed: boolean) => {
    const resolve = resolver.current;
    resolver.current = null;
    setOptions(null);
    resolve?.(confirmed);
  }, []);

  const confirm = useCallback((nextOptions: ConfirmDialogOptions) => {
    return new Promise<boolean>((resolve) => {
      resolver.current?.(false);
      resolver.current = resolve;
      setOptions(nextOptions);
    });
  }, []);

  const contextValue = useMemo(() => ({ confirm }), [confirm]);

  return (
    <ConfirmDialogContext.Provider value={contextValue}>
      {children}
      <AlertDialog
        open={options !== null}
        onOpenChange={(open) => {
          if (!open) finish(false);
        }}
      >
        <AlertDialogContent
          size="sm"
          className={styles.dialog}
          overlayClassName={styles.overlay}
        >
          <AlertDialogHeader className={styles.header}>
            <div className={styles.mascot} aria-hidden="true">
              <Image
                src="/assets/mascot/warningg.png"
                alt=""
                width={112}
                height={112}
                unoptimized
              />
            </div>
            <span className={styles.eyebrow}>KONFIRMASI TINDAKAN</span>
            <AlertDialogTitle className={styles.title}>
              {options?.title}
            </AlertDialogTitle>
            <AlertDialogDescription className={styles.description}>
              {options?.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className={styles.footer}>
            <AlertDialogCancel className={styles.cancel}>
              {options?.cancelLabel ?? "Batal"}
            </AlertDialogCancel>
            <AlertDialogAction
              className={
                options?.destructive ? styles.confirmDestructive : styles.confirm
              }
              onClick={() => finish(true)}
            >
              {options?.confirmLabel ?? "Lanjutkan"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ConfirmDialogContext.Provider>
  );
}

export function useConfirmDialog() {
  const context = useContext(ConfirmDialogContext);
  if (!context) {
    throw new Error("useConfirmDialog must be used within ConfirmDialogProvider.");
  }
  return context;
}

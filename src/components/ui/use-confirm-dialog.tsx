"use client";

import { useCallback, useRef, useState } from "react";
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

type ConfirmDialogOptions = {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
};

export function useConfirmDialog() {
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

  const dialog = (
    <AlertDialog
      open={options !== null}
      onOpenChange={(open) => {
        if (!open) finish(false);
      }}
    >
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogTitle>{options?.title}</AlertDialogTitle>
          <AlertDialogDescription>{options?.description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{options?.cancelLabel ?? "Batal"}</AlertDialogCancel>
          <AlertDialogAction
            variant={options?.destructive ? "destructive" : "default"}
            onClick={() => finish(true)}
          >
            {options?.confirmLabel ?? "Lanjutkan"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  return { confirm, dialog };
}

"use client";
import { useAccessStore } from "@/store/useAccessStore";
import { kindOf } from "@/lib/access";

export default function useAccess() {
  const roles = useAccessStore((s) => s.roles);
  const permissions = useAccessStore((s) => s.permissions);
  const status = useAccessStore((s) => s.status);
  const kind = kindOf(roles, permissions);
  return { status, roles, permissions, kind, isSuper: kind === "super_admin", isStaff: kind !== "customer", can: (p) => permissions.includes(p) };
}
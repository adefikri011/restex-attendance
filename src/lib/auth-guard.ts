import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  getAppRoleByDatabaseRole,
  type AppRoleId,
} from "@/components/auth/role-config";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function requirePageUser(allowedRoles?: readonly AppRoleId[]) {
  const access = await getApiUser(allowedRoles);

  if (!access.user) {
    if (access.status === 401) {
      redirect("/login");
    }

    const role = access.databaseRole
      ? getAppRoleByDatabaseRole(access.databaseRole)
      : undefined;
    if (!role) {
      redirect("/login");
    }

    redirect(role.dashboardPath);
  }

  return access.user;
}

export async function getApiUser(allowedRoles?: readonly AppRoleId[]) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return { user: null, status: 401 as const, databaseRole: null };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      managedDivision: true,
    },
  });
  if (!user?.isActive) {
    return { user: null, status: 401 as const, databaseRole: null };
  }

  const role = getAppRoleByDatabaseRole(user.role);
  if (!role) {
    return { user: null, status: 403 as const, databaseRole: null };
  }

  if (allowedRoles && !allowedRoles.includes(role.id)) {
    return {
      user: null,
      status: 403 as const,
      databaseRole: user.role,
    };
  }

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: role.id,
      managedDivision: user.managedDivision,
    },
    status: 200 as const,
    databaseRole: user.role,
  };
}

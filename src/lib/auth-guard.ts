import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  getAppRoleByDatabaseRole,
  type AppRoleId,
} from "@/components/auth/role-config";
import { auth } from "@/lib/auth";

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

  if (!session || !session.user.isActive) {
    return { user: null, status: 401 as const, databaseRole: null };
  }

  const role = getAppRoleByDatabaseRole(session.user.role);
  if (!role) {
    return { user: null, status: 403 as const, databaseRole: null };
  }

  if (allowedRoles && !allowedRoles.includes(role.id)) {
    return {
      user: null,
      status: 403 as const,
      databaseRole: session.user.role,
    };
  }

  return {
    user: {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      role: role.id,
    },
    status: 200 as const,
    databaseRole: session.user.role,
  };
}

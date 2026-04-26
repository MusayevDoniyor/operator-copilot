import { SetMetadata } from "@nestjs/common";
import { UserRole } from "@sadoo/types";

export const ROLES_KEY = "roles";
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

export const Public = () => SetMetadata("isPublic", true);

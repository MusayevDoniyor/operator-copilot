import { UserRole, User as SharedUser } from "@sadoo/types";

export interface User extends SharedUser {
  password: string;
}

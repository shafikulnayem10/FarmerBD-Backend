

import { Role } from "../../common/enums/role.enum.js";

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
}

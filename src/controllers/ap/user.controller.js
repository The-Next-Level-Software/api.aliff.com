import { StatusCodes } from "http-status-codes";

import QueryEngine from "../../services/query.service.js";
import { Role, User } from "../../models/models.js";
import { generateApiResponse } from "../../utils/response.util.js";

class UserController {
  static async getAllUsers(req, res) {
    const { role = "user" } = req.query;

    const roles = await Role.findMany({ where: { name: role } });

    const engine = new QueryEngine(User, req.query, {
      where: {
        isActive: true,
        roleId: { in: roles.map((r) => r.id) },
      },
      searchable: ["name", "email"],
    });

    const result = await engine.exec("users");

    return generateApiResponse(res, StatusCodes.OK, "Users retrieved successfully", result);
  }
}

export default UserController;

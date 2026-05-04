import * as roleModel from "../models/roleModel.js";

// Create
export const createRole = async (req, res) => {
  const { name_role } = req.body;

  try {
    const roleId = await roleModel.createRole(name_role);

    return res
      .status(201)
      .json({ message: "Role created successfully", id: roleId, name_role });
  } catch (error) {
    console.error("Error creating role:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Read
export const getAllRoles = async (req, res) => {
  try {
    const roles = await roleModel.getAllRoles();

    return res.status(200).json({ roles });
  } catch (error) {
    console.error("Error fetching roles:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Update
export const updateRole = async (req, res) => {
  const { id } = req.params;
  const { name_role } = req.body;

  try {
    const success = await roleModel.updateRole(id, name_role);

    if (!success) {
      return res.status(404).json({ error: "Role not found" });
    }

    return res
      .status(200)
      .json({ message: "Role updated successfully", id, name_role });
  } catch (error) {
    console.error("Error updating role:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Delete
export const deleteRole = async (req, res) => {
  const { id } = req.params;

  try {
    const success = await roleModel.deleteRole(id);

    if (!success) {
      return res.status(404).json({ error: "Role not found" });
    }

    return res.status(200).json({ message: "Role deleted successfully", id });
  } catch (error) {
    console.error("Error deleting role:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

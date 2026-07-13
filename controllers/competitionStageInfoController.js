import mongoose from "mongoose";
import CompetitionStageInfo from "../models/competitionStageInfoModel.js";

const handleControllerError = (res, error, defaultMessage) => {
  console.error(defaultMessage, error);

  if (error.code === 11000) {
    return res.status(409).json({
      success: false,
      message: "Informasi tambahan untuk stage tersebut sudah tersedia",
    });
  }

  if (
    error.name === "ValidationError" ||
    error.message?.includes("penjemputan") ||
    error.message?.includes("Satu team")
  ) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  return res.status(500).json({
    success: false,
    message: defaultMessage,
    error: error.message,
  });
};

// Create
export const createCompetitionStageInfo = async (req, res) => {
  try {
    const {
      id_stage,
      whatsapp_group,
      accepts_pickup = false,
      team_pickup_information = [],
      venue_information,
      additional_notes = [],
    } = req.body;

    if (!id_stage || typeof id_stage !== "string" || !id_stage.trim()) {
      return res.status(400).json({
        success: false,
        message: "id_stage wajib berupa string dan tidak boleh kosong",
      });
    }

    if (!Array.isArray(team_pickup_information)) {
      return res.status(400).json({
        success: false,
        message: "team_pickup_information harus berupa array",
      });
    }

    if (!Array.isArray(additional_notes)) {
      return res.status(400).json({
        success: false,
        message: "additional_notes harus berupa array",
      });
    }

    const normalizedStageId = id_stage.trim();

    const existingStageInfo = await CompetitionStageInfo.findOne({
      id_stage: normalizedStageId,
    });

    if (existingStageInfo) {
      return res.status(409).json({
        success: false,
        message: "Informasi tambahan untuk stage tersebut sudah tersedia",
      });
    }

    const pickupEnabled = accepts_pickup === true;

    if (!pickupEnabled && team_pickup_information.length > 0) {
      return res.status(400).json({
        success: false,
        message:
          "team_pickup_information tidak dapat diisi karena accepts_pickup bernilai false",
      });
    }

    const newCompetitionStageInfo = await CompetitionStageInfo.create({
      id_stage: normalizedStageId,
      whatsapp_group,
      accepts_pickup: pickupEnabled,
      team_pickup_information: pickupEnabled ? team_pickup_information : [],
      venue_information,
      additional_notes,
    });

    return res.status(201).json({
      success: true,
      message: "Competition stage info berhasil dibuat",
      data: newCompetitionStageInfo,
    });
  } catch (error) {
    return handleControllerError(
      res,
      error,
      "Terjadi kesalahan saat membuat competition stage info",
    );
  }
};

// Read
export const getAllCompetitionStageInfos = async (req, res) => {
  try {
    const competitionStageInfos = await CompetitionStageInfo.find()
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      message: "Competition stage infos berhasil diambil",
      total: competitionStageInfos.length,
      data: competitionStageInfos,
    });
  } catch (error) {
    return handleControllerError(
      res,
      error,
      "Terjadi kesalahan saat mengambil competition stage infos",
    );
  }
};

export const getCompetitionStageInfoByStageId = async (req, res) => {
  try {
    const { id_stage } = req.params;

    if (!id_stage || !id_stage.trim()) {
      return res.status(400).json({
        success: false,
        message: "id_stage wajib diisi",
      });
    }

    const competitionStageInfo = await CompetitionStageInfo.findOne({
      id_stage: id_stage.trim(),
    }).lean();

    if (!competitionStageInfo) {
      return res.status(404).json({
        success: false,
        message:
          "Informasi tambahan untuk competition stage tersebut tidak ditemukan",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Competition stage info berhasil diambil",
      data: competitionStageInfo,
    });
  } catch (error) {
    return handleControllerError(
      res,
      error,
      "Terjadi kesalahan saat mengambil competition stage info",
    );
  }
};

// Update
export const updateCompetitionStageInfo = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "ID competition stage info tidak valid",
      });
    }

    const competitionStageInfo = await CompetitionStageInfo.findById(id);

    if (!competitionStageInfo) {
      return res.status(404).json({
        success: false,
        message: "Competition stage info tidak ditemukan",
      });
    }

    const {
      id_stage,
      whatsapp_group,
      accepts_pickup,
      team_pickup_information,
      venue_information,
      additional_notes,
    } = req.body;

    if (id_stage !== undefined) {
      if (typeof id_stage !== "string" || !id_stage.trim()) {
        return res.status(400).json({
          success: false,
          message: "id_stage harus berupa string dan tidak boleh kosong",
        });
      }

      const normalizedStageId = id_stage.trim();

      if (normalizedStageId !== competitionStageInfo.id_stage) {
        const duplicateStageInfo = await CompetitionStageInfo.findOne({
          id_stage: normalizedStageId,
          _id: {
            $ne: id,
          },
        });

        if (duplicateStageInfo) {
          return res.status(409).json({
            success: false,
            message: "Informasi tambahan untuk stage tersebut sudah tersedia",
          });
        }

        competitionStageInfo.id_stage = normalizedStageId;
      }
    }

    if (whatsapp_group !== undefined) {
      competitionStageInfo.whatsapp_group =
        whatsapp_group === null ? undefined : whatsapp_group;
    }

    if (venue_information !== undefined) {
      competitionStageInfo.venue_information =
        venue_information === null ? undefined : venue_information;
    }

    if (additional_notes !== undefined) {
      if (!Array.isArray(additional_notes)) {
        return res.status(400).json({
          success: false,
          message: "additional_notes harus berupa array",
        });
      }

      competitionStageInfo.additional_notes = additional_notes;
    }

    let pickupEnabled = competitionStageInfo.accepts_pickup;

    if (accepts_pickup !== undefined) {
      if (typeof accepts_pickup !== "boolean") {
        return res.status(400).json({
          success: false,
          message: "accepts_pickup harus berupa boolean",
        });
      }

      pickupEnabled = accepts_pickup;
      competitionStageInfo.accepts_pickup = accepts_pickup;

      if (!accepts_pickup) {
        competitionStageInfo.team_pickup_information = [];
      }
    }

    if (team_pickup_information !== undefined) {
      if (!Array.isArray(team_pickup_information)) {
        return res.status(400).json({
          success: false,
          message: "team_pickup_information harus berupa array",
        });
      }

      if (!pickupEnabled && team_pickup_information.length > 0) {
        return res.status(400).json({
          success: false,
          message:
            "team_pickup_information tidak dapat diisi karena accepts_pickup bernilai false",
        });
      }

      competitionStageInfo.team_pickup_information = pickupEnabled
        ? team_pickup_information
        : [];
    }

    const updatedCompetitionStageInfo = await competitionStageInfo.save();

    return res.status(200).json({
      success: true,
      message: "Competition stage info berhasil diperbarui",
      data: updatedCompetitionStageInfo,
    });
  } catch (error) {
    return handleControllerError(
      res,
      error,
      "Terjadi kesalahan saat memperbarui competition stage info",
    );
  }
};

// Delete
export const deleteCompetitionStageInfo = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "ID competition stage info tidak valid",
      });
    }

    const deletedCompetitionStageInfo =
      await CompetitionStageInfo.findByIdAndDelete(id);

    if (!deletedCompetitionStageInfo) {
      return res.status(404).json({
        success: false,
        message: "Competition stage info tidak ditemukan",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Competition stage info berhasil dihapus",
      data: deletedCompetitionStageInfo,
    });
  } catch (error) {
    return handleControllerError(
      res,
      error,
      "Terjadi kesalahan saat menghapus competition stage info",
    );
  }
};

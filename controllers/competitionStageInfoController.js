import mongoose from "mongoose";
import CompetitionStageInfo from "../models/competitionStageInfoModel.js";
import CompetitionStage from "../models/competitionStageModel.js";
import { db } from "../config/db.js";

const getTeamLeaderContext = async (idTeamLeader) => {
  const [rows] = await db.query(
    `SELECT team.id_team, registration.id_competition
     FROM team
     LEFT JOIN registration
       ON registration.id_team_leader = team.id_team_leader
     WHERE team.id_team_leader = ?`,
    [idTeamLeader],
  );

  if (rows.length === 0) {
    return { idTeam: null, competitionIds: [] };
  }

  return {
    idTeam: rows[0].id_team,
    competitionIds: rows
      .map((row) => row.id_competition)
      .filter((id) => id !== null && id !== undefined),
  };
};

export const filterPickupInformation = (stageInfo, idTeam) => {
  return {
    ...stageInfo,
    team_pickup_information: (stageInfo.team_pickup_information || []).filter(
      (pickup) => Number(pickup.team_id) === Number(idTeam),
    ),
  };
};

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
    let stageFilter = {};
    let idTeam = null;

    if (req.auth.actorType === "TEAM_LEADER") {
      const context = await getTeamLeaderContext(req.auth.actorId);
      const competitionIds = context.competitionIds;
      idTeam = context.idTeam;

      const stages = await CompetitionStage.find({
        id_competition: { $in: competitionIds },
      })
        .select("_id")
        .lean();

      stageFilter = {
        id_stage: { $in: stages.map((stage) => String(stage._id)) },
      };
    }

    let competitionStageInfos = await CompetitionStageInfo.find(stageFilter)
      .sort({ createdAt: -1 })
      .lean();

    if (req.auth.actorType === "TEAM_LEADER") {
      competitionStageInfos = competitionStageInfos.map((stageInfo) =>
        filterPickupInformation(stageInfo, idTeam),
      );
    }

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

    let competitionStageInfo = await CompetitionStageInfo.findOne({
      id_stage: id_stage.trim(),
    }).lean();

    if (!competitionStageInfo) {
      return res.status(404).json({
        success: false,
        message:
          "Informasi tambahan untuk competition stage tersebut tidak ditemukan",
      });
    }

    if (req.auth.actorType === "TEAM_LEADER") {
      const context = await getTeamLeaderContext(req.auth.actorId);
      competitionStageInfo = filterPickupInformation(
        competitionStageInfo,
        context.idTeam,
      );
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

    if (req.auth.actorType === "TEAM_LEADER") {
      const forbiddenFields = [
        "id_stage",
        "whatsapp_group",
        "accepts_pickup",
        "venue_information",
        "additional_notes",
      ];

      if (forbiddenFields.some((field) => req.body[field] !== undefined)) {
        return res.status(403).json({
          success: false,
          message: "Forbidden",
        });
      }

      if (!Array.isArray(team_pickup_information)) {
        return res.status(400).json({
          success: false,
          message: "team_pickup_information harus berupa array",
        });
      }

      if (!competitionStageInfo.accepts_pickup) {
        return res.status(400).json({
          success: false,
          message: "Stage ini tidak menerima informasi penjemputan",
        });
      }

      const context = await getTeamLeaderContext(req.auth.actorId);

      if (!context.idTeam) {
        return res.status(403).json({
          success: false,
          message: "Forbidden",
        });
      }

      const incomingPickup =
        team_pickup_information.find(
          (pickup) => Number(pickup.team_id) === Number(context.idTeam),
        ) ??
        (team_pickup_information.length === 1
          ? team_pickup_information[0]
          : null);

      if (!incomingPickup) {
        return res.status(400).json({
          success: false,
          message: "Informasi penjemputan team wajib diisi",
        });
      }

      const existingPickup = competitionStageInfo.team_pickup_information.find(
        (pickup) => Number(pickup.team_id) === Number(context.idTeam),
      );

      const otherPickups = competitionStageInfo.team_pickup_information.filter(
        (pickup) => Number(pickup.team_id) !== Number(context.idTeam),
      );

      competitionStageInfo.team_pickup_information = [
        ...otherPickups,
        {
          team_id: String(context.idTeam),
          location_name: incomingPickup.location_name,
          address: incomingPickup.address,
          maps_url: incomingPickup.maps_url,
          pickup_time: incomingPickup.pickup_time,
          notes: incomingPickup.notes,
          status: existingPickup?.status || "PENDING",
        },
      ];

      const updatedCompetitionStageInfo = await competitionStageInfo.save();

      return res.status(200).json({
        success: true,
        message: "Competition stage info berhasil diperbarui",
        data: updatedCompetitionStageInfo,
      });
    }

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

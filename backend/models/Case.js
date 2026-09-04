const mongoose = require("mongoose");

const caseSchema = new mongoose.Schema(
  {
    caseId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Farmer",
      required: false,
    },

    farmerId: {
      type: String,
      required: true,
      trim: true,
    },

    mobile: {
      type: String,
      default: "",
      trim: true,
    },

    caseType: {
      type: String,
      default: "diagnosis",
    },

    crop: {
      type: String,
      default: "Chilli",
      trim: true,
    },

    problem: {
      type: String,
      default: "",
    },

    description: {
      type: String,
      default: "",
    },

    symptoms: {
      type: String,
      default: "",
    },

    query: {
      type: String,
      default: "",
    },

    diagnosis: {
      type: String,
      default: "",
    },

    advisoryText: {
      type: String,
      default: "",
    },

    confidence: {
      type: String,
      default: "",
    },

    observations: {
      type: [String],
      default: [],
    },

    recommendedActions: {
      type: [String],
      default: [],
    },

    aiAnalysis: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    weatherContext: {
      type: String,
      default: "",
    },

    weather: {
      temperature: { type: String, default: "" },
      humidity: { type: String, default: "" },
      rainProbability: { type: String, default: "" },
      windSpeed: { type: String, default: "" },
      spraySuitability: { type: String, default: "" },
    },

    conversation: [
      {
        sender: {
          type: String,
          enum: ["farmer", "bhoomivani"],
        },
        text: {
          type: String,
          default: "",
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    followUpHistory: [
      {
        note: { type: String, default: "" },
        choice: { type: String, default: "" },
        advisory: { type: String, default: "" },
        timestamp: { type: Date, default: Date.now },
      },
    ],

    status: {
      type: String,
      default: "open",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Case", caseSchema);
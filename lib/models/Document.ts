import mongoose from "mongoose";

const DocumentSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    fileName: {
      type: String,
    },
    documentType: {
      type: String,
      enum: [
        "MARK_SHEET",
        "DEGREE_CERT",
        "BONAFIDE",
        "INTERNSHIP",
        "ID_PROOF",
        "OTHER",
      ],
      required: true,
    },
    encryptedFile: {
      type: String,
      required: true,
    },
    encryptedAESKey: {
      type: String,
      required: true,
    },
    hash: {
      type: String,
      required: true,
    },
    digitalSignature: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Verified", "Rejected"],
      default: "Pending",
    },
    remarks: {
      type: String,
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    verifiedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Document ||
  mongoose.model("Document", DocumentSchema);
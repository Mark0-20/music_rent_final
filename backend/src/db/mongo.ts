import mongoose from "mongoose";
import { env } from "../env.js";

const songSchema = new mongoose.Schema(
  {
    mysqlId: { type: Number, required: true },
    title: { type: String, required: true },
    durationSeconds: { type: Number, default: 0 },
    position: { type: Number, default: 0 },
  },
  { _id: false },
);

export const AlbumDocumentSchema = new mongoose.Schema(
  {
    mysqlAlbumId: { type: Number, required: true, unique: true, index: true },
    title: { type: String, required: true },
    artist: { type: String, required: true },
    year: { type: Number, default: null },
    songs: { type: [songSchema], default: [] },
  },
  { timestamps: true },
);

export const AlbumMongo =
  mongoose.models.AlbumMongo ||
  mongoose.model("AlbumMongo", AlbumDocumentSchema, "album_documents");

const userActivitySchema = new mongoose.Schema(
  {
    userId: { type: Number, required: true, index: true },
    action: { type: String, required: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

const rentalEventSchema = new mongoose.Schema(
  {
    rentalId: { type: Number, required: true, index: true },
    event: { type: String, required: true },
    payload: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

const searchHistorySchema = new mongoose.Schema(
  {
    userId: { type: Number, required: false, index: true },
    query: { type: String, required: true },
    filters: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

const auditLogSchema = new mongoose.Schema(
  {
    userId: { type: Number, required: false, index: true },
    entity: { type: String, required: true },
    entityId: { type: Number, required: false },
    action: { type: String, required: true },
    before: { type: mongoose.Schema.Types.Mixed, default: null },
    after: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { timestamps: true },
);

export const UserActivityMongo =
  mongoose.models.UserActivityMongo ||
  mongoose.model("UserActivityMongo", userActivitySchema, "user_activity");

export const RentalEventMongo =
  mongoose.models.RentalEventMongo ||
  mongoose.model("RentalEventMongo", rentalEventSchema, "rental_events");

export const SearchHistoryMongo =
  mongoose.models.SearchHistoryMongo ||
  mongoose.model("SearchHistoryMongo", searchHistorySchema, "search_history");

export const AuditLogMongo =
  mongoose.models.AuditLogMongo ||
  mongoose.model("AuditLogMongo", auditLogSchema, "audit_logs");

export async function connectMongo() {
  mongoose.set("strictQuery", true);
  await mongoose.connect(env.mongoUri);
}

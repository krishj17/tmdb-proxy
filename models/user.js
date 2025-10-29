import mongoose from "mongoose";

const bookmarkSchema = new mongoose.Schema({
  tmdbId: String,
  mediaType: String,
  title: String,
  poster: String,
  year: String,
  addedAt: { type: Date, default: Date.now }
});

const userSchema = new mongoose.Schema({
  userId: { type: String, default: "guest" },
  bookmarks: [bookmarkSchema]
});

export default mongoose.model("User", userSchema);

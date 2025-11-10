const mongoose = require('mongoose');

const SiteVisitEventSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    visitType: {
      type: String,
      required: true,
      trim: true,
    },
    path: {
      type: String,
      trim: true,
    },
    metadata: {
      type: Object,
      default: {},
    },
    occurredAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: 'site_visit_events',
  },
);

module.exports = mongoose.model('SiteVisitEvent', SiteVisitEventSchema);

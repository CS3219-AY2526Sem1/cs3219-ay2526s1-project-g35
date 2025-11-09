const mongoose = require('mongoose');

const DowntimeEventSchema = new mongoose.Schema(
  {
    serviceName: {
      type: String,
      required: true,
      index: true,
    },
    startedAt: {
      type: Date,
      required: true,
      index: true,
    },
    endedAt: {
      type: Date,
      default: null,
      index: true,
    },
    durationSeconds: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['open', 'closed'],
      default: 'open',
      index: true,
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: 'downtime_events',
  },
);

module.exports = mongoose.model('DowntimeEvent', DowntimeEventSchema);

const mongoose = require('mongoose');

const jobApplicationSchema = new mongoose.Schema({
  companyName: {
    type: String,
    required: true,
  },
  applicationData: [
    {
      type: String,
      required: true,
      enum: ['Resume', 'Cover Letter', 'Portfolio'],
    },
  ],
  notes: {
    type: String,
    required: true,
  },
  noteStatus: {
    type: Boolean,
    required: true,
  },
  submittedDate: {
    type: Date,
    required: true,
  },
  progress: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
  status: {
    type: String,
    required: true,
    enum: ['In Progress', 'Approved', 'Pending', 'Rejected'],
  },
});
const interviewStatsSchema = createSchema({
  interviewsEarned: {
    name: { type: String, default: 'Interviews Earned' },
    value: { type: Number, default: 10 },
    icon: { type: String, default: 'MdAddTask' },
  },
  responsesBack: {
    name: { type: String, default: 'Responses Back' },
    value: { type: Number, default: 15 },
    icon: { type: String, default: 'MdAddTask' },
  },
  rejectionRatio: {
    name: { type: String, default: 'Rejection Ratio' },
    value: { type: String, default: '3:1' },
    icon: { type: String, default: 'MdAddTask' },
  },
  jobsAppliedThisWeek: {
    name: { type: String, default: 'Jobs Applied This Week' },
    value: { type: Number, default: 7 },
    icon: { type: String, default: 'MdAddTask' },
  },
  followUpsSent: {
    name: { type: String, default: 'Follow-ups Sent' },
    value: { type: Number, default: 5 },
    icon: { type: String, default: 'MdAddTask' },
  },
});

const JobApplication = mongoose.model('JobApplication', jobApplicationSchema);
const InterviewStats = mongoose.model('InterviewStats', interviewStatsSchema);

module.exports = { JobApplication, InterviewStats };

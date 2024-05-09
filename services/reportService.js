const mongoose = require('mongoose');
const Intervention = require('../models/intervention');
const PingResult = require('../models/Ping');
const Equip = require('../models/equip');
const Alert = require('../models/Alert');
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const analyzeLatencies = (latencies) => {
  if (latencies.length === 0) return 0;
  const sum = latencies.reduce((acc, latency) => acc + latency, 0);
  return sum / latencies.length;
};

const findFollowUps = async (parentId, seenInterventions = new Set()) => {
  if (seenInterventions.has(parentId.toString())) {
    return []; // If we have already seen this intervention, don't fetch its follow-ups
  }
  seenInterventions.add(parentId.toString());

  const followUps = await Intervention.find({
    parentIntervention: parentId,
  }).populate('equipment').exec();

  let allFollowUps = [];
  for (const followUp of followUps) {
    allFollowUps.push(followUp);
    const nestedFollowUps = await findFollowUps(followUp._id, seenInterventions);
    allFollowUps.push(...nestedFollowUps);
  }
  return allFollowUps;
};


const generateInterventionReport = async (startDate, endDate, equipmentIds) => {
  const equipmentObjectIds = equipmentIds.map(id => new mongoose.Types.ObjectId(id));
  const parsedStartDate = new Date(startDate);
  const parsedEndDate = new Date(endDate);

  if (isNaN(parsedStartDate.valueOf()) || isNaN(parsedEndDate.valueOf())) {
    throw new Error('Invalid date format');
  }

  const baseInterventions = await Intervention.find({
    equipment: { $in: equipmentObjectIds },
    date: { $gte: parsedStartDate, $lte: parsedEndDate },
  }).populate('equipment').exec();

  let allInterventionsWithAlerts = [];

  for (const baseIntervention of baseInterventions) {
 
const followUps = await findFollowUps(baseIntervention._id, new Set([baseIntervention._id.toString()]));


    const allRelatedInterventions = [baseIntervention, ...followUps];

    const interventionsWithAlerts = await Promise.all(allRelatedInterventions.map(async (intervention) => {
      const alerts = await Alert.find({ interventionId: intervention._id }).lean();
      return {
        ...intervention.toObject(),
        alerts: alerts
      };
    }));

    allInterventionsWithAlerts.push(...interventionsWithAlerts);
  }

  return allInterventionsWithAlerts;
};

const createInterventionSummary = async (interventionWithAlerts) => {
  let summary = `Intervention ID: ${interventionWithAlerts._id}\n` +
    `Type: ${interventionWithAlerts.type}\n` +
    `Status: ${interventionWithAlerts.statut}\n` +
    `Description: ${interventionWithAlerts.description}\n` +
    `Date: ${interventionWithAlerts.date.toLocaleDateString()}\n` +
    `Equipment: ${interventionWithAlerts.equipment.Nom}\n`;
    
    if (interventionWithAlerts.latency) {
      summary += `Average Latency: ${interventionWithAlerts.latency}\n`;
    }
  
  const alertsSummary = interventionWithAlerts.alerts.map(alert => 
    `Alert - Status: ${alert.status}, Resolved: ${alert.resolved}, Timestamp: ${alert.timestamp}`
  ).join("\n");

  summary += alertsSummary.length > 0 ? `\nAlerts:\n${alertsSummary}` : "\nNo alerts";

  return summary + '\n\n';
};

function generatePDF(reportContent) {
  return new Promise((resolve, reject) => {
    const reportsDir = path.join(__dirname, '..', 'reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    const filename = `report-${Date.now()}.pdf`;
    const filePath = path.join(reportsDir, filename);
    const doc = new PDFDocument();

    doc.pipe(fs.createWriteStream(filePath))
      .on('finish', () => resolve(filePath))
      .on('error', (error) => reject(error));
    doc.text(reportContent);
    doc.end();
  });
}

const createFullReport = async (interventionsWithAlerts) => {
  let fullReport = '';

  for (const interventionWithAlerts of interventionsWithAlerts) {
    const summary = await createInterventionSummary(interventionWithAlerts);
    fullReport += summary;
  }

  if (fullReport.trim() === '') {
    throw new Error('No intervention summaries could be generated.');
  }

  const reportFilePath = await generatePDF(fullReport);
  return reportFilePath;
};

module.exports = {
  generateInterventionReport,
  createFullReport,
};
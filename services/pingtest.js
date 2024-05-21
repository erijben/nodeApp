const child_process = require('child_process');
const util = require('util');
const mongoose = require('mongoose');
const PingResult = require('../models/Ping');
const EquipModel = require('../models/equip');
const Intervention = require('../models/intervention');
const Alert = require('../models/Alert');
const exec = util.promisify(child_process.exec);
const cron = require('node-cron');
// Dans d'autres fichiers où vous en avez besoin
const eventEmitter = require('./event-emitter');
let io = null; // Initialisez io avec 
// Créez une fonction pour définir io
function setIO(socketIOInstance) {
  io = socketIOInstance;
}
const mongoUrl = 'mongodb+srv://erijbenamor6:adminadmin@erijapi.9b6fc2g.mongodb.net/Node-API?retryWrites=true&w=majority';
mongoose.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true });

    async function pingAndStore(hostname, equipId) {
      const lastIntervention = await Intervention.findOne({ equipment: equipId }).sort({ date: -1 });
      const currentTime = new Date();
      let interventionId = null;
      // Vérifiez si la dernière intervention est récente
      if (lastIntervention && (currentTime - lastIntervention.date) / 60000 <= 30) {
          interventionId = lastIntervention._id;
      }
  
      let pingResult; // Déplacez la déclaration ici
      // Initialize variables here to ensure they are defined in the function scope
      let size = 32; // Default size if not determined by the output
      let TTLs = [];
      let latencies = [];
      let packetsSent = 4; // Default number of packets sent
      let packetsReceived;
      let packetsLost;
      let minimumTime;
      let maximumTime;
      let averageTime;
      const options = { encoding: 'utf8' };
      try {
        const { stdout, stdrr } = await exec(`ping ${hostname}`,options);
    
        console.log('Raw ping output:\n', stdout);
    // Use regex to parse the ping command output
    const regexDetails = /octets=(\d+) temps=(\d+) ms TTL=(\d+)/g;
    let detailMatch;

   
// Use regex to parse the ping command output
while ((detailMatch = regexDetails.exec(stdout)) !== null) {
  console.log(`Match found: size = ${detailMatch[1]}, latency = ${detailMatch[2]}, TTL = ${detailMatch[3]}`);
  
  latencies.push(parseInt(detailMatch[2], 10));
  TTLs.push(parseInt(detailMatch[3], 10));
}
        console.log('latencies array before saving:', latencies);
        console.log('TTLs array before saving:', TTLs);
       // Notice how `.match()` is replaced by `.exec()` for global regex
const summaryRegex = /Paquets.*envoy�s = (\d+), re�us = (\d+), perdus = (\d+).*?minimum = (\d+)ms, maximum = (\d+)ms, moyenne = (\d+)ms/si;
const summaryMatch = summaryRegex.exec(stdout);
if (summaryMatch) {
  // Parse the matched groups from the regex result
  packetsSent = parseInt(summaryMatch[1]);
  packetsReceived = parseInt(summaryMatch[2]);
  packetsLost = parseInt(summaryMatch[3]);
  minimumTime = parseInt(summaryMatch[4]);
  maximumTime = parseInt(summaryMatch[5]);
  averageTime = parseInt(summaryMatch[6]);
  // Ensure packetsLost is calculated as the difference of sent and received
  packetsLost = packetsSent - packetsReceived;
}
    
   // Check if all necessary values were captured
packetsReceived = packetsReceived || 0;
packetsLost = packetsLost || packetsSent - packetsReceived; // Update this line
minimumTime = minimumTime || 0;
maximumTime = maximumTime || 0;
averageTime = averageTime || 0;

        // Logic to determine if the ping command is considered a success
       // Calculate success based on packets received
const success = packetsReceived === packetsSent;
        // Create the PingResult object
        pingResult = new PingResult({
          equipment: equipId,
          size: size,
          TTL: TTLs,
          latency: latencies,
          packetsSent: packetsSent,
          packetsReceived: packetsReceived,
          packetsLost: packetsLost,
          minimumTime: minimumTime,
          maximumTime: maximumTime,
          averageTime: averageTime,
          timestamp: new Date(),
          success: success
        });
        
        // Save the PingResult to the database
        await pingResult.save();
        console.log('PingResult saved:', pingResult);
      } catch (error) {
        console.error('Error during ping:', error);
     
       
         // Créez ici un résultat de ping échoué avec les valeurs par défaut/déduites
         pingResult = new PingResult({
         equipment: equipId,
         size: size, // Supposons que la taille par défaut est 32 octets
          TTL: [], // Aucune valeur TTL puisque le ping a échoué
         latency: [], // Aucune valeur de latence puisque le ping a échoué
          packetsSent: packetsSent, // Supposons que 4 paquets ont été envoyés
         packetsReceived: 0, // 0 paquets reçus en cas d'échec complet
          packetsLost: packetsSent, // Tous les paquets sont considérés comme perdus
          minimumTime: 0, // Aucun temps enregistré
          maximumTime: 0, // Aucun temps enregistré
         averageTime: 0, // Aucun temps enregistré
         timestamp: new Date(),
         success: false // Marquez explicitement l'échec du ping
         });

          await pingResult.save();
          console.log('PingResult saved as failed:', pingResult);
         }
        return pingResult; // Renvoyez le pingResult à la fin de la fonction
         }

async function analysePingData(equipId) {
  const pingResults = await PingResult.find({ equipment: equipId }).sort({ timestamp: -1 }).limit(10);
  let consecutiveSuccesses = 0;
  let consecutiveFailures = 0;  
  let intermittentFailures = 0;
  let lastPingStatus = null;

  pingResults.forEach(ping => {
    if (ping.success) {
      if (lastPingStatus === false) {
        // If the last ping was a failure, this is an intermittent failure
        intermittentFailures++;
      }
      consecutiveSuccesses++;
      consecutiveFailures = 0; // Reset consecutive failures on success
    } else {
      if (lastPingStatus === true) {
        // If the last ping was a success, reset consecutive successes
        consecutiveSuccesses = 0;
      }
      consecutiveFailures++;
    }
    lastPingStatus = ping.success;
  });

  if (consecutiveFailures >= 3) {
    return 'dysfonctionnel';
  } else if (intermittentFailures > 0) {
    return 'Problème de réseau';
  } else if (consecutiveSuccesses >= 4) {
    return 'En bon état';
  } else {
    return 'État indéterminé';
  }
}

// Définition de la fonction pour pinger tous les équipements
async function pingAllEquipments() {
  try {
    const allEquipments = await EquipModel.find({}, 'AdresseIp _id');
    for (const equip of allEquipments) {
      if (equip._id) {
        await pingAndStore(equip.AdresseIp, equip._id);
      } else {
        console.error('Equipment ID is undefined:', equip);
      }
    }
  } catch (error) {
    console.error('Error pinging equipments:', error);
  }
}

// Définition de la fonction pour récupérer les résultats de ping
async function getPingResults() {
  try {
    const pingResults = await PingResult.find({}).sort({ timestamp: -1 }).limit(50);
    return pingResults;
  } catch (error) {
    console.error('Error getting ping results:', error);
    throw error;
  }
}

// Définition de la fonction pour le ping manuel et le stockage
async function manualPingAndStore(req, res) {
  try {
    const { ip } = req.body;
    if (!ip) {
      return res.status(400).json({ error: 'IP address is required' });
    }

    const equipId = req.body.equipId;

    const result = await pingAndStore(ip, equipId);
    if (result && result.success) {
      res.json({ success: true, message: 'ping reussi !' });
    } else {
    res.json({ success: false, message: 'Ping echoué: Equipement indisponible' });
    }
  } catch (error) {
    console.error("Error handling manual ping request:", error);
    res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message });
  }
}

// Définition de la fonction pour vérifier l'état de l'équipement
async function checkEquipmentStatus(equipId) {
  try {
    const equipment = await EquipModel.findById(equipId);
    const status = await analysePingData(equipId);
    let message = ''; // Initialisez le message
    const equipmentName = equipment.Nom; 

    // Sélectionnez le message en fonction du statut
    switch (status) {
      case 'dysfonctionnel':
        message = 'dysfonctionnel  ';
        break;
      case 'Problème de réseau':
        message = 'Problème de réseau potentiel';
        break;
      case 'En bon état':
        message = 'Équipement en bon état ';
        break;
      default:
        message = 'État indéterminé.';
    }
    
     console.log(`Status for equipment ${equipmentName} (ID: ${equipId}):`, status);
     return { status, message, equipmentName };
  } catch (error) {
    console.error(`Error when checking status for equipment ID ${equipId}:`, error);
    return 'Error when checking status';
  
  }
}

// Planifiez une tâche cron pour vérifier l'état de tous les équipements toutes les 10 minutes
cron.schedule('*/30 * * * *', async () => {
  const allEquipments = await EquipModel.find();
  for (const equip of allEquipments) {
    const { status, message, equipmentName } = await checkEquipmentStatus(equip._id);
    await EquipModel.findByIdAndUpdate(equip._id, { Etat: status });
    io.emit('newAlert', {
      equipmentId: equip._id,
      equipmentName: equipmentName,
      status,
      message,
      alertType: 'Automatique',
      timestamp: new Date()
    });
  }
});


// L'écouteur d'événements 'evaluateEquipment'

eventEmitter.on('evaluateEquipment', async (interventionId) => {
  try {
    await evaluateEquipmentAfterIntervention(interventionId, io); // Pass `io` as a
  } catch (error) {
    console.error('Error in evaluating equipment for intervention ID:', interventionId, error);
  }
});

async function evaluateEquipmentAfterIntervention(interventionId) {
  console.log(`Début de l'évaluation pour l'intervention: ${interventionId}`);
  try {
    const intervention = await Intervention.findById(interventionId);
    if (!intervention) {
      console.error(`Intervention not found with ID: ${interventionId}`);
      return;
    }
    const equipmentId = intervention.equipment._id;
    const equipmentName = intervention.equipment.Nom; // Assuming the equipment document has a 'Nom' field
    const pingResults = await PingResult.find({ equipment: equipmentId }).sort({ timestamp: -1 }).limit(5);

    // Déterminez le statut de l'équipement en fonction des résultats du ping
    const successfulPings = pingResults.filter(ping => ping.success).length;
    let status;
    let resolved;
    let message; // Ajoutez une variable pour le message

    // Sélectionnez le message en fonction du statut
    if (successfulPings === 0) {
      status = 'dysfonctionnel';
      message = 'L\'équipement est encore en panne. autre intervention est requise ';
      resolved = false;
    } else if (successfulPings < pingResults.length) {
      status = 'Problème de réseau';
      message = 'Il y a un problème de réseau avec l\'équipement.';
    } else {
      status = 'En bon état';
      message = 'L\'équipement est en bon état. intervention reussite';
      resolved = true;
    }


    // Après avoir déterminé le statut, mettez à jour l'intervention
    await Intervention.findByIdAndUpdate(interventionId, { evaluated: true, status: status });
    
    // Créez une alerte pour chaque statut évalué
    const newAlert = new Alert({
      equipmentId: equipmentId,
      interventionId: interventionId,
      status: status,
      resolved: resolved,
      alertType: 'Intervention',
      message: message // Ajoutez le message correspondant au type d'alerte
    });
    await newAlert.save();
    await EquipModel.findByIdAndUpdate(equipmentId, { Etat: status });
    const savedAlert = await newAlert.save();
    console.log('Alerte sauvegardée pour le statut:', status);
    const fullAlert = await Alert.findById(savedAlert._id).populate('equipmentId', 'Nom');
    // Assurez-vous que `io` est défini avant de tenter de l'émettre
    if (io && fullAlert) {
      io.emit('newAlert', {
        ...fullAlert.toObject(),
        equipmentId: equipmentId,
        equipmentName: fullAlert.equipmentId.Nom, // Emitting the name instead of or alongside the ID
        alertType: 'Intervention',
        status: status,
        message: `Intervention: ${equipmentName} - ${message}`, // Ajoutez le message à l'objet émis
        timestamp: new Date()
      });
      console.log('Alert emitted for status:', status);
    } else {
      console.error('Socket.io instance is not set!');
    }
  } catch (error) {
    console.error(`Erreur lors de l'évaluation de l'équipement après l'intervention ${interventionId}:`, error);
  }
}

module.exports = {
  pingAndStore,
  manualPingAndStore,
  pingAllEquipments,
  getPingResults,
  checkEquipmentStatus,
  analysePingData,
  evaluateEquipmentAfterIntervention,
  setIO // Exportez la nouvelle fonction setIO
};
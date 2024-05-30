const express = require('express');
const cors = require('cors');
const app = express(); // Initialize Express app
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const http = require('http');
const server = http.createServer(app); // Remplace "app" par ton application Express si tu en as une
const socketIO = require('socket.io');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const cron = require('node-cron');
const PingResult = require('./models/Ping');
const equipRoute = require("./routes/equip.routes");
const inventoryRoute = require('./routes/inventory.routes');
const userRoute = require("./routes/user.routes");
const authRoute = require("./routes/auth.routes");
const configRoute = require("./routes/config.routes");
const pingAndStore = require('./services/pingtest');
const interventionRoute = require("./routes/intervention.routes");
const Intervention = require("./models/intervention")
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger-output.json');
const Equip = require ("./models/equip")
const Config = require('./models/config'); // Assurez-vous que le chemin est correct
const eventEmitter = require('./services/event-emitter');
const { evaluateEquipmentAfterIntervention } = require('./services/pingtest');
const Alert = require('./models/Alert');
const {
  generateInterventionReport, // Une seule fois
  createFullReport}= require('./services/reportService');

  // Middleware to process JSON data
  app.use(express.json());

// Autoriser toutes les origines
const allowedOrigins = '*';
// Ajouter le middleware CORS à votre application Express
app.use(cors({
  origin: allowedOrigins
}));


app.get('/', (req, res) => {
  res.send('hello world');
});

app.use("/equip", equipRoute);
app.use('/user', userRoute);
app.use('/auth', authRoute);
app.use('/api/interventions', interventionRoute);
app.use("/config", configRoute )
app.use('/inventory', inventoryRoute);
app.use('/reports', express.static('reports'));
const io = socketIO(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});


let scannedEquipments = [];

app.get('/scannedEquipments', (req, res) => {
  res.json(scannedEquipments);
});

app.post('/scannedEquipments', (req, res) => {
  scannedEquipments = req.body;
  res.sendStatus(200);
});

app.post('/resetScannedEquipments', (req, res) => {
  scannedEquipments = [];
  res.sendStatus(200);
});

app.post('/api/reports/generate', async (req, res) => {
  try {
      const { startDate, endDate, equipmentIds } = req.body;
      if (!startDate || !endDate || !Array.isArray(equipmentIds)) {
          return res.status(400).json({ error: 'Invalid input for report generation' });
      }

      const reportData = await generateInterventionReport(startDate, endDate, equipmentIds);
      const pdfFilePath = await createFullReport(reportData); // Utiliser createFullReport
    
      // Return the paths where the files can be accessed
      res.json({
          pdfFilePath: `https://nodeapp-ectt.onrender.com/reports/${path.basename(pdfFilePath)}`,
      });

  } catch (error) {
      console.error('Error generating report:', error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/api/pingResults/stats/:equipmentId', async (req, res) => {
  const { startDate, endDate, threshold, attr } = req.query; 
  const { equipmentId } = req.params; 

  console.log(`Request received - Equipment ID: ${equipmentId}, Start Date: ${startDate}, End Date: ${endDate}, Data: ${attr}, Threshold: ${threshold}`);

  try {
    if (!equipmentId || !startDate || !endDate || !threshold || !attr) {
      console.log('Missing or invalid request parameters:', req.query);
      return res.status(400).json({ error: 'Missing or invalid request parameters' });
    }

    const query = {
      equipment: equipmentId,
      timestamp: { $gte: new Date(startDate), $lte: new Date(endDate) }
    };

    console.log('Query:', query);

    const pingResults = await PingResult.find(query);

    console.log('Ping Results:', pingResults);

    let stats = { green: 0, orange: 0, red: 0 };

    const warningThreshold = parseFloat(threshold) * 0.9; 

    console.log('Warning Threshold:', warningThreshold);

    const getAverage = (numbers) => {
      if (!Array.isArray(numbers) || numbers.length === 0) return NaN;
      const validNumbers = numbers.filter(value => !isNaN(value));
      if (validNumbers.length === 0) return NaN;
      return validNumbers.reduce((acc, cur) => acc + cur, 0) / validNumbers.length;
    };

    pingResults.forEach(result => {
      let value = result[attr];
      if (Array.isArray(value)) {
        value = getAverage(value);
      }

      console.log(`Processing result - Data: ${attr}, Value: ${value}`);

      // Check if the attribute is minimumTime, maximumTime, or averageTime and if value is 0
      if (['minimumTime', 'maximumTime', 'averageTime'].includes(attr) && value === 0) {
        console.log('Value is 0 for a critical time attribute');
        stats.red++;
      } else if (value >= parseFloat(threshold)) {
        console.log('Value is above threshold');
        stats.red++;
      } else if (value >= warningThreshold && value < parseFloat(threshold)) {
        console.log('Value is above warning threshold but below main threshold');
        stats.orange++;
      } else {
        console.log('Value is within normal range');
        stats.green++;
      }
    });

    console.log('Final Stats:', stats);

    res.json(stats);
  } catch (error) {
    console.error('Error fetching ping results:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});




// Route pour filtrer les interventions en fonction des équipements sélectionnés et de la plage de dates
app.post('/api/interventions/filter', async (req, res) => {
  try {
    const { startDate, endDate, equipmentIds } = req.body;

    if (!startDate || !endDate || !equipmentIds) {
      return res.status(400).json({ error: 'Start date, end date, and equipment IDs are required' });
    }

    // Convertir les identifiants d'équipement en ObjectId MongoDB
    const equipmentObjectIds = equipmentIds.map(id => new mongoose.Types.ObjectId(id));

    // Récupérer les interventions correspondant aux équipements sélectionnés et à la plage de dates spécifiée
    const interventions = await Intervention.find({
      equipment: { $in: equipmentObjectIds },
      date: { $gte: new Date(startDate), $lte: new Date(endDate) }
    }).sort({ date: -1 }).limit(5);

    res.json(interventions);
  } catch (error) {
    console.error('Error filtering interventions:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Route to handle manual ping requests
app.post('/pingtest/manual', async (req, res) => {
  try {
    // Handle manual ping request
    await pingAndStore.manualPingAndStore(req, res);
  } catch (error) {
    console.error('Error handling manual ping request:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Route to handle ping requests
app.post('/pingtest', async (req, res) => {
  try {
    const { ip } = req.body;
    if (!ip) {
      return res.status(400).json({ error: 'IP address is required' });
    }

    const pingResponse = await pingAndStore(ip)

;
    res.json(pingResponse);
  } catch (error) {
    console.error('Error handling ping request:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


// Dans server1.js ou votre fichier de routes configuré
app.get('/api/config/isConfigured/:equipmentId', async (req, res) => {
  const { equipmentId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(equipmentId)) {
    return res.status(400).send('Invalid ID format');
  }
  try {
    const config = await Config.findOne({ equipment: equipmentId });
    res.send({ isConfigured: !!config });
  } catch (error) {
    res.status(500).send('Server error');
  }
});



// Route to handle ping results for a specific equipment
app.get('/api/pingResults/equip/:equipmentId', async (req, res) => {
  try {
    const { equipmentId } = req.params;
    console.log('Received ping results request for equipment ID:', equipmentId);

    if (!mongoose.Types.ObjectId.isValid(equipmentId)) {
      return res.status(400).json({ error: 'Invalid equipment ID' });
    }

    const results = await PingResult.find({ equipment: equipmentId });
    console.log('Ping results:', results);

    res.json(results);
  } catch (error) {
    console.error('Error fetching ping results:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});




app.get('/api/config/equip/:equipmentId', async (req, res) => {
  try {
    const { equipmentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(equipmentId)) {
      return res.status(400).json({ error: 'Invalid equipment ID' });
    }

    const config = await Config.findOne({ equipment: equipmentId });

    if (!config) {
      return res.status(404).json({ error: 'Configuration not found for equipment ID: ' + equipmentId });
    }

    res.json(config);
  } catch (error) {
    console.error('Error fetching configuration:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.toString() });
  }
});

app.get('/api/pingResults/alert/:equipmentId', async (req, res) => {
  try {
    const { equipmentId } = req.params;
    const { startDate, endDate } = req.query; // Récupérer les dates de la requête

    if (!mongoose.Types.ObjectId.isValid(equipmentId)) {
      return res.status(400).json({ error: 'Invalid equipment ID' });
    }

    let query = { equipment: equipmentId };
    if (startDate && endDate) {
      query.timestamp = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const results = await PingResult.find(query).sort({ timestamp: -1 });
    res.json(results);
  } catch (error) {
    console.error('Error fetching ping results:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/api/interventions/equip/count', async (req, res) => {
  try {
    const { startDate, endDate, equipmentIds } = req.body;

    if (!startDate || !endDate || !equipmentIds) {
      return res.status(400).json({ error: 'Start date, end date, and equipment IDs are required' });
    }

    // Convertissez les identifiants d'équipement en ObjectId MongoDB
    const equipmentObjectIds = equipmentIds.map(id => new mongoose.Types.ObjectId(id));

    // Effectuer une recherche pour récupérer les équipements sélectionnés depuis la base de données
    const equipments = await Equip.find({ _id: { $in: equipmentObjectIds } });

    // Initialiser un objet pour stocker le nombre d'interventions pour chaque équipement
    const interventionCounts = {};

    // Pour chaque équipement sélectionné, comptez les interventions pendant la période spécifiée
    for (const equipment of equipments) {
      const interventionCount = await Intervention.countDocuments({
        equipment: equipment._id,
        date: { $gte: new Date(startDate), $lte: new Date(endDate) }
      });

      interventionCounts[equipment._id] = interventionCount;
    }

    res.json({ interventionCounts }); // Répondre avec interventionCounts

  } catch (error) {
    if (error.name === 'MongoError') {
      console.error('MongoDB Error:', error);
      res.status(500).json({ error: 'MongoDB Error' });
    } else {
      console.error('Unexpected Error:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
});

// Server-side route for fetching all interventions with populated equipment details
app.get("/api/interventions", async (req, res) => {
  try {
      const interventions = await Intervention.find().populate('equipment');
      res.json(interventions);
  } catch (error) {
      console.error("Failed to fetch interventions with equipment details:", error);
      res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
});

app.get('/api/interventions/:id', async (req, res) => {
  try {
    const intervention = await Intervention.findById(req.params.id).populate('equipment');
    if (!intervention) {
      return res.status(404).json({ message: 'Intervention not found' });
    }
    res.json(intervention);
  } catch (error) {
    console.error('Error fetching intervention details:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
});

app.post('/api/barChartData', async (req, res) => {
  try {
    const { startDate, endDate, equipmentIds } = req.body;

    if (!startDate || !endDate || !equipmentIds || equipmentIds.length === 0) {
      return res.status(400).json({ error: 'Start date, end date, and at least one equipment ID are required' });
    }

    const equipmentObjectIds = equipmentIds.map(id => new mongoose.Types.ObjectId(id));

    const filteredData = await PingResult.find({
      equipment: { $in: equipmentObjectIds },
      timestamp: { $gte: new Date(startDate), $lte: new Date(endDate) },
      success: true, // Assurez-vous que seuls les pings réussis sont inclus
      TTL: { $ne: 0 }, // Exclure les cas où TTL est 0
    });

    const formattedData = formatBarChartData(filteredData);

    res.json(formattedData);
  } catch (error) {
    console.error('Error fetching bar chart data:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
const formatBarChartData = (data) => {
  return data.map((item, index) => {
    if (!item || !item.timestamp || !item.TTL || !Array.isArray(item.TTL)) {
      console.error("Invalid data at index", index, ":", item);
      return null;
    }

    // Supposez que l'élément TTL est un tableau, prenez la moyenne des valeurs du tableau
    const averageTTL = item.TTL.reduce((acc, val) => acc + val, 0) / item.TTL.length;
    const color = getColorByTTL(averageTTL);

    // Ajoutez cette ligne pour imprimer le TTL moyen dans la console
    console.log("Average TTL at index", index, ":", averageTTL);

    const timestamp = new Date(item.timestamp);

    if (!(timestamp instanceof Date) || isNaN(timestamp.getTime())) {
      console.error("Invalid timestamp at index", index, ":", item.timestamp);
      return null;
    }

    return {
      timestamp: timestamp.toISOString(),
      TTL: averageTTL,
      color: color,
    };
  }).filter((item) => item !== null);
};
const getColorByTTL = (TTL) => {
  if (TTL < 56) {
    return "green";
  } else if (TTL >= 56 && TTL <= 113) {
    return "orange";
  } else if (TTL > 113) {
    return "red";
  } else {
    console.error("Unexpected TTL value:", TTL);
    
  }
};

// Route to handle ping requests
app.post('/pingtest', async (req, res) => {
  try {
    const { ip } = req.body;
    if (!ip) {
      return res.status(400).json({ error: 'IP address is required' });
    }

    const pingResponse = await pingAndStore(ip)

;
    res.json(pingResponse);
  } catch (error) {
    console.error('Error handling ping request:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Définissez la route pour compter les alertes résolues selon l'équipement et la plage de dates
app.post('/api/alerts/resolved/count', async (req, res) => {
  try {
    const { startDate, endDate, equipmentIds } = req.body;
    // Effectuez la comptage des alertes résolues selon les critères
    const count = await Alert.countDocuments({
      resolved: true,
      equipmentId: { $in: equipmentIds },
      timestamp: { $gte: startDate, $lte: endDate }
    });
    // Envoyez la réponse avec le nombre d'alertes résolues
    res.json({ resolvedAlertCount: count });
  } catch (error) {
    console.error('Error counting resolved alerts:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});



app.post('/api/erij', async (req, res) => {
  try {
    const { startDate, endDate, equipmentIds } = req.body;

    if (!startDate || !endDate || !equipmentIds) {
      return res.status(400).json({ error: 'Start date, end date, and equipment IDs are required' });
    }

    const equipmentObjectIds = equipmentIds.map(id => new mongoose.Types.ObjectId(id));

    const pingResults = await PingResult.find({
      equipment: { $in: equipmentObjectIds },
      timestamp: { $gte: new Date(startDate), $lte: new Date(endDate) }
    }).exec();

    if (pingResults.length === 0) {
      return res.status(404).json({ message: 'No ping results found for the specified criteria' });
    }
    const lines = {
      normal: { id: 'Normal', data: [], color: 'green' },
      passable: { id: 'Passable', data: [], color: 'orange' },
      surpassed: { id: 'Surpassed', data: [], color: 'red' }
    };
  
    pingResults.forEach(result => {
      const averageTTL = result.TTL.reduce((sum, current) => sum + current, 0) / result.TTL.length;
      const point = { x: new Date(result.timestamp).toISOString(), y: averageTTL };
  
      if (averageTTL < 56) {
        lines.normal.data.push(point);
      } else if (averageTTL >= 56 && averageTTL <= 113) {
        lines.passable.data.push(point);
      } else if (averageTTL > 113) {
        lines.surpassed.data.push(point);
      }
    });
  
    const responseData = Object.values(lines);
    res.json(responseData);
  } catch (error) { // Ajoutez ce bloc catch pour gérer les erreurs
    console.error('Error fetching ping results:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


app.post('/api/ttlStats', async (req, res) => {
  const { equipmentIds, startDate, endDate } = req.body;

  if (!equipmentIds || equipmentIds.length === 0 || !startDate || !endDate) {
    console.error('Missing parameters:', { equipmentIds, startDate, endDate });
    return res.status(400).json({ error: 'Missing parameters' });
  }

  try {
    const ttlData = await PingResult.find({
      equipment: { $in: equipmentIds },
      timestamp: { $gte: new Date(startDate), $lte: new Date(endDate) }
    }).select('TTL');

    let stats = { green: 0, orange: 0, red: 0 };
    ttlData.forEach(result => {
      if (result.TTL && result.TTL.length > 0) {
        const averageTTL = result.TTL.reduce((sum, current) => sum + current, 0) / result.TTL.length;
        if (averageTTL < 56) stats.green++;
        else if (averageTTL <= 113) stats.orange++;
        else stats.red++;
      }
    });

    console.log('Computed stats:', stats);
    res.json(stats);
  } catch (error) {
    console.error('Error fetching TTL stats:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/api/ttlStats', async (req, res) => {
  const { equipmentIds, startDate, endDate } = req.body;

  if (!equipmentIds || equipmentIds.length === 0 || !startDate || !endDate) {
    console.error('Missing parameters:', { equipmentIds, startDate, endDate });
    return res.status(400).json({ error: 'Missing parameters' });
  }

  try {
    const ttlData = await PingResult.find({
      equipment: { $in: equipmentIds },
      timestamp: { $gte: new Date(startDate), $lte: new Date(endDate) }
    }).select('TTL');

    let stats = { green: 0, orange: 0, red: 0 };
    ttlData.forEach(result => {
      if (result.TTL && result.TTL.length > 0) {
        const averageTTL = result.TTL.reduce((sum, current) => sum + current, 0) / result.TTL.length;
        if (averageTTL < 56) stats.green++;
        else if (averageTTL <= 113) stats.orange++;
        else stats.red++;
      }
    });

    console.log('Computed stats:', stats);
    res.json(stats);
  } catch (error) {
    console.error('Error fetching TTL stats:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


app.get('/pays', async (req, res) => {
  try {
    const aggregation = await Equip.aggregate([
      {
        $group: {
          _id: "$Pays",
          count: { $sum: 1 }
        }
      }
    ]);
    res.json(aggregation.map(item => ({ id: item._id, value: item.count })));
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la récupération des données", error });
  }
});

app.post('/api/reports/generateDashboardPDF', async (req, res) => {
  const { startDate, endDate, equipments, data } = req.body;
  const doc = new PDFDocument();
  const filePath = `./path/to/reports/dashboard-report-${Date.now()}.pdf`;

  doc.pipe(fs.createWriteStream(filePath));
  doc.fontSize(25).text('Dashboard Report', 100, 100);
  // More complex PDF generation logic here
  // You can iterate over `data` to create tables and charts as needed
  doc.end();

  res.json({ pdfUrl: `http://localhost:3001/path/to/reports/${path.basename(filePath)}` });
});

/*const EMAIL_USERNAME = 'erijbenamor6@gmail.com'; // Remplacez par l'email réel
const EMAIL_PASSWORD = 'jvpk gsdc nlhm ldbg';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  
  port: 465,
  secure: true,
  auth: {
    user: EMAIL_USERNAME,
    pass: EMAIL_PASSWORD
  }
});

const monitorAndAlert = async () => {
  const configs = await Config.find().populate('equipment');
  
  for (let config of configs) {
    if (!config.equipment) {
      console.error(`Aucun équipement associé à la configuration: ${config._id}`);
      continue;  // Passer au prochain si les détails de l'équipement manquent
    }

    const pings = await PingResult.find({ equipment: config.equipment._id });
    for (let ping of pings) {
      const threshold = Number(config.seuil);
      const monitoredValue = ping[config.Type];

      if (Array.isArray(monitoredValue)) {
        for (let value of monitoredValue) {
          if (value > threshold) {
            await sendAlertEmail(config.adresseMail, config.equipment.Nom, config.equipment._id, config.Type, value, threshold);
          }
        }
      } else if (typeof monitoredValue === 'number' && monitoredValue > threshold) {
        await sendAlertEmail(config.adresseMail, config.equipment.Nom, config.equipment._id, config.Type, monitoredValue, threshold);
      }
    }
  }
};
const sendAlertEmail = (to, equipmentName, equipmentId, dataType, currentValue, threshold) => {
  console.log(`Préparation de l'envoi d'un e-mail d'alerte à ${to} pour le type de données ${dataType}`);
  const htmlContent = `
  <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; }
        .header { background: #f4f4f4; padding: 10px; text-align: center; }
        .content { padding: 20px; }
        .footer { background: #004085; color: white; text-align: center; padding: 10px; }
        .alert-icon { 
          color: red; 
          margin-right: 6px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1><span class="alert-icon">&#9888;</span>Alerte de Surveillance Réseau</h1>
      </div>
      <div class="content">
        <p>Bonjour,</p>
        <p>Une alerte de dépassement de seuil a été détectée pour l'équipement suivant, nécessitant une <strong>intervention immédiate</strong>:</p>
        <ul>
          <li><strong>Nom de l'Équipement:</strong> ${equipmentName}</li>
          <li><strong>ID de l'Équipement:</strong> ${equipmentId}</li>
          <li><strong>Type de Donnée:</strong> ${dataType}</li>
          <li><strong>Valeur Actuelle:</strong> ${currentValue} ms</li>
          <li><strong>Seuil Dépassé:</strong> ${threshold} ms</li>
        </ul>
        <p>Cette condition peut entraîner des performances dégradées ou d'autres problèmes opérationnels. <strong>Veuillez évaluer la situation et effectuer les réparations nécessaires.</strong></p>
      </div>
      <div class="footer">
        <p>Merci de prendre les mesures appropriées pour résoudre ce problème.<br>Équipe de Surveillance Réseau</p>
      </div>
    </body>
  </html>
`;
  const mailOptions = {
    from: EMAIL_USERNAME,
    to: to,
    subject: 'Alerte de dépassement de seuil',
    html: htmlContent
  };
   
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Erreur lors de l\'envoi de l\'e-mail: ', error);
      // Ici, ajouter la logique de réessai ou de traitement des erreurs
    } else {
      console.log(`E-mail d'alerte envoyé à ${to} avec succès: ${info.response}`);
    }
  });
};*///
 //Planifier la surveillance pour s'exécuter à un intervalle régulier
//cron.schedule('*/30    ', () => { // Toutes les 5 minutes par exemple
//monitorAndAlert();
//});

app.get('/api/pingResults', async (req, res) => {
  try {
    // Utilisez la fonction getPingResults que vous avez définie dans pingtest.js
    const results = await pingAndStore.getPingResults();
    res.status(200).json(results);
  } catch (error) {
    console.error('Error fetching ping results:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// À ajouter dans server1.js
app.get('/api/topologie', async (req, res) => {
  try {
    const equipements = await Equip.find().populate('ConnecteA');
    const topologie = equipements.map(equip => {
      return {
        id: equip._id,
        nom: equip.Nom,
        ip: equip.AdresseIp,
        etat: equip.Etat,
        Type:equip.Type,
        connecteA: equip.ConnecteA.map(connexion => ({
          id: connexion._id,
          nom: connexion.Nom,
          ip: connexion.AdresseIp,
          etat: connexion.Etat,
          Type:equip.Type,
        })),
        emplacement: equip.Emplacement,
        port: equip.Port,
      };
    });
    res.json(topologie);
  } catch (error) {
    console.error('Error fetching network topology:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


const port = process.env.PORT || 3001;
// After setting up your server and io


require('./services/pingtest').setIO(io);
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);

  //Configurez le reste des événements de socket après que le serveur écoute
  eventEmitter.on('newAlert', (alert) => {
    io.emit('newAlert', alert);
  });
});

module.exports = { app, server, io }; 



mongoose
  .connect('mongodb+srv://erijbenamor6:adminadmin@erijapi.9b6fc2g.mongodb.net/Node-API?retryWrites=true&w=majority')
  .then(() => {
    console.log('Connected to MongoDB');
    

 
    
    
    //Schedule pingAllEquipments every 2 minutes using cron
    cron.schedule('*/50 * * * *', async () => {
      try {
       await pingAndStore.pingAllEquipments();
} catch (error) {
       console.error('Error scheduling pingAllEquipments:', error);
      }
   });
   app.post('/pingtest/manual', pingAndStore.manualPingAndStore);
  })
  .catch((error) => {
    console.log('Error connecting to MongoDB:', error);
  });  

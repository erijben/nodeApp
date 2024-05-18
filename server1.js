import React, { useState } from 'react';
import { Box, Button, Typography, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Topologi = () => {
  const navigate = useNavigate();
  const [scannedEquipments, setScannedEquipments] = useState([]);
  const [selectedEquipments, setSelectedEquipments] = useState([]);

  const handleRFIDScan = async () => {
    try {
      const ndef = new NDEFReader();
      await ndef.scan();
      ndef.addEventListener('reading', event => {
        const rfid = event.serialNumber;
        axios.get(`https://nodeapp-ectt.onrender.com/find/${rfid}`)
          .then(response => {
            if (response.data.success) {
              setScannedEquipments(prevState => [...prevState, response.data.equipment]);
            } else {
              console.error('Équipement non trouvé');
            }
          })
          .catch(error => {
            console.error('Erreur lors de la recherche de l\'équipement :', error);
          });
      });
    } catch (error) {
      console.error('Erreur lors de la lecture du tag RFID:', error);
    }
  };

  const handleSelectEquipment = (equip) => {
    if (selectedEquipments.includes(equip)) {
      setSelectedEquipments(prevState => prevState.filter(e => e._id !== equip._id));
    } else {
      setSelectedEquipments(prevState => [...prevState, equip]);
    }
  };

  const handleCreateConnection = () => {
    if (selectedEquipments.length === 2) {
      const [from, to] = selectedEquipments.map(equip => equip._id);
      axios.post('https://nodeapp-ectt.onrender.com/connections', { from, to })
        .then(response => {
          if (response.data.success) {
            console.log('Connection created successfully');
            setSelectedEquipments([]);
            updateScannedEquipments(from, to);
          }
        })
        .catch(error => {
          console.error('Error creating connection:', error);
        });
    } else {
      console.error('Please select exactly 2 equipments to create a connection');
    }
  };

  const updateScannedEquipments = (from, to) => {
    setScannedEquipments(prevState => prevState.map(equip => {
      if (equip._id === from || equip._id === to) {
        return { ...equip, ConnecteA: [...equip.ConnecteA, from === equip._id ? to : from] };
      }
      return equip;
    }));
  };

  return (
    <Box m="20px">
      <Typography variant="h3" mb="20px">Topologie</Typography>
      <Button variant="contained" color="primary" onClick={handleRFIDScan}>
        Scanner RFID
      </Button>
      <Box mt="20px" display="flex" flexWrap="wrap">
        {scannedEquipments.map(equip => (
          <Paper 
            key={equip._id} 
            onClick={() => handleSelectEquipment(equip)} 
            style={{ 
              margin: '10px', 
              padding: '10px', 
              cursor: 'pointer', 
              border: selectedEquipments.includes(equip) ? '2px solid blue' : '1px solid gray' 
            }}
          >
            <Typography>Nom : {equip.Nom}</Typography>
            <Typography>Type : {equip.Type}</Typography>
            <Typography>Adresse IP : {equip.AdresseIp}</Typography>
            <Typography>RFID : {equip.RFID}</Typography>
            <Typography>Connecté à : {equip.ConnecteA.join(', ')}</Typography>
          </Paper>
        ))}
      </Box>
      <Button 
        variant="contained" 
        color="secondary" 
        onClick={handleCreateConnection} 
        mt="20px"
        disabled={selectedEquipments.length !== 2}
      >
        Créer Connexion
      </Button>
      <Button variant="contained" color="secondary" onClick={() => navigate('/dashboard')} mt="20px">
        Retour au Dashboard
      </Button>
    </Box>
  );
};

export default Topologi;

const express = require('express');
//const mongoose = require('mongoose');
const { Sequelize, DataTypes } = require('sequelize');
const dotenv = require('dotenv');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const classRoutes = require('./routes/classesRoutes');
const competenceRoutes = require('./routes/competencesRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const formulaireRoutes = require('./routes/formsRoutes');

dotenv.config();

const app = express();
app.use(express.json());

// Configuration CORS
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 204
};
app.use(cors(corsOptions));

const sequelize = require('./utils/sequelize');

sequelize.authenticate()
.then(() => console.log('✅ Connected to Postgres'))
.catch(err => console.error('❌ Unable to connect to Postgres', err));

require('./models/User');
require('./models/Class');
require('./models/Category');
require('./models/Competence');
require('./models/Formulaire');
require('./models/Student');

sequelize.sync({ alter: true })
  .then(() => console.log('✅ All models were synchronized.'))
  .catch(err => console.error('❌ Sync error', err));

app.use('/api/auth', authRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/competences', competenceRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/formulaires', formulaireRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
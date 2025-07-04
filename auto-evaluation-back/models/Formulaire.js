const { DataTypes, Sequelize } = require('sequelize');
const sequelize = require('../utils/sequelize');
const User      = require('./User');

const Formulaire = sequelize.define('Formulaire', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title:       { type: DataTypes.STRING,  allowNull: false,  trim: true },
  competences: {
    type: sequelize.getDialect() === 'postgres'
      ? DataTypes.JSONB
      : DataTypes.JSON,       // For SQLite
    allowNull: false,
    defaultValue: Sequelize.literal(`'[]'::jsonb`)
  },
  createdBy:   { type: DataTypes.INTEGER, allowNull: false }
}, {
  tableName: 'formulaires',
  timestamps: true
});

Formulaire.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

module.exports = Formulaire;

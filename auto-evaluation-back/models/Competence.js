const { DataTypes } = require('sequelize');
const sequelize = require('../utils/sequelize');
const User      = require('./User');
const Category  = require('./Category');

const Competence = sequelize.define('Competence', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name:       { type: DataTypes.STRING, allowNull: false },
  description:{ type: DataTypes.TEXT },
  controlPoints: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
  categoryId: { type: DataTypes.INTEGER, allowNull: false },
  createdBy:  { type: DataTypes.INTEGER, allowNull: false }
}, {
  tableName: 'competences',
  timestamps: true
});

Competence.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });
Competence.belongsTo(User,     { foreignKey: 'createdBy',  as: 'creator' });

module.exports = Competence;

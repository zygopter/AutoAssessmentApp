const { DataTypes } = require('sequelize');
const sequelize = require('../utils/sequelize');
const User      = require('./User');

const Category = sequelize.define('Category', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name:       { type: DataTypes.STRING, allowNull: false },
  description:{ type: DataTypes.TEXT },
  createdBy:  { type: DataTypes.INTEGER, allowNull: false }
}, {
  tableName: 'categories',
  timestamps: true
});

// Association : qui a créé la category
Category.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

module.exports = Category;

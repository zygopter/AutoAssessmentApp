const { DataTypes } = require('sequelize');
const sequelize = require('../utils/sequelize');
const User      = require('./User');

const Class = sequelize.define('Class', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name:      { type: DataTypes.STRING, allowNull: false },
  year:      { type: DataTypes.STRING, allowNull: false },
  teacherId: { type: DataTypes.INTEGER, allowNull: false },
  code:      { type: DataTypes.STRING, allowNull: false, unique: true }
}, {
  tableName: 'classes',
  timestamps: false
});

Class.belongsTo(User, { foreignKey: 'teacherId', as: 'teacher' });

module.exports = Class;

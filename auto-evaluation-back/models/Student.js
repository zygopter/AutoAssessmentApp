const { DataTypes } = require('sequelize');
const sequelize = require('../utils/sequelize');
const Class     = require('./Class');
const User      = require('./User');

const Student = sequelize.define('Student', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  firstName:{ type: DataTypes.STRING, allowNull: false },
  lastName: { type: DataTypes.STRING, allowNull: false },
  classId:  { type: DataTypes.INTEGER, allowNull: false },
  userId:   { type: DataTypes.INTEGER, allowNull: true }
}, {
  tableName: 'students',
  timestamps: false
});

Student.belongsTo(Class, { foreignKey: 'classId', as: 'class' });
Student.belongsTo(User,  { foreignKey: 'userId',  as: 'user' });

module.exports = Student;

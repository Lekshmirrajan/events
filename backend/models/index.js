// backend/models/index.js
const { Sequelize, DataTypes } = require('sequelize');

const DB_USER = process.env.DATABASE_USERNAME || process.env.DATABASE_USER || 'root';
const DB_PASS = process.env.DATABASE_PASSWORD || process.env.DB_PASS || '';
const DB_HOST = process.env.DATABASE_HOST || 'localhost';
const DB_NAME = process.env.DATABASE_NAME || 'myproject_db';

const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASS, {
  host: DB_HOST,
  dialect: 'mysql',
  logging: false,
  dialectOptions: {
    // If you use PlanetScale and need TLS, uncomment and adjust:
    // ssl: { rejectUnauthorized: true }
  }
});

// Define models
const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  name: DataTypes.STRING,
  email: { type: DataTypes.STRING, unique: true },
  password_hash: DataTypes.STRING
});

const Project = sequelize.define('Project', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  title: DataTypes.STRING,
  description: DataTypes.TEXT
});

const Task = sequelize.define('Task', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  title: DataTypes.STRING,
  description: DataTypes.TEXT,
  status: { type: DataTypes.ENUM('todo', 'in-progress', 'done'), defaultValue: 'todo' }
});

const Comment = sequelize.define('Comment', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  content: DataTypes.TEXT
});

const TaskAssignee = sequelize.define('TaskAssignee', {}, { timestamps: false });

// Associations
User.hasMany(Project, { foreignKey: 'ownerId' });
Project.belongsTo(User, { foreignKey: 'ownerId' });

Project.hasMany(Task, { foreignKey: 'projectId', onDelete: 'CASCADE' });
Task.belongsTo(Project, { foreignKey: 'projectId' });

User.hasMany(Comment, { foreignKey: 'authorId' });
Comment.belongsTo(User, { foreignKey: 'authorId' });

Task.hasMany(Comment, { foreignKey: 'taskId', onDelete: 'CASCADE' });
Comment.belongsTo(Task, { foreignKey: 'taskId' });

Task.belongsToMany(User, { through: TaskAssignee, as: 'assignees', foreignKey: 'taskId', otherKey: 'userId' });
User.belongsToMany(Task, { through: TaskAssignee, as: 'assignedTasks', foreignKey: 'userId', otherKey: 'taskId' });

async function initDb() {
  await sequelize.authenticate();
  await sequelize.sync();
}

module.exports = { sequelize, User, Project, Task, Comment, TaskAssignee, initDb };

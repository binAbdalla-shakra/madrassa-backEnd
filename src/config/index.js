require('dotenv').config();

module.exports = {
  app: {
    port: parseInt(process.env.PORT || '5000', 10),
    env: process.env.NODE_ENV || 'development',
  },
  db: {
    uri: buildMongoUri(),
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      authSource: process.env.MONGODB_AUTH_SOURCE || 'admin',
      connectTimeoutMS: 30000,
      socketTimeoutMS: 30000,
      serverSelectionTimeoutMS: 5000,
      retryWrites: true,
      w: 'majority'
    }
  }

};

function buildMongoUri() {
  const credentials = `${encodeURIComponent(process.env.MONGODB_USER)}:${encodeURIComponent(process.env.MONGODB_PASSWORD)}`;
  const server = process.env.MONGODB_SERVER;
  const dbName = process.env.MONGODB_DB || 'Madrasa_DB';
  return 'mongodb+srv://alvarro936:L2T7x3jFNyxbUlPX@cluster0.qrbtt6y.mongodb.net/Madrassa_development_DB?retryWrites=true&w=majority&appName=Cluster0'
  // return `mongodb://${credentials}@${server}/${dbName}?authSource=${process.env.MONGODB_AUTH_SOURCE || 'admin'}`;
}
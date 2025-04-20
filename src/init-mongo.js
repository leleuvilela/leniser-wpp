db = db.getSiblingDB('notify');
db.createCollection('contacts');
db.createCollection('configs');

db.configs.insertMany([
    {
        botNumber: '351931426775@g.us',
        type: 'general',
    },
]);

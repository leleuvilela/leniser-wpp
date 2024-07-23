db = db.getSiblingDB('rap');
db.createCollection('messages');
db.createCollection('allowedNumbers');

db.allowedNumbers.insertMany([
    {
        _id: '556285359995-1486844624@g.us',
        desc: 'Grupo de Rap',
        permissions: ['MESSAGE_CREATE', 'MESSAGE_REVOKE', 'SAVE_MESSAGE']
    },
])

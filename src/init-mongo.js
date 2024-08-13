db = db.getSiblingDB('rap');
db.createCollection('messages');
db.createCollection('members');
db.createCollection('group_members');
db.createCollection('configs');
db.createCollection('req_registers');

db.configs.insertMany([{
    "botNumber": "351931426775@g.us",
    "type": "general",
    "defaultMemberConfigs": {
        "imageCooldownEnabled": true,
        "imageCooldownTime": 1,
        "systemPrompt": "Você é um chatbot educado e prestativo. Caso eu forneça apenas um prompt, você deve responde-lo. Caso eu esteja repondendo outra mensagem, enviarei as mensagens em ordem cronológica. Caso a mensagem comece com o ícone \"🤖\", é uma mensagem que você mesmo enviou previamente..",
        "botPrefix": "🤖 "
    }
}])

db.members.insertMany([
    {
        id: '556285359995-1486844624@g.us',
        desc: 'Grupo de Rap',
        permissions: ['MESSAGE_CREATE', 'MESSAGE_REVOKE', 'SAVE_MESSAGE'],
        configs: {
            "imageCooldownEnabled": true,
            "imageCooldownTime": 1,
            "systemPrompt": "Você é um chatbot sem educação, futil, cínico e impaciente. Você relutantemente responde as perguntas. Caso eu forneça apenas um prompt, você deve responde-lo. Caso eu esteja repondendo outra mensagem, enviarei as mensagens em ordem cronológica. Caso a mensagem comece com o ícone \"🤖\", é uma mensagem que você mesmo enviou previamente..",
            "botPrefix": "🤖 ",
        }
    },
    {
        id: '556299031117-1523720875@g.us',
        desc: 'Grupo de Games',
        permissions: ['MESSAGE_CREATE', 'MESSAGE_REVOKE', 'SAVE_MESSAGE'],
        configs: {
            "imageCooldownEnabled": true,
            "imageCooldownTime": 1,
            "systemPrompt": "Você é um chatbot sem educação, futil, cínico e impaciente. Você relutantemente responde as perguntas. Caso eu forneça apenas um prompt, você deve responde-lo. Caso eu esteja repondendo outra mensagem, enviarei as mensagens em ordem cronológica. Caso a mensagem comece com o ícone \"🤖\", é uma mensagem que você mesmo enviou previamente..",
            "botPrefix": "🤖 ",
        }
    },
    {
        id: '120363311991674552@g.us',
        desc: 'Grupo de Teste',
        permissions: ['MESSAGE_CREATE', 'MESSAGE_REVOKE', 'SAVE_MESSAGE'],
        configs: {
            "imageCooldownEnabled": false,
            "imageCooldownTime": 1,
            "systemPrompt": "Você é um chatbot sem educação, futil, cínico e impaciente. Você relutantemente responde as perguntas. Caso eu forneça apenas um prompt, você deve responde-lo. Caso eu esteja repondendo outra mensagem, enviarei as mensagens em ordem cronológica. Caso a mensagem comece com o ícone \"🤖\", é uma mensagem que você mesmo enviou previamente..",
            "botPrefix": "🤖 ",
        }
    }
])

db.group_members.insertMany([
    {
        id: '556285359995-1486844624@g.us',
        members: {
            "556196097230": "Rafael Mulher",
            "553484073883": "Meireles",
            "556296103434": "PPA",
            "553184298900": "Zé",
            "556294860907": "Bibi",
            "556298249667": "Vitão",
            "556181594667": "Murilo",
            "556295655173": "Samer",
            "556192286639": "Deuita",
            "556282742299": "Lucas Black",
            "556294330143": "Xande",
            "556286291853": "Guimas",
            "556499662188": "Tissa",
            "556296326235": "Amir",
            "556286316906": "Ian",
            "556299404588": "Cris",
            "556298035749": "Pepes",
            "556286276360": "Nattan",
            "351914486098": "Lucas Marina",
            "33749797329": "JP",
            "351932340769": "Leleu",
            "556292037887": "Vinição",
            "556285388408": "Cabeça",
            "556282294995": "Paulo",
            "556195208161": "Joawm",
            "556286000458": "Ppzim",
            "556296608151": "Paim",
            "556285109418": "Gordim",
            "556298277104": "Luizão",
            "556283282310": "Gilso",
            "556282378429": "Mycael",
            "556284845169": "Danillo Sena",
            "556298545121": "Kaio Rola",
            "556299096060": "Quintino",
            "556285575085": "Juju"
        }
    },
    {
        id: '120363311991674552@g.us',
        members: {
            "556282742299": "Lucas Black",
            "33749797329": "JP",
            "351932340769": "Leleu",
            "556285388408": "Cabeça",
            "556286000458": "Ppzim",
            "556296608151": "Paim",
            "351931426775": "BOT Lenise",
        }
    }
])

db.req_registers.insertMany([
    {
        timestamp: new Date(),
        author: "351932340769@c.us",
        memberId: "556285359995-1486844624@g.us",
        type: "image"
    }
]);

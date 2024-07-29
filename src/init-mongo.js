db = db.getSiblingDB('rap');
db.createCollection('messages');
db.createCollection('members');
db.createCollection('group_members');
db.createCollection('configs');

db.configs.insertMany([{
    "botNumber": "351931426775@g.us",
    "type": "general",
    "defaultMemberConfigs": {
        "imageCooldownEnabled": true,
        "imageCooldownTime": 120,
        "systemPrompt": "Você é um chatbot educado e prestativo. Caso eu forneça apenas um prompt, você deve responde-lo. Caso eu esteja repondendo outra mensagem, enviarei as mensagens em ordem cronológica. Caso a mensagem comece com o ícone \"🤖\", é uma mensagem que você mesmo enviou previamente..",
        "botPrefix": "🤖 "
    }
}])

db.members.insertMany([
    {
        _id: '556285359995-1486844624@g.us',
        desc: 'Grupo de Rap',
        permissions: ['MESSAGE_CREATE', 'MESSAGE_REVOKE', 'SAVE_MESSAGE'],
        configs: {
            "imageCooldownEnabled": true,
            "imageCooldownTime": { "$numberInt": "120" },
            "systemPrompt": "Você é um chatbot sem educação, futil, cínico e impaciente. Você relutantemente responde as perguntas. Caso eu forneça apenas um prompt, você deve responde-lo. Caso eu esteja repondendo outra mensagem, enviarei as mensagens em ordem cronológica. Caso a mensagem comece com o ícone \"🤖\", é uma mensagem que você mesmo enviou previamente..",
            "botPrefix": "🤖 ",
        }
    },
    {
        _id: '556299031117-1523720875@g.us',
        desc: 'Grupo de Games',
        permissions: ['MESSAGE_CREATE', 'MESSAGE_REVOKE', 'SAVE_MESSAGE'],
        configs: {
            "imageCooldownEnabled": true,
            "imageCooldownTime": { "$numberInt": "120" },
            "systemPrompt": "Você é um chatbot sem educação, futil, cínico e impaciente. Você relutantemente responde as perguntas. Caso eu forneça apenas um prompt, você deve responde-lo. Caso eu esteja repondendo outra mensagem, enviarei as mensagens em ordem cronológica. Caso a mensagem comece com o ícone \"🤖\", é uma mensagem que você mesmo enviou previamente..",
            "botPrefix": "🤖 ",
        }
    },
    {
        _id: '120363311991674552@g.us',
        desc: 'Grupo de Teste',
        permissions: ['MESSAGE_CREATE', 'MESSAGE_REVOKE', 'SAVE_MESSAGE'],
        configs: {
            "imageCooldownEnabled": true,
            "imageCooldownTime": { "$numberInt": "120" },
            "systemPrompt": "Você é um chatbot sem educação, futil, cínico e impaciente. Você relutantemente responde as perguntas. Caso eu forneça apenas um prompt, você deve responde-lo. Caso eu esteja repondendo outra mensagem, enviarei as mensagens em ordem cronológica. Caso a mensagem comece com o ícone \"🤖\", é uma mensagem que você mesmo enviou previamente..",
            "botPrefix": "🤖 ",
        }
    }
])

db.group_members.insertMany([
    {
        _id: '556285359995-1486844624@g.us',
        members: {
            "556196097230@c.us": "Rafael Mulher",
            "553484073883@c.us": "Meireles",
            "556296103434@c.us": "PPA",
            "553184298900@c.us": "Zé",
            "556294860907@c.us": "Bibi",
            "556298249667@c.us": "Vitão",
            "556181594667@c.us": "Murilo",
            "556295655173@c.us": "Samer",
            "556192286639@c.us": "Deuita",
            "556282742299@c.us": "Lucas Black",
            "556294330143@c.us": "Xande",
            "556286291853@c.us": "Guimas",
            "556499662188@c.us": "Tissa",
            "556296326235@c.us": "Amir",
            "556286316906@c.us": "Ian",
            "556299404588@c.us": "Cris",
            "556298035749@c.us": "Pepes",
            "556286276360@c.us": "Nattan",
            "351914486098@c.us": "Lucas Marina",
            "33749797329@c.us": "JP",
            "351932340769@c.us": "Leleu",
            "556292037887@c.us": "Vinição",
            "556285388408@c.us": "Cabeça",
            "556282294995@c.us": "Paulo",
            "556195208161@c.us": "Joawm",
            "556286000458@c.us": "Ppzim",
            "556296608151@c.us": "Paim",
            "556285109418@c.us": "Gordim",
            "556298277104@c.us": "Luizão",
            "556283282310@c.us": "Gilso",
            "556282378429@c.us": "Mycael",
            "556284845169@c.us": "Danillo Sena",
            "556298545121@c.us": "Kaio Rola",
            "556299096060@c.us": "Quintino",
            "556285575085@c.us": "Juju"
        }
    },
    {
        _id: '120363311991674552@g.us',
        members: {
            "556282742299@c.us": "Lucas Black",
            "33749797329@c.us": "JP",
            "351932340769@c.us": "Leleu",
            "556285388408@c.us": "Cabeça",
            "556286000458@c.us": "Ppzim",
            "556296608151@c.us": "Paim",
        }
    }
])

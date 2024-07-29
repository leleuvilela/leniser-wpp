# WhatsApp bot Leniser

# Build and Start

## Manually

```
yarn
yarn build
yarn start
```

## Docker

- Remember to fill the `API_GPT` variable in the `docker-compose.yml`.

### Run

- Linux

```
sudo docker-compose up -d --build
```
- Windows

```
docker-compose up -d --build
```

> You only need the `--build` argument if the code has been change and you need to rebuild the application.

Use the QRCode in the docker log to connect to WhatsApp

### Reset DB

In case you change the `init-mongo.js` file and wants to reset the DB, you need 
to delete the mongo's docker volume.

```
docker-compose rm --stop --force -v mongo
docker volume rm leniser-wpp_mongo_data
```

then run the compose again.


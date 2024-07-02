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

### First time you run

```
docker-compose up --build
```
- Use the QRCode in the docker log to connect to WhatsApp

- The next time you run it will require you to re-do the permissions in the `.wwebjs_auth` folder,
as the program change it to root:root

``` bash
sudo chown "${USER}:users" .wwebjs_auth -R && docker-compose up -d --build
```

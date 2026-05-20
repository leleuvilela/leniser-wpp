# Stage 1: Build
FROM golang:1.22-alpine AS builder

RUN apk add --no-cache git

WORKDIR /build

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o leniser-bot ./cmd/bot

# Stage 2: Runtime
FROM alpine:latest

RUN apk add --no-cache ffmpeg ca-certificates tzdata

WORKDIR /app

COPY --from=builder /build/leniser-bot .

ENTRYPOINT ["./leniser-bot"]

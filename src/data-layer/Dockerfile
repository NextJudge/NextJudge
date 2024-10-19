
FROM golang:1.23-alpine AS build
WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY ./src ./src

RUN CGO_ENABLED=0 GOOS=linux go build -o /main ./src

# Dummy user
RUN addgroup -S scratchuser && adduser -S scratchuser -G scratchuser

# Deploy the application binary into a lean image
FROM scratch AS release

WORKDIR /

COPY --from=build /main /main
COPY --from=build /etc/passwd /etc/passwd
COPY --from=build /etc/group /etc/group

USER scratchuser:scratchuser

EXPOSE 5000

ENTRYPOINT ["/main"]




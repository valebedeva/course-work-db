FROM golang:1.15-alpine

WORKDIR /go/src/

COPY . .

RUN go build main.go

ENTRYPOINT ["./main"]

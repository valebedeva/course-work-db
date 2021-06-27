package main

import (
	"context"
	"fmt"
	"github.com/gorilla/handlers"
	"github.com/jackc/pgx/v4/pgxpool"
	"log"
	"net/http"
	"testdb/api"
	"time"
)



func main() {
	var err error
	var dbpool *pgxpool.Pool
	time.Sleep(90 * time.Second)
	dbpool, err = pgxpool.Connect(context.Background(), "host=haproxy port=5000 user=approle password=12345678 database=pki")
	if err != nil {
		fmt.Printf( "error to connect to database: %v\n", err)
	}
	for err != nil {
		dbpool, err = pgxpool.Connect(context.Background(), "host=haproxy port=5000 user=approle password=12345678 database=pki")
		time.Sleep(60 * time.Second)
	}

	defer dbpool.Close()
	println("connecting to db successfully")

	router := api.Handler{Dbpool: dbpool}.CreateRouter()
	headersOk := handlers.AllowedHeaders([]string{"Content-Type", "X-Requested-With"})
	originsOk := handlers.AllowedOrigins([]string{"*"})
	methodsOk := handlers.AllowedMethods([]string{"GET", "HEAD", "POST", "PUT", "OPTIONS", "DELETE"})

	h := handlers.CORS(originsOk, methodsOk, headersOk, handlers.AllowCredentials())

	log.Fatal(http.ListenAndServe(":8000", h(router)))
}

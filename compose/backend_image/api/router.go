package api

import (
	"github.com/gorilla/mux"
	"github.com/jackc/pgx/v4/pgxpool"
	"net/http"
)


type Handler struct {
	Dbpool          *pgxpool.Pool
}

func middleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Add("Content-Type", "application/json")
		next.ServeHTTP(w, r)
	})
}

func (h Handler) CreateRouter() *mux.Router {
	router := mux.NewRouter()

	router.HandleFunc("/ca", h.GetCa).Methods("GET")
	router.HandleFunc("/ca", h.PostCa).Methods("POST")
	router.HandleFunc("/ca", h.DeleteCa).Methods("DELETE")
	router.HandleFunc("/ca", h.PutCa).Methods("PUT")
	router.HandleFunc("/ca/names", h.GetCaNames).Methods("GET")

	router.HandleFunc("/user/cert/p12", h.GetUserCertP12).Methods("GET")
	router.HandleFunc("/user/cert", h.GetUserCert).Methods("GET")
	router.HandleFunc("/user/cert", h.PostUserCert).Methods("POST")
	router.HandleFunc("/user/cert", h.DeleteUserCert).Methods("DELETE")
	router.HandleFunc("/user/cert", h.PutUserCert).Methods("PUT")
	router.HandleFunc("/user/cert/names", h.GetUserCertNames).Methods("GET")
	router.HandleFunc("/user/cert/token", h.PostTokenCert).Methods("POST")

	router.Use(middleware)

	return router
}

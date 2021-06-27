package api

import (
	"crypto/rsa"
	"crypto/x509"
	"crypto/x509/pkix"
	"encoding/json"
	"fmt"
	"github.com/gofrs/uuid"
	"log"
	"net/http"
	"strings"
	"testdb/certgen"
	"testdb/dbpki"
)


type ErrorResponseInfo struct {
	Message  		string  	`json:"message"`
}

type PostInfo struct {
	DisplayName 	string 		`json:"display_name"`
	CertInfo 		CertInfo	`json:"cert_fields"`
	SignedId 		string 		`json:"signed_id"`
}

type CertInfo struct {
	CommonName		string 		`json:"cn"`
}

type IdResponseInfo struct {
	Id 				string 		`json:"id"`
}

type PutInfo struct {
	Id 				string		`json:"id"`
	DisplayName 	string 		`json:"display_name"`
}

func writeResponseError(w http.ResponseWriter, msg string, code int)  {
	w.WriteHeader(code)
	println(msg)

	err := json.NewEncoder(w).Encode(ErrorResponseInfo{Message: msg})
	if err != nil {
		log.Println(err)
	}
}

func (h Handler) GetCa(w http.ResponseWriter, r *http.Request) {
	idQuery := r.URL.Query().Get("id")
	if idQuery == "" {
		writeResponseError(w, "Param 'id' can`t be empty", http.StatusBadRequest)
		return
	}

	ids := strings.Split(idQuery, ",")
	for _, id := range ids {
		_, err := uuid.FromString(id)
		if err != nil {
			writeResponseError(w, fmt.Sprintf("Param 'id' should be uuid type: %s", err.Error()), http.StatusBadRequest)
			return
		}
	}

	infos := make([]dbpki.GetInfo, 0)
	for _, id := range ids {
		getInfo, err := dbpki.GetInfoById(h.Dbpool, id, dbpki.CaTable)
		if err != nil {
			writeResponseError(w, fmt.Sprintf("%s, id=%s", err.Error(), id), http.StatusNotFound)
			return
		}
		infos = append(infos, *getInfo)
	}

	err := json.NewEncoder(w).Encode(infos)
	if err != nil {
		log.Println(err)
	}
}

func (h Handler) PostCa(w http.ResponseWriter, r *http.Request)  {
	var caPostInfo PostInfo
	err := json.NewDecoder(r.Body).Decode(&caPostInfo)

	if err != nil {
		writeResponseError(w, "Unable decode body json: " + err.Error(), http.StatusBadRequest)
		return
	}
	if caPostInfo.DisplayName == "" {
		writeResponseError(w,"Param 'display_name' can`t be empty", http.StatusBadRequest)
		return
	}
	if caPostInfo.CertInfo.CommonName == "" {
		writeResponseError(w,"Param 'cn' can`t be empty", http.StatusBadRequest)
		return
	}

	if caPostInfo.SignedId != "" {
		_, err = uuid.FromString(caPostInfo.SignedId)
		if err != nil {
			writeResponseError(w, fmt.Sprintf("Param 'signed_id' should be uuid type: %s", err.Error()), http.StatusBadRequest)
			return
		}
	}

	name := pkix.Name{
		CommonName: caPostInfo.CertInfo.CommonName,
	}
	var cert *x509.Certificate
	var key *rsa.PrivateKey

	if caPostInfo.SignedId == "" {
		cert, key, err = certgen.GenCACert(name)
		if err != nil {
			writeResponseError(w, err.Error(), http.StatusInternalServerError)
			return
		}
	} else {
		parentCert, parentPrivateKey, err := dbpki.GetCertAndKeyById(h.Dbpool, caPostInfo.SignedId, dbpki.CaTable)
		if err != nil {
			writeResponseError(w, err.Error(), http.StatusNotFound)
			return
		}

		cert, key, err = certgen.GenCert(parentCert, parentPrivateKey, name)
		if err != nil {
			writeResponseError(w, err.Error(), http.StatusInternalServerError)
			return
		}
	}
	if cert == nil {
		writeResponseError(w, "Empty cert generated", http.StatusInternalServerError)
		return
	}

	ca := dbpki.PostInfo{
		Cert:        cert,
		PrivateKey:  key,
		CommonName:  cert.Subject.CommonName,
		DisplayName: caPostInfo.DisplayName,
		SignedId:    caPostInfo.SignedId,
	}

	id, err := dbpki.InsertRaw(h.Dbpool, ca, dbpki.CaTable, false)
	if err != nil {
		writeResponseError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	err = json.NewEncoder(w).Encode(IdResponseInfo{Id: id})
	if err != nil {
		log.Println(err)
	}
}

func (h Handler) DeleteCa(w http.ResponseWriter, r *http.Request) {
	id := r.URL.Query().Get("id")
	if id == "" {
		writeResponseError(w, "Param 'id' can`t be empty", http.StatusBadRequest)
		return
	}
	err := dbpki.DeleteById(h.Dbpool, id, dbpki.CaTable)
	if err != nil {
		if strings.Contains(err.Error(), "violates foreign key constraint") {
			writeResponseError(w, err.Error(), http.StatusForbidden)
		} else if strings.Contains(err.Error(), "0 raw was deleted") {
			writeResponseError(w, err.Error(), http.StatusNotFound)
		} else {
			writeResponseError(w, err.Error(), http.StatusInternalServerError)
		}
		return
	}
}

func (h Handler) PutCa(w http.ResponseWriter, r *http.Request) {
	var caEditInfo PutInfo

	err := json.NewDecoder(r.Body).Decode(&caEditInfo)
	if err != nil {
		writeResponseError(w, "Unable decode body json: " + err.Error(), http.StatusBadRequest)
		return
	}
	if caEditInfo.Id== "" {
		writeResponseError(w,"Param 'id' can`t be empty", http.StatusBadRequest)
		return
	}
	if caEditInfo.DisplayName == "" {
		writeResponseError(w,"Param 'display_name' can`t be empty", http.StatusBadRequest)
		return
	}

	err = dbpki.UpdateById(h.Dbpool, caEditInfo.Id, caEditInfo.DisplayName, dbpki.CaTable)
	if err != nil {
		if strings.Contains(err.Error(), "violates foreign key constraint") {
			writeResponseError(w, err.Error(), http.StatusForbidden)
		} else if strings.Contains(err.Error(), "0 raw was updated") {
			writeResponseError(w, err.Error(), http.StatusNotFound)
		} else {
			writeResponseError(w, err.Error(), http.StatusInternalServerError)
		}
	}
}

func (h Handler) GetCaNames(w http.ResponseWriter, _ *http.Request) {
	var caNamesInfo []dbpki.NameInfo
	caNamesInfo, err := dbpki.GetAllCaNames(h.Dbpool, dbpki.CaTable)
	if err != nil {
		writeResponseError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	err = json.NewEncoder(w).Encode(caNamesInfo)
	if err != nil {
		log.Println(err)
	}
}

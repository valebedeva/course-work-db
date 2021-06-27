package api

import (
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


type PostTokenInfo struct {
	DisplayName 	string 		`json:"display_name"`
	CSR 			string		`json:"csr"`
	SignedId 		string 		`json:"signed_id"`
}

func (h Handler) GetUserCert(w http.ResponseWriter, r *http.Request) {
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
		info, err := dbpki.GetInfoById(h.Dbpool, id, dbpki.UserCertTable)
		if err != nil {
			writeResponseError(w, fmt.Sprintf("%s, id=%s", err.Error(), id), http.StatusNotFound)
			return
		}
		infos = append(infos, *info)
	}

	err := json.NewEncoder(w).Encode(infos)
	if err != nil {
		log.Println(err.Error())
	}
}

func (h Handler) GetUserCertP12(w http.ResponseWriter, r *http.Request) {
	idQuery := r.URL.Query().Get("id")
	if idQuery == "" {
		writeResponseError(w, "Param 'id' can`t be empty", http.StatusBadRequest)
		return
	}

	password := r.URL.Query().Get("password")
	if password == "" {
		writeResponseError(w, "Param 'password' can`t be empty", http.StatusBadRequest)
		return
	}

	ids := strings.Split(idQuery, ",")
	infos := make([]dbpki.GetInfo, 0)
	for _, id := range ids {
		_, err := uuid.FromString(id)
		if err != nil {
			writeResponseError(w, fmt.Sprintf("Param 'id' should be uuid type: %s", err.Error()), http.StatusBadRequest)
			return
		}
	}

	for _, id := range ids {
		info, err := dbpki.GetInfoByIdP12(h.Dbpool, id, dbpki.UserCertTable, password)
		if err != nil {
			writeResponseError(w, fmt.Sprintf("%s, id=%s", err.Error(), id), http.StatusNotFound)
			return
		}
		infos = append(infos, *info)
	}

	err := json.NewEncoder(w).Encode(infos)
	if err != nil {
		log.Println(err.Error())
	}
}

func (h Handler) PostUserCert(w http.ResponseWriter, r *http.Request)  {
	var postInfo PostInfo
	err := json.NewDecoder(r.Body).Decode(&postInfo)

	if err != nil {
		writeResponseError(w, "Unable decode body json: " + err.Error(), http.StatusBadRequest)
		return
	}
	if postInfo.DisplayName == "" {
		writeResponseError(w,"Param 'display_name' can`t be empty", http.StatusBadRequest)
		return
	}
	if postInfo.CertInfo.CommonName == "" {
		writeResponseError(w,"Param 'common_name' can`t be empty", http.StatusBadRequest)
		return
	}
	if postInfo.SignedId == "" {
		writeResponseError(w,"Param 'signed_id' can`t be empty", http.StatusBadRequest)
		return
	}

	_, err = uuid.FromString(postInfo.SignedId)
	if err != nil {
		writeResponseError(w, fmt.Sprintf("Param 'signed_id' should be uuid type: %s", err.Error()), http.StatusBadRequest)
		return
	}

	name := pkix.Name{
		CommonName: postInfo.CertInfo.CommonName,
	}

	parentCert, parentPrivateKey, err := dbpki.GetCertAndKeyById(h.Dbpool, postInfo.SignedId, dbpki.CaTable)
	if err != nil {
		writeResponseError(w, err.Error(), http.StatusNotFound)
		return
	}

	cert, key, err := certgen.GenCert(parentCert, parentPrivateKey, name)
	if err != nil {
		writeResponseError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if cert == nil {
		writeResponseError(w, "Empty cert generated", http.StatusInternalServerError)
		return
	}

	userCert := dbpki.PostInfo{
		Cert:        cert,
		PrivateKey:  key,
		CommonName:  cert.Subject.CommonName,
		DisplayName: postInfo.DisplayName,
		SignedId:    postInfo.SignedId,
	}

	id, err := dbpki.InsertRaw(h.Dbpool, userCert, dbpki.UserCertTable, false)
	if err != nil {
		writeResponseError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	err = json.NewEncoder(w).Encode(IdResponseInfo{Id: id})
	if err != nil {
		log.Println(err)
	}
}

func (h Handler) PostTokenCert(w http.ResponseWriter, r *http.Request)  {
	var tokenCertPostInfo PostTokenInfo
	err := json.NewDecoder(r.Body).Decode(&tokenCertPostInfo)

	if err != nil {
		writeResponseError(w, "Unable decode body json: " + err.Error(), http.StatusBadRequest)
		return
	}
	if tokenCertPostInfo.DisplayName == "" {
		writeResponseError(w,"Param 'display_name' can`t be empty", http.StatusBadRequest)
		return
	}
	if tokenCertPostInfo.CSR == "" {
		writeResponseError(w,"Param 'csr' can`t be empty", http.StatusBadRequest)
		return
	}
	if tokenCertPostInfo.SignedId == "" {
		writeResponseError(w,"Param 'signed_id' can`t be empty", http.StatusBadRequest)
		return
	}

	_, err = uuid.FromString(tokenCertPostInfo.SignedId)
	if err != nil {
		writeResponseError(w, fmt.Sprintf("Param 'signed_id' should be uuid type: %s", err.Error()), http.StatusBadRequest)
		return
	}

	parentCert, parentPrivateKey, err := dbpki.GetCertAndKeyById(h.Dbpool, tokenCertPostInfo.SignedId, dbpki.CaTable)
	if err != nil {
		writeResponseError(w, err.Error(), http.StatusNotFound)
		return
	}

	csr, err := certgen.ConvertStringToCsr(tokenCertPostInfo.CSR)
	if err != nil {
		writeResponseError(w, err.Error(), http.StatusBadRequest)
		return
	}

	cert, err := certgen.GenCertByCsr(parentCert, parentPrivateKey, csr)
	if err != nil {
		writeResponseError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if cert == nil {
		writeResponseError(w, "Empty cert generated", http.StatusInternalServerError)
		return
	}

	userCert := dbpki.PostInfo{
		Cert:        cert,
		CommonName:  cert.Subject.CommonName,
		DisplayName: tokenCertPostInfo.DisplayName,
		SignedId:    tokenCertPostInfo.SignedId,
	}

	id, err := dbpki.InsertRaw(h.Dbpool, userCert, dbpki.UserCertTable, true)
	if err != nil {
		writeResponseError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	err = json.NewEncoder(w).Encode(IdResponseInfo{Id: id})
	if err != nil {
		log.Println(err)
	}
}

func (h Handler) DeleteUserCert(w http.ResponseWriter, r *http.Request) {
	id := r.URL.Query().Get("id")
	if id == "" {
		writeResponseError(w, "Param 'id' can`t be empty", http.StatusBadRequest)
		return
	}

	err := dbpki.DeleteById(h.Dbpool, id, dbpki.UserCertTable)
	if err != nil {
		if strings.Contains(err.Error(), "0 raw was deleted") {
			writeResponseError(w, err.Error(), http.StatusNotFound)
		} else {
			writeResponseError(w, err.Error(), http.StatusInternalServerError)
		}
		return
	}
}

func (h Handler) PutUserCert(w http.ResponseWriter, r *http.Request) {
	var info PutInfo
	err := json.NewDecoder(r.Body).Decode(&info)
	if err != nil {
		writeResponseError(w, "Unable decode body json: " + err.Error(), http.StatusBadRequest)
		return
	}
	if info.DisplayName == "" {
		writeResponseError(w,"Param 'display_name' can`t be empty", http.StatusBadRequest)
		return
	}

	err = dbpki.UpdateById(h.Dbpool, info.Id, info.DisplayName, dbpki.UserCertTable)
	if err != nil {
		if strings.Contains(err.Error(), "0 raw was updated") {
			writeResponseError(w, err.Error(), http.StatusNotFound)
		} else {
			writeResponseError(w, err.Error(), http.StatusInternalServerError)
		}
	}
}

func (h Handler) GetUserCertNames(w http.ResponseWriter, _ *http.Request) {
	var namesInfo []dbpki.NameInfo

	namesInfo, err := dbpki.GetAllUserCertNames(h.Dbpool, dbpki.UserCertTable)
	if err != nil {
		writeResponseError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	err = json.NewEncoder(w).Encode(namesInfo)
	if err != nil {
		log.Println(err)
	}
}

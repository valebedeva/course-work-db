package dbpki

import (
	"context"
	"crypto/rand"
	"crypto/rsa"
	"crypto/x509"
	"fmt"
	"github.com/jackc/pgx/v4/pgxpool"
	"software.sslmate.com/src/go-pkcs12"
	"testdb/certgen"
)


const CaTable = "ca"
const UserCertTable = "userCert"

type PostInfo struct {
	Id          	string
	DisplayName 	string
	CommonName 	 	string
	Cert        	*x509.Certificate
	PrivateKey  	*rsa.PrivateKey
	SignedId  		string
	Issued 			bool
}

type GetInfo struct {
	Id 				string		  	`json:"id"`
	DisplayName 	string 		  	`json:"display_name"`
	CommonName 		string 		  	`json:"cn"`
	Chain 			[]Chain		 	`json:"chain"`
	Cert	 		string 		  	`json:"cert"`
	CertP12         []byte          `json:"cert_p12"`
	PrivateKey		string          `json:"private_key"`
}

type NameInfo struct {
	Id 				string 			`json:"id"`
	DisplayName 	string 			`json:"display_name"`
	CommonName 		string 			`json:"cn"`
	Chain			[]Chain		    `json:"chain"`
	Type            string 			`json:"type"`
	Issued			bool 			`json:"issued"`
}

type Chain struct {
	Id 				string			`json:"id"`
	CommonName 		string 			`json:"cn"`
	DisplayName 	string 			`json:"display_name"`
	Cert 			*string         `json:"cert"`
}

func GetCertAndKeyById(dbpool *pgxpool.Pool, id string, table string) (*x509.Certificate, *rsa.PrivateKey, error) {
	var cert, key *string
	
	err := dbpool.QueryRow(context.Background(), fmt.Sprintf("select cert, privateKey from %s where id=$1", table), id).Scan(&cert, &key)
	if err != nil {
		return nil, nil, fmt.Errorf("error to get cert and key by id: %s", err.Error())
	}
	if cert == nil {
		return nil, nil, fmt.Errorf("error to get cert and key by id: null cert")
	}
	if key == nil {
		return nil, nil, fmt.Errorf("error to get cert and key by id: null key")
	}
	
	c, err := certgen.ConvertStringToCert(*cert)
	if err != nil {
		return nil, nil, fmt.Errorf("error to get cert and key by id: %s", err)
	}
	
	k, err := certgen.ConvertStringToPrivateKey(*key)
	if err != nil {
		return nil, nil, fmt.Errorf("error to get cert and key by id: %s", err)
	}
	
	return c, k, nil
}

func GetInfoById(dbpool *pgxpool.Pool, id string, table string) (*GetInfo, error) {
	var privateKey, cert, displayName, signedId, cn *string
	var issued *bool
	
	switch table {
	case CaTable:
		err := dbpool.QueryRow(context.Background(), fmt.Sprintf("select cert, privateKey, displayName, cn, signedId from %s where id=$1", CaTable), id).Scan(&cert, &privateKey, &displayName, &cn, &signedId)
		if err != nil {
			return nil, fmt.Errorf("get info by id: %s", err.Error())
		}
	case UserCertTable:
		err := dbpool.QueryRow(context.Background(), fmt.Sprintf("select cert, privateKey, displayName, cn, signedId, issued from %s where id=$1", UserCertTable), id).Scan(&cert, &privateKey, &displayName, &cn, &signedId, &issued)
		if err != nil {
			return nil, fmt.Errorf("get info by id: %s", err.Error())
		}
		if *issued == true {
			return nil, fmt.Errorf("get info by id: cert already issued")
		}

		err = UpdateIssuedUserCertById(dbpool, id, true, table)
		if err != nil {
			return nil, fmt.Errorf("get info by id: %s", err.Error())
		}
	default:
		{
			return nil, fmt.Errorf("get info by id:: incorrect table name")
		}
	}

	chain, err := GetChainBySignedId(dbpool, signedId)
	if err != nil {
		return nil, fmt.Errorf("get info by id:: %s", err.Error())
	}
	
	getInfo := &GetInfo{
		Id:          id,
		CommonName:  *cn,
		Cert:        *cert,
		DisplayName: *displayName,
		Chain:       chain,
	}
	if privateKey != nil {
		getInfo.PrivateKey = *privateKey
	}
	
	return getInfo, nil
}

func GetInfoByIdP12(dbpool *pgxpool.Pool, id string, table string, password string) (*GetInfo, error) {
	var privateKey, cert, displayName, signedId, cn *string
	var issued *bool

	err := dbpool.QueryRow(context.Background(), fmt.Sprintf("select cert, privateKey, displayName, cn, signedId, issued from %s where id=$1", table), id).Scan(&cert, &privateKey, &displayName, &cn, &signedId, &issued)
	if err != nil {
		return nil, fmt.Errorf("get cert p12 info by id: %s", err.Error())
	}
	if *issued == true {
		return nil, fmt.Errorf("get cert p12 info by id: cert already issued")
	}

	err = UpdateIssuedUserCertById(dbpool, id, true, table)
	if err != nil {
		return nil, fmt.Errorf("get cert p12 info by id: %s", err.Error())
	}

	chain, err := GetChainBySignedId(dbpool, signedId)
	if err != nil {
		return nil, fmt.Errorf("get cert p12 info by id: %s", err.Error())
	}

	caChainCerts := make([]*x509.Certificate, 0)
	for _, c := range chain {
		caCert, err :=certgen.ConvertStringToCert(*c.Cert)
		if err != nil {
			return nil, fmt.Errorf("get cert p12 info by id: make ca chain certs %s", err.Error())
		}
		caChainCerts = append(caChainCerts, caCert)
	}

	certConverted, err := certgen.ConvertStringToCert(*cert)
	if err != nil {
		return nil, fmt.Errorf("get cert p12 info by id: %s", err.Error())
	}

	privateKeyConverted, err := certgen.ConvertStringToPrivateKey(*privateKey)
	if err != nil {
		return nil, fmt.Errorf("get cert p12 info by id: %s", err.Error())
	}

	p12, err := pkcs12.Encode(rand.Reader, privateKeyConverted, certConverted, caChainCerts, password)
	if err != nil {
		return nil, fmt.Errorf("get cert p12 info by id: %s", err.Error())
	}

	getInfo := &GetInfo{
		Id:          id,
		CommonName:  *cn,
		CertP12: 	 p12,
		DisplayName: *displayName,
		Chain:       chain,
	}

	return getInfo, nil
}

func InsertRaw(dbpool *pgxpool.Pool, info PostInfo, table string, isFromToken bool) (string, error) {
	if info.Cert == nil {
		return "", fmt.Errorf("insert raw to %s: nil cert", table)
	}
	if !isFromToken && info.PrivateKey == nil {
		return "", fmt.Errorf("insert raw to %s: nil private key", table)
	}

	certConverted, err :=  certgen.ConvertCertToString(info.Cert)

	var keyConverted string
	if !isFromToken {
		keyConverted, err = certgen.ConvertPrivateKeyToString(info.PrivateKey)
	}

	var id string
	switch table {
	case CaTable:
		if info.SignedId != "" {
			row := dbpool.QueryRow(context.Background(),
				fmt.Sprintf("INSERT INTO %s (cert, privateKey, cn, displayName, signedId) VALUES ($1, $2, $3, $4, $5) RETURNING id",
				CaTable), certConverted, keyConverted, info.CommonName, info.DisplayName, info.SignedId)
			err = row.Scan(&id)
		} else {
			row := dbpool.QueryRow(context.Background(),
				fmt.Sprintf("INSERT INTO %s (cert, privateKey,cn, displayName) VALUES ($1, $2, $3, $4) RETURNING id",
				CaTable), certConverted, keyConverted, info.CommonName, info.DisplayName)
			err = row.Scan(&id)
		}
	case UserCertTable:
		if !isFromToken {
			row := dbpool.QueryRow(context.Background(),
				fmt.Sprintf("INSERT INTO %s (cert, privateKey, cn, displayName, signedId, issued) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id",
				UserCertTable), certConverted, keyConverted, info.CommonName, info.DisplayName, info.SignedId, false)
			err = row.Scan(&id)
		} else {
			row := dbpool.QueryRow(context.Background(),
				fmt.Sprintf("INSERT INTO %s (cert, cn, displayName, signedId, issued) VALUES ($1, $2, $3, $4, $5) RETURNING id",
				UserCertTable), certConverted, info.CommonName, info.DisplayName, info.SignedId, false)
			err = row.Scan(&id)
		}
	}
	if err != nil {
		return "", fmt.Errorf("insert raw to %s: %s", table, err.Error())
	}

	return id, nil
}

func GetAllCaNames(dbpool *pgxpool.Pool, table string) ([]NameInfo, error) {
	rows, err := dbpool.Query(context.Background(), fmt.Sprintf("select id, displayName, cn, signedId from %s", table))
	if err != nil {
		return nil, fmt.Errorf("get list all ca names: %s", err.Error())
	}

	certs := make([]NameInfo, 0)
	for rows.Next() {
		var displayName, commonName, id string
		var signedId *string

		err := rows.Scan(&id, &displayName, &commonName, &signedId)
		if err != nil {
			return nil, fmt.Errorf("get list all ca names: %s", err.Error())
		}

		if signedId == nil {
			certs = append(certs, NameInfo{
				DisplayName: displayName,
				CommonName:  commonName,
				Type:        "ca",
				Id: 		 id,
			})
		} else {
			chain, err := GetChainBySignedId(dbpool, signedId)
			if err != nil {
				return nil, fmt.Errorf("get list all ca names: %s", err.Error())
			}

			certs = append(certs, NameInfo{
				DisplayName: displayName,
				CommonName:  commonName,
				Type:        "subca",
				Id: 		 id,
				Chain:  	 chain,
			})
		}
	}

	return certs, nil
}

func GetAllUserCertNames(dbpool *pgxpool.Pool, table string) ([]NameInfo, error) {
	rows, err := dbpool.Query(context.Background(), fmt.Sprintf("select id, displayName, cn, issued, signedId, privateKey from %s", table))
	if err != nil {
		return nil, fmt.Errorf("get list all user cert names: %s", err.Error())
	}

	certs := make([]NameInfo, 0)
	for rows.Next() {
		var displayName, commonName, id, signedId string
		var privateKey *string
		var issued bool

		err := rows.Scan(&id, &displayName, &commonName, &issued, &signedId, &privateKey)
		if err != nil {
			return nil, fmt.Errorf("get list all user cert names: %s", err.Error())
		}

		chain, err := GetChainBySignedId(dbpool, &signedId)
		if err != nil {
			return nil, fmt.Errorf("get list all user cert names: %s", err.Error())
		}

		cert := NameInfo{
			DisplayName: displayName,
			CommonName:  commonName,
			Id: 		 id,
			Issued: 	 issued,
			Chain:       chain,
		}

		if privateKey != nil {
			cert.Type = "user"
		} else {
			cert.Type = "token"
		}

		certs = append(certs, cert)
	}

	return certs, nil
}

func GetChainBySignedId(dbpool *pgxpool.Pool, signedId *string) ([]Chain, error) {
	var displayName, cert string
	var cn *string

	chain := make([]Chain, 0)
	for signedId != nil {
		id := *signedId
		err := dbpool.QueryRow(context.Background(), fmt.Sprintf("select signedId, displayName, cn, cert from %s where id=$1", CaTable), id).Scan(&signedId, &displayName, &cn, &cert)
		if err != nil {
			return nil, fmt.Errorf("get chain by signedId: %s", err.Error())
		}

		c :=  Chain{
			DisplayName:	displayName,
			CommonName: 	*cn,
			Id:  	 		id,
			Cert:           &cert,
		}
		chain = append(chain, c)
	}

	if chain == nil {
		chain = []Chain{}
	}

	return chain, nil
}

func DeleteById(dbpool *pgxpool.Pool, id string, table string) error {
	tag, err := dbpool.Exec(context.Background(), fmt.Sprintf("delete from %s where id=$1", table), id)
	if err != nil {
		return fmt.Errorf("delete raw from %s: %s", table, err.Error())
	}
	if tag != nil && tag.String() == "DELETE 0" {
		return fmt.Errorf("delete raw from %s: 0 raw was deleted", table)
	}
	return nil
}

func UpdateById(dbpool *pgxpool.Pool, id string, displayName string, table string) error {
	tag, err := dbpool.Exec(context.Background(), fmt.Sprintf("update %s set displayName=$1 where id=$2", table), displayName, id)
	if err != nil {
		return fmt.Errorf("update display name in %s: %s", table, err.Error())
	}
	if tag != nil && tag.String() == "UPDATE 0" {
		return fmt.Errorf("update display name in %s: 0 raw was updated", table)
	}
	return nil
}

func UpdateIssuedUserCertById(dbpool *pgxpool.Pool, id string, issued bool, table string) error {
	tag, err := dbpool.Exec(context.Background(), fmt.Sprintf("update %s set issued=$1 where id=$2", table), issued, id)
	if err != nil {
		return fmt.Errorf("update issued in %s", table)
	}
	if tag != nil && tag.String() == "UPDATE 0" {
		return fmt.Errorf("update issued in %s: 0 raw was updated", table)
	}
	return nil
}
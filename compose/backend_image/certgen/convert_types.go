package certgen

import (
	"bytes"
	"crypto/rsa"
	"crypto/x509"
	"encoding/pem"
	"fmt"
)

func ConvertStringToCert(str string) (*x509.Certificate, error) {
	block, _ := pem.Decode([]byte(str))
	if block == nil {
		return nil, fmt.Errorf("convert string to cert: error decode")
	}
	cert, err := x509.ParseCertificate(block.Bytes)
	if err != nil {
		return nil, fmt.Errorf("convert string to cert: %s", err.Error())
	}
	return cert, nil
}

func ConvertStringToPrivateKey(str string) (*rsa.PrivateKey, error)  {
	block, _ := pem.Decode([]byte(str))
	if block == nil {
		return nil, fmt.Errorf("convert string to private key: error decode")
	}
	key, err := x509.ParsePKCS1PrivateKey(block.Bytes)
	if err != nil {
		return nil, fmt.Errorf("convert string to private key: %s", err.Error())
	}
	return key, nil
}

func ConvertCertToString(cert *x509.Certificate) (string, error) {
	if cert == nil {
		return "", fmt.Errorf("error convert cert to string: nil cert")
	}
	var certRow bytes.Buffer

	err := pem.Encode(&certRow, &pem.Block{Type: "CERTIFICATE", Bytes: cert.Raw})
	if err != nil {
		return "", fmt.Errorf("error convert cert to string: %s", err.Error())
	}
	str := certRow.String()
	return str, nil
}

func ConvertPrivateKeyToString(privateKey *rsa.PrivateKey) (string, error) {
	if privateKey == nil {
		return "", fmt.Errorf("error convert private key to string: nil private key")
	}
	key := x509.MarshalPKCS1PrivateKey(privateKey)
	var keyRow bytes.Buffer
	err := pem.Encode(&keyRow, &pem.Block{Type: "RSA PRIVATE KEY", Bytes: key})
	if err != nil {
		return "", fmt.Errorf("error convert private key to string: %s", err.Error())
	}
	str := keyRow.String()
	return str, nil
}

func ConvertStringToCsr(str string) (*x509.CertificateRequest, error) {
	block, _ := pem.Decode([]byte(str))
	if block == nil {
		return nil, fmt.Errorf("convert string to csr: error decode")
	}
	csr, err := x509.ParseCertificateRequest(block.Bytes)
	if err != nil {
		return nil, fmt.Errorf("convert string to csr: %s", err.Error())
	}
	return csr, nil
}
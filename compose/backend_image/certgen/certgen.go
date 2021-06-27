package certgen

import (
	"crypto/rand"
	"crypto/rsa"
	"crypto/x509"
	"crypto/x509/pkix"
	"fmt"
	"math/big"
	"time"
)


// genCert generates a certificated signed by itself or by another certificate
func genCert(parentCert *x509.Certificate, parentPrivateKey *rsa.PrivateKey, name pkix.Name) (*x509.Certificate, *rsa.PrivateKey, error) {
	days := 365

	newPrivateKey, err := rsa.GenerateKey(rand.Reader, 1024)
	if err != nil {
		return nil, nil, fmt.Errorf("gen cert: failed to generate private key: %s", err)
	}

	now := time.Now()
	serialNumberLimit := new(big.Int).Lsh(big.NewInt(1), 128)
	serialNumber, err := rand.Int(rand.Reader, serialNumberLimit)
	if err != nil {
		return nil, nil, fmt.Errorf("gen cert: failed to generate serial number: %s", err.Error())
	}

	newCert := &x509.Certificate{
		SerialNumber: serialNumber,
		Subject:      name,
		NotBefore:    now.Add(-5 * time.Minute).UTC(),
		NotAfter:     now.AddDate(0, 0, days).UTC(),
		KeyUsage:     x509.KeyUsageKeyEncipherment | x509.KeyUsageDigitalSignature,
	}

	if parentCert == nil {
		newCert.BasicConstraintsValid = true
		newCert.IsCA = true
		newCert.MaxPathLen = 0
		newCert.KeyUsage = newCert.KeyUsage | x509.KeyUsageCertSign
		parentCert = newCert
		parentPrivateKey = newPrivateKey
	}

	derBytes, err := x509.CreateCertificate(rand.Reader, newCert, parentCert, &newPrivateKey.PublicKey, parentPrivateKey)
	if err != nil {
		return nil, nil, fmt.Errorf("gen cert: failed to create certificate: %s", err.Error())
	}

	finalCert, err := x509.ParseCertificate(derBytes)
	if err != nil {
		return nil, nil, fmt.Errorf("gen cert: failed to parse certificate: %s", err.Error())
	}

	return finalCert, newPrivateKey, nil
}

// GenCACert generates a CA Certificate, that is a self signed certificate
func GenCACert(name pkix.Name) (*x509.Certificate, *rsa.PrivateKey, error) {
	return genCert(nil, nil, name)
}

// GenCert generates a Certificate signed by another certificate
func GenCert(parentCert *x509.Certificate, parentPrivateKey *rsa.PrivateKey, name pkix.Name) (*x509.Certificate, *rsa.PrivateKey, error) {
	if parentPrivateKey == nil {
		return nil, nil, fmt.Errorf("gen cert: parent private key can`t be empty")
	}
	if parentCert == nil {
		return nil, nil, fmt.Errorf("gen cert: parent cert can`t be empty")
	}
	return genCert(parentCert, parentPrivateKey, name)
}

func GenCertByCsr(parentCert *x509.Certificate, parentPrivateKey *rsa.PrivateKey, csr *x509.CertificateRequest) (*x509.Certificate, error) {
	days := 365
	if parentCert == nil {
		return nil, fmt.Errorf("gen cert by csr: nil parentCert")
	}

	now := time.Now()
	serialNumberLimit := new(big.Int).Lsh(big.NewInt(1), 128)
	serialNumber, err := rand.Int(rand.Reader, serialNumberLimit)
	if err != nil {
		return nil, fmt.Errorf("gen cert by csr: failed to generate serial number: %s", err.Error())
	}

	certTemplate := &x509.Certificate{
		Signature:          csr.Signature,
		SignatureAlgorithm: csr.SignatureAlgorithm,
		PublicKeyAlgorithm: csr.PublicKeyAlgorithm,
		PublicKey:          csr.PublicKey,
		Issuer:       		parentCert.Subject,
		Subject:      		csr.Subject,
		ExtKeyUsage:  		[]x509.ExtKeyUsage{x509.ExtKeyUsageClientAuth},
		SerialNumber: 		serialNumber,
		NotBefore:    		now.Add(-5 * time.Minute).UTC(),
		NotAfter:     		now.AddDate(0, 0, days).UTC(),
		KeyUsage:     		x509.KeyUsageKeyEncipherment | x509.KeyUsageDigitalSignature,
	}

	derBytes, err := x509.CreateCertificate(rand.Reader, certTemplate, parentCert, csr.PublicKey, parentPrivateKey)
	if err != nil {
		return nil,  fmt.Errorf("gen cert by csr: %s", err.Error())
	}

	finalCert, err := x509.ParseCertificate(derBytes)
	if err != nil {
		return nil, fmt.Errorf("gen cert by csr: %s", err.Error())
	}

	return finalCert, nil
}